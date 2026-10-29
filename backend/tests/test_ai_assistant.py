"""
AI Assistant Golden Dataset & SSE Streaming Tests.
Verifies tool routing, grounded answers, authorization guardrails, and SSE stream delivery.
"""

import json
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import create_access_token
from app.modules.ai.service import AIService
from app.modules.auth.models import Role, User


@pytest.mark.asyncio
async def test_ai_tools_and_sse_streaming(client: AsyncClient, db_session: AsyncSession):
    # Setup test user
    from sqlalchemy import select
    res = await db_session.execute(select(Role).where(Role.name == "customer"))
    cust_role = res.scalar_one_or_none()
    if not cust_role:
        cust_role = Role(name="customer", description="Customer")
        db_session.add(cust_role)
        await db_session.flush()

    user = User(
        email="ai_test_user@example.com",
        hashed_password="hash",
        full_name="AI Test Shopper",
        role_id=cust_role.id,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()

    token, _, _ = create_access_token(user.id, user.email, "customer")

    # 1. Test Policy Inquiries via Tool
    service = AIService(db_session, current_user=user)
    policy_res = await service.dispatcher.execute_tool("get_store_policies", {"topic": "returns"})
    assert "30-day" in policy_res["policy_summary"]

    # 2. Test Order Inquiry when Authenticated vs Unauthenticated
    auth_orders = await service.dispatcher.execute_tool("get_my_orders", {})
    assert "orders" in auth_orders or "no previous orders" in auth_orders.get("message", "")

    anon_service = AIService(db_session, current_user=None)
    unauth_orders = await anon_service.dispatcher.execute_tool("get_my_orders", {})
    assert "sign in" in unauth_orders["message"].lower()

    # 3. Test SSE Chat Streaming Endpoint
    response = await client.post(
        "/api/v1/assistant/chat",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "session_id": "test_sse_session_001",
            "message": "What is your return policy?",
        },
    )
    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]
    text_content = response.text
    assert "data: " in text_content
    assert "done" in text_content

    # 4. Test Recommendations Endpoint
    rec_res = await client.get("/api/v1/recommendations/for-you?limit=3")
    assert rec_res.status_code == 200
    assert isinstance(rec_res.json(), list)

    # 5. Admin AI Copy Generation
    admin_res = await db_session.execute(select(Role).where(Role.name == "admin"))
    admin_role = admin_res.scalar_one_or_none()
    if not admin_role:
        admin_role = Role(name="admin", description="Admin")
        db_session.add(admin_role)
        await db_session.flush()

    admin_user = User(
        email="ai_admin@example.com",
        hashed_password="hash",
        full_name="AI Admin",
        role_id=admin_role.id,
        is_active=True,
    )
    db_session.add(admin_user)
    await db_session.commit()

    admin_token, _, _ = create_access_token(admin_user.id, admin_user.email, "admin")

    ai_gen_res = await client.post(
        "/api/v1/admin/ai/generate-description",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "title": "Quantum ANC Earbuds",
            "brand": "SonicWave",
            "attributes": {"driver": "11mm planar", "battery": "38 hours"},
        },
    )
    assert ai_gen_res.status_code == 200
    data = ai_gen_res.json()
    assert "description" in data
    assert "seo_title" in data


"""
Integration tests for Admin Operations, Business Analytics, and Role-Based Access Control.
Verifies RBAC enforcement (403 for customers, 200 for admins) and operational endpoints.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password
from app.modules.auth.models import Role, User
from app.modules.orders.models import Order
from app.modules.products.models import Product


@pytest.mark.asyncio
async def test_admin_rbac_and_analytics_suite(client: AsyncClient, db_session: AsyncSession):
    # 1. Setup Admin and Customer roles in test DB
    res_admin_role = await db_session.execute(select(Role).where(Role.name == "admin"))
    admin_role = res_admin_role.scalar_one_or_none()
    if not admin_role:
        admin_role = Role(name="admin", description="Administrator")
        db_session.add(admin_role)

    res_cust_role = await db_session.execute(select(Role).where(Role.name == "customer"))
    cust_role = res_cust_role.scalar_one_or_none()
    if not cust_role:
        cust_role = Role(name="customer", description="Customer")
        db_session.add(cust_role)
    await db_session.flush()

    # Ensure admin user
    res_admin = await db_session.execute(select(User).where(User.email == "analytics_admin@novamart.com"))
    admin_user = res_admin.scalar_one_or_none()
    if not admin_user:
        admin_user = User(
            email="analytics_admin@novamart.com",
            hashed_password=hash_password("AdminPass123!"),
            full_name="Analytics Admin",
            role_id=admin_role.id,
            is_active=True,
            is_verified=True,
        )
        db_session.add(admin_user)

    # Ensure customer user
    res_cust = await db_session.execute(select(User).where(User.email == "regular_cust@novamart.com"))
    cust_user = res_cust.scalar_one_or_none()
    if not cust_user:
        cust_user = User(
            email="regular_cust@novamart.com",
            hashed_password=hash_password("CustPass123!"),
            full_name="Regular Customer",
            role_id=cust_role.id,
            is_active=True,
            is_verified=True,
        )
        db_session.add(cust_user)
    await db_session.commit()

    # 2. Verify Customer receives 403 Forbidden on Admin endpoints
    cust_token, _, _ = create_access_token(cust_user.id, cust_user.email, "customer")
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    forbidden_resp = await client.get("/api/v1/admin/analytics/overview", headers=cust_headers)
    assert forbidden_resp.status_code == 403
    assert forbidden_resp.json().get("code") == "FORBIDDEN"

    # 3. Verify Admin Access
    admin_token, _, _ = create_access_token(admin_user.id, admin_user.email, "admin")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 4. Admin Analytics Overview
    overview_resp = await client.get("/api/v1/admin/analytics/overview", headers=admin_headers)
    assert overview_resp.status_code == 200
    data = overview_resp.json()
    assert "total_revenue_dollars" in data
    assert "total_orders_count" in data
    assert "total_products_count" in data
    assert "average_order_value_dollars" in data

    # 5. Admin Top Products & Sales Chart
    top_prod_resp = await client.get("/api/v1/admin/analytics/top-products", headers=admin_headers)
    assert top_prod_resp.status_code == 200
    assert isinstance(top_prod_resp.json(), list)

    chart_resp = await client.get("/api/v1/admin/analytics/sales-chart", headers=admin_headers)
    assert chart_resp.status_code == 200
    assert isinstance(chart_resp.json(), list)

    # 6. Admin Orders List and Lifecycle Status Update
    orders_resp = await client.get("/api/v1/admin/orders", headers=admin_headers)
    assert orders_resp.status_code == 200
    assert isinstance(orders_resp.json(), list)

    # Insert a test order into the session
    test_order = Order(
        order_number="ORD-TEST-ADMIN-01",
        user_id=cust_user.id,
        status="pending",
        total_amount_cents=29900,
        shipping_address_snapshot_json='{"line1": "123 Admin Way", "city": "Seattle"}',
    )
    db_session.add(test_order)
    await db_session.commit()
    await db_session.refresh(test_order)

    update_order_resp = await client.patch(
        f"/api/v1/admin/orders/{test_order.id}/status",
        json={"status": "shipped", "tracking_number": "TRK-987654321"},
        headers=admin_headers,
    )
    assert update_order_resp.status_code == 200
    updated_order_data = update_order_resp.json()
    assert updated_order_data["status"] == "shipped"
    assert updated_order_data["tracking_number"] == "TRK-987654321"

    # 7. Admin AI Product Description Generator
    ai_gen_resp = await client.post(
        "/api/v1/admin/ai/generate-description",
        json={
            "title": "Quantum Neural Link V2",
            "brand": "NovaMart Labs",
            "attributes": {
                "category": "Neural Interfaces",
                "features": ["Sub-millisecond synap-sync", "Biocompatible titanium casing", "Qi wireless charging"],
            },
        },
        headers=admin_headers,
    )
    assert ai_gen_resp.status_code == 200
    ai_data = ai_gen_resp.json()
    assert "description" in ai_data
    assert "Quantum Neural Link V2" in ai_data["description"]
    assert len(ai_data["seo_keywords"]) > 0

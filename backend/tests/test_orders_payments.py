"""
Cart, Checkout, Orders & Payments Integration Tests.
Verifies guest carts, cart merging, row-locked transactional inventory, IDOR protection, and Stripe webhooks.
"""

import json
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import create_access_token
from app.modules.auth.models import Role, User
from app.modules.categories.models import Category
from app.modules.products.models import Inventory, Product, ProductVariant


@pytest.mark.asyncio
async def test_cart_and_checkout_flow(client: AsyncClient, db_session: AsyncSession):
    # 1. Setup Roles & Customers
    from sqlalchemy import select
    res = await db_session.execute(select(Role).where(Role.name == "customer"))
    cust_role = res.scalar_one_or_none()
    if not cust_role:
        cust_role = Role(name="customer", description="Customer")
        db_session.add(cust_role)
        await db_session.flush()

    user_a = User(
        email="usera@test.com",
        hashed_password="hash",
        full_name="User A",
        role_id=cust_role.id,
        is_active=True,
    )
    user_b = User(
        email="userb@test.com",
        hashed_password="hash",
        full_name="User B",
        role_id=cust_role.id,
        is_active=True,
    )
    db_session.add_all([user_a, user_b])
    await db_session.flush()

    token_a, _, _ = create_access_token(user_a.id, user_a.email, "customer")
    token_b, _, _ = create_access_token(user_b.id, user_b.email, "customer")

    # 2. Setup Category, Product, Variant, and Inventory (Total 5 units)
    cat = Category(name="Electronics", slug="electronics")
    db_session.add(cat)
    await db_session.flush()

    prod = Product(
        category_id=cat.id,
        title="Gaming Mouse Ultra",
        slug="gaming-mouse-ultra",
        description="High precision 20K DPI optical sensor",
        brand="LogiTech",
        base_price_cents=4999,  # $49.99
    )
    db_session.add(prod)
    await db_session.flush()

    variant = ProductVariant(
        product_id=prod.id,
        sku="GM-ULTRA-BLK",
        title="Gaming Mouse - Black",
        price_cents=4999,
    )
    db_session.add(variant)
    await db_session.flush()

    inv = Inventory(variant_id=variant.id, quantity=5, reserved_quantity=0)
    db_session.add(inv)
    await db_session.commit()

    # 3. Guest Cart: Add 2 items
    guest_session = "guest_session_12345"
    add_guest = await client.post(
        "/api/v1/cart/items",
        headers={"X-Session-Token": guest_session},
        json={"variant_id": variant.id, "quantity": 2},
    )
    assert add_guest.status_code == 200
    assert add_guest.json()["total_quantity"] == 2

    # 4. Cart Merge upon User A Login
    merge_res = await client.post(
        "/api/v1/cart/merge",
        headers={"Authorization": f"Bearer {token_a}"},
        json={"session_token": guest_session},
    )
    assert merge_res.status_code == 200
    assert merge_res.json()["total_quantity"] == 2
    assert merge_res.json()["user_id"] == user_a.id

    # 5. Calculate Checkout Totals
    calc_res = await client.post(
        "/api/v1/checkout/calculate",
        json={"items": [{"variant_id": variant.id, "quantity": 2}]},
    )
    assert calc_res.status_code == 200
    calc_data = calc_res.json()
    assert calc_data["subtotal_cents"] == 4999 * 2

    # 6. Create Stripe PaymentIntent
    intent_res = await client.post(
        "/api/v1/checkout/create-intent",
        headers={"Authorization": f"Bearer {token_a}"},
        json={"idempotency_key": "checkout_idemp_key_001", "currency": "USD"},
    )
    assert intent_res.status_code == 200
    intent_data = intent_res.json()
    assert "client_secret" in intent_data
    payment_intent_id = intent_data["payment_intent_id"]

    # 7. Submit Order for User A
    order_res = await client.post(
        "/api/v1/orders",
        headers={"Authorization": f"Bearer {token_a}"},
        json={
            "shipping_address": {
                "full_name": "User A",
                "address_line1": "123 Main St",
                "city": "San Jose",
                "state": "CA",
                "postal_code": "95112",
                "country": "US",
            },
            "payment_intent_id": payment_intent_id,
            "idempotency_key": "checkout_idemp_key_001",
        },
    )
    assert order_res.status_code == 201
    order_data = order_res.json()
    assert order_data["status"] == "paid"
    order_id = order_data["id"]

    # 8. Check Inventory: Quantity should have decremented from 5 to 3
    await db_session.refresh(inv)
    assert inv.quantity == 3

    # 9. IDOR Prevention: User B attempts to access User A's order -> MUST return 403 Forbidden!
    idor_res = await client.get(
        f"/api/v1/orders/{order_id}",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert idor_res.status_code == 403

    # 10. Concurrency / Overselling Protection:
    # User B adds 4 units to cart (but only 3 are left in stock)
    oversell_add = await client.post(
        "/api/v1/cart/items",
        headers={"Authorization": f"Bearer {token_b}"},
        json={"variant_id": variant.id, "quantity": 4},
    )
    assert oversell_add.status_code == 409  # Conflict: insufficient stock

    # 11. Stripe Webhook Verification with Idempotency
    webhook_payload = json.dumps({
        "id": "evt_test_123",
        "type": "payment_intent.succeeded",
        "data": {
            "object": {
                "id": payment_intent_id,
                "amount": 10998,
                "currency": "usd",
                "status": "succeeded",
            }
        },
    }).encode("utf-8")

    wh_res = await client.post(
        "/api/v1/payments/stripe/webhook",
        headers={"Stripe-Signature": "t=123,v1=mock_signature"},
        content=webhook_payload,
    )
    assert wh_res.status_code == 200

    # Repeating the same webhook should detect duplicate idempotency key
    wh_dup = await client.post(
        "/api/v1/payments/stripe/webhook",
        headers={"Stripe-Signature": "t=123,v1=mock_signature"},
        content=webhook_payload,
    )
    assert wh_dup.status_code == 200
    assert wh_dup.json()["status"] == "already_processed"


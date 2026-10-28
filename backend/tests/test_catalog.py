"""
Catalog, Search & Admin Product Management Tests.
Verifies category trees, catalog filters, hybrid search, autocomplete, and RBAC admin CRUD.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import create_access_token
from app.modules.auth.models import Role, User


# Tests


@pytest.mark.asyncio
async def test_category_and_product_flows(client: AsyncClient, db_session: AsyncSession):
    # Fetch or create roles
    from sqlalchemy import select
    admin_res = await db_session.execute(select(Role).where(Role.name == "admin"))
    admin_role = admin_res.scalar_one_or_none()
    if not admin_role:
        admin_role = Role(name="admin", description="Admin")
        db_session.add(admin_role)
        await db_session.flush()

    cust_res = await db_session.execute(select(Role).where(Role.name == "customer"))
    customer_role = cust_res.scalar_one_or_none()
    if not customer_role:
        customer_role = Role(name="customer", description="Customer")
        db_session.add(customer_role)
        await db_session.flush()

    admin_user = User(
        email="admin@test.com",
        hashed_password="hash",
        full_name="Admin",
        role_id=admin_role.id,
        is_active=True,
    )
    customer_user = User(
        email="customer@test.com",
        hashed_password="hash",
        full_name="Customer",
        role_id=customer_role.id,
        is_active=True,
    )
    db_session.add_all([admin_user, customer_user])
    await db_session.commit()

    admin_token, _, _ = create_access_token(admin_user.id, admin_user.email, "admin")
    customer_token, _, _ = create_access_token(customer_user.id, customer_user.email, "customer")

    # 1. Fetch categories
    cat_res = await client.get("/api/v1/categories?tree=true")
    assert cat_res.status_code == 200

    # 2. Admin creates a category and a product
    from app.modules.categories.models import Category
    test_cat = Category(name="Laptops", slug="laptops")
    db_session.add(test_cat)
    await db_session.commit()

    # Unauthorized attempt to create product by customer should fail (403)
    unauth_create = await client.post(
        "/api/v1/admin/products",
        headers={"Authorization": f"Bearer {customer_token}"},
        json={
            "category_id": test_cat.id,
            "title": "ThinkPad Carbon X1",
            "slug": "thinkpad-carbon-x1",
            "description": "Ultra-lightweight business laptop with carbon fiber chassis.",
            "brand": "Lenovo",
            "base_price_cents": 149900,
            "variants": [
                {
                    "sku": "TP-X1-16GB",
                    "title": "ThinkPad X1 16GB",
                    "price_cents": 149900,
                    "initial_stock": 25,
                }
            ],
            "image_urls": ["https://images.unsplash.com/test.jpg"],
        },
    )
    assert unauth_create.status_code == 403

    # Authorized admin creates product
    admin_create = await client.post(
        "/api/v1/admin/products",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "category_id": test_cat.id,
            "title": "ThinkPad Carbon X1",
            "slug": "thinkpad-carbon-x1",
            "description": "Ultra-lightweight business laptop with carbon fiber chassis.",
            "brand": "Lenovo",
            "base_price_cents": 149900,
            "variants": [
                {
                    "sku": "TP-X1-16GB",
                    "title": "ThinkPad X1 16GB",
                    "price_cents": 149900,
                    "initial_stock": 25,
                }
            ],
            "image_urls": ["https://images.unsplash.com/test.jpg"],
        },
    )
    assert admin_create.status_code == 201
    prod_data = admin_create.json()
    assert prod_data["title"] == "ThinkPad Carbon X1"
    prod_id = prod_data["id"]
    variant_id = prod_data["variants"][0]["id"]

    # 3. Public Catalog listing with filter
    list_res = await client.get("/api/v1/products?brand=Lenovo")
    assert list_res.status_code == 200
    page_data = list_res.json()
    assert len(page_data["items"]) >= 1
    assert page_data["items"][0]["slug"] == "thinkpad-carbon-x1"

    # 4. Product details by slug
    detail_res = await client.get("/api/v1/products/thinkpad-carbon-x1")
    assert detail_res.status_code == 200
    assert detail_res.json()["variants"][0]["inventory"]["quantity"] == 25

    # 5. Hybrid search
    search_res = await client.get("/api/v1/search?q=ThinkPad+ultralight&mode=hybrid")
    assert search_res.status_code == 200
    results = search_res.json()["items"]
    assert len(results) >= 1
    assert results[0]["brand"] == "Lenovo"

    # 6. Autocomplete
    ac_res = await client.get("/api/v1/search/autocomplete?q=Think")
    assert ac_res.status_code == 200
    suggestions = ac_res.json()["suggestions"]
    assert any("ThinkPad" in s["text"] for s in suggestions)

    # 7. Admin updates inventory
    inv_res = await client.patch(
        f"/api/v1/admin/inventory/{variant_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"quantity": 80, "low_stock_threshold": 10},
    )
    assert inv_res.status_code == 200
    assert inv_res.json()["quantity"] == 80

    # 8. Admin soft-deletes product
    del_res = await client.delete(
        f"/api/v1/admin/products/{prod_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert del_res.status_code == 204

    # Verification: should now return 404
    get_del = await client.get(f"/api/v1/products/{prod_id}")
    assert get_del.status_code == 404

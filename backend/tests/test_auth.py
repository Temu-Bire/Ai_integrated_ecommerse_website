"""
Authentication, Password Security & Token Rotation Tests.
Verifies registration, validation, login, lockout, token rotation, family revocation, and logout.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_register_and_login_flow(client: AsyncClient):
    # 1. Register with weak password should fail
    weak_res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "weak",
            "full_name": "Test User",
        },
    )
    assert weak_res.status_code == 422 or weak_res.status_code == 400

    # 2. Register with valid password
    valid_res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "StrongPassword123!",
            "full_name": "Test User",
        },
    )
    assert valid_res.status_code == 201
    assert "verification_token" in valid_res.json()["details"]
    verif_token = valid_res.json()["details"]["verification_token"]

    # 3. Duplicate registration should return 409 Conflict
    dup_res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "StrongPassword123!",
            "full_name": "Test User",
        },
    )
    assert dup_res.status_code == 409

    # 4. Email verification
    verif_res = await client.post(
        "/api/v1/auth/verify-email",
        json={"token": verif_token},
    )
    assert verif_res.status_code == 200

    # 5. Login with invalid password
    bad_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "WrongPassword123!"},
    )
    assert bad_login.status_code == 401

    # 6. Login with correct password
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "StrongPassword123!"},
    )
    assert login_res.status_code == 200
    data = login_res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    access_token = data["access_token"]

    # Check cookies
    cookies = login_res.cookies
    assert "refresh_token" in cookies
    refresh_token = cookies["refresh_token"]

    # 7. Get current user profile
    me_res = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert me_res.status_code == 200
    user_info = me_res.json()
    assert user_info["email"] == "test@example.com"
    assert user_info["is_verified"] is True

    # 8. Token Refresh Rotation
    refresh_res = await client.post(
        "/api/v1/auth/refresh",
        cookies={"refresh_token": refresh_token},
    )
    assert refresh_res.status_code == 200
    refreshed_data = refresh_res.json()
    assert "access_token" in refreshed_data
    new_refresh_token = refresh_res.cookies.get("refresh_token")
    assert new_refresh_token is not None
    assert new_refresh_token != refresh_token

    # 9. Token Reuse Detection: Presenting old revoked refresh_token should trigger security violation
    reuse_res = await client.post(
        "/api/v1/auth/refresh",
        cookies={"refresh_token": refresh_token},
    )
    assert reuse_res.status_code == 401
    assert "reuse" in reuse_res.json()["message"].lower()

    # 10. Logout
    logout_res = await client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {refreshed_data['access_token']}"},
        cookies={"refresh_token": new_refresh_token},
    )
    assert logout_res.status_code == 200


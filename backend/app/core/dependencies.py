"""
Common FastAPI Dependencies.
Handles DB injection, current authenticated user resolution, RBAC, and IDOR prevention.
"""

from datetime import datetime, timezone
from typing import Any, AsyncGenerator, Callable, Optional
from fastapi import Depends, Header, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.exceptions import ForbiddenException, UnauthorizedException
from app.core.logging import logger
from app.core.redis import redis_service
from app.core.security import decode_access_token

security_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
):
    """
    Extracts Bearer token from header or authorization, validates claims,
    verifies Redis denylist, checks user status and lockout in DB.
    """
    from app.modules.auth.models import User

    token = None
    if credentials:
        token = credentials.credentials
    else:
        # Also check Authorization header directly
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        raise UnauthorizedException("Authentication token missing")

    payload = decode_access_token(token)
    user_id = payload.get("sub")
    jti = payload.get("jti")

    if not user_id or not jti:
        raise UnauthorizedException("Invalid token payload")

    # Check Redis denylist
    if await redis_service.is_token_denylisted(jti):
        raise UnauthorizedException("Token has been revoked")

    # Fetch user from DB
    result = await db.execute(select(User).where(User.id == user_id, User.deleted_at.is_(None)))
    user = result.scalar_one_or_none()

    if not user:
        raise UnauthorizedException("User no longer exists")

    if not user.is_active:
        raise UnauthorizedException("User account is disabled")

    # Check lockout
    lockout = user.lockout_until.replace(tzinfo=timezone.utc) if user.lockout_until and user.lockout_until.tzinfo is None else user.lockout_until
    if lockout and lockout > datetime.now(timezone.utc):
        raise ForbiddenException("Account temporarily locked due to failed login attempts")

    # Attach to request state for structured logging
    request.state.user_id = user.id
    return user


async def get_optional_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
):
    """Returns authenticated User if token is present and valid; otherwise None."""
    try:
        return await get_current_user(request, credentials, db)
    except Exception:
        return None


def require_role(required_role: str) -> Callable:
    """Enforces role-based access control (e.g. 'admin')."""
    async def role_checker(current_user=Depends(get_current_user)):
        # Check role name on user.role
        role_name = getattr(current_user, "role_name", None)
        if not role_name and hasattr(current_user, "role") and current_user.role:
            role_name = current_user.role.name
        
        if role_name != required_role:
            logger.warning(
                f"Unauthorized role access attempt by user {current_user.id}: "
                f"required '{required_role}', got '{role_name}'"
            )
            raise ForbiddenException(f"Operation requires '{required_role}' privileges")
        return current_user

    return role_checker


def check_resource_ownership(owner_id: str, current_user: Any, admin_bypass: bool = True) -> None:
    """
    Prevents Insecure Direct Object References (IDOR).
    Raises ForbiddenException if current_user is neither the owner nor an admin.
    """
    is_admin = False
    if hasattr(current_user, "role") and current_user.role:
        is_admin = current_user.role.name == "admin"
    elif getattr(current_user, "role_name", "") == "admin":
        is_admin = True

    if admin_bypass and is_admin:
        return

    if str(owner_id) != str(current_user.id):
        raise ForbiddenException("You are not authorized to access or modify this resource")

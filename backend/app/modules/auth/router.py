"""
Authentication Router.
Handles register, login, refresh, logout, email verification, password reset, and identity endpoints.
"""

from typing import Optional
from fastapi import APIRouter, Cookie, Depends, Header, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.exceptions import UnauthorizedException
from app.core.security import decode_access_token
from app.modules.auth.models import User
from app.modules.auth.schemas import (
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserResponse,
    VerifyEmailRequest,
)
from app.modules.auth.service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


def set_refresh_cookie(response: Response, refresh_token: str) -> None:
    """Sets secure HttpOnly cookie for rotating refresh token."""
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,  # "lax"
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
        path=f"{settings.API_V1_PREFIX}/auth",
        domain=settings.COOKIE_DOMAIN,
    )


def clear_refresh_cookie(response: Response) -> None:
    """Clears refresh token cookie."""
    response.delete_cookie(
        key="refresh_token",
        path=f"{settings.API_V1_PREFIX}/auth",
        domain=settings.COOKIE_DOMAIN,
    )


@router.post(
    "/register",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new customer account",
)
async def register(
    req: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    user, verification_token = await service.register(req)
    return MessageResponse(
        message="Registration successful. Please verify your email.",
        details={"email": user.email, "verification_token": verification_token if settings.DEBUG else None},
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate and receive access token + HttpOnly refresh cookie",
)
async def login(
    req: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    user, access_token, refresh_token, expires_in = await service.login(req)
    set_refresh_cookie(response, refresh_token)
    return TokenResponse(access_token=access_token, expires_in=expires_in)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Rotate refresh token and issue new access token",
)
async def refresh_token_endpoint(
    response: Response,
    refresh_token: Optional[str] = Cookie(default=None),
    authorization: Optional[str] = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    raw_token = refresh_token
    # Support bearer/header token for automated tests or headless clients
    if not raw_token and authorization and authorization.startswith("Bearer "):
        raw_token = authorization.split(" ")[1]

    if not raw_token:
        raise UnauthorizedException("Refresh token missing from request")

    service = AuthService(db)
    user, new_access_token, new_refresh_token, expires_in = await service.refresh_tokens(raw_token)
    set_refresh_cookie(response, new_refresh_token)
    return TokenResponse(access_token=new_access_token, expires_in=expires_in)


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Revoke session and denylist token",
)
async def logout(
    request: Request,
    response: Response,
    refresh_token: Optional[str] = Cookie(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    auth_header = request.headers.get("Authorization", "")
    jti = None
    if auth_header.startswith("Bearer "):
        try:
            payload = decode_access_token(auth_header.split(" ")[1])
            jti = payload.get("jti")
        except Exception:
            pass

    await service.logout(refresh_token, jti)
    clear_refresh_cookie(response)
    return MessageResponse(message="Successfully logged out.")


@router.post(
    "/verify-email",
    response_model=MessageResponse,
    summary="Verify customer email address",
)
async def verify_email(
    req: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    await service.verify_email(req.token)
    return MessageResponse(message="Email address verified successfully.")


@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    summary="Request password reset token",
)
async def forgot_password(
    req: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    token = await service.forgot_password(req.email)
    return MessageResponse(
        message="If an account exists with this email, a password reset link has been dispatched.",
        details={"reset_token": token if settings.DEBUG else None},
    )


@router.post(
    "/reset-password",
    response_model=MessageResponse,
    summary="Reset password with verification token",
)
async def reset_password(
    req: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    await service.reset_password(req.token, req.new_password)
    return MessageResponse(message="Password has been reset successfully. You may now log in.")


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current authenticated user identity",
)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


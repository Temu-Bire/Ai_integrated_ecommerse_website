"""
Authentication Service Business Logic.
Handles password security, lockout policies, rotating refresh tokens, and lifecycle events.
"""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
    UnauthorizedException,
)
from app.core.logging import logger
from app.core.redis import redis_service
from app.core.security import (
    create_access_token,
    generate_secure_token,
    hash_password,
    hash_token,
    validate_password_strength,
    verify_password,
)
from app.modules.auth.models import (
    EmailVerificationToken,
    PasswordResetToken,
    RefreshToken,
    Role,
    User,
)
from app.modules.auth.repository import TokenRepository, UserRepository
from app.modules.auth.schemas import LoginRequest, RegisterRequest


def ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.token_repo = TokenRepository(db)

    async def register(self, req: RegisterRequest) -> Tuple[User, str]:
        """Registers a new customer account, validating password strength and generating verification token."""
        validate_password_strength(req.password)

        existing_user = await self.user_repo.get_by_email(req.email)
        if existing_user:
            raise ConflictException("An account with this email address already exists.")

        # Ensure default customer role exists
        role = await self.user_repo.get_role_by_name("customer")
        if not role:
            role = Role(name="customer", description="Standard customer account")
            self.db.add(role)
            await self.db.flush()

        hashed_pwd = hash_password(req.password)
        user = User(
            email=req.email.lower().strip(),
            hashed_password=hashed_pwd,
            full_name=req.full_name.strip(),
            role_id=role.id,
            is_active=True,
            is_verified=False,
        )
        user = await self.user_repo.create_user(user)

        # Generate email verification token
        raw_token = generate_secure_token()
        verif_token = EmailVerificationToken(
            user_id=user.id,
            token_hash=hash_token(raw_token),
            expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
        )
        await self.token_repo.create_email_verification_token(verif_token)

        logger.info(f"User registered successfully: {user.email}")
        return user, raw_token

    async def login(self, req: LoginRequest) -> Tuple[User, str, str, int]:
        """
        Authenticates user with email/password.
        Enforces account lockout on repeated failures.
        Returns: (user, access_token, raw_refresh_token, expires_in)
        """
        user = await self.user_repo.get_by_email(req.email)
        now = datetime.now(timezone.utc)

        if not user:
            # Constant time delay / dummy check against timing attacks
            verify_password("dummy", "$argon2id$v=19$m=65536,t=3,p=4$dummy$dummy")
            raise UnauthorizedException("Invalid email or password.")

        # Check account lockout
        if user.lockout_until and ensure_utc(user.lockout_until) > now:
            minutes_left = int((ensure_utc(user.lockout_until) - now).total_seconds() / 60) + 1
            raise ForbiddenException(
                f"Account is temporarily locked due to failed login attempts. Try again in {minutes_left} minutes."
            )

        if not verify_password(req.password, user.hashed_password):
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= settings.MAX_FAILED_LOGIN_ATTEMPTS:
                user.lockout_until = now + timedelta(minutes=settings.ACCOUNT_LOCKOUT_MINUTES)
                logger.warning(f"User locked out after {user.failed_login_attempts} failed attempts: {user.email}")
            await self.user_repo.update_user(user)
            raise UnauthorizedException("Invalid email or password.")

        if not user.is_active:
            raise UnauthorizedException("This account has been deactivated.")

        # Reset failed attempts upon successful login
        if user.failed_login_attempts > 0 or user.lockout_until:
            user.failed_login_attempts = 0
            user.lockout_until = None
            await self.user_repo.update_user(user)

        # Create access token and refresh token
        access_token, _, _ = create_access_token(
            user_id=user.id,
            email=user.email,
            role=user.role_name,
        )

        raw_refresh_token = generate_secure_token()
        family_id = str(uuid.uuid4())
        refresh_token_record = RefreshToken(
            user_id=user.id,
            token_hash=hash_token(raw_refresh_token),
            jti=str(uuid.uuid4()),
            family_id=family_id,
            expires_at=now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
        await self.token_repo.save_refresh_token(refresh_token_record)

        logger.info(f"User logged in successfully: {user.email}")
        return user, access_token, raw_refresh_token, settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

    async def refresh_tokens(self, raw_refresh_token: str) -> Tuple[User, str, str, int]:
        """
        Rotates refresh token. Detects token reuse (family revocation).
        Returns: (user, new_access_token, new_raw_refresh_token, expires_in)
        """
        token_hash = hash_token(raw_refresh_token)
        stored_token = await self.token_repo.get_refresh_token_by_hash(token_hash)
        now = datetime.now(timezone.utc)

        if not stored_token:
            raise UnauthorizedException("Invalid refresh token")

        # Reuse Detection: If a revoked refresh token is presented, compromise is detected!
        if stored_token.is_revoked:
            logger.critical(
                f"Refresh token reuse detected for user {stored_token.user_id}! "
                f"Revoking token family {stored_token.family_id}."
            )
            await self.token_repo.revoke_family(stored_token.family_id)
            raise UnauthorizedException("Security violation: Refresh token reuse detected. Please log in again.")

        if ensure_utc(stored_token.expires_at) < now:
            raise UnauthorizedException("Refresh token has expired")

        user = await self.user_repo.get_by_id(stored_token.user_id)
        if not user or not user.is_active:
            raise UnauthorizedException("User is no longer active")

        # Invalidate current refresh token
        stored_token.is_revoked = True
        await self.db.commit()

        # Issue new token pair with same family_id
        access_token, _, _ = create_access_token(
            user_id=user.id,
            email=user.email,
            role=user.role_name,
        )

        new_raw_refresh_token = generate_secure_token()
        new_token_record = RefreshToken(
            user_id=user.id,
            token_hash=hash_token(new_raw_refresh_token),
            jti=str(uuid.uuid4()),
            family_id=stored_token.family_id,
            expires_at=now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
        await self.token_repo.save_refresh_token(new_token_record)

        return user, access_token, new_raw_refresh_token, settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

    async def logout(self, raw_refresh_token: Optional[str], access_jti: Optional[str]) -> None:
        """Revokes refresh token and denylists active access token in Redis."""
        if raw_refresh_token:
            token_hash = hash_token(raw_refresh_token)
            stored_token = await self.token_repo.get_refresh_token_by_hash(token_hash)
            if stored_token:
                stored_token.is_revoked = True
                await self.db.commit()

        if access_jti:
            # Denylist access token for remaining expiration lifetime
            await redis_service.denylist_token(
                jti=access_jti,
                expires_in_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            )

    async def verify_email(self, raw_token: str) -> None:
        """Verifies email using single-use verification token."""
        token_hash = hash_token(raw_token)
        record = await self.token_repo.get_valid_email_token(token_hash)
        if not record:
            raise BadRequestException("Invalid or expired email verification link.")

        record.used_at = datetime.now(timezone.utc)
        user = await self.user_repo.get_by_id(record.user_id)
        if user:
            user.is_verified = True
        await self.db.commit()
        logger.info(f"Email verified successfully for user: {user.email if user else record.user_id}")

    async def forgot_password(self, email: str) -> str:
        """Generates secure password reset token."""
        user = await self.user_repo.get_by_email(email)
        if not user:
            # Return dummy string to prevent user enumeration
            return "reset_token_sent"

        raw_token = generate_secure_token()
        reset_token = PasswordResetToken(
            user_id=user.id,
            token_hash=hash_token(raw_token),
            expires_at=datetime.now(timezone.utc) + timedelta(hours=2),
        )
        await self.token_repo.create_password_reset_token(reset_token)
        logger.info(f"Password reset requested for: {user.email}")
        return raw_token

    async def reset_password(self, raw_token: str, new_password: str) -> None:
        """Resets user password after token verification."""
        validate_password_strength(new_password)
        token_hash = hash_token(raw_token)
        record = await self.token_repo.get_valid_password_reset_token(token_hash)
        if not record:
            raise BadRequestException("Invalid or expired password reset token.")

        record.used_at = datetime.now(timezone.utc)
        user = await self.user_repo.get_by_id(record.user_id)
        if not user:
            raise NotFoundException("User not found.")

        user.hashed_password = hash_password(new_password)
        user.failed_login_attempts = 0
        user.lockout_until = None
        await self.db.commit()
        logger.info(f"Password successfully reset for: {user.email}")

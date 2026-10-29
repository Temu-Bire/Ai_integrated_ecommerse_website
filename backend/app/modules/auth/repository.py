"""
Authentication Database Repositories.
Decoupled data access layer for Users, Roles, and Tokens.
"""

from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.auth.models import (
    EmailVerificationToken,
    PasswordResetToken,
    RefreshToken,
    Role,
    User,
)


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: str) -> Optional[User]:
        stmt = select(User).where(User.id == user_id, User.deleted_at.is_(None))
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[User]:
        stmt = select(User).where(User.email == email.lower().strip(), User.deleted_at.is_(None))
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_role_by_name(self, name: str) -> Optional[Role]:
        stmt = select(Role).where(Role.name == name)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create_user(self, user: User) -> User:
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def update_user(self, user: User) -> User:
        await self.db.commit()
        await self.db.refresh(user)
        return user


class TokenRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def save_refresh_token(self, token: RefreshToken) -> RefreshToken:
        self.db.add(token)
        await self.db.commit()
        return token

    async def get_refresh_token_by_hash(self, token_hash: str) -> Optional[RefreshToken]:
        stmt = select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def revoke_family(self, family_id: str) -> None:
        """Revokes all refresh tokens in a given family (compromise/reuse detection)."""
        stmt = (
            update(RefreshToken)
            .where(RefreshToken.family_id == family_id)
            .values(is_revoked=True)
        )
        await self.db.execute(stmt)
        await self.db.commit()

    async def create_email_verification_token(self, token: EmailVerificationToken) -> EmailVerificationToken:
        self.db.add(token)
        await self.db.commit()
        return token

    async def get_valid_email_token(self, token_hash: str) -> Optional[EmailVerificationToken]:
        now = datetime.now(timezone.utc)
        stmt = select(EmailVerificationToken).where(
            EmailVerificationToken.token_hash == token_hash,
            EmailVerificationToken.used_at.is_(None),
            EmailVerificationToken.expires_at > now,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create_password_reset_token(self, token: PasswordResetToken) -> PasswordResetToken:
        self.db.add(token)
        await self.db.commit()
        return token

    async def get_valid_password_reset_token(self, token_hash: str) -> Optional[PasswordResetToken]:
        now = datetime.now(timezone.utc)
        stmt = select(PasswordResetToken).where(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.used_at.is_(None),
            PasswordResetToken.expires_at > now,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()


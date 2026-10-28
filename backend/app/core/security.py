"""
Cryptographic Security, Password Hashing & JWT Management.
Implements Argon2id hashing, short-lived JWT access tokens, and rotating refresh tokens with family tracking.
"""

import hashlib
import re
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Tuple
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from jose import JWTError, jwt
from app.core.config import settings
from app.core.exceptions import BadRequestException, UnauthorizedException
from app.core.logging import logger

# Initialize Argon2id password hasher with OWASP-recommended parameters
ph = PasswordHasher(
    time_cost=3,
    memory_cost=65536,  # 64 MB
    parallelism=4,
    hash_len=32,
    salt_len=16,
)

PASSWORD_REGEX = re.compile(
    r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^~_\-+=\[\]{}|:;<>,./])[A-Za-z\d@$!%*?&#^~_\-+=\[\]{}|:;<>,./]{8,}$"
)


def validate_password_strength(password: str) -> None:
    """Enforces minimum length (8 chars), uppercase, lowercase, digit, and special char."""
    if len(password) < 8:
        raise BadRequestException("Password must be at least 8 characters long.")
    if not PASSWORD_REGEX.match(password):
        raise BadRequestException(
            "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character."
        )


def hash_password(plain_password: str) -> str:
    """Hashes a plaintext password using Argon2id."""
    return ph.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plaintext password against an Argon2id hash."""
    try:
        return ph.verify(hashed_password, plain_password)
    except (VerifyMismatchError, Exception):
        return False


def hash_token(raw_token: str) -> str:
    """Generates SHA-256 hash of a token for secure database persistence."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def generate_secure_token() -> str:
    """Generates cryptographically random URL-safe token."""
    return secrets.token_urlsafe(32)


def create_access_token(
    user_id: str,
    email: str,
    role: str,
    expires_delta: Optional[timedelta] = None,
) -> Tuple[str, str, datetime]:
    """
    Creates short-lived JWT access token.
    Returns: (token_str, jti, expire_datetime)
    """
    jti = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    expires = now + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))

    payload: Dict[str, Any] = {
        "sub": user_id,
        "email": email,
        "role": role,
        "jti": jti,
        "iat": int(now.timestamp()),
        "exp": int(expires.timestamp()),
        "type": "access",
    }

    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.ALGORITHM)
    return token, jti, expires


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decodes and validates a JWT access token."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        if payload.get("type") != "access":
            raise UnauthorizedException("Invalid token type")
        return payload
    except JWTError as e:
        logger.debug(f"JWT decode error: {e}")
        raise UnauthorizedException("Invalid or expired access token")

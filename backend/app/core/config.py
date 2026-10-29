"""
Application Configuration Module using Pydantic Settings.
Loads and validates environment variables from .env.
"""

from typing import List, Optional
from pydantic import AnyHttpUrl, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # General App Config
    ENVIRONMENT: str = "development"
    APP_NAME: str = "NovaMart AI E-Commerce"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # Security & CORS
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1", "0.0.0.0"]
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./ecommerce.db"
    POSTGRES_USER: str = "ecommerce_user"
    POSTGRES_PASSWORD: str = "ecommerce_password"
    POSTGRES_DB: str = "ecommerce_db"
    POSTGRES_PORT: int = 5432

    # Redis
    REDIS_URL: Optional[str] = None
    REDIS_PASSWORD: Optional[str] = None

    # JWT & Auth
    JWT_SECRET_KEY: str = "c70e3af059e614f43ad89fe4095270fa4_production_grade_secret_key_32_chars!"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"
    COOKIE_DOMAIN: Optional[str] = None
    MAX_FAILED_LOGIN_ATTEMPTS: int = 5
    ACCOUNT_LOCKOUT_MINUTES: int = 15

    # Rate Limiting (per minute)
    RATE_LIMIT_AUTH: int = 30
    RATE_LIMIT_SEARCH: int = 60
    RATE_LIMIT_AI: int = 20
    RATE_LIMIT_DEFAULT: int = 120

    # AI Configuration
    LLM_PROVIDER: str = "gemini"  # openai, anthropic, gemini
    AI_MODEL_NAME: str = "gemini-1.5-flash"
    AI_EMBEDDING_MODEL: str = "text-embedding-004"
    AI_TEMPERATURE: float = 0.2
    AI_MAX_TOKENS: int = 1024
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None

    # Payments (Stripe)
    STRIPE_SECRET_KEY: str = "sk_test_mock"
    STRIPE_PUBLISHABLE_KEY: str = "pk_test_mock"
    STRIPE_WEBHOOK_SECRET: str = "whsec_mock"

    # S3 Object Storage
    S3_ENDPOINT_URL: Optional[str] = None
    S3_ACCESS_KEY: Optional[str] = None
    S3_SECRET_KEY: Optional[str] = None
    S3_BUCKET_NAME: str = "ecommerce-products"
    S3_REGION: str = "us-east-1"

    # Email
    EMAILS_FROM_EMAIL: str = "support@novamart.local"
    EMAILS_FROM_NAME: str = "NovaMart Support"


settings = Settings()


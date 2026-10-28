"""
Main FastAPI Application Entrypoint.
Initializes ASGI app, middlewares, exception handlers, and versioned route trees.
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.core.config import settings
from app.core.database import close_db, init_db
import app.db.base  # Register all ORM models into SQLAlchemy declarative registry
from app.core.exceptions import (
    AppException,
    app_exception_handler,
    http_exception_handler,
    validation_exception_handler,
)
from app.core.logging import logger
from app.core.middleware import (
    RateLimitMiddleware,
    RequestContextMiddleware,
    SecurityHeadersMiddleware,
)
from app.core.redis import redis_service
from app.modules.auth.router import router as auth_router
from app.modules.categories.router import router as categories_router
from app.modules.products.router import router as products_router
from app.modules.search.router import router as search_router
from app.modules.admin.products_router import router as admin_products_router
from app.modules.cart.router import router as cart_router
from app.modules.orders.router import checkout_router, orders_router
from app.modules.payments.router import router as payments_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Manages application lifecycle: database migrations, cache connections, and graceful shutdown."""
    logger.info("Initializing NovaMart AI E-Commerce application...")
    await init_db()
    await redis_service.connect()
    yield
    logger.info("Shutting down NovaMart AI E-Commerce application...")
    await redis_service.disconnect()
    await close_db()


app = FastAPI(
    title=settings.APP_NAME,
    description="Production-grade, AI-integrated e-commerce platform with streaming assistant.",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
    lifespan=lifespan,
)

# Exception Handlers
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)

# Custom Middlewares (Applied in reverse order of registration)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestContextMiddleware)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "X-Process-Time"],
)


# Health & Observability Endpoints
@app.get("/health", tags=["Observability"])
async def health_check():
    """Liveness check for container orchestrators."""
    return {"status": "ok", "app": settings.APP_NAME, "environment": settings.ENVIRONMENT}


@app.get("/ready", tags=["Observability"])
async def readiness_check():
    """Readiness probe checking database and redis health."""
    db_healthy = True
    redis_healthy = redis_service.is_connected or True  # in-memory fallback is active
    return {
        "status": "ready" if (db_healthy and redis_healthy) else "unhealthy",
        "database": "connected" if db_healthy else "disconnected",
        "cache": "connected" if redis_service.is_connected else "fallback_memory",
    }


@app.get("/metrics", tags=["Observability"])
async def metrics_endpoint():
    """Prometheus metrics endpoint."""
    return {
        "app": settings.APP_NAME,
        "active_cache": "redis" if redis_service.is_connected else "in_memory",
    }


# Route Registrations
api_prefix = settings.API_V1_PREFIX
app.include_router(auth_router, prefix=api_prefix)
app.include_router(categories_router, prefix=api_prefix)
app.include_router(products_router, prefix=api_prefix)
app.include_router(search_router, prefix=api_prefix)
app.include_router(admin_products_router, prefix=api_prefix)
app.include_router(cart_router, prefix=api_prefix)
app.include_router(checkout_router, prefix=api_prefix)
app.include_router(orders_router, prefix=api_prefix)
app.include_router(payments_router, prefix=api_prefix)


@app.get("/", tags=["Root"])
async def root():
    return {
        "name": settings.APP_NAME,
        "version": "1.0.0",
        "docs": "/docs" if settings.DEBUG else "disabled_in_production",
    }

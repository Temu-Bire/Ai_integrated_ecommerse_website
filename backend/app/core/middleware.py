"""
Security, Request ID, and Rate Limiting Middlewares.
Implements OWASP security headers, correlation IDs, and sliding window rate limiting.
"""

import time
import uuid
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from app.core.config import settings
from app.core.exceptions import RateLimitExceededException
from app.core.logging import logger
from app.core.redis import redis_service


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Injects unique X-Request-ID into request state and response headers."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = request_id
        start_time = time.time()

        try:
            response = await call_next(request)
        except Exception as e:
            logger.error(f"Unhandled exception during request {request_id}: {e}", exc_info=True)
            raise e

        process_time = time.time() - start_time
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = f"{process_time:.4f}s"
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Enforces OWASP recommended HTTP security headers."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        
        # Strict-Transport-Security if in production or HTTPS
        if not settings.DEBUG:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"

        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Applies sliding-window rate limits based on client IP or authenticated user identifier.
    Different endpoints have tailored rate-limit thresholds.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Determine client identifier
        client_ip = request.client.host if request.client else "unknown"
        # Forwarded header support if behind proxy
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()

        path = request.url.path

        # Determine rate limit threshold for current route
        if "/auth/" in path:
            limit = settings.RATE_LIMIT_AUTH
        elif "/search" in path:
            limit = settings.RATE_LIMIT_SEARCH
        elif "/assistant" in path:
            limit = settings.RATE_LIMIT_AI
        else:
            limit = settings.RATE_LIMIT_DEFAULT

        # Check rate limit
        identifier = f"{client_ip}:{path.split('/')[3] if len(path.split('/')) > 3 else 'root'}"
        allowed = await redis_service.check_rate_limit(identifier=identifier, limit=limit, window_seconds=60)

        if not allowed:
            return JSONResponse(
                status_code=429,
                content={
                    "code": "RATE_LIMIT_EXCEEDED",
                    "message": "Too many requests. Please slow down and try again later.",
                    "details": {"limit_per_minute": limit},
                },
                headers={"Retry-After": "60"},
            )

        return await call_next(request)


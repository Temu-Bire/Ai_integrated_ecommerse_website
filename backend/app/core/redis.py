"""
Async Redis Client with in-memory fallback for local development/testing.
Handles caching, sliding-window rate limiting, and token denylisting.
"""

import time
from typing import Any, Dict, Optional, Set
from app.core.config import settings
from app.core.logging import logger

try:
    import redis.asyncio as aioredis
except ImportError:
    aioredis = None  # type: ignore


class InMemoryCacheFallback:
    """In-memory key-value and rate-limiter fallback when Redis is not reachable."""

    def __init__(self):
        self._data: Dict[str, Any] = {}
        self._expiry: Dict[str, float] = {}
        self._denylist: Set[str] = set()

    async def get(self, key: str) -> Optional[str]:
        if key in self._expiry and time.time() > self._expiry[key]:
            del self._data[key]
            del self._expiry[key]
            return None
        return self._data.get(key)

    async def set(self, key: str, value: str, ex: Optional[int] = None) -> bool:
        self._data[key] = value
        if ex:
            self._expiry[key] = time.time() + ex
        return True

    async def delete(self, key: str) -> int:
        existed = key in self._data
        self._data.pop(key, None)
        self._expiry.pop(key, None)
        return 1 if existed else 0

    async def is_token_denylisted(self, jti: str) -> bool:
        return jti in self._denylist

    async def denylist_token(self, jti: str, expires_in_seconds: int) -> None:
        self._denylist.add(jti)

    async def check_rate_limit(self, identifier: str, limit: int, window_seconds: int = 60) -> bool:
        """Sliding window counter in memory."""
        now = time.time()
        key = f"rate:{identifier}"
        history = self._data.get(key, [])
        # filter out entries outside the window
        history = [t for t in history if now - t < window_seconds]
        if len(history) >= limit:
            self._data[key] = history
            return False
        history.append(now)
        self._data[key] = history
        return True


class RedisService:
    def __init__(self):
        self.client: Optional[Any] = None
        self.fallback = InMemoryCacheFallback()
        self.is_connected = False

    async def connect(self) -> None:
        if settings.REDIS_URL and aioredis:
            try:
                self.client = aioredis.from_url(
                    settings.REDIS_URL,
                    password=settings.REDIS_PASSWORD or None,
                    decode_responses=True,
                    socket_timeout=2.0,
                )
                await self.client.ping()
                self.is_connected = True
                logger.info("Successfully connected to Redis.")
                return
            except Exception as e:
                logger.warning(f"Could not connect to Redis ({e}). Using in-memory fallback cache.")
        else:
            logger.info("Redis not configured. Operating with in-memory fallback cache.")
        self.is_connected = False

    async def disconnect(self) -> None:
        if self.client and self.is_connected:
            try:
                await self.client.close()
            except Exception as e:
                logger.warning(f"Error closing Redis connection: {e}")
            self.is_connected = False

    async def get(self, key: str) -> Optional[str]:
        if self.is_connected and self.client:
            try:
                return await self.client.get(key)
            except Exception as e:
                logger.warning(f"Redis get failed ({e}), falling back to memory.")
        return await self.fallback.get(key)

    async def set(self, key: str, value: str, ex: Optional[int] = None) -> bool:
        if self.is_connected and self.client:
            try:
                return bool(await self.client.set(key, value, ex=ex))
            except Exception as e:
                logger.warning(f"Redis set failed ({e}), falling back to memory.")
        return await self.fallback.set(key, value, ex=ex)

    async def delete(self, key: str) -> int:
        if self.is_connected and self.client:
            try:
                return int(await self.client.delete(key))
            except Exception as e:
                logger.warning(f"Redis delete failed ({e}), falling back to memory.")
        return await self.fallback.delete(key)

    async def is_token_denylisted(self, jti: str) -> bool:
        key = f"denylist:{jti}"
        if self.is_connected and self.client:
            try:
                val = await self.client.get(key)
                return val is not None
            except Exception:
                pass
        return await self.fallback.is_token_denylisted(jti)

    async def denylist_token(self, jti: str, expires_in_seconds: int) -> None:
        key = f"denylist:{jti}"
        if self.is_connected and self.client:
            try:
                await self.client.set(key, "revoked", ex=expires_in_seconds)
                return
            except Exception:
                pass
        await self.fallback.denylist_token(jti, expires_in_seconds)

    async def check_rate_limit(self, identifier: str, limit: int, window_seconds: int = 60) -> bool:
        """
        Sliding window rate limit using Redis sorted sets (or fallback).
        Returns True if request is allowed, False if limit exceeded.
        """
        now = time.time()
        key = f"rate:{identifier}"
        if self.is_connected and self.client:
            try:
                pipe = self.client.pipeline()
                pipe.zremrangebyscore(key, 0, now - window_seconds)
                pipe.zadd(key, {str(now): now})
                pipe.zcard(key)
                pipe.expire(key, window_seconds + 5)
                results = await pipe.execute()
                current_count = results[2]
                return current_count <= limit
            except Exception as e:
                logger.warning(f"Redis rate limit check error ({e}), using fallback.")
        return await self.fallback.check_rate_limit(identifier, limit, window_seconds)


redis_service = RedisService()


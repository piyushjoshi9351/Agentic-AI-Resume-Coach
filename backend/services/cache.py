"""Caching utilities with Redis optional backend and in-memory fallback."""

import json
import os
import time
from typing import Any

try:
    import redis
except Exception:
    redis = None


class CacheClient:
    def __init__(self):
        self._memory: dict[str, tuple[float, Any]] = {}
        self._redis = None
        redis_url = os.getenv("REDIS_URL", "").strip()
        if redis and redis_url:
            try:
                self._redis = redis.Redis.from_url(redis_url, decode_responses=True)
                self._redis.ping()
            except Exception:
                self._redis = None

    def get(self, key: str):
        if self._redis:
            try:
                value = self._redis.get(key)
                if value is None:
                    return None
                return json.loads(value)
            except Exception:
                return None

        data = self._memory.get(key)
        if not data:
            return None
        expires_at, value = data
        if expires_at < time.time():
            self._memory.pop(key, None)
            return None
        return value

    def set(self, key: str, value, ttl_seconds: int = 300):
        if self._redis:
            try:
                self._redis.setex(key, ttl_seconds, json.dumps(value))
                return
            except Exception:
                pass

        self._memory[key] = (time.time() + ttl_seconds, value)


cache_client = CacheClient()

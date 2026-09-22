import time
import json
import logging
from typing import Optional, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

class CacheClient:
    def __init__(self):
        self._redis = None
        self._memory_cache = {}
        self._memory_expiry = {}
        self._locks = {}
        
        if settings.REDIS_ENABLED:
            try:
                import redis
                self._redis = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
                self._redis.ping()
                logger.info("Connected to Redis successfully.")
            except Exception as e:
                logger.warning(f"Redis unavailable ({e}), using in-memory cache fallback.")
                self._redis = None

    def get(self, key: str) -> Optional[str]:
        if self._redis:
            try:
                return self._redis.get(key)
            except Exception:
                pass
        
        # In-memory fallback
        now = time.time()
        if key in self._memory_cache:
            if key in self._memory_expiry and self._memory_expiry[key] < now:
                del self._memory_cache[key]
                del self._memory_expiry[key]
                return None
            return self._memory_cache.get(key)
        return None

    def set(self, key: str, value: str, ex: int = 300) -> bool:
        if self._redis:
            try:
                return bool(self._redis.set(key, value, ex=ex))
            except Exception:
                pass
        
        self._memory_cache[key] = value
        if ex:
            self._memory_expiry[key] = time.time() + ex
        return True

    def delete(self, key: str) -> bool:
        if self._redis:
            try:
                return bool(self._redis.delete(key))
            except Exception:
                pass
        
        self._memory_cache.pop(key, None)
        self._memory_expiry.pop(key, None)
        return True

    def acquire_lock(self, lock_key: str, timeout_sec: int = 5) -> bool:
        """Simple lock helper for seat concurrency coordination"""
        full_key = f"lock:{lock_key}"
        if self._redis:
            try:
                # SET key value NX EX
                acquired = self._redis.set(full_key, "locked", nx=True, ex=timeout_sec)
                return bool(acquired)
            except Exception:
                pass
        
        now = time.time()
        if full_key in self._locks and self._locks[full_key] > now:
            return False
        self._locks[full_key] = now + timeout_sec
        return True

    def release_lock(self, lock_key: str) -> bool:
        full_key = f"lock:{lock_key}"
        if self._redis:
            try:
                return bool(self._redis.delete(full_key))
            except Exception:
                pass
        
        self._locks.pop(full_key, None)
        return True

cache = CacheClient()

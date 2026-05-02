"""Сервис для кэширования данных в Redis."""
import json
from typing import Optional, Any
from database import get_redis_client

# TTL для разных типов данных (в секундах)
CACHE_TTL = {
    "rooms_list": 30,      # Список комнат (30 секунд)
    "room_details": 60,    # Детали комнаты (60 секунд)
    "participants": 10,    # Участники комнаты (10 секунд)
    "analytics": 300,      # Аналитика (5 минут)
}

async def get_cache_key(prefix: str, identifier: str) -> str:
    """Сформировать ключ для кэша."""
    return f"{prefix}:{identifier}"

async def get_cached(prefix: str, identifier: str) -> Optional[Any]:
    """Получить данные из кэша."""
    try:
        redis = await get_redis_client()
        key = await get_cache_key(prefix, identifier)
        data = await redis.get(key)
        if data:
            return json.loads(data)
    except Exception as e:
        print(f"Redis get error: {e}")
    return None

async def set_cached(prefix: str, identifier: str, data: Any, ttl: int = None) -> None:
    """Сохранить данные в кэш."""
    try:
        redis = await get_redis_client()
        key = await get_cache_key(prefix, identifier)
        if ttl is None:
            ttl = CACHE_TTL.get(prefix, 60)
        await redis.setex(key, ttl, json.dumps(data, default=str))
    except Exception as e:
        print(f"Redis set error: {e}")

async def invalidate_cache(prefix: str, identifier: str = None) -> None:
    """Инвалидировать кэш по префиксу или конкретному ключу."""
    try:
        redis = await get_redis_client()
        if identifier:
            key = await get_cache_key(prefix, identifier)
            await redis.delete(key)
        else:
            # Удалить все ключи с данным префиксом
            pattern = f"{prefix}:*"
            keys = await redis.keys(pattern)
            if keys:
                await redis.delete(*keys)
    except Exception as e:
        print(f"Redis invalidate error: {e}")
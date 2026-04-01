"""
Conversation Memory Engine
Stores interaction history, tracks emotion trends, and detects escalation.
Uses Redis when available, falls back to in-memory storage.
"""

import json
import time
import hashlib
import logging
from collections import deque

logger = logging.getLogger(__name__)

# In-memory fallback storage
_memory_store: dict[str, deque] = {}
_cache_store: dict[str, dict] = {}
_redis_client = None
_redis_available = False

MAX_HISTORY = 10
MAX_SESSIONS = 100
CACHE_TTL = 3600  # 1 hour


def init_redis(redis_url: str = None):
    """Try to connect to Redis. Fall back to in-memory if unavailable."""
    global _redis_client, _redis_available

    if not redis_url:
        logger.info("No Redis URL provided. Using in-memory storage.")
        _redis_available = False
        return

    try:
        import redis
        _redis_client = redis.from_url(redis_url, decode_responses=True)
        _redis_client.ping()
        _redis_available = True
        logger.info("Redis connected successfully.")
    except Exception as e:
        _redis_available = False
        _redis_client = None
        logger.warning(f"Redis unavailable ({e}). Falling back to in-memory storage.")


def _get_session_key(session_id: str) -> str:
    return f"empathy:session:{session_id}"


def _get_cache_key(text: str, mode: str, session_id: str) -> str:
    raw = f"{text.strip().lower()}|{mode}|{session_id}"
    return f"empathy:cache:{hashlib.md5(raw.encode()).hexdigest()}"


# ─── Conversation History ──────────────────────────────────────────

def add_interaction(session_id: str, interaction: dict):
    """Store an interaction in the session history."""
    interaction_copy = interaction.copy()
    interaction_copy["timestamp"] = time.time()

    if _redis_available:
        try:
            key = _get_session_key(session_id)
            _redis_client.lpush(key, json.dumps(interaction_copy))
            _redis_client.ltrim(key, 0, MAX_HISTORY - 1)
            _redis_client.expire(key, CACHE_TTL * 2)
            return
        except Exception as e:
            logger.warning(f"Redis write failed: {e}")

    # In-memory fallback
    if session_id not in _memory_store:
        if len(_memory_store) >= MAX_SESSIONS:
            oldest_session = next(iter(_memory_store))
            _memory_store.pop(oldest_session, None)
        _memory_store[session_id] = deque(maxlen=MAX_HISTORY)

    _memory_store[session_id].appendleft(interaction_copy)


def get_history(session_id: str) -> list[dict]:
    """Retrieve conversation history for a session."""
    if _redis_available:
        try:
            key = _get_session_key(session_id)
            items = _redis_client.lrange(key, 0, MAX_HISTORY - 1)
            return [json.loads(item) for item in items]
        except Exception as e:
            logger.warning(f"Redis read failed: {e}")

    return list(_memory_store.get(session_id, []))


def get_emotion_history(session_id: str) -> list[str]:
    """Get list of recent behavioral states for the session."""
    history = get_history(session_id)
    return [h.get("state", "Neutral") for h in reversed(history)]


def get_emotion_trend(session_id: str) -> str:
    """
    Analyze emotion trend over recent interactions.
    Returns: "escalating" | "de-escalating" | "stable" | "mixed"
    """
    states = get_emotion_history(session_id)
    if len(states) < 2:
        return "stable"

    negative_states = {"Frustrated", "Disappointed", "Concerned"}
    positive_states = {"Excited", "Curious"}

    recent = states[-3:]
    older = states[:-3] if len(states) > 3 else []

    recent_neg = sum(1 for s in recent if s in negative_states)
    older_neg = sum(1 for s in older if s in negative_states)
    recent_pos = sum(1 for s in recent if s in positive_states)

    if recent_neg >= 2 and recent_neg >= recent_pos:
        return "escalating"
    elif recent_pos >= 2 and recent_neg == 0:
        return "de-escalating"
    elif len(set(states[-4:])) >= 3:
        return "mixed"
    elif older and recent_neg < older_neg:
        return "de-escalating"
    else:
        return "stable"


# ─── Response Cache ────────────────────────────────────────────────

def get_cached_response(text: str, mode: str, session_id: str) -> dict | None:
    """Check cache for a previously generated response."""
    key = _get_cache_key(text, mode, session_id)

    if _redis_available:
        try:
            cached = _redis_client.get(key)
            if cached:
                logger.info("Cache HIT (Redis)")
                cached_data = json.loads(cached)
                cached_data.pop("_cached_at", None)
                cached_data["cached"] = True
                return cached_data
        except Exception as e:
            logger.warning(f"Redis cache read failed: {e}")

    cached = _cache_store.get(key)
    if cached and (time.time() - cached.get("_cached_at", 0)) < CACHE_TTL:
        logger.info("Cache HIT (in-memory)")
        cached_copy = cached.copy()
        cached_copy.pop("_cached_at", None)
        cached_copy["cached"] = True
        return cached_copy

    return None


def cache_response(text: str, mode: str, session_id: str, response: dict):
    """Cache a generated response."""
    key = _get_cache_key(text, mode, session_id)
    response_copy = response.copy()
    response_copy["_cached_at"] = time.time()

    if _redis_available:
        try:
            _redis_client.setex(key, CACHE_TTL, json.dumps(response_copy))
            return
        except Exception as e:
            logger.warning(f"Redis cache write failed: {e}")

    _cache_store[key] = response_copy
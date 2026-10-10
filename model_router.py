"""
Smart model router for J&K EduSetu ("Your Bridge to Education & Opportunities").
Routes queries to the appropriate Gemini model based on complexity
while tracking per-model usage to avoid hitting rate limits.
"""

import os
import re
import time
from threading import RLock
from langchain_google_genai import ChatGoogleGenerativeAI

# Complete active Gemini 3.x Fleet specifications aligned with user's Google AI Studio free tier limits
MODEL_FLEET = {
    "gemini-3.8-flash": {
        "tier": "complex",
        "label": "Flash 3.8 Flagship",
        "emoji": "🧠",
        "daily_limit": 20,
        "rpm_limit": 5,
        "max_tokens": 4500,
        "supports_thinking": True,
        "description": "Deep multi-parameter reasoning & flagship analysis",
    },
    "gemini-3.6-flash": {
        "tier": "medium",
        "label": "Flash 3.6 Pro",
        "emoji": "🎯",
        "daily_limit": 20,
        "rpm_limit": 5,
        "max_tokens": 3500,
        "supports_thinking": False,
        "description": "Fast, high-fidelity reasoning & standard queries",
    },
    "gemini-3.5-flash": {
        "tier": "medium",
        "label": "Flash 3.5 Standard",
        "emoji": "🎯",
        "daily_limit": 20,
        "rpm_limit": 5,
        "max_tokens": 3500,
        "supports_thinking": False,
        "description": "High stability general knowledge & document QA",
    },
    "gemini-3.7-flash": {
        "tier": "complex",
        "label": "Flash 3.7 Reasoning",
        "emoji": "🧠",
        "daily_limit": 20,
        "rpm_limit": 5,
        "max_tokens": 4500,
        "supports_thinking": True,
        "description": "Advanced analytical reasoning & step-by-step logic",
    },
    "gemini-3.5-flash-lite": {
        "tier": "simple",
        "label": "Flash-Lite 3.5",
        "emoji": "⚡",
        "daily_limit": 500,
        "rpm_limit": 15,
        "max_tokens": 2500,
        "supports_thinking": False,
        "description": "Sub-second lightweight conversational responses",
    },
    "gemini-3.1-flash-lite": {
        "tier": "simple",
        "label": "Flash-Lite 3.1",
        "emoji": "⚡",
        "daily_limit": 500,
        "rpm_limit": 15,
        "max_tokens": 2500,
        "supports_thinking": False,
        "description": "High-throughput 500 RPD rapid information retrieval",
    },
}

# Simplified tier mapping for backwards compatibility
MODELS = {
    "simple": {
        "id": "gemini-3.5-flash-lite",
        "max_tokens": 2500,
        "label": "Fast (Flash-Lite)",
        "emoji": "⚡",
        "daily_limit": 500,
    },
    "medium": {
        "id": "gemini-3.6-flash",
        "max_tokens": 3500,
        "label": "Standard (Flash)",
        "emoji": "🎯",
        "daily_limit": 20,
    },
    "complex": {
        "id": "gemini-3.8-flash",
        "max_tokens": 4500,
        "label": "Deep Analysis (Flash 3.8)",
        "emoji": "🧠",
        "daily_limit": 20,
    },
}

# Ordered candidate pools per complexity tier to balance load
TIER_CANDIDATE_POOLS = {
    "simple": [
        "gemini-3.5-flash-lite",
        "gemini-3.1-flash-lite",
    ],
    "medium": [
        "gemini-3.6-flash",
        "gemini-3.5-flash",
        "gemini-3.5-flash-lite",
        "gemini-3.1-flash-lite",
    ],
    "complex": [
        "gemini-3.8-flash",
        "gemini-3.6-flash",
        "gemini-3.5-flash",
        "gemini-3.5-flash-lite",
        "gemini-3.1-flash-lite",
    ],
}

# Resilient fallback sequence across all active models in the fleet
GEMINI_FALLBACK_POOL = [
    "gemini-3.8-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-3.7-flash",
]

# Keywords that signal query complexity
COMPLEX_SIGNALS = [
    "based on my profile", "based on my", "all scholarships",
    "comprehensive", "full analysis", "everything i can",
    "what are all my options", "complete guide", "step by step plan",
    "both admission and scholarship", "analyze my", "eligibility for all",
    "pcm", "pcb", "percentage", "marks", "cutoff", "category",
    # Urdu complex signals
    "سکالرشپ", "مکمل تفصیل", "اہلیت برائے", "پوری تفصیل", "تمام وظائف", "رہنمائی اور داخلہ",
    # Hindi complex signals
    "सभी छात्रवृत्ति", "विस्तृत जानकारी", "पूरी जानकारी", "प्रोफाइल के आधार पर",
]

MEDIUM_SIGNALS = [
    "eligible", "eligib", "qualify", "should i", "recommend", "suggest",
    "difference between", "which is better", "compare", "options for",
    "options i have", "what can i apply", "how to apply", "what documents", "document", "documents",
    "college", "seats", "quota", "reservation", "merit", "fee", "jkcet", "neet", "jee", "criteria",
    # Urdu medium signals
    "کالج", "داخلہ", "رہنمائی", "موازنہ", "کونسا بہتر", "دستاویزات", "درخواست کیسے",
    # Hindi medium signals
    "पात्रता", "प्रवेश", "कटऑफ", "तुलना", "दस्तावेज़", "आवेदन कैसे",
]

_API_STATE = {}
_ROUTER_LOCK = RLock()


def _runtime_state():
    """Return process-local best-effort provider circuit-breaker state."""
    with _ROUTER_LOCK:
        if "model_cooldowns" not in _API_STATE:
            if "model_usage" not in _API_STATE:
                _API_STATE["model_usage"] = {m: 0 for m in MODEL_FLEET}
                for tier in ["simple", "medium", "complex"]:
                    _API_STATE["model_usage"][tier] = 0
            _API_STATE.setdefault("active_model_tier", "simple")
            _API_STATE.setdefault("active_model_id", "gemini-3.5-flash-lite")
            _API_STATE.setdefault("exhausted_models", set())
            _API_STATE.setdefault("model_cooldowns", {})
            _API_STATE.setdefault("provider_cooldowns", {})
    return _API_STATE


def reset_router_state() -> None:
    """Reset process-local routing metrics; primarily used by isolated tests."""
    with _ROUTER_LOCK:
        _API_STATE.clear()


def is_multilingual_query(text: str) -> bool:
    """Check if query is non-English (e.g. Urdu, Kashmiri, Hindi) or contains non-Latin scripts."""
    if not text:
        return False
    for char in text:
        code = ord(char)
        # Arabic / Perso-Arabic (Urdu, Kashmiri) or Devanagari (Hindi)
        if (0x0600 <= code <= 0x06FF) or (0x0750 <= code <= 0x077F) or (0xFB50 <= code <= 0xFEFF) or (0x0900 <= code <= 0x097F):
            return True
    lower_t = text.lower()
    if "[note: " in lower_t and any(lang in lower_t for lang in ["urdu", "hindi", "kashmiri", "اردو", "हिंदी", "کٲشُر"]):
        return True
    return False


def classify_complexity(query: str, history_length: int = 0) -> str:
    """Classify query as simple, medium, or complex."""
    q = query.lower().strip()
    word_count = len(q.split())

    # Long conversation history = model needs more context = bump up
    if history_length > 8:
        return "complex"

    # Check complex signals first
    if any(signal in q for signal in COMPLEX_SIGNALS) or word_count > 25:
        return "complex"

    # Check medium signals
    if any(signal in q for signal in MEDIUM_SIGNALS) or word_count > 12:
        return "medium"

    # Non-Latin / Multilingual scripts (Urdu, Hindi, Kashmiri) require richer vocabulary and context
    if is_multilingual_query(query) and word_count >= 4:
        return "medium"

    return "simple"


def _init_usage():
    """Initialize process-local model usage tracking."""
    state = _runtime_state()
    with _ROUTER_LOCK:
        if "model_usage" not in state:
            state["model_usage"] = {m: 0 for m in MODEL_FLEET}
            for tier in ["simple", "medium", "complex"]:
                state["model_usage"][tier] = 0
        state.setdefault("active_model_tier", "simple")
        state.setdefault("active_model_id", "gemini-3.5-flash-lite")
        state.setdefault("exhausted_models", set())
        state.setdefault("model_cooldowns", {})
        state.setdefault("provider_cooldowns", {})


def _clear_expired_cooldowns(now: float | None = None) -> None:
    """Remove models whose provider retry window has elapsed."""
    now = time.time() if now is None else now
    state = _runtime_state()
    with _ROUTER_LOCK:
        cooldowns = state.get("model_cooldowns", {})
        active = {model: expiry for model, expiry in cooldowns.items() if expiry > now}
        state["model_cooldowns"] = active
        # Kept as a compatibility view for existing UI and callers.
        state["exhausted_models"] = set(active)
        provider_cooldowns = state.get("provider_cooldowns", {})
        state["provider_cooldowns"] = {
            provider: expiry
            for provider, expiry in provider_cooldowns.items()
            if expiry > now
        }


def model_is_available(model_id: str, now: float | None = None) -> bool:
    """Return False while a model is in its provider-error cooldown window."""
    _init_usage()
    _clear_expired_cooldowns(now)
    state = _runtime_state()
    with _ROUTER_LOCK:
        return model_id not in state.get("model_cooldowns", {})


def provider_is_available(provider: str, now: float | None = None) -> bool:
    """Return False while a provider is cooling down after quota or service errors."""
    _init_usage()
    _clear_expired_cooldowns(now)
    state = _runtime_state()
    with _ROUTER_LOCK:
        return provider not in state.get("provider_cooldowns", {})


def _retry_seconds(error_text: str, default_seconds: int, maximum: int = 3600) -> int:
    lowered = error_text.lower()
    match = re.search(
        r"(?:retry(?:[\s_]*after|[\s_]*in)?|retry[\s_]*delay[^\d]*)\s*(\d+(?:\.\d+)?)\s*(?:s|sec|seconds)?",
        lowered,
    )
    if not match:
        return default_seconds
    return int(min(max(float(match.group(1)), 15), maximum))


def record_model_usage(model_id: str, tier: str | None = None) -> None:
    """Record a request only after the provider has accepted it."""
    if model_id not in MODEL_FLEET:
        return
    _init_usage()
    state = _runtime_state()
    with _ROUTER_LOCK:
        usage = state["model_usage"]
        usage[model_id] = usage.get(model_id, 0) + 1
        resolved_tier = tier or MODEL_FLEET[model_id]["tier"]
        usage[resolved_tier] = usage.get(resolved_tier, 0) + 1


def mark_model_cooldown(model_id: str, error_text: str, now: float | None = None) -> None:
    """Temporarily bypass a failed model, respecting provider retry hints."""
    if model_id not in MODEL_FLEET:
        return
    _init_usage()
    lowered = error_text.lower()
    # A missing model is unlikely to recover immediately; rate limits should.
    default_seconds = 3600 if ("404" in lowered or "not_found" in lowered) else 60
    retry_seconds = _retry_seconds(error_text, default_seconds)
    current_time = time.time() if now is None else now
    state = _runtime_state()
    with _ROUTER_LOCK:
        cooldowns = dict(state.get("model_cooldowns", {}))
        cooldowns[model_id] = current_time + retry_seconds
        state["model_cooldowns"] = cooldowns
    _clear_expired_cooldowns(current_time)


def mark_provider_cooldown(provider: str, error_text: str, now: float | None = None) -> None:
    """Pause a provider after quota or service errors to avoid wasting its shared quota."""
    if provider not in {"google", "groq"}:
        return

    lowered = error_text.lower()
    if any(token in lowered for token in ("429", "resource_exhausted", "rate limit", "quota")):
        default_seconds = 3600 if any(token in lowered for token in ("per day", "per-day", "rpd", "daily quota")) else 60
    elif any(token in lowered for token in ("503", "unavailable", "502", "500", "timeout")):
        default_seconds = 30
    elif any(token in lowered for token in ("401", "403", "unauthorized", "forbidden")):
        default_seconds = 300
    elif any(token in lowered for token in ("404", "not_found", "model not found")):
        default_seconds = 3600
    else:
        return

    retry_seconds = _retry_seconds(error_text, default_seconds)
    current_time = time.time() if now is None else now
    _init_usage()
    state = _runtime_state()
    with _ROUTER_LOCK:
        cooldowns = dict(state.get("provider_cooldowns", {}))
        cooldowns[provider] = current_time + retry_seconds
        state["provider_cooldowns"] = cooldowns


def get_routed_model_info(query: str = "", history_length: int = 0, language: str | None = None) -> dict:
    """Return model tier, ID, max tokens, and metadata dynamically balanced across the active fleet."""
    _init_usage()
    _clear_expired_cooldowns()
    tier = classify_complexity(query, history_length)

    candidates = TIER_CANDIDATE_POOLS.get(tier, TIER_CANDIDATE_POOLS["simple"])
    state = _runtime_state()
    exhausted = state.get("exhausted_models", set())
    usage = state.get("model_usage", {})

    selected_model = None

    # Filter out models that are known to be exhausted (429) or reached safety limit in this session
    healthy_candidates = []
    for cand in candidates:
        if cand in exhausted:
            continue
        cand_limit = MODEL_FLEET[cand]["daily_limit"]
        used = usage.get(cand, 0)
        safety_buf = 3 if cand_limit <= 20 else 50
        if used < (cand_limit - safety_buf):
            healthy_candidates.append(cand)

    if healthy_candidates:
        if tier == "simple":
            # Round-robin / balance between 3.5-lite and 3.1-lite based on least used
            selected_model = min(healthy_candidates, key=lambda m: usage.get(m, 0))
        elif tier == "medium":
            # Prefer 20 RPD models (3.6-flash, 3.5-flash) if available, otherwise lite models
            standard_cands = [m for m in healthy_candidates if MODEL_FLEET[m]["tier"] == "medium"]
            if standard_cands:
                selected_model = min(standard_cands, key=lambda m: usage.get(m, 0))
            else:
                selected_model = min(healthy_candidates, key=lambda m: usage.get(m, 0))
        else:  # complex
            # Prefer flagship reasoning models (3.8-flash, 3.6-flash, 3.7-flash)
            flagship_cands = [m for m in healthy_candidates if MODEL_FLEET[m]["tier"] in ["complex", "medium"]]
            if flagship_cands:
                selected_model = min(flagship_cands, key=lambda m: usage.get(m, 0))
            else:
                selected_model = min(healthy_candidates, key=lambda m: usage.get(m, 0))
    else:
        # Emergency fail-safe: choose any non-exhausted lite model with massive 500 RPD
        for lite in ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]:
            if lite not in exhausted:
                selected_model = lite
                break
        if not selected_model:
            selected_model = "gemini-3.5-flash-lite"

    model_info = MODEL_FLEET.get(selected_model, MODEL_FLEET["gemini-3.5-flash-lite"])

    # Determine token budget based on query complexity tier
    tier_token_budgets = {
        "simple": 2500,
        "medium": 3500,
        "complex": 4500,
    }
    max_tokens = tier_token_budgets.get(tier, 3500)

    # Non-English / Multilingual responses consume 3-4x more tokens per word due to subword byte encoding.
    # We guarantee a generous minimum token allocation of 4,000 tokens so Urdu/Hindi/Kashmiri never truncates.
    is_multi = is_multilingual_query(query) or (language is not None and language != "English")
    if language is None and state.get("selected_language", "English") != "English":
        is_multi = True
    if is_multi:
        max_tokens = max(max_tokens, 4000)

    state["active_model_tier"] = tier
    state["active_model_id"] = selected_model
    return {
        "tier": tier,
        "model_id": selected_model,
        "max_tokens": max_tokens,
        "label": model_info["label"],
        "emoji": model_info["emoji"],
    }


def get_llm(query: str = "", history_length: int = 0):
    """
    Returns the appropriate LangChain LLM for this query.
    Automatically load balances across the Gemini 3.x fleet.
    """
    model_info = get_routed_model_info(query, history_length)

    import api_key_helper

    google_api_key = api_key_helper.get_google_api_key()
    groq_api_key = api_key_helper.get_groq_api_key()

    if google_api_key:
        llm_kwargs = dict(
            model=model_info["model_id"],
            google_api_key=google_api_key,
            max_output_tokens=model_info["max_tokens"],
            temperature=0.2,
        )
        return ChatGoogleGenerativeAI(**llm_kwargs)

    if groq_api_key:
        from langchain_groq import ChatGroq
        return ChatGroq(
            model_name="qwen/qwen3.8-27b",
            groq_api_key=groq_api_key,
            temperature=0.2,
            max_tokens=model_info["max_tokens"],
        )

    # Fallback if no keys configured
    return ChatGoogleGenerativeAI(
        model=model_info["model_id"],
        google_api_key="dummy_key",
        max_output_tokens=model_info["max_tokens"],
        temperature=0.2,
    )

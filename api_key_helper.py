"""Resolve provider secrets from deployment environment variables or a local .env."""

import os
from typing import Any, Dict

from dotenv import load_dotenv

load_dotenv()


def _mask_key(key: str) -> str:
    """Mask a key for internal diagnostics without exposing its value."""
    if not key:
        return "Not configured"
    value = key.strip()
    return "***" if len(value) <= 8 else f"{value[:4]}...{value[-4:]}"


def _first_configured(*names: str) -> str:
    for name in names:
        value = os.getenv(name, "").strip().strip("'\"").strip()
        if value and not value.lower().startswith("your_"):
            return value
    return ""


def get_google_api_key() -> str:
    key = _first_configured(
        "GOOGLE_API_KEY", "GEMINI_API_KEY", "GEMINI_KEY", "GOOGLE_KEY", "API_KEY"
    )
    if key:
        os.environ.setdefault("GOOGLE_API_KEY", key)
        os.environ.setdefault("GEMINI_API_KEY", key)
    return key


def get_groq_api_key() -> str:
    key = _first_configured("GROQ_API_KEY", "GROQ_KEY")
    if key:
        os.environ.setdefault("GROQ_API_KEY", key)
    return key


def get_admin_password() -> str:
    """Return an explicitly configured admin secret; there is no default password."""
    return _first_configured("ADMIN_PASSWORD")


def get_api_diagnostics() -> Dict[str, Any]:
    """Return provider configuration status without returning secret values."""
    google_key = get_google_api_key()
    groq_key = get_groq_api_key()
    return {
        "google_configured": bool(google_key),
        "google_masked": _mask_key(google_key),
        "groq_configured": bool(groq_key),
        "groq_masked": _mask_key(groq_key),
        "mode": (
            "Dual Engine (Gemini + Groq)"
            if google_key and groq_key
            else "Gemini Primary"
            if google_key
            else "Groq Fallback"
            if groq_key
            else "Offline Guidance"
        ),
    }

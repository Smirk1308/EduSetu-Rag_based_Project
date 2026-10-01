"""
Personalized Error Handling & Zero-Downtime Recovery System for J&K EduSetu ("Your Bridge to Education & Opportunities").
Classifies runtime, API, network, and vector store exceptions (including Google Gemini and Groq)
into human-friendly, actionable diagnostics with automatic 2G fallback options.
"""

from typing import Dict, Any, Optional
import google.api_core.exceptions as google_exceptions


def classify_error(error: Exception) -> str:
    """Classifies an exception into standard category strings."""
    error_str = str(error).lower()
    error_type = type(error).__name__

    # Gemini-specific errors
    if isinstance(error, google_exceptions.ResourceExhausted):
        return "rate_limit"
    if isinstance(error, google_exceptions.Unauthenticated):
        return "authentication"
    if isinstance(error, google_exceptions.DeadlineExceeded):
        return "network"
    if isinstance(error, google_exceptions.InvalidArgument) and ("token" in error_str or "context" in error_str):
        return "context_length"

    # Groq and general conditions
    if "api_key" in error_str or "authentication" in error_str or "401" in error_str or "unauthorized" in error_str:
        return "authentication"
    if "rate_limit" in error_str or "429" in error_str or "quota" in error_str or "too many requests" in error_str or "resource_exhausted" in error_str:
        return "rate_limit"
    if "timeout" in error_str or "connection" in error_str or "connect" in error_str or "unreachable" in error_str or "httpx" in error_str or "deadline_exceeded" in error_str:
        return "network"
    if "context_length" in error_str or "maximum context" in error_str or "token limit" in error_str or "max_tokens" in error_str or "context window" in error_str:
        return "context_length"
    if "chroma" in error_str or "collection" in error_str or "sqlite" in error_str:
        return "database"

    return "general"


class ErrorDiagnostic:
    """Classifies exceptions into categorized, actionable guidance."""

    @staticmethod
    def classify(error: Exception) -> Dict[str, Any]:
        err_type = type(error).__name__
        err_msg = str(error).lower()

        # 1. Missing or Invalid API Key / Authentication (Gemini + Groq)
        if isinstance(error, google_exceptions.Unauthenticated) or "api_key" in err_msg or "authentication" in err_msg or "401" in err_msg or "unauthorized" in err_msg:
            return {
                "category": "authentication",
                "icon": "🔑",
                "title": "Cloud API Key Required or Invalid (Gemini / Groq)",
                "description": (
                    "The cloud AI service requires a valid GOOGLE_API_KEY (for Gemini) or GROQ_API_KEY to generate conversational responses. "
                    "Don't worry — your app continues to function seamlessly using local 2G government records."
                ),
                "action_steps": [
                    "Set `GOOGLE_API_KEY` in the backend deployment's environment variables or in a local `.env` file.",
                    "**Zero-Downtime 2G Edge**: Switch to **⚡ 2G Ultra-Lite (Offline)** in the sidebar to get instant answers with zero cloud dependencies."
                ],
                "fallback_available": True,
                "badge": "⚡ Auto-Switched to 2G Offline Records"
            }

        # 2. Rate Limiting (Gemini ResourceExhausted + Groq HTTP 429)
        if isinstance(error, google_exceptions.ResourceExhausted) or "rate_limit" in err_msg or "429" in err_msg or "quota" in err_msg or "too many requests" in err_msg or "resource_exhausted" in err_msg:
            return {
                "category": "rate_limit",
                "icon": "⏳",
                "title": "Cloud API Rate Limit Reached",
                "description": (
                    "Cloud AI rate limits / quotas were temporarily reached due to high activity. "
                    "The system has seamlessly engaged 2G Offline mode so you don't experience any interruption."
                ),
                "action_steps": [
                    "Wait 30–60 seconds for your rate limit window to reset.",
                    "Switch to **⚡ 2G Ultra-Lite Mode** in the sidebar for unlimited, instant offline answers.",
                    "Ensure queries are focused to conserve API tokens."
                ],
                "fallback_available": True,
                "badge": "⚡ Instant 2G Fallback Engaged"
            }

        # 3. Network Drop or Connection Timeout (Gemini DeadlineExceeded + Network)
        if isinstance(error, google_exceptions.DeadlineExceeded) or "timeout" in err_msg or "connection" in err_msg or "connect" in err_msg or "unreachable" in err_msg or "httpx" in err_msg or "deadline_exceeded" in err_msg:
            return {
                "category": "network",
                "icon": "📡",
                "title": "Network Timeout / Slow Connection Detected",
                "description": (
                    "Cloud servers took too long to respond, typical on remote 2G/3G mountain connections. "
                    "J&K EduSetu has served your answer directly from local verified government documents."
                ),
                "action_steps": [
                    "Toggle **⚡ 2G Ultra-Lite (Offline)** in the sidebar to bypass cloud networks entirely.",
                    "Check your internet connection if you wish to use deep conversational generation."
                ],
                "fallback_available": True,
                "badge": "⚡ 2G Mountain Edge Mode Active"
            }

        # 4. Context Window / Token Length Exceeded (Gemini InvalidArgument + General)
        if (isinstance(error, google_exceptions.InvalidArgument) and ("token" in err_msg or "context" in err_msg)) or "context_length" in err_msg or "maximum context" in err_msg or "token limit" in err_msg or "max_tokens" in err_msg or "context window" in err_msg:
            return {
                "category": "context_length",
                "icon": "📏",
                "title": "Conversation Context Limit Exceeded",
                "description": (
                    "The chat history has grown very long, exceeding the model's single-turn token window."
                ),
                "action_steps": [
                    "Click the **🗑️ Clear Chat History** button in the sidebar to start a fresh topic.",
                    "Shorten the question to focus on specific requirements."
                ],
                "fallback_available": True,
                "badge": "⚡ Summary Mode Active"
            }

        # 5. Database / Vector Store Sync Issue
        if any(term in err_msg for term in ("chroma", "pgvector", "postgres", "database", "collection", "sqlite")):
            return {
                "category": "database",
                "icon": "📚",
                "title": "Database Index Synchronization Notice",
                "description": (
                    "The document index could not be reached during retrieval."
                ),
                "action_steps": [
                    "Check the backend database connection and confirm the document index has been loaded.",
                    "The offline guidance service remains available as a fallback."
                ],
                "fallback_available": True,
                "badge": "⚡ 2G Pre-computed Mode Active"
            }

        # 6. General / Unknown Exception
        return {
            "category": "general",
            "icon": "ℹ️",
            "title": f"Advisory Notice ({err_type})",
            "description": (
                "An unexpected condition occurred while communicating with cloud endpoints. "
                "Local verified government guidance has been delivered below without disruption."
            ),
            "action_steps": [
                f"Technical details: `{str(error)[:120]}`",
                "Switch to **⚡ 2G Ultra-Lite (Offline)** mode in the sidebar for guaranteed offline execution."
            ],
            "fallback_available": True,
            "badge": "⚡ Offline Resilience Active"
        }

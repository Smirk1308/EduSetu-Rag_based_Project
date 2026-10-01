"""
FastAPI Async Server for J&K EduSetu AI Advisor.
Provides high-performance Server-Sent Events (SSE) streaming,
6-model Gemini fleet load balancing, and sub-10ms 2G edge retrieval.
"""

import asyncio
from collections import defaultdict
import json
import logging
import os
import sys
import time
from typing import Any, Dict, List, Literal, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool

# Ensure local imports work reliably
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import api_key_helper
from model_router import MODEL_FLEET, MODELS, get_routed_model_info
from offline_engine import OfflineQueryEngine, get_2g_response
from rag_engine import RAGEngine
from scholarship_engine import (
    SCHOLARSHIPS,
    check_eligibility,
    get_documents_checklist,
    search_scholarships,
)
from college_data import (
    get_all_college_types,
    get_all_districts,
    get_college_by_id,
    search_colleges,
)

# Configure structured logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("edusetu_server")

# Initialize FastAPI application
app = FastAPI(
    title="J&K EduSetu AI Engine API",
    description="Autonomous Career, Scholarship & College Advisor for Jammu, Kashmir & Ladakh",
    version="2.0.0",
)

configured_origins = [
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGINS", "").split(",")
    if origin.strip()
]
is_production = (
    os.getenv("APP_ENV", "").lower() == "production"
    or os.getenv("RAILWAY_ENVIRONMENT", "").lower() == "production"
)
if not is_production:
    configured_origins.extend([
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ])

# The frontend's same-origin proxy avoids browser CORS in production. Exact origins
# remain available for local development and explicitly configured direct clients.
app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(set(configured_origins)),
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Accept", "Content-Type"],
)

# Initialize engines
rag_engine = RAGEngine()
offline_engine = OfflineQueryEngine()


# ---------------------------------------------------------------------------
# Request & Response Models
# ---------------------------------------------------------------------------
class ChatMessage(BaseModel):
    role: Literal["user", "assistant"] = Field(..., description="Role: 'user' or 'assistant'")
    content: str = Field(..., min_length=1, max_length=4000, description="Message text")


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000, description="User query or question")
    history: List[ChatMessage] = Field(default_factory=list, max_length=6, description="Recent conversation turns")
    language: Literal["English", "Urdu", "Hindi", "Kashmiri"] = Field(
        default="English", description="Target response language"
    )
    offline_mode: bool = Field(default=False, description="Force local offline retrieval")


class ScholarshipProfile(BaseModel):
    """Non-identifying details used only to estimate scholarship eligibility."""

    domicile: Literal["J&K", "India", "Other"] = "J&K"
    income: Optional[int] = Field(default=None, ge=0, le=10_000_000)
    percentage: Optional[float] = Field(default=None, ge=0, le=100)
    category: Literal["All", "SC", "ST", "OBC", "EWS", "RBA", "Minority"] = "All"
    gender: Literal["all", "female", "male", "other"] = "all"
    disability: Optional[bool] = None
    age: Optional[int] = Field(default=None, ge=13, le=100)
    stream: Literal["All", "PCM", "PCB", "Arts", "Commerce"] = "All"


def _public_scholarship(scholarship: Dict[str, Any]) -> Dict[str, Any]:
    """Return catalogue fields suitable for browser display, never personal profile data."""
    return {
        "id": scholarship["id"],
        "name": scholarship["name"],
        "provider": scholarship["provider"],
        "portal_url": scholarship["portal_url"],
        "category": scholarship["category"],
        "benefits": scholarship["benefits"],
        "deadlines": scholarship["deadlines"],
        "documents_required": scholarship["documents_required"],
        "priority_for_jk": scholarship.get("priority_for_jk", False),
        "eligibility": scholarship["eligibility"],
    }


def _public_college(college: Dict[str, Any]) -> Dict[str, Any]:
    """Return catalogue data, bounded to fields the explorer actually needs."""
    return {
        key: college.get(key)
        for key in (
            "id", "name", "district", "type", "affiliation", "fees_per_sem",
            "hostel", "website", "admission_through", "naac_grade", "established", "branches",
        )
    }


def _offline_response(query: str) -> Dict[str, Any]:
    """Return a local match or a useful no-match response without failing the stream."""
    return get_2g_response(query) or {
        "answer": (
            "This question is not covered by the locally available guidance. "
            "Reconnect and try again, or ask about scholarships, admissions, colleges, or seat categories."
        ),
        "sources": [],
        "latency_ms": None,
    }


SSE_HEADERS = {
    "Cache-Control": "no-cache, no-transform",
    "X-Accel-Buffering": "no",
}

MAX_CONCURRENT_CHATS = int(os.getenv("MAX_CONCURRENT_CHATS", "10"))
_chat_semaphore = asyncio.Semaphore(MAX_CONCURRENT_CHATS)

_IP_REQUEST_TIMES: Dict[str, List[float]] = defaultdict(list)
_RATE_LIMIT_LOCK = asyncio.Lock()
RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_MAX_REQUESTS = int(os.getenv("CHAT_RATE_LIMIT_PER_MINUTE", "30"))


async def _check_rate_limit(client_ip: str) -> bool:
    """Return True if request is within sliding window limits, False otherwise."""
    now = time.time()
    cutoff = now - RATE_LIMIT_WINDOW_SECONDS
    async with _RATE_LIMIT_LOCK:
        times = _IP_REQUEST_TIMES[client_ip]
        valid_times = [t for t in times if t > cutoff]
        if len(valid_times) >= RATE_LIMIT_MAX_REQUESTS:
            _IP_REQUEST_TIMES[client_ip] = valid_times
            return False
        valid_times.append(now)
        _IP_REQUEST_TIMES[client_ip] = valid_times
        return True


# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------
@app.get("/")
async def root():
    """Welcome endpoint pointing to docs and health status."""
    return {
        "service": "J&K EduSetu AI Engine API",
        "version": "2.0.0",
        "status": "online",
        "documentation": "/docs",
        "health": "/api/health",
        "frontend": "http://localhost:3000",
    }


@app.get("/api/health")
async def health_check():
    """Liveness probe; does not depend on external providers or the database."""
    return {
        "status": "healthy",
        "service": "J&K EduSetu Core API",
        "version": "2.0.0",
        "environment": os.getenv("APP_ENV", "development"),
    }


@app.get("/api/ready")
async def readiness_check():
    """Readiness probe verifies the configured persistent store is reachable."""
    if rag_engine.postgres_store is not None:
        try:
            await run_in_threadpool(rag_engine.postgres_store.check_connection)
        except Exception as exc:
            logger.error("Database readiness check failed: %s", exc)
            raise HTTPException(status_code=503, detail="Persistent store unavailable") from exc
    return {"status": "ready", "storage": "postgresql-pgvector" if rag_engine.postgres_store else "local-chroma"}


@app.get("/api/models")
async def get_model_fleet():
    """Returns active Gemini 3.x fleet status, quotas, and capability metadata."""
    models_info = []
    for mid, cfg in MODEL_FLEET.items():
        models_info.append({
            "id": mid,
            "name": cfg["label"],
            "tier": cfg["tier"],
            "emoji": cfg["emoji"],
            "daily_limit": cfg["daily_limit"],
            "rpm_limit": cfg["rpm_limit"],
            "max_tokens": cfg["max_tokens"],
            "supports_thinking": cfg.get("supports_thinking", False),
            "description": cfg.get("description", ""),
        })

    return {
        "fleet": models_info,
        "default_model": "gemini-3.8-flash",
        "fallback_pool": [
            "gemini-3.8-flash",
            "gemini-3.6-flash",
            "gemini-3.5-flash",
            "gemini-3.5-flash-lite",
            "gemini-3.1-flash-lite",
        ],
    }


@app.get("/api/catalog/scholarships")
async def scholarship_catalog(query: str = ""):
    """Return the public scholarship catalogue for the frontend explorer."""
    normalized_query = query.strip()
    if normalized_query:
        scholarships = await run_in_threadpool(search_scholarships, normalized_query)
    else:
        scholarships = SCHOLARSHIPS
    return {
        "items": [_public_scholarship(item) for item in scholarships],
        "notice": "Eligibility is an estimate. Confirm current rules, dates, and documents on the official portal before applying.",
    }


@app.post("/api/catalog/scholarships/match")
async def scholarship_match(profile: ScholarshipProfile):
    """Estimate scholarship matches without retaining a student profile."""
    profile_dict = profile.model_dump()
    matches = await run_in_threadpool(check_eligibility, profile_dict)
    selected_ids = [match["id"] for match in matches[:8]]
    docs_checklist = await run_in_threadpool(get_documents_checklist, selected_ids)
    return {
        "items": [
            {
                **_public_scholarship(match),
                "match_score": match["match_score"],
                "match_reasons": match["match_reasons"],
                "missing_info": match["missing_info"],
            }
            for match in matches[:12]
        ],
        "documents_checklist": docs_checklist,
        "notice": "This is a guide, not an application decision. Verify every requirement with the official provider.",
    }


@app.get("/api/catalog/colleges")
async def college_catalog(
    query: str = "",
    district: Optional[str] = None,
    college_type: Optional[str] = None,
    category: Optional[Literal["OM", "SC", "ST", "RBA", "EWS", "OBC"]] = None,
):
    """Search the maintained college and seat catalogue."""
    colleges = await run_in_threadpool(
        search_colleges,
        query=query.strip(),
        district=district.strip() if district else None,
        college_type=college_type.strip() if college_type else None,
        category=category,
    )
    return {
        "items": [_public_college(college) for college in colleges[:30]],
        "total": len(colleges),
        "notice": "Seat availability, fees, cut-offs, and admission routes change. Confirm them through the institution or the current official notification.",
    }


@app.get("/api/catalog/colleges/options")
async def college_catalog_options():
    districts = await run_in_threadpool(get_all_districts)
    types = await run_in_threadpool(get_all_college_types)
    return {"districts": districts, "types": types}


@app.get("/api/catalog/colleges/{college_id}")
async def college_detail(college_id: str):
    college = await run_in_threadpool(get_college_by_id, college_id)
    if college is None:
        raise HTTPException(status_code=404, detail="College not found")
    return {"item": _public_college(college)}


@app.get("/api/stats")
async def get_system_stats():
    """Return live document-store counts rather than stale hard-coded claims."""
    try:
        document_stats = await run_in_threadpool(rag_engine.get_collection_stats)
    except Exception as exc:
        logger.warning("Could not read document-store stats: %s", exc)
        document_stats = {"total_chunks": None, "all_files": []}
    return {
        "indexed_documents": len(document_stats.get("all_files", [])),
        "indexed_chunks": document_stats.get("total_chunks"),
        "storage": "postgresql-pgvector" if rag_engine.postgres_store else "local-chroma",
    }


@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest, request: Request):
    """
    Primary chat endpoint with Server-Sent Events (SSE) streaming.
    Streams chunks in real-time from the 6-model Gemini fleet or local 2G offline engine.
    Safeguarded by bounded concurrency queueing and client rate limiting.
    """
    query = req.message.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query message cannot be empty.")

    client_ip = request.client.host if request.client else "unknown"
    if client_ip not in ("127.0.0.1", "::1", "testclient"):
        allowed = await _check_rate_limit(client_ip)
        if not allowed:
            raise HTTPException(
                status_code=429,
                detail="Too many queries received. Please wait a minute before asking again.",
            )

    try:
        await asyncio.wait_for(_chat_semaphore.acquire(), timeout=5.0)
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=429,
            detail="The advisor is currently experiencing heavy student volume. Please retry in a few moments.",
        )

    history_dicts = [{"role": msg.role, "content": msg.content} for msg in req.history]

    # Mode 1: 2G Mountain Edge Mode (Instant verified local records)
    if req.offline_mode:
        async def offline_streamer():
            try:
                offline_res = _offline_response(query)
                ans = offline_res["answer"]
                words = ans.split(" ")
                for i in range(0, len(words), 4):
                    chunk = " ".join(words[i:i+4]) + " "
                    yield f"data: {json.dumps({'chunk': chunk, 'model': '⚡ 2G Mountain Edge (Offline)'})}\n\n"

                yield f"data: {json.dumps({'done': True, 'model': '⚡ 2G Mountain Edge (Offline)', 'sources': offline_res.get('sources', []), 'latency': offline_res.get('latency_ms', 5.0)})}\n\n"
            finally:
                _chat_semaphore.release()

        return StreamingResponse(
            offline_streamer(),
            media_type="text/event-stream",
            headers=SSE_HEADERS,
        )

    # Mode 2: Cloud RAG Generation (Gemini 3.x Fleet Streaming)
    routed_info = get_routed_model_info(query, len(history_dicts))
    initial_model = routed_info["model_id"]

    try:
        rag_result = await run_in_threadpool(
            rag_engine.generate_answer,
            query=query,
            history=history_dicts,
            language=req.language,
            stream=True
        )

        stream_gen = rag_result["stream"]
        sources = rag_result.get("sources", [])
        model_used = rag_result.get("model_used", initial_model)

        def sse_streamer():
            try:
                active_model = model_used
                try:
                    for chunk_text in stream_gen:
                        if chunk_text:
                            yield f"data: {json.dumps({'chunk': chunk_text, 'model': active_model})}\n\n"

                    # Send terminal metadata event
                    formatted_sources = [
                        {
                            "source": s.get("source", "Verified Government Document"),
                            "page": s.get("page", 1),
                            "similarity": s.get("similarity", 0.0)
                        }
                        for s in sources[:4]
                    ]
                    yield f"data: {json.dumps({'done': True, 'model': active_model, 'sources': formatted_sources})}\n\n"

                except Exception as stream_err:
                    logger.error(f"Error during SSE stream: {stream_err}")
                    fallback_offline = _offline_response(query)
                    offline_payload = {
                        "chunk": "\n\n[Switched to offline guidance]\n" + fallback_offline["answer"],
                        "model": "Offline Fallback",
                        "done": True,
                        "sources": fallback_offline.get("sources", []),
                    }
                    yield f"data: {json.dumps(offline_payload)}\n\n"
            finally:
                _chat_semaphore.release()

        return StreamingResponse(
            sse_streamer(),
            media_type="text/event-stream",
            headers=SSE_HEADERS,
        )

    except Exception as e:
        logger.error(f"Chat generation failed: {e}")
        fallback_offline = _offline_response(query)
        async def emergency_streamer():
            try:
                yield f"data: {json.dumps({'chunk': fallback_offline['answer'], 'model': 'Offline Fallback', 'done': True, 'sources': fallback_offline.get('sources', [])})}\n\n"
            finally:
                _chat_semaphore.release()

        return StreamingResponse(
            emergency_streamer(),
            media_type="text/event-stream",
            headers=SSE_HEADERS,
        )


# ---------------------------------------------------------------------------
# Server Entry Point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    print(f"\n=======================================================")
    print(f"  J&K EduSetu FastAPI Server Starting on Port {port}")
    print(f"  Swagger Docs: http://localhost:{port}/docs")
    print(f"  Health Check: http://localhost:{port}/api/health")
    print(f"=======================================================\n")
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=False)

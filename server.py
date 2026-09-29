"""
FastAPI Async Server for J&K EduSetu AI Advisor.
Provides high-performance Server-Sent Events (SSE) streaming,
6-model Gemini fleet load balancing, and sub-10ms 2G edge retrieval.
"""

import json
import logging
import os
import sys
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field

# Ensure local imports work reliably
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import api_key_helper
from model_router import MODEL_FLEET, MODELS, get_routed_model_info
from offline_engine import OfflineQueryEngine, get_2g_response
from rag_engine import RAGEngine

# Configure structured logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("edusetu_server")

# Initialize FastAPI application
app = FastAPI(
    title="J&K EduSetu AI Engine API",
    description="Autonomous Career, Scholarship & College Advisor for Jammu, Kashmir & Ladakh",
    version="2.0.0",
)

# Enable CORS for Next.js (Localhost, Vercel previews, and custom domains)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "https://*.vercel.app",
        "*",  # Allow all for flexible development & portfolio hosting
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize engines
rag_engine = RAGEngine()
offline_engine = OfflineQueryEngine()


# ---------------------------------------------------------------------------
# Request & Response Models
# ---------------------------------------------------------------------------
class ChatMessage(BaseModel):
    role: str = Field(..., description="Role: 'user' or 'assistant'")
    content: str = Field(..., description="Message text")


class ChatRequest(BaseModel):
    message: str = Field(..., description="User query or question")
    history: Optional[List[ChatMessage]] = Field(default_factory=list, description="Recent conversation turns")
    language: Optional[str] = Field(default="English", description="Target language (English, Urdu, Hindi, Kashmiri)")
    offline_mode: Optional[bool] = Field(default=False, description="Force 2G local offline retrieval")


# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------
@app.get("/api/health")
async def health_check():
    """Health probe for Railway, Render, or Docker containers."""
    return {
        "status": "healthy",
        "service": "J&K EduSetu Core API",
        "version": "2.0.0",
        "environment": "production",
    }


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


@app.get("/api/stats")
async def get_system_stats():
    """Returns system facts: verified schemes, seat matrices, colleges, latency."""
    return {
        "verified_schemes": 26,
        "ut_colleges": 32,
        "pmsss_annual_slots": 5000,
        "reservation_rules": "S.O. 176 (2024)",
        "offline_latency_ms": "< 10ms",
        "cloud_response_ms": "sub-second TTFT",
    }


@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    """
    Primary chat endpoint with Server-Sent Events (SSE) streaming.
    Streams chunks in real-time from the 6-model Gemini fleet or local 2G offline engine.
    """
    query = req.message.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query message cannot be empty.")

    history_dicts = [{"role": msg.role, "content": msg.content} for msg in req.history]

    # Mode 1: 2G Mountain Edge Mode (Instant verified local records)
    if req.offline_mode:
        async def offline_streamer():
            offline_res = get_2g_response(query)
            ans = offline_res["answer"]
            # Stream in natural chunk bursts
            words = ans.split(" ")
            for i in range(0, len(words), 4):
                chunk = " ".join(words[i:i+4]) + " "
                yield f"data: {json.dumps({'chunk': chunk, 'model': '⚡ 2G Mountain Edge (Offline)'})}\n\n"

            yield f"data: {json.dumps({'done': True, 'model': '⚡ 2G Mountain Edge (Offline)', 'sources': offline_res.get('sources', []), 'latency': offline_res.get('latency_ms', 5.0)})}\n\n"

        return StreamingResponse(offline_streamer(), media_type="text/event-stream")

    # Mode 2: Cloud RAG Generation (Gemini 3.x Fleet Streaming)
    routed_info = get_routed_model_info(query, len(history_dicts))
    initial_model = routed_info["model_id"]

    try:
        # Call RAG engine with stream=True
        rag_result = rag_engine.generate_answer(
            query=query,
            history=history_dicts,
            stream=True
        )

        stream_gen = rag_result["stream"]
        sources = rag_result.get("sources", [])
        model_used = rag_result.get("model_used", initial_model)

        async def sse_streamer():
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
                # Fall back to 2G offline answer gracefully if stream breaks
                fallback_offline = get_2g_response(query)
                yield f"data: {json.dumps({'chunk': '\n\n⚡ *[Switched to 2G Offline Fallback]*\n' + fallback_offline['answer'], 'model': '2G Offline Fallback', 'done': True})}\n\n"

        return StreamingResponse(sse_streamer(), media_type="text/event-stream")

    except Exception as e:
        logger.error(f"Chat generation failed: {e}")
        # Failover to 2G offline engine
        fallback_offline = get_2g_response(query)
        async def emergency_streamer():
            yield f"data: {json.dumps({'chunk': fallback_offline['answer'], 'model': '⚡ 2G Mountain Edge (Auto-Failover)', 'done': True, 'sources': fallback_offline.get('sources', [])})}\n\n"

        return StreamingResponse(emergency_streamer(), media_type="text/event-stream")


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

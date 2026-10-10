"""
RAG Engine for Career Advisor Application.
Handles:
1. Loading and parsing PDF files from docs/
2. Token-based chunking (300 tokens with 50-token overlap)
3. Embedding with HuggingFace all-MiniLM-L6-v2
4. Persistent ChromaDB storage in chroma_db/
5. Top-5 relevant chunk retrieval
6. Contextual prompt assembly & Groq LLM querying (llama3-8b-8192)
"""

import os
import glob
import time
import hashlib
import json
from threading import RLock
from typing import List, Dict, Any, Optional, Generator
from pypdf import PdfReader
import tiktoken
import chromadb
from chromadb.api.types import EmbeddingFunction, Documents, Embeddings
from groq import Groq
import logging
from google import genai
from google.genai import types
from database.postgres_store import PostgresVectorStore

logger = logging.getLogger(__name__)

# Default Directory Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DOCS_DIR = os.path.join(BASE_DIR, "docs")
CHROMA_DIR = os.path.join(BASE_DIR, "chroma_db")
COLLECTION_NAME = "career_advisor_docs"
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"
DEFAULT_GROQ_MODEL = "qwen/qwen3.8-27b"

# Token Splitting Settings
CHUNK_SIZE = 300
CHUNK_OVERLAP = 50
TOKENIZER_ENCODING = "cl100k_base"

# Smart Model Router import for complexity-based tier selection
from model_router import (
    get_routed_model_info,
    GEMINI_FALLBACK_POOL,
    mark_model_cooldown,
    mark_provider_cooldown,
    model_is_available,
    provider_is_available,
    record_model_usage,
)

SYSTEM_PROMPTS = {
    "simple": (
        "You are J&K EduSetu ('Your Bridge to Education & Opportunities'), a concise and helpful career & education advisor for J&K students. "
        "Provide direct, clear answers in well-structured bullet points with inline source citations. "
        "Ensure your response is completely articulated and never cuts off."
    ),
    "medium": (
        "You are J&K EduSetu ('Your Bridge to Education & Opportunities'), a dedicated career and education advisor for J&K students. "
        "Provide structured, comprehensive answers with relevant sections, eligibility criteria, and source citations. "
        "Ensure all points and recommendations are fully articulated and complete."
    ),
    "complex": (
        "You are J&K EduSetu ('Your Bridge to Education & Opportunities'), an expert career and profile advisor for J&K students doing an in-depth profile analysis. "
        "Provide a thorough, highly structured analysis with numbered sections, complete eligibility details, "
        "source citations, and an actionable 3-point action plan."
    ),
}

FOLLOWUP_SIGNALS = [
    "concise", "shorter", "summarize", "only", "just give",
    "explain the first", "tell me more about", "elaborate on",
    "what about the", "and the second", "previous answer",
    "make it shorter", "simplify", "brief",
]

def is_followup(query: str, messages: list) -> bool:
    q = query.lower()
    has_signal = any(s in q for s in FOLLOWUP_SIGNALS)
    has_history = len(messages) >= 2 if messages else False
    return bool(has_signal and has_history)

# In-memory query response cache to eliminate duplicate API consumption
_RESPONSE_CACHE: Dict[str, Dict[str, Any]] = {}
_RESPONSE_CACHE_LOCK = RLock()
_RESPONSE_CACHE_TTL_SECONDS = 600
_RESPONSE_CACHE_MAX_ENTRIES = 256


def _response_cache_key(
    query: str,
    language: Optional[str],
    context_chunks: List[Dict[str, Any]],
    history: Optional[List[Dict[str, str]]],
) -> Optional[str]:
    """Cache only first-turn answers and bind them to the retrieved source text."""
    query_terms = {term.strip(".,!?;:()[]{}\"'") for term in query.casefold().split()}
    personal_terms = {"i", "i'm", "im", "me", "my", "mine", "we", "our", "ours"}
    if history or len(query) > 500 or query_terms.intersection(personal_terms) or any(char.isdigit() for char in query):
        return None

    source_snapshot = [
        {
            "id": chunk.get("id"),
            "source": chunk.get("source"),
            "page": chunk.get("page"),
            "text": chunk.get("text", ""),
        }
        for chunk in context_chunks
    ]
    material = json.dumps(
        {
            "query": query.strip().casefold(),
            "language": language or "English",
            "sources": source_snapshot,
        },
        sort_keys=True,
        ensure_ascii=False,
    )
    return hashlib.sha256(material.encode("utf-8")).hexdigest()


def _get_cached_response(cache_key: Optional[str]) -> Optional[Dict[str, Any]]:
    if not cache_key:
        return None
    now = time.time()
    with _RESPONSE_CACHE_LOCK:
        cached = _RESPONSE_CACHE.get(cache_key)
        if not cached:
            return None
        if cached.get("expires_at", 0) <= now:
            _RESPONSE_CACHE.pop(cache_key, None)
            return None
        return dict(cached)


def _store_cached_response(cache_key: Optional[str], response: Dict[str, Any]) -> None:
    if not cache_key or not response.get("answer"):
        return
    now = time.time()
    with _RESPONSE_CACHE_LOCK:
        expired = [
            key for key, value in _RESPONSE_CACHE.items()
            if value.get("expires_at", 0) <= now
        ]
        for key in expired:
            _RESPONSE_CACHE.pop(key, None)
        while len(_RESPONSE_CACHE) >= _RESPONSE_CACHE_MAX_ENTRIES:
            oldest_key = next(iter(_RESPONSE_CACHE), None)
            if oldest_key is None:
                break
            _RESPONSE_CACHE.pop(oldest_key, None)
        _RESPONSE_CACHE[cache_key] = {
            **response,
            "expires_at": now + _RESPONSE_CACHE_TTL_SECONDS,
        }

class LazySentenceTransformerEmbeddingFunction(EmbeddingFunction[Documents]):
    """ChromaDB-compatible lazy embedding function that delays sentence_transformers & torch loading until first retrieval."""
    def __init__(self, model_name: str = EMBEDDING_MODEL_NAME):
        self.model_name = model_name
        self._fn = None

    def _get_fn(self):
        if self._fn is None:
            # Ensure no offline flags block model download on a fresh container.
            os.environ.pop("HF_HUB_OFFLINE", None)
            os.environ.pop("TRANSFORMERS_OFFLINE", None)
            os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
            os.environ["TRANSFORMERS_NO_ADVISORY_WARNINGS"] = "1"
            os.environ["TOKENIZERS_PARALLELISM"] = "false"
            from chromadb.utils import embedding_functions
            self._fn = embedding_functions.SentenceTransformerEmbeddingFunction(
                model_name=self.model_name
            )
        return self._fn

    def __call__(self, input: Documents) -> Embeddings:
        return self._get_fn()(input)

    def name(self) -> str:
        return "sentence_transformer"

    def default_space(self) -> str:
        return "cosine"

    def supported_spaces(self) -> list:
        return ["cosine", "l2", "ip"]

    def get_config(self) -> dict:
        return {"model_name": self.model_name}

# Singleton cached embedding function to slash cold start latency
_CACHED_EMBEDDING_FN = None

def get_embedding_function():
    """Cached singleton embedding function preventing model reload overhead."""
    global _CACHED_EMBEDDING_FN
    if _CACHED_EMBEDDING_FN is None:
        _CACHED_EMBEDDING_FN = LazySentenceTransformerEmbeddingFunction(
            model_name=EMBEDDING_MODEL_NAME
        )
    return _CACHED_EMBEDDING_FN


class DocumentChunker:
    """Chunks text into token-based windows with configurable overlap."""
    
    def __init__(self, chunk_size: int = CHUNK_SIZE, chunk_overlap: int = CHUNK_OVERLAP, encoding_name: str = TOKENIZER_ENCODING):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        try:
            self.encoding = tiktoken.get_encoding(encoding_name)
        except Exception:
            self.encoding = tiktoken.get_encoding("cl100k_base")

    def chunk_text(self, text: str, metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Split text into 300-token chunks with 50-token overlap."""
        tokens = self.encoding.encode(text)
        total_tokens = len(tokens)
        
        if total_tokens == 0:
            return []

        chunks = []
        step = max(1, self.chunk_size - self.chunk_overlap)
        chunk_index = 0

        for start_idx in range(0, total_tokens, step):
            end_idx = min(start_idx + self.chunk_size, total_tokens)
            chunk_tokens = tokens[start_idx:end_idx]
            
            chunk_text = self.encoding.decode(chunk_tokens).strip()
            if chunk_text:
                chunk_meta = dict(metadata)
                chunk_meta["chunk_index"] = chunk_index
                chunk_meta["token_count"] = len(chunk_tokens)
                chunk_meta["start_token"] = start_idx
                chunk_meta["end_token"] = end_idx
                
                chunks.append({
                    "id": f"{metadata.get('source', 'doc')}_p{metadata.get('page', 1)}_c{chunk_index}",
                    "text": chunk_text,
                    "metadata": chunk_meta
                })
                chunk_index += 1

            if end_idx >= total_tokens:
                break

        return chunks


class RAGEngine:
    """Manages PostgreSQL/pgvector (production) or local Chroma (development) RAG."""

    def __init__(self, docs_dir: str = DOCS_DIR, chroma_dir: str = CHROMA_DIR):
        self.docs_dir = docs_dir
        self.chroma_dir = chroma_dir
        os.makedirs(self.docs_dir, exist_ok=True)

        self.chunker = DocumentChunker(chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP)

        database_url = os.getenv("DATABASE_URL", "").strip()
        is_production = (
            os.getenv("APP_ENV", "").lower() == "production"
            or os.getenv("RAILWAY_ENVIRONMENT", "").lower() == "production"
        )
        if is_production and not database_url:
            raise RuntimeError("DATABASE_URL must be configured for production deployments")
        self.postgres_store = PostgresVectorStore(database_url) if database_url else None
        if self.postgres_store is None:
            os.makedirs(self.chroma_dir, exist_ok=True)
        
        # Cached HuggingFace all-MiniLM-L6-v2 embedding function
        self.embedding_fn = get_embedding_function()
        
        # Persistent clients
        self._genai_client = None
        self._current_genai_key = None
        self._groq_client = None
        self._current_groq_key = None

        # Local Chroma remains available for database-free development only.
        self.chroma_client = None
        self.collection = None
        # Local Chroma collection is lazy-initialized when accessed.

    def get_genai_client(self, api_key: str) -> genai.Client:
        """Cache and return persistent Google GenAI client to prevent premature closure."""
        if self._genai_client is None or getattr(self, "_current_genai_key", None) != api_key:
            self._genai_client = genai.Client(api_key=api_key)
            self._current_genai_key = api_key
        return self._genai_client

    def get_groq_client(self, api_key: str) -> Groq:
        """Cache and return persistent Groq client."""
        if self._groq_client is None or getattr(self, "_current_groq_key", None) != api_key:
            self._groq_client = Groq(api_key=api_key)
            self._current_groq_key = api_key
        return self._groq_client

    def _ensure_collection(self):
        """Ensure ChromaDB client and collection handles are healthy and synchronized."""
        if self.postgres_store is not None:
            return
        if self.collection is not None:
            return
        try:
            if self.chroma_client is None:
                self.chroma_client = chromadb.PersistentClient(path=self.chroma_dir)
            self.collection = self.chroma_client.get_or_create_collection(
                name=COLLECTION_NAME,
                embedding_function=self.embedding_fn,
                metadata={"hnsw:space": "cosine"}
            )
        except Exception as exc:
            logger.warning("Could not initialize local Chroma collection: %s", exc)

    def load_and_parse_documents(self) -> List[Dict[str, Any]]:
        """Extract text page-by-page from all PDFs and TXT files in the docs directory."""
        extracted_chunks = []

        # 1. Parse PDFs
        pdf_files = glob.glob(os.path.join(self.docs_dir, "*.pdf"))
        for pdf_path in pdf_files:
            filename = os.path.basename(pdf_path)
            try:
                reader = PdfReader(pdf_path)
                for page_idx, page in enumerate(reader.pages):
                    page_text = page.extract_text() or ""
                    if not page_text.strip():
                        continue
                    
                    page_meta = {
                        "source": filename,
                        "page": page_idx + 1,
                        "file_path": pdf_path
                    }
                    
                    page_chunks = self.chunker.chunk_text(page_text, page_meta)
                    extracted_chunks.extend(page_chunks)
            except Exception as e:
                print(f"Error reading PDF {filename}: {e}")

        # 2. Parse Text (.txt) Files
        txt_files = glob.glob(os.path.join(self.docs_dir, "*.txt"))
        for txt_path in txt_files:
            filename = os.path.basename(txt_path)
            try:
                with open(txt_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                if not content.strip():
                    continue

                txt_meta = {
                    "source": filename,
                    "page": 1,
                    "file_path": txt_path
                }
                txt_chunks = self.chunker.chunk_text(content, txt_meta)
                extracted_chunks.extend(txt_chunks)
            except Exception as e:
                print(f"Error reading TXT {filename}: {e}")

        return extracted_chunks

    def load_and_parse_pdfs(self) -> List[Dict[str, Any]]:
        """Backward-compatible wrapper for load_and_parse_documents."""
        return self.load_and_parse_documents()

    def index_documents(self, force_reindex: bool = False) -> Dict[str, Any]:
        """Index the official PDF/TXT corpus into configured vector storage."""
        if self.postgres_store is not None:
            chunks = self.load_and_parse_documents()
            total_count = self.postgres_store.replace_all(chunks)
            return {
                "status": "success" if chunks else "empty",
                "indexed_chunks": len(chunks),
                "total_chunks_in_db": total_count,
                "message": f"Indexed {len(chunks)} chunks into PostgreSQL/pgvector.",
            }

        self._ensure_collection()

        if force_reindex:
            try:
                # Clear all existing documents from collection without destroying the collection handle
                existing = self.collection.get()
                if existing and existing.get("ids") and len(existing["ids"]) > 0:
                    del_batch = 200
                    for i in range(0, len(existing["ids"]), del_batch):
                        self.collection.delete(ids=existing["ids"][i:i + del_batch])
            except Exception as e:
                # If collection state was broken, re-initialize client and collection
                try:
                    self.chroma_client.delete_collection(COLLECTION_NAME)
                except Exception:
                    pass
                self._ensure_collection()
        else:
            # Purge any stale chunks whose source files were deleted from /docs
            try:
                existing_data = self.collection.get()
                stale_ids = []
                if existing_data and existing_data.get("metadatas"):
                    for doc_id, meta in zip(existing_data["ids"], existing_data["metadatas"]):
                        src = meta.get("source")
                        if src and not os.path.exists(os.path.join(self.docs_dir, src)):
                            stale_ids.append(doc_id)
                if stale_ids:
                    del_batch = 200
                    for i in range(0, len(stale_ids), del_batch):
                        self.collection.delete(ids=stale_ids[i:i + del_batch])
            except Exception as e:
                print(f"Warning cleaning stale chunks: {e}")

        chunks = self.load_and_parse_documents()
        if not chunks:
            count = self.collection.count()
            return {
                "status": "empty",
                "indexed_chunks": 0,
                "total_chunks_in_db": count,
                "message": "No documents found in docs/ folder."
            }

        # Prepare records for ChromaDB batch insertion
        ids = [chunk["id"] for chunk in chunks]
        documents = [chunk["text"] for chunk in chunks]
        metadatas = [chunk["metadata"] for chunk in chunks]

        # Use upsert in batches with error recovery for Rust/SQLite bindings
        batch_size = 100
        for i in range(0, len(ids), batch_size):
            end = min(i + batch_size, len(ids))
            batch_ids = ids[i:end]
            batch_docs = documents[i:end]
            batch_metas = metadatas[i:end]
            try:
                self.collection.upsert(
                    ids=batch_ids,
                    documents=batch_docs,
                    metadatas=batch_metas
                )
            except Exception:
                # Re-sync collection handle in case of Rust/SQLite binding desync
                self._ensure_collection()
                self.collection.upsert(
                    ids=batch_ids,
                    documents=batch_docs,
                    metadatas=batch_metas
                )

        total_count = self.collection.count()
        return {
            "status": "success",
            "indexed_chunks": len(chunks),
            "total_chunks_in_db": total_count,
            "message": f"Successfully indexed {len(chunks)} chunks into ChromaDB."
        }

    def _get_docs_fingerprint(self) -> str:
        """Generate a fast timestamp/size fingerprint of all files in docs_dir."""
        files = sorted(glob.glob(os.path.join(self.docs_dir, "*")))
        sig_parts = []
        for f in files:
            if f.endswith((".pdf", ".txt")):
                st_stat = os.stat(f)
                sig_parts.append(f"{os.path.basename(f)}:{st_stat.st_mtime}:{st_stat.st_size}")
        return hashlib.md5(";".join(sig_parts).encode()).hexdigest()

    def _get_manifest_path(self) -> str:
        return os.path.join(self.chroma_dir, ".sync_manifest.json")

    def sync_documents(self, force_reindex: bool = False) -> Dict[str, Any]:
        """Fast synchronization between /docs and ChromaDB.
        Uses fingerprint cache to complete in <1ms when files haven't changed.
        """
        if self.postgres_store is not None:
            return self.index_documents(force_reindex=force_reindex)

        self._ensure_collection()
        manifest_path = self._get_manifest_path()
        current_fp = self._get_docs_fingerprint()

        # Fast path: If collection already has data and manifest matches, skip heavy sync
        if not force_reindex and os.path.exists(manifest_path) and self.collection.count() > 0:
            try:
                with open(manifest_path, "r", encoding="utf-8") as mf:
                    cached = json.load(mf)
                if cached.get("fingerprint") == current_fp:
                    return {
                        "status": "cached_up_to_date",
                        "total_chunks_in_db": self.collection.count(),
                        "fast_sync": True
                    }
            except Exception:
                pass

        # If fingerprint differs or force_reindex is requested, index documents
        res = self.index_documents(force_reindex=force_reindex)

        # Save new manifest
        try:
            with open(manifest_path, "w", encoding="utf-8") as mf:
                json.dump({
                    "fingerprint": current_fp,
                    "total_chunks": self.collection.count(),
                    "synced_at": time.time()
                }, mf)
        except Exception:
            pass

        return res

    def get_collection_stats(self) -> Dict[str, Any]:
        """Get statistics about the indexed collection and documents."""
        if self.postgres_store is not None:
            pdf_files = [os.path.basename(f) for f in glob.glob(os.path.join(self.docs_dir, "*.pdf"))]
            txt_files = [os.path.basename(f) for f in glob.glob(os.path.join(self.docs_dir, "*.txt"))]
            return {
                "total_chunks": self.postgres_store.count(),
                "pdf_files": pdf_files,
                "txt_files": txt_files,
                "all_files": self.postgres_store.sources(),
                "docs_dir": self.docs_dir,
                "storage": "postgresql-pgvector",
            }

        self._ensure_collection()
        count = self.collection.count()
        pdf_files = [os.path.basename(f) for f in glob.glob(os.path.join(self.docs_dir, "*.pdf"))]
        txt_files = [os.path.basename(f) for f in glob.glob(os.path.join(self.docs_dir, "*.txt"))]
        return {
            "total_chunks": count,
            "pdf_files": pdf_files,
            "txt_files": txt_files,
            "all_files": pdf_files + txt_files,
            "docs_dir": self.docs_dir,
            "chroma_dir": self.chroma_dir
        }

    def retrieve(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Retrieve relevant chunks from configured vector storage with offline fallback."""
        try:
            if self.postgres_store is not None:
                return self.postgres_store.retrieve(query, top_k)

            self._ensure_collection()
            if self.collection.count() == 0:
                return []

            results = self.collection.query(
                query_texts=[query],
                n_results=min(top_k, self.collection.count()),
                include=["documents", "metadatas", "distances"]
            )

            retrieved = []
            if results and "documents" in results and results["documents"]:
                docs = results["documents"][0]
                metas = results["metadatas"][0] if "metadatas" in results else [{}] * len(docs)
                dists = results["distances"][0] if "distances" in results else [0.0] * len(docs)
                ids = results["ids"][0] if "ids" in results else [""] * len(docs)

                for doc, meta, dist, chunk_id in zip(docs, metas, dists, ids):
                    similarity = round(1 - dist, 4) if dist is not None else 0.0
                    retrieved.append({
                        "id": chunk_id,
                        "text": doc,
                        "metadata": meta,
                        "distance": dist,
                        "similarity": similarity,
                        "source": meta.get("source", "Unknown"),
                        "page": meta.get("page", 1)
                    })

            return retrieved
        except Exception as e:
            logger.warning(f"ChromaDB retrieval notice: {e}. Falling back to 2G verified store.")
            try:
                from offline_engine import get_2g_response
                match = get_2g_response(query)
                if match and match.get("sources"):
                    return match["sources"][:top_k]
            except Exception:
                pass
            return []

    @staticmethod
    def format_conversation_history(history: Optional[List[Dict[str, Any]]], max_exchanges: int = 3) -> str:
        """Format the last N conversation exchanges (up to 2*N messages) into a clean string for context injection."""
        if not history:
            return "No previous conversation."
        
        # Last 3 exchanges = up to 6 messages (3 user + 3 assistant)
        max_messages = max_exchanges * 2
        recent_turns = [m for m in history if m.get("role") in ["user", "assistant"]][-max_messages:]
        
        if not recent_turns:
            return "No previous conversation."
            
        formatted = []
        for turn in recent_turns:
            role = "User" if turn.get("role") == "user" else "Assistant"
            content = turn.get("content", "").strip()
            formatted.append(f"{role}: {content}")
            
        return "\n".join(formatted)

    def contextualize_query(
        self,
        query: str,
        history: Optional[List[Dict[str, Any]]],
        client: Optional[Any] = None,
        model: str = DEFAULT_GROQ_MODEL
    ) -> str:
        """Fast contextual query formulation without blocking LLM round-trips."""
        if not history or len(history) < 2:
            return query

        pronouns = ["that", "it", "this", "these", "those", "same", "for this", "for that", "previous", "above", "he", "she", "they"]
        q_words = query.lower().split()
        needs_context = any(p in q_words for p in pronouns) or len(q_words) <= 3
        if not needs_context:
            return query

        last_user_turns = [t.get("content", "") for t in history if t.get("role") == "user"]
        if last_user_turns:
            last_q = last_user_turns[-1].strip()
            # Clean last query to core keywords
            clean_last = " ".join([w for w in last_q.split() if len(w) > 2][:8])
            return f"{clean_last} {query}"
        return query

    def build_prompt(self, query: str, context_chunks: List[Dict[str, Any]], history_str: str = "") -> str:
        """Construct the prompt combining retrieved context, conversation history, and user question."""
        if not context_chunks:
            context_str = "No specific reference documents available."
        else:
            formatted_chunks = []
            for i, chunk in enumerate(context_chunks, 1):
                source = chunk.get("source", "Document")
                page = chunk.get("page", "?")
                formatted_chunks.append(
                    f"--- Source [{i}]: {source} (Page {page}) ---\n{chunk.get('text', '')}"
                )
            context_str = "\n\n".join(formatted_chunks)

        history_section = ""
        if history_str and history_str != "No previous conversation.":
            history_section = f"Conversation History (Last 3 Exchanges):\n{history_str}\n\n"

        prompt = f"""You are J&K EduSetu - Your Bridge to Education & Opportunities, an expert AI Career & Education Advisor for Jammu & Kashmir students. Guide the user with professional, actionable, comprehensive, and structured advice.

{history_section}Retrieved Context from Career Documents:
{context_str}

Current User Question: {query}

Instructions:
1. Provide a comprehensive, structured response (using bullet points, bold key terms, and step-by-step guidance).
2. Take into account previous conversation context and follow-up intent.
3. Ground your advice in the provided reference context wherever applicable.
4. If the context does not fully answer the question, supplement with industry-standard career best practices while clearly distinguishing general advice.
5. Reference the specific sources (e.g., [Source 1], [Source 2]) when referencing facts from the documents.
"""
        return prompt

    @staticmethod
    def get_available_groq_models(api_key: str) -> List[str]:
        """Fetch active text generation models available for this Groq API key."""
        fallback = ["qwen/qwen3.8-27b", "qwen/qwen3.6-27b"]
        if not api_key:
            return fallback
        try:
            client = Groq(api_key=api_key)
            model_list = client.models.list()
            active_models = []
            for m in model_list.data:
                model_id = m.id
                # Filter out whisper, vision-preview, embedding, and safety guard models
                if any(excluded in model_id.lower() for excluded in ["whisper", "guard", "embed", "safet", "vision", "tool"]):
                    continue
                active_models.append(model_id)
            
            # Prioritize qwen/qwen3.8-27b if present
            if "qwen/qwen3.8-27b" in active_models:
                active_models.remove("qwen/qwen3.8-27b")
                active_models.insert(0, "qwen/qwen3.8-27b")
            
            return active_models if active_models else fallback
        except Exception:
            return fallback

    def generate_answer(
        self,
        query: str,
        api_key: Optional[str] = None,
        google_api_key: Optional[str] = None,
        model: str = DEFAULT_GROQ_MODEL,
        top_k: int = 5,
        history: Optional[List[Dict[str, str]]] = None,
        language: Optional[str] = None,
        stream: bool = False
    ) -> Any:
        """Retrieve grounded context and route generation across Groq and Gemini."""
        # Resolve conversation history
        effective_history = history
        if effective_history is None:
            effective_history = []

        # Check if query is a follow-up or reformatting request
        if is_followup(query, effective_history):
            search_query = query
            # Extract last assistant message for context instead of querying ChromaDB
            last_assistant_content = ""
            for turn in reversed(effective_history):
                if turn.get("role") == "assistant":
                    last_assistant_content = turn.get("content", "").strip()
                    break

            if last_assistant_content:
                context_chunks = [{
                    "id": "prev_assistant_context",
                    "text": last_assistant_content,
                    "source": "Previous Assistant Response",
                    "page": 1,
                    "metadata": {"source": "Previous Assistant Response", "page": 1}
                }]
            else:
                context_chunks = []

            # Pass only the last 2 exchanges as context to the LLM
            history_str = self.format_conversation_history(effective_history, max_exchanges=2)
            prompt = self.build_prompt(query, context_chunks, history_str=history_str)
            exchanges_to_keep = 2
        else:
            # 1. Contextualize query if there is conversation history
            client = None
            if api_key:
                try:
                    client = Groq(api_key=api_key)
                except Exception:
                    pass
            search_query = self.contextualize_query(query, effective_history, client=client, model=model)
            
            # 2. Retrieve top-k context chunks using the search query
            context_chunks = self.retrieve(search_query, top_k=top_k)

            # 3. Format the last 3 exchanges (up to 6 messages) as conversation history
            history_str = self.format_conversation_history(effective_history, max_exchanges=3)
            prompt = self.build_prompt(query, context_chunks, history_str=history_str)
            exchanges_to_keep = 3

        # Reuse source-bound first-turn answers briefly; do not cache personal follow-ups.
        cache_key = _response_cache_key(query, language, context_chunks, effective_history)
        cached = _get_cached_response(cache_key)
        if cached:
            cached_result = {
                "answer": cached["answer"],
                "sources": cached["sources"],
                "search_query": cached.get("search_query", search_query),
                "model_used": f"{cached['model_used']} (Cached)",
            }
            if not stream:
                return cached_result

            def cached_stream_generator() -> Generator[str, None, None]:
                yield cached_result["answer"]

            return {
                **cached_result,
                "stream": cached_stream_generator(),
            }

        # Determine history length and route LLM using model_router
        history_length = len(effective_history)
        routed_cfg = get_routed_model_info(query, history_length, language=language)
        active_model_id = routed_cfg["model_id"]
        max_tokens_to_use = routed_cfg.get("max_tokens", 3072)

        # Resolve Gemini and Groq API Keys via centralized resilient helper
        import api_key_helper
        resolved_google_key = str(google_api_key).strip().strip("'").strip('"').strip() if google_api_key else ""
        if not resolved_google_key:
            resolved_google_key = api_key_helper.get_google_api_key()

        resolved_groq_key = str(api_key).strip().strip("'").strip('"').strip() if api_key else ""
        if not resolved_groq_key:
            resolved_groq_key = api_key_helper.get_groq_api_key()

        active_tier = routed_cfg.get("tier", "simple")
        system_content = SYSTEM_PROMPTS.get(active_tier, SYSTEM_PROMPTS["simple"])
        if language and language != "English":
            system_content += f" Respond in {language}, using clear and natural language."

        # Prepare messages for Groq fallback
        groq_messages = [{"role": "system", "content": system_content}]
        if effective_history:
            max_msgs = exchanges_to_keep * 2
            recent_turns = [turn for turn in effective_history if turn.get("role") in ["user", "assistant"]][-max_msgs:]
            for turn in recent_turns:
                role = "user" if turn.get("role") == "user" else "assistant"
                groq_messages.append({"role": role, "content": turn.get("content", "")})
        groq_messages.append({"role": "user", "content": prompt})

        # Ensure Groq model is strictly a Groq-hosted model, NEVER a Gemini model ID!
        groq_model = DEFAULT_GROQ_MODEL
        if model and not any(p in model.lower() for p in ["gemini", "gpt", "claude"]) and not any(d in model for d in ["llama3-8b-8192", "llama3-70b-8192"]):
            groq_model = model

        # Use Groq's independent quota for everyday questions; preserve Gemini for
        # complex questions and as a fallback when the preferred provider is limited.
        if active_tier in {"simple", "medium"} and resolved_groq_key and provider_is_available("groq"):
            try:
                groq_client = self.get_groq_client(resolved_groq_key)
                if stream:
                    stream_response = groq_client.chat.completions.create(
                        model=groq_model,
                        messages=groq_messages,
                        max_tokens=min(max_tokens_to_use, 2048),
                        temperature=0.3,
                        stream=True,
                    )
                    stream_iterator = iter(stream_response)
                    first_chunk = next(stream_iterator, None)

                    def groq_primary_stream() -> Generator[str, None, None]:
                        answer_parts: List[str] = []
                        chunks = [first_chunk] if first_chunk is not None else []
                        try:
                            for chunk in chunks:
                                if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
                                    content = chunk.choices[0].delta.content
                                    answer_parts.append(content)
                                    yield content
                            for chunk in stream_iterator:
                                if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
                                    content = chunk.choices[0].delta.content
                                    answer_parts.append(content)
                                    yield content
                            _store_cached_response(cache_key, {
                                "answer": "".join(answer_parts),
                                "sources": context_chunks,
                                "search_query": search_query,
                                "model_used": f"{groq_model} (Groq)",
                            })
                        except Exception as groq_stream_error:
                            mark_provider_cooldown("groq", str(groq_stream_error))
                            logger.warning("Groq primary stream interrupted: %s", groq_stream_error)
                            raise

                    return {
                        "stream": groq_primary_stream(),
                        "sources": context_chunks,
                        "search_query": search_query,
                        "model_used": f"{groq_model} (Groq)",
                    }

                response = groq_client.chat.completions.create(
                    model=groq_model,
                    messages=groq_messages,
                    max_tokens=min(max_tokens_to_use, 2048),
                    temperature=0.3,
                )
                content = response.choices[0].message.content if response.choices else ""
                if not content or not content.strip():
                    raise RuntimeError("Groq returned an empty response")
                groq_result = {
                    "answer": content or "",
                    "sources": context_chunks,
                    "search_query": search_query,
                    "model_used": f"{groq_model} (Groq)",
                }
                _store_cached_response(cache_key, groq_result)
                return groq_result
            except Exception as groq_error:
                mark_provider_cooldown("groq", str(groq_error))
                logger.warning("Groq primary attempt failed; trying Gemini if available: %s", groq_error)

        # 1. Attempt Primary: Gemini via Google GenAI SDK (Sub-second TTFT, multilingual)
        client_genai = None
        if resolved_google_key and provider_is_available("google"):
            try:
                client_genai = self.get_genai_client(resolved_google_key)
            except Exception as google_error:
                mark_provider_cooldown("google", str(google_error))
                logger.warning("Gemini client initialization failed: %s", google_error)

        if client_genai:

            # Format conversation history for google.genai chat
            genai_history = []
            if effective_history:
                max_msgs = exchanges_to_keep * 2
                recent_turns = [turn for turn in effective_history if turn.get("role") in ["user", "assistant"]][-max_msgs:]
                for turn in recent_turns:
                    role = "user" if turn.get("role") == "user" else "model"
                    genai_history.append(
                        types.Content(role=role, parts=[types.Part.from_text(text=turn.get("content", ""))])
                    )

            # Candidate Gemini models: active routed model first, followed by resilient pool
            candidate_models = [active_model_id]
            for cm in GEMINI_FALLBACK_POOL:
                if cm not in candidate_models:
                    candidate_models.append(cm)
            candidate_models = [candidate for candidate in candidate_models if model_is_available(candidate)]

            if stream:
                def dynamic_stream_generator() -> Generator[str, None, None]:
                    gemini_streamed_any = False
                    answer_parts: List[str] = []
                    for try_model in candidate_models:
                        try:
                            gen_config = types.GenerateContentConfig(
                                system_instruction=system_content,
                                temperature=0.3,
                                max_output_tokens=max_tokens_to_use,
                            )
                            if "3.7" in try_model or "3.8" in try_model:
                                gen_config.thinking_config = types.ThinkingConfig(thinking_level="low")

                            chat = client_genai.chats.create(
                                model=try_model,
                                history=genai_history,
                                config=gen_config
                            )
                            response_stream = chat.send_message_stream(prompt)
                            stream_iter = iter(response_stream)
                            first_chunk = next(stream_iter, None)
                            record_model_usage(try_model)

                            if first_chunk and first_chunk.text:
                                gemini_streamed_any = True
                                answer_parts.append(first_chunk.text)
                                yield first_chunk.text

                            for chunk in stream_iter:
                                if chunk.text:
                                    gemini_streamed_any = True
                                    answer_parts.append(chunk.text)
                                    yield chunk.text
                            if not gemini_streamed_any:
                                raise RuntimeError(f"Gemini model '{try_model}' returned an empty response")
                            _store_cached_response(cache_key, {
                                "answer": "".join(answer_parts),
                                "sources": context_chunks,
                                "search_query": search_query,
                                "model_used": try_model,
                            })
                            return
                        except Exception as try_err:
                            err_str = str(try_err)
                            if any(code in err_str for code in ["429", "RESOURCE_EXHAUSTED", "404", "NOT_FOUND", "503", "UNAVAILABLE", "500"]):
                                mark_model_cooldown(try_model, err_str)
                            if any(code in err_str.lower() for code in ["429", "resource_exhausted", "rate limit", "quota", "503", "unavailable"]):
                                mark_provider_cooldown("google", err_str)
                            logger.warning(f"Gemini streaming attempt on '{try_model}' failed: {try_err}. Checking next candidate in pool...")
                            if gemini_streamed_any:
                                raise
                            if not provider_is_available("google"):
                                break
                            continue

                    # If all Gemini models in candidate_models failed, try Groq fallback
                    if resolved_groq_key and provider_is_available("groq"):
                        logger.warning("All Gemini candidate models failed. Falling back to Groq stream...")
                        try:
                            groq_client = self.get_groq_client(resolved_groq_key)
                            stream_resp = groq_client.chat.completions.create(
                                model=groq_model,
                                messages=groq_messages,
                                max_tokens=2048,
                                temperature=0.3,
                                stream=True
                            )
                            for chunk in stream_resp:
                                if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
                                    content = chunk.choices[0].delta.content
                                    answer_parts.append(content)
                                    yield content
                            _store_cached_response(cache_key, {
                                "answer": "".join(answer_parts),
                                "sources": context_chunks,
                                "search_query": search_query,
                                "model_used": f"{groq_model} (Groq Fallback)",
                            })
                            return
                        except Exception as groq_err:
                            mark_provider_cooldown("groq", str(groq_err))
                            logger.error(f"Groq stream fallback also failed: {groq_err}")
                            raise groq_err

                    raise RuntimeError("All Gemini candidate models and Groq fallback failed to stream.")

                return {
                    "stream": dynamic_stream_generator(),
                    "sources": context_chunks,
                    "search_query": search_query,
                    "model_used": active_model_id
                }
            else:
                last_gemini_err = None
                for try_model in candidate_models:
                    try:
                        gen_config = types.GenerateContentConfig(
                            system_instruction=system_content,
                            temperature=0.3,
                            max_output_tokens=max_tokens_to_use,
                        )
                        if "3.7" in try_model or "3.8" in try_model:
                            gen_config.thinking_config = types.ThinkingConfig(thinking_level="low")

                        chat = client_genai.chats.create(
                            model=try_model,
                            history=genai_history,
                            config=gen_config
                        )
                        response = chat.send_message(prompt)
                        record_model_usage(try_model)
                        content = response.text or ""
                        cached_result = {
                            "answer": content,
                            "sources": context_chunks,
                            "search_query": search_query,
                            "model_used": try_model
                        }
                        _store_cached_response(cache_key, cached_result)
                        return cached_result
                    except Exception as e:
                        last_gemini_err = e
                        err_str = str(e)
                        if any(code in err_str for code in ["429", "RESOURCE_EXHAUSTED", "404", "NOT_FOUND", "503", "UNAVAILABLE", "500"]):
                            mark_model_cooldown(try_model, err_str)
                        if any(code in err_str.lower() for code in ["429", "resource_exhausted", "rate limit", "quota", "503", "unavailable"]):
                            mark_provider_cooldown("google", err_str)
                        logger.warning(f"Gemini attempt with model '{try_model}' failed: {e}. Checking next candidate in pool...")
                        if not provider_is_available("google"):
                            break
                        continue

                logger.warning(f"All Gemini models in pool failed (Last error: {last_gemini_err}). Falling back to Groq if available.")
                if not resolved_groq_key and last_gemini_err:
                    raise last_gemini_err

        # 2. Attempt Fallback: Groq (Direct Groq SDK with active model)
        if resolved_groq_key and provider_is_available("groq"):
            groq_client = self.get_groq_client(resolved_groq_key)

            if stream:
                def stream_generator_groq() -> Generator[str, None, None]:
                    answer_parts: List[str] = []
                    try:
                        stream_resp = groq_client.chat.completions.create(
                            model=groq_model,
                            messages=groq_messages,
                            max_tokens=min(max_tokens_to_use, 2048),
                            temperature=0.3,
                            stream=True,
                        )
                        for chunk in stream_resp:
                            if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
                                content = chunk.choices[0].delta.content
                                answer_parts.append(content)
                                yield content
                        _store_cached_response(cache_key, {
                            "answer": "".join(answer_parts),
                            "sources": context_chunks,
                            "search_query": search_query,
                            "model_used": f"{groq_model} (Groq Fallback)",
                        })
                    except Exception as groq_err:
                        mark_provider_cooldown("groq", str(groq_err))
                        logger.error("Groq fallback stream failed: %s", groq_err)
                        raise
                return {
                    "stream": stream_generator_groq(),
                    "sources": context_chunks,
                    "search_query": search_query,
                    "model_used": f"{groq_model} (Groq Fallback)"
                }
            else:
                try:
                    resp = groq_client.chat.completions.create(
                        model=groq_model,
                        messages=groq_messages,
                        max_tokens=min(max_tokens_to_use, 2048),
                        temperature=0.3,
                    )
                except Exception as groq_err:
                    mark_provider_cooldown("groq", str(groq_err))
                    raise
                content = resp.choices[0].message.content if resp.choices else ""
                if not content or not content.strip():
                    raise RuntimeError("Groq returned an empty response")
                groq_result = {
                    "answer": content,
                    "sources": context_chunks,
                    "search_query": search_query,
                    "model_used": f"{groq_model} (Groq Fallback)"
                }
                _store_cached_response(cache_key, groq_result)
                return groq_result

        raise ValueError("Neither GOOGLE_API_KEY nor GROQ_API_KEY is configured in the backend environment.")

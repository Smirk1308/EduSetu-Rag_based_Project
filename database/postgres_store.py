"""Server-only PostgreSQL/pgvector storage for indexed government documents."""

from __future__ import annotations

import hashlib
import os
from collections import defaultdict
from typing import Any, Dict, Iterable, List


class PostgresVectorStore:
    """Persist document chunks in PostgreSQL and retrieve them by cosine distance."""

    def __init__(self, connection_string: str):
        if not connection_string:
            raise ValueError("DATABASE_URL is required for PostgreSQL vector storage")

        from psycopg_pool import ConnectionPool

        max_connections = int(os.getenv("DB_POOL_MAX_SIZE", "8"))
        self.pool = ConnectionPool(
            conninfo=connection_string,
            min_size=1,
            max_size=max(1, min(max_connections, 32)),
            timeout=10,
        )
        self._embedding_model = None

    def _embed(self, texts: Iterable[str]):
        if self._embedding_model is None:
            from sentence_transformers import SentenceTransformer

            self._embedding_model = SentenceTransformer(
                os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
            )
        return self._embedding_model.encode(
            list(texts), normalize_embeddings=True, show_progress_bar=False
        )

    @staticmethod
    def _vector_literal(vector: Iterable[float]) -> str:
        return "[" + ",".join(f"{float(value):.8f}" for value in vector) + "]"

    @staticmethod
    def _content_hash(chunks: List[Dict[str, Any]]) -> str:
        digest = hashlib.sha256()
        for chunk in chunks:
            digest.update(chunk.get("text", "").encode("utf-8"))
        return digest.hexdigest()

    def replace_all(self, chunks: List[Dict[str, Any]]) -> int:
        """Replace the indexed corpus atomically; intended for controlled re-indexes."""
        if not chunks:
            # An empty deployment bundle must never silently erase an existing corpus.
            return self.count()

        by_source: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        for chunk in chunks:
            metadata = chunk.get("metadata") or {}
            source = os.path.basename(str(metadata.get("source") or "unknown"))
            by_source[source].append(chunk)

        # Build vectors before taking database locks; transformer inference can be
        # CPU-heavy and should not hold the corpus replacement transaction open.
        prepared_sources = []
        for source, source_chunks in by_source.items():
            texts = [chunk.get("text", "") for chunk in source_chunks]
            vectors = self._embed(texts)
            rows = []
            for chunk, vector in zip(source_chunks, vectors):
                if len(vector) != 384:
                    raise ValueError("The configured embedding model must return 384-dimensional vectors")
                metadata = chunk.get("metadata") or {}
                rows.append((
                    int(metadata.get("chunk_index", 0)),
                    max(1, int(metadata.get("page", 1))),
                    chunk.get("text", ""),
                    self._vector_literal(vector),
                ))
            prepared_sources.append((source, source_chunks, rows))

        with self.pool.connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute("DELETE FROM public.documents")
                for source, source_chunks, source_rows in prepared_sources:
                    file_hash = self._content_hash(source_chunks)
                    cursor.execute(
                        """
                        INSERT INTO public.documents (title, file_name, content_hash)
                        VALUES (%s, %s, %s)
                        RETURNING id
                        """,
                        (os.path.splitext(source)[0], source, file_hash),
                    )
                    document_id = cursor.fetchone()[0]
                    rows = [
                        (
                            document_id,
                            chunk_index,
                            page_number,
                            content,
                            embedding,
                        )
                        for chunk_index, page_number, content, embedding in source_rows
                    ]
                    cursor.executemany(
                        """
                        INSERT INTO public.document_chunks
                            (doc_id, chunk_index, page_number, content, embedding)
                        VALUES (%s, %s, %s, %s, %s::extensions.vector)
                        """,
                        rows,
                    )

                cursor.execute("SELECT count(*) FROM public.document_chunks")
                return int(cursor.fetchone()[0])

    def count(self) -> int:
        with self.pool.connection() as connection:
            row = connection.execute(
                "SELECT count(*) FROM public.document_chunks"
            ).fetchone()
        return int(row[0])

    def check_connection(self) -> None:
        with self.pool.connection() as connection:
            connection.execute("SELECT 1").fetchone()

    def sources(self) -> List[str]:
        with self.pool.connection() as connection:
            rows = connection.execute(
                "SELECT file_name FROM public.documents ORDER BY file_name"
            ).fetchall()
        return [row[0] for row in rows]

    def retrieve(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        query_vector = self._vector_literal(self._embed([query])[0])
        with self.pool.connection() as connection:
            rows = connection.execute(
                """
                SELECT c.id, c.content, d.file_name, c.page_number,
                       c.embedding OPERATOR(extensions.<=>) %s::extensions.vector AS distance
                FROM public.document_chunks AS c
                JOIN public.documents AS d ON d.id = c.doc_id
                ORDER BY c.embedding OPERATOR(extensions.<=>) %s::extensions.vector
                LIMIT %s
                """,
                (query_vector, query_vector, max(1, min(int(top_k), 20))),
            ).fetchall()

        return [
            {
                "id": str(row[0]),
                "text": row[1],
                "metadata": {"source": row[2], "page": row[3]},
                "distance": float(row[4]),
                "similarity": round(1 - float(row[4]), 4),
                "source": row[2],
                "page": row[3],
            }
            for row in rows
        ]

    def close(self) -> None:
        self.pool.close()

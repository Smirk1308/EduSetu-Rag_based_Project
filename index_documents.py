"""Index the local docs/ corpus into the configured PostgreSQL or Chroma store."""

import os

from dotenv import load_dotenv

load_dotenv()

from rag_engine import RAGEngine


def main() -> None:
    if not os.getenv("DATABASE_URL"):
        raise SystemExit("Set DATABASE_URL before indexing the production corpus.")

    engine = RAGEngine()
    result = engine.index_documents(force_reindex=True)
    print(result["message"])
    print(f"Indexed: {result['indexed_chunks']} | Total: {result['total_chunks_in_db']}")


if __name__ == "__main__":
    main()

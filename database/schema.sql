-- J&K EduSetu production document store (Supabase PostgreSQL + pgvector).
-- Apply with the Supabase SQL editor or a reviewed database migration.

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
ALTER EXTENSION vector SET SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    file_name TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    official_portal_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    page_number INTEGER NOT NULL DEFAULT 1 CHECK (page_number > 0),
    content TEXT NOT NULL,
    embedding extensions.VECTOR(384) NOT NULL,
    tsv TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (doc_id, page_number, chunk_index)
);

-- Keep this schema compatible with the earlier draft in this repository.
ALTER TABLE public.documents
    ADD COLUMN IF NOT EXISTS content_hash TEXT NOT NULL DEFAULT '';
ALTER TABLE public.documents
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_file_name_unique
    ON public.documents (file_name);

CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding
    ON public.document_chunks USING hnsw (embedding extensions.vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_document_chunks_tsv
    ON public.document_chunks USING gin (tsv);
CREATE INDEX IF NOT EXISTS idx_document_chunks_doc_id
    ON public.document_chunks (doc_id);

-- Do not expose official source content or embeddings directly through the
-- browser-facing Supabase Data API. The trusted FastAPI service uses DATABASE_URL.
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.documents, public.document_chunks FROM anon, authenticated;

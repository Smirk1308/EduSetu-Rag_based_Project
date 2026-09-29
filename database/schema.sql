-- =============================================================================
-- J&K EduSetu Database Schema (Supabase / PostgreSQL + pgvector)
-- =============================================================================

-- 1. Enable pgvector extension for high-dimensional vector search
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Verified Government Document Registry
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'Scholarship', 'Cutoff', 'Reservation', 'College'
    file_name VARCHAR(255) NOT NULL,
    official_portal_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Document Chunks with 384-dimensional dense vectors (all-MiniLM-L6-v2)
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    page_number INT DEFAULT 1,
    content TEXT NOT NULL,
    embedding VECTOR(384) NOT NULL,
    tsv TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for lightning fast hybrid search (Cosine Distance + Full-Text BM25)
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON document_chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_chunks_tsv ON document_chunks USING gin (tsv);

-- 4. User Chat Sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    language VARCHAR(20) DEFAULT 'English',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Chat Messages with Model & Citation Metadata
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    model_used VARCHAR(50),
    latency_ms FLOAT,
    citations JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. User Feedback Loop (Reinforcement signal for retrieval quality)
CREATE TABLE IF NOT EXISTS message_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
    rating INT CHECK (rating IN (1, -1)), -- 1 = Thumbs Up, -1 = Thumbs Down
    feedback_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

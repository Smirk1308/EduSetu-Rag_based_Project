# AI-Powered Vector Search with Tiger Data, pgvector & pgvectorscale

> **MLH Global Hack Week Challenge Implementation**  
> *Storing high-dimensional vector embeddings alongside time-series data using Tiger Data's native `pgvector` and `pgvectorscale` support on TimescaleDB hypertables.*

---

## 1. Overview & Architecture

Modern AI applications often rely on a **separate vector database sidecar** (such as Pinecone, Qdrant, or ChromaDB) alongside an operational database. This introduces data sync lag, dual-database overhead, duplicate infrastructure costs, and complex joins across systems.

By using **Tiger Data** (Timescale) with **`pgvector`** and **`pgvectorscale`**, we turn **PostgreSQL** into a unified, high-performance vector and time-series database:
1. **High-Dimensional Embeddings (`vector(384)`)**: Generated from text documents using `sentence-transformers/all-MiniLM-L6-v2`.
2. **TimescaleDB Hypertables**: Partitions vector records along a time-series dimension (`recorded_at TIMESTAMPTZ`), speeding up time-bounded searches and enabling automated data retention.
3. **StreamingDiskANN Indexing (`pgvectorscale`)**: High-performance graph indexing with Statistical Binary Quantization (SBQ), serving vector search from NVMe/SSD storage with minimal RAM footprint.
4. **Hybrid RAG Queries**: Single SQL queries filtering by semantic similarity, time intervals, metadata, and distance metrics.

```
                           +----------------------------------------+
                           |     Incoming Document / Notice Text    |
                           +----------------------------------------+
                                               |
                                               v
                           +----------------------------------------+
                           | sentence-transformers (384-dimensions) |
                           +----------------------------------------+
                                               |
                                               v
+-----------------------------------------------------------------------------------------+
|                              PostgreSQL / TimescaleDB Engine                            |
|                                                                                         |
|   +---------------------------------------------------------------------------------+   |
|   |                  Hypertable: admissions_timeline_vectors                        |   |
|   |         (Partitioned by recorded_at into 1-month time-series chunks)            |   |
|   |  - id: UUID                                                                     |   |
|   |  - recorded_at: TIMESTAMPTZ (Event / Notice Publication Timestamp)              |   |
|   |  - category: TEXT (scholarship, engineering, medical, quotas)                   |   |
|   |  - academic_cycle: TEXT (2024-25, 2025-26)                                      |   |
|   |  - content: TEXT                                                                |   |
|   |  - metadata: JSONB                                                              |   |
|   |  - embedding: vector(384)                                                       |   |
|   +---------------------------------------------------------------------------------+   |
|                                           |                                             |
|                                           v                                             |
|   +---------------------------------------------------------------------------------+   |
|   |                  pgvectorscale Index: StreamingDiskANN                          |   |
|   |     - num_neighbors = 50 | search_list_size = 100 | max_alpha = 1.2             |   |
|   |     - num_dimensions = 384 | Statistical Binary Quantization (2-bit SBQ)        |   |
|   +---------------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------------+
                                            |
                                            v
              +-------------------------------------------------------------+
              |           Unified Hybrid Retrieval-Augmented Query          |
              |   - Semantic Distance: Cosine (<=>), L2 (<->), IP (<#>)     |
              |   - Time-Range Filter: recorded_at BETWEEN t1 AND t2        |
              |   - Metadata Filter: category = 'scholarship'               |
              |   - Time-Decay Score: Hybrid (Semantic 70% + Freshness 30%)|
              +-------------------------------------------------------------+
```

---

## 2. PostgreSQL Schema & Extensions

### Extension Activation
```sql
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
CREATE EXTENSION IF NOT EXISTS vector CASCADE;
CREATE EXTENSION IF NOT EXISTS vectorscale CASCADE;
```

### Table & Hypertable Creation
```sql
CREATE TABLE IF NOT EXISTS public.admissions_timeline_vectors (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    recorded_at TIMESTAMPTZ NOT NULL,
    doc_id TEXT NOT NULL,
    chunk_index INT NOT NULL,
    title TEXT NOT NULL,
    source TEXT NOT NULL,
    category TEXT NOT NULL,
    academic_cycle TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    embedding vector(384) NOT NULL,
    PRIMARY KEY (recorded_at, id)
);

-- Partition into 1-month time chunks via TimescaleDB
SELECT create_hypertable(
    'public.admissions_timeline_vectors',
    'recorded_at',
    if_not_exists => TRUE,
    chunk_time_interval => INTERVAL '1 month'
);
```

### pgvectorscale StreamingDiskANN Index
```sql
CREATE INDEX IF NOT EXISTS idx_admissions_vectors_diskann
ON public.admissions_timeline_vectors
USING diskann (embedding)
WITH (
    num_neighbors = 50,
    search_list_size = 100,
    max_alpha = 1.2,
    num_dimensions = 384,
    num_bits_per_dimension = 2
);
```

---

## 3. Hybrid Search Queries with Time Ranges, Metadata & Distance Metrics

### SQL Query: Cosine Distance with Time Range & Category Filter
```sql
WITH scored AS (
    SELECT
        id,
        recorded_at,
        title,
        source,
        category,
        academic_cycle,
        content,
        metadata,
        -- Distance Metric: Cosine Distance (<=>)
        (embedding <=> $1::vector) AS cosine_distance,
        -- Semantic Similarity [0.0, 1.0]
        1.0 - (embedding <=> $1::vector) AS semantic_similarity,
        -- Time-Freshness Score using exponential decay (half-life of 180 days)
        EXP(-0.00385 * GREATEST(0.0, EXTRACT(EPOCH FROM (NOW() - recorded_at)) / 86400.0)) AS time_freshness
    FROM public.admissions_timeline_vectors
    WHERE
        recorded_at >= '2025-01-01' AND recorded_at <= '2026-12-31'  -- Time-range filter
        AND category = 'scholarship'                                  -- Metadata filter
)
SELECT
    id,
    recorded_at,
    title,
    content,
    cosine_distance,
    semantic_similarity,
    time_freshness,
    -- Hybrid RAG Score: 70% Semantic Relevance + 30% Temporal Freshness
    (0.70 * semantic_similarity) + (0.30 * time_freshness) AS hybrid_score
FROM scored
ORDER BY hybrid_score DESC
LIMIT 5;
```

### Supported Distance Metrics:
- **Cosine Distance (`<=>`)**: Directional cosine similarity, ideal for normalized embeddings.
- **Euclidean L2 Distance (`<->`)**: Geometric straight-line distance.
- **Inner Product (`<#>`)**: Negative dot product, optimal for unnormalized magnitude-aware vectors.

---

## 4. How to Run & Verify

### Option A: Local Docker (Tiger Data / TimescaleDB with pgvectorscale)
Start the official pre-configured container containing PostgreSQL 16, TimescaleDB, pgvector, and pgvectorscale:
```bash
docker compose -f docker-compose.tigerdata.yml up -d
```
Connection string: `postgresql://postgres:password123@localhost:5433/edusetu_vectors`

### Option B: Run the CLI Demonstration Script
Run the automated test suite demonstrating hypertable partitioning, DiskANN index creation, and hybrid searches:
```bash
python demo_tigerdata_vector.py
```

### Option C: Interactive Web Console
Start the server and visit the interactive visual dashboard:
```bash
uvicorn server:app --port 8000
```
Open **[http://localhost:8000/tigerdata](http://localhost:8000/tigerdata)** in your browser to:
- Test queries live (e.g. *"PMSSS scholarship eligibility"*, *"NIT Srinagar cutoffs"*)
- Select distance metrics (`<=>`, `<->`, `<#>`)
- Filter across time-ranges (2024-25, 2025-26, Recent 90 Days)
- Adjust the hybrid time-decay slider
- Capture screenshots for submission

---

## 5. Submission Checklist

- [x] **Branch Isolation**: Created on `feat/tigerdata-pgvector`; main app functionality untouched.
- [x] **High-Dimensional Embeddings**: 384-dimensional dense vectors stored natively via `vector(384)`.
- [x] **Time-Series Hypertables**: Partitions vector records temporally via TimescaleDB `create_hypertable`.
- [x] **pgvectorscale Support**: StreamingDiskANN index definition with Statistical Binary Quantization (SBQ).
- [x] **Multi-Filter Search**: Full support for time ranges, metadata tags, and configurable distance metrics.
- [x] **Hybrid Scoring**: Blends semantic similarity with temporal decay for fresh admissions context.
- [x] **Submission Screenshot**: Generated and saved to `tigerdata_vector_screenshot.png`.

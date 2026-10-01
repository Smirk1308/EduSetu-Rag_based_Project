# Backend and scale-readiness review

Reviewed: 2026-09-30

## Implemented in this pass

- Removed the Streamlit entrypoints and all Streamlit imports/state from the backend. Provider keys now come only from deployment environment variables or local `.env`.
- Added a production PostgreSQL/pgvector store with a bounded psycopg connection pool. When `DATABASE_URL` is configured, RAG indexing and similarity retrieval use that store; local development can continue to use ChromaDB.
- Added a guarded one-shot corpus indexer (`python index_documents.py`) and updated the schema for document hashes, vector/full-text indexes, and browser-role access restrictions.
- Added `/api/ready` as a separate database readiness probe and changed `/api/stats` to report live document counts rather than hard-coded figures.
- Kept student chat history in request memory only. Persistent chat needs authentication, retention rules, and explicit user consent first.
- Added in-view section motion and mobile navigation transitions. Both follow the system reduced-motion preference. Framer Motion was already installed.

## Still required before a large public launch

1. **Backend credential and corpus indexing.** A Supabase project is provisioned and the schema is applied. The API deployment still needs a private `DATABASE_URL`, and the official source corpus still needs to be indexed from the backend environment.
2. **Abuse and spend controls.** `/api/chat` is public and can incur model-provider charges. Add edge/WAF rate limits, request/concurrency limits, provider spend alerts, and preferably a shared limiter before broad public traffic.
3. **Shared routing state.** Model cooldown/usage observations are process-local and reset on restart; with multiple API replicas they are best-effort rather than account-wide quota tracking.
4. **End-to-end database tests.** Add migration checks, retrieval-quality fixtures, pool exhaustion/reconnect tests, and API/SSE tests against a disposable database before production promotion.
5. **Feature parity.** The previous Streamlit-only screens are removed; only the currently implemented Next.js experience remains. Any legacy-only functionality that should survive must be rebuilt as Next.js pages or API endpoints.

## Frontend connection and navigation

The browser calls the same-origin Next.js `/api/chat` proxy. Set `BACKEND_API_URL` only in the frontend deployment and keep `DATABASE_URL`, Gemini, and Groq credentials only in the backend deployment. The homepage navigation uses working hash anchors; those links are not gated on a database or API connection.

## Verification

- `npm run lint`: passed.
- `npm run build`: passed.
- Python syntax: all 21 root/database Python files parsed successfully.
- Supabase: both schema migrations applied; pgvector is installed in the `extensions` schema; RLS is enabled; a privilege check confirmed `anon` and `authenticated` cannot read either table.
- Supabase advisors: only the expected informational notice remains that these server-only tables have no browser RLS policies; performance indexes show as unused because the corpus is not indexed yet.
- Python tests were not run because this workspace interpreter has no `pytest`; the FastAPI/database dependencies are not installed here.

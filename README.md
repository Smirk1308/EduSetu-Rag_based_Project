# J&K EduSetu — Autonomous AI Higher Education & Scholarship Advisor
### Official AI Advisor for Jammu, Kashmir & Ladakh • Next.js 15 + FastAPI + ChromaDB Hybrid RAG

<p align="center">
  <img src="frontend/public/jk_emblem.png" width="100" alt="J&K State Emblem" />
</p>

An enterprise-grade, decoupled AI advisor grounded directly on verified government gazettes, AICTE PMSSS guidelines, JKBOPEE seat matrices, and the updated **S.O. 176 (2024)** reservation rules. 

Built with **Next.js 15 (React 19)**, **Tailwind CSS**, **Framer Motion**, and **Aceternity UI** on the frontend, paired with an asynchronous **FastAPI** backend featuring a self-healing **5-model Gemini fleet** and sub-10ms **2G mountain edge failover**.

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js 15 Frontend                    │
│   (Vercel Deploy • React 19 • Aceternity UI • Tailwind CSS) │
│  Spotlight · Background Beams · Floating Nav · Bento Grid   │
└──────────────────────────────┬──────────────────────────────┘
                               │ SSE Streaming / REST
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     FastAPI Async Backend                   │
│          (Railway Deploy • Docker • Python 3.11/3.14)       │
│                                                             │
│   ┌────────────────────┐          ┌───────────────────────┐ │
│   │ 5-Model Gemini     │          │ 2G Mountain Edge      │ │
│   │ Fleet Load Balancer│          │ Sub-10ms Offline RAG  │ │
│   └─────────┬──────────┘          └───────────┬───────────┘ │
└─────────────┼─────────────────────────────────┼─────────────┘
              ▼                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                      Storage & Retrieval                    │
│    Local ChromaDB (384-d all-MiniLM) / Supabase pgvector    │
│              Verified Official Gazette Documents            │
└─────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

- **Decoupled Architecture**: Independent Next.js 15 frontend and FastAPI async REST API.
- **Aceternity UI & 21st.dev Components**:
  - **Spotlight**: Radial cursor hero spotlight gradient.
  - **Background Beams / Sparkles**: Ambient floating particles inspired by Himalayan tranquility.
  - **Floating Navbar**: Frosted glass pill header with official J&K Emblem, active fleet badge, and 2G switch.
  - **Bento Grid**: Asymmetric responsive cards for Colleges, PMSSS, and S.O. 176 Quotas.
- **Verified Government Grounding**:
  - AICTE PMSSS (5,000 reserved slots annually, up to ₹3.00L tuition + ₹1.00L maintenance).
  - BOPEE & JEE Main opening/closing cutoffs (NIT Srinagar, GCET Jammu, GMC Srinagar).
  - S.O. 176 (2024) Updated Reservation Policy (OM 50%, ST 20%, RBA 10%, SC 8%, EWS 10%).
- **Quota-Aware 5-Model Gemini Fleet**:
  - `gemini-3.8-flash`: Deep reasoning & flagship queries.
  - `gemini-3.6-flash`: High-fidelity standard queries.
  - `gemini-3.5-flash`: Stable general QA.
  - `gemini-3.5-flash-lite`: High-throughput 500 RPD sub-second generation.
  - `gemini-3.1-flash-lite`: High-throughput 500 RPD fallback.
  - Self-healing circuit breaker that bypasses transient 503 or 429 errors silently.
- **⚡ Sub-10ms 2G Mountain Edge Failover**: Instant offline responses from local gazette records for remote border areas (Gurez, Kupwara, Uri, Kargil).
- **Multi-Language Support**: English, اردو (Urdu with RTL layout), हिंदी (Hindi), and کٲشُر (Kashmiri).

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Python 3.10+ (tested on Python 3.11 & 3.14)
- Node.js 18+ (tested on Node v24)
- Google AI Studio API key (configured in `.env` or `.streamlit/secrets.toml`)

### 2. Start the FastAPI Backend
```bash
# Install Python dependencies
pip install -r requirements.txt

# Run FastAPI backend
python server.py
```
Backend runs at: `http://localhost:8000`  
Interactive Swagger API documentation: `http://localhost:8000/docs`

### 3. Start the Next.js Frontend
```bash
cd frontend

# Install Node dependencies
npm install

# Run frontend development server
npm run dev
```
Frontend runs at: `http://localhost:3000`

---

## ☁️ Deployment Guide

### Deploy Frontend to Vercel
1. Push your repository to GitHub.
2. In Vercel, click **Add New Project** and select this repository.
3. Set **Root Directory** to `frontend`.
4. Add Environment Variable:
   ```
   NEXT_PUBLIC_API_URL = https://your-backend-railway-url.up.railway.app
   ```
5. Click **Deploy**.

### Deploy Backend to Railway
1. In Railway, click **New Project** ➔ **Deploy from GitHub repo**.
2. Railway will automatically detect the root `Dockerfile` and `railway.json`.
3. Add Environment Variables in Railway Settings:
   ```
   GOOGLE_API_KEY = your_google_ai_studio_api_key
   GROQ_API_KEY = your_groq_api_key (optional fallback)
   ```
4. Click **Deploy**. Copy the generated public URL and paste it into your Vercel frontend `NEXT_PUBLIC_API_URL`.

---

## 🗄️ Database Architecture (Roadmap)
The production schema for **Supabase (PostgreSQL with `pgvector`)** is located in [`database/schema.sql`](database/schema.sql) with HNSW indexes for dense vector similarity and GIN indexes for full-text BM25 search.

---

## 👨‍💻 Author & Credits
- **Developed by**: **Shubh Sharma**, CSE, The National Institute of Engineering (NIE), Mysuru.
- Dedicated to the students of Jammu, Kashmir & Ladakh.

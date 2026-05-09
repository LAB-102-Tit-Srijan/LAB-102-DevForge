# SheriSense — Progress Tracker

> This file tracks all development progress for context continuity across sessions.

---

## Project Info
- **Name**: SheriSense (AI-Powered Learning Companion for LMS)
- **Repo**: https://github.com/LAB-102-Tit-Srijan/LAB-102-DevForge
- **Branch**: main
- **Start Time**: 2026-05-09T16:22:00+05:30

## Tech Stack
- **Frontend**: React + Vite + Tailwind CSS v4 + Framer Motion + Zustand + React Query
- **Backend**: Express.js + BullMQ + Redis + ChromaDB + MongoDB Atlas + Groq (Llama 3.3 70B)
- **Transcription**: yt-dlp + ffmpeg + Groq Whisper (whisper-large-v3-turbo)
- **Infra**: Docker Compose (frontend, backend, worker, redis, chromadb)
- **Language**: Plain JavaScript (JSX for frontend, JS with ES Modules for backend)

## Architecture
```
Teacher Uploads YouTube URL or MP4 File
        ↓
  Express API (+ multer for file uploads)
        ↓
  BullMQ Job Queue
        ↓
  Worker Process
        ↓
  yt-dlp (YouTube) or ffmpeg (MP4) → Audio extraction
        ↓
  Groq Whisper Transcription (segment-level timestamps)
        ↓
  Semantic Chunking (chunking.service.js)
        ↓
  ChromaDB Embeddings (all-MiniLM-L6-v2)
        ↓
  Metadata → MongoDB Atlas
        ↓
  Cleanup temp files
```

## Credentials Status
- [ ] GROQ_API_KEY — Not yet provided (needed for Whisper + LLM)
- [ ] MONGODB_URI — Not yet provided (needed for metadata)
- [x] REDIS_URL — Runs in Docker (redis://redis:6379)
- [x] CHROMA_URL — Runs in Docker (http://chromadb:8000)

---

## Milestone Progress

### Milestone 1: Project Setup & Infrastructure
- **Status**: ✅ Complete (pushed)
- **Commit**: `feat(M1): project setup — React+Vite frontend, Express backend, Docker, CI`

### Milestone 2: Backend Services Layer
- **Status**: ✅ Complete (pushed)
- **Commit**: `feat(M2): backend services — transcript, ChromaDB, Groq, cache, queue, prompts`

### Milestone 3: API Routes, Controllers & Worker
- **Status**: ✅ Complete (pushed)
- **Commit**: `feat(M3): API routes, controllers, BullMQ worker, tests (9/9 passing)`

### Milestone 4: Whisper Pipeline + AI Integration
- **Status**: ✅ Code complete — awaiting credentials for end-to-end test
- **Changes made**:
  - Removed `youtube-transcript` dependency
  - Added: `fluent-ffmpeg`, `ffmpeg-static`, `multer`, `fs-extra`
  - Created: `video-download.service.js` (yt-dlp + ffmpeg)
  - Created: `transcription.service.js` (Groq Whisper with auto-splitting)
  - Created: `chunking.service.js` (semantic chunks with start+end timestamps)
  - Deprecated: `transcript.service.js`
  - Updated: `video.worker.js` (new pipeline)
  - Updated: `video.controller.js` (added uploadVideo handler)
  - Updated: `video.routes.js` (added multer + POST /upload)
  - Updated: `Video.js` model (added 'transcribing' status, optional youtubeUrl)
  - Updated: `Dockerfile` (ffmpeg + yt-dlp installed)
  - Updated: `.env.example` (UPLOAD_DIR, TEMP_DIR)
  - Updated: `TeacherDashboard.jsx` (dual mode: URL + file upload with drag-and-drop)
  - Updated: `api.js` (uploadVideoFile function)
  - Updated: `services.test.js` (11 tests, all passing)
  - Updated: `README.md`

### Tests:
- ✅ Backend: 11/11 passing
- ✅ Frontend build: 2.08s

---

## Credentials Needed
- **GROQ_API_KEY**: [VERIFIED] (used for both Whisper transcription and Llama 3.3 chat)
- **MONGODB_URI**: [VERIFIED]

## Remaining Items
- [ ] Test docker compose up --build
- [ ] End-to-end demo with real YouTube video

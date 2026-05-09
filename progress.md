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
- **Transcription**: yt-dlp + ffmpeg + Groq Whisper (replaces youtube-transcript)
- **Infra**: Docker Compose (frontend, backend, worker, redis, chromadb)
- **Language**: Plain JavaScript (JSX for frontend, JS with ES Modules for backend)

## Architecture (Updated)
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
  Groq Whisper Transcription (with segment timestamps)
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
- [ ] GROQ_API_KEY — Not yet provided (needed for Whisper transcription + LLM)
- [ ] MONGODB_URI — Not yet provided (needed for metadata persistence)
- [x] REDIS_URL — Runs in Docker (redis://redis:6379)
- [x] CHROMA_URL — Runs in Docker (http://chromadb:8000)

---

## Milestone Progress

### Milestone 1-3: Project Setup + Backend Services + API Routes
- **Status**: ✅ Complete
- **Completed**: 2026-05-09T16:45:00+05:30

#### What was implemented:
**Root Config:** .gitignore, .env.example, docker-compose.yml, README.md, CI workflow
**Frontend:** 15+ components — Landing, Teacher Dashboard, Video Page, Analytics, Chat (SSE), Summary, Quiz
**Backend:** Express server, 5 route groups, 5 controllers, 6 services, 3 prompt templates, BullMQ worker
**Tests:** 9/9 passing (chunking, cache, prompts)
**Build:** Frontend builds in 2.06s

---

### Pipeline Change: youtube-transcript → yt-dlp + ffmpeg + Groq Whisper
- **Status**: 📋 Plan approved, implementation pending
- **Reason**: youtube-transcript relies on pre-existing subtitles. Many videos lack captions.
- **New approach**: Download audio → Groq Whisper transcription → works on ANY video.

#### Changes needed:
1. Remove `youtube-transcript` dependency
2. Add: `fluent-ffmpeg`, `ffmpeg-static`, `yt-dlp-wrap`, `multer`, `fs-extra`
3. Create: `video-download.service.js`, `transcription.service.js`, `chunking.service.js`
4. Delete: `transcript.service.js` (old)
5. Update: worker, video controller, video routes, Dockerfile, .env.example
6. Frontend: Add MP4 file upload to Teacher Dashboard

---

### Milestone 4: AI Integration & Testing
- **Status**: ⏳ Pending — Needs GROQ_API_KEY and MONGODB_URI
- **Blocked on**: Pipeline change implementation + credentials

---

## Key Decisions
1. **Whisper over youtube-transcript**: Works on videos without subtitles, supports MP4 uploads
2. ChromaDB's built-in embedding function (all-MiniLM-L6-v2) — no separate embedding API needed
3. shadcn/ui components manually created in JSX
4. Tailwind CSS v4 with @tailwindcss/vite plugin
5. MongoDB Atlas external; Redis + ChromaDB in Docker
6. Audio files split into segments for files >25MB (Groq Whisper limit)

## Remaining Items
- [ ] Implement new transcription pipeline (yt-dlp + ffmpeg + Whisper)
- [ ] Add MP4 upload support (frontend + backend)
- [ ] Update Dockerfile with ffmpeg + yt-dlp
- [ ] Obtain GROQ_API_KEY
- [ ] Obtain MONGODB_URI
- [ ] Test docker compose up --build
- [ ] End-to-end demo with real YouTube video

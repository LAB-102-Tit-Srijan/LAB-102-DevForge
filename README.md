# SherySense â€” AI-Powered Learning Companion

> Turn every coding lecture into an interactive AI tutor.

![License](https://img.shields.io/badge/license-MIT-blue)
![Stack](https://img.shields.io/badge/stack-React%20%7C%20Express%20%7C%20Groq%20%7C%20ChromaDB-purple)

## ðŸŽ¯ Overview

SherySense transforms video lectures into intelligent study sessions. Teachers upload a YouTube URL or an MP4 file, and the system downloads/extracts the audio, transcribes it with Groq Whisper, and stores semantic embeddings in ChromaDB. Students can then ask contextual questions, generate quizzes, create smart summaries, and jump to exact timestamps â€” all powered by AI.

## ðŸ—ï¸ Architecture

```
Teacher Uploads YouTube URL or MP4 File
        â†“
  Express API (+ multer for file uploads)
        â†“
  BullMQ Job Queue
        â†“
  Worker Process
        â†“
  yt-dlp (YouTube) or ffmpeg (MP4) â†’ Audio Extraction
        â†“
  Groq Whisper Transcription (segment timestamps)
        â†“
  Semantic Chunking â†’ ChromaDB Embeddings
        â†“
  Metadata â†’ MongoDB Atlas

Student Query
        â†“
  API â†’ Redis Cache Check
        â†“
  ChromaDB Semantic Search
        â†“
  Groq LLM (Llama 3.3 70B)
        â†“
  Streamed Answer + Timestamps
```

## âœ¨ Features

- **Whisper Transcription** â€” Works on ANY video, even without subtitles
- **Dual Input** â€” YouTube URL or direct MP4 upload
- **Contextual Q&A** â€” RAG-powered answers grounded in lecture content
- **Jump-to-Moment** â€” Clickable timestamps that seek the video player
- **Smart Summaries** â€” Last 5 min, short, normal, or detailed modes
- **Quiz Generation** â€” MCQ & open-ended, topic-specific or conversation-aware
- **Streaming Responses** â€” Real-time token-by-token SSE streaming
- **Session Memory** â€” Conversation history persists across page refreshes
- **Redis Caching** â€” Sub-300ms cached responses
- **Background Processing** â€” BullMQ queue with retry & status tracking
- **Analytics Dashboard** â€” Videos processed, queries, cache hit rate

## ðŸ› ï¸ Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, Vite, Tailwind CSS v4, Framer Motion, Zustand, React Query |
| Backend | Express.js, BullMQ, Zod, Pino, Multer |
| AI | Groq Whisper (transcription), Groq Llama 3.3 70B (LLM), ChromaDB (MiniLM embeddings) |
| Audio | yt-dlp (YouTube download), ffmpeg (audio extraction) |
| Data | MongoDB Atlas, Redis |
| Infra | Docker Compose, GitHub Actions CI |

## ðŸš€ Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)
- MongoDB Atlas account (free tier)
- Groq API key (free at console.groq.com)

### 1. Clone & Configure

```bash
git clone https://github.com/LAB-102-Tit-Srijan/LAB-102-DevForge.git
cd LAB-102-DevForge
cp .env.example .env
# Edit .env with your GROQ_API_KEY and MONGODB_URI
```

### 2. Run with Docker

```bash
docker compose up --build
```

Services:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- ChromaDB: http://localhost:8000
- Redis: localhost:6379

### 3. Local Development (without Docker)

```bash
# Prerequisites: install yt-dlp
pip install yt-dlp

# Terminal 1 â€” Backend
cd backend && npm install && npm run dev

# Terminal 2 â€” Worker
cd backend && npm run worker

# Terminal 3 â€” Frontend
cd frontend && npm install && npm run dev
```

## ðŸŽ¬ Demo Flow

### Teacher
1. Open http://localhost:3000/teacher
2. **Option A**: Paste a YouTube lecture URL â†’ click "Process"
3. **Option B**: Upload an MP4 file â†’ click "Upload & Process"
4. Watch status: queued â†’ processing â†’ transcribing â†’ embedding â†’ ready
5. Redirected to video page when ready

### Student
1. Open video page
2. Ask: "What is useEffect?"
3. Get AI answer with clickable timestamps
4. Click timestamp â†’ video jumps to that moment
5. Generate a summary (short/normal/detailed)
6. Take a quiz and check your score
7. Ask follow-up questions with session memory

## ðŸ“Š Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GROQ_API_KEY` | Groq API key (LLM + Whisper) | Yes |
| `MONGODB_URI` | MongoDB Atlas connection string | Yes |
| `REDIS_URL` | Redis connection URL | No (default: redis://redis:6379) |
| `CHROMA_URL` | ChromaDB URL | No (default: http://chromadb:8000) |
| `PORT` | Backend server port | No (default: 5000) |
| `UPLOAD_DIR` | Directory for uploaded files | No (default: ./uploads) |
| `TEMP_DIR` | Directory for temp audio files | No (default: ./temp) |
| `VITE_API_URL` | Frontend API base URL | No (default: http://localhost:5000) |

## ðŸ”® Future Improvements

- Multi-language transcript support
- PDF/slide upload support
- User authentication & roles
- Learning progress tracking
- Spaced repetition quiz scheduling
- Real-time collaborative study sessions
- Mobile app (React Native)
- Horizontal scaling with Kubernetes

## ðŸ“„ License

MIT
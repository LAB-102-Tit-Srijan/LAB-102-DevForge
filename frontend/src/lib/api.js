import axios from 'axios';

// Axios instance with base URL configuration
// In development, Vite proxy handles /api routes
// In production, VITE_API_URL points to the backend
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Video API ─────────────────────────────────────────────
export const processVideo = (youtubeUrl) =>
  api.post('/api/videos/process', { youtubeUrl });

export const getVideoStatus = (videoId) =>
  api.get(`/api/videos/${videoId}/status`);

export const getVideo = (videoId) =>
  api.get(`/api/videos/${videoId}`);

export const getVideos = () =>
  api.get('/api/videos');

export const deleteVideo = (videoId) =>
  api.delete(`/api/videos/${videoId}`);

// Upload a video file (MP4, etc.)
export const uploadVideoFile = (file) => {
  const formData = new FormData();
  formData.append('video', file);
  return api.post('/api/videos/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300000, // 5 min timeout for large uploads
  });
};

// ── Chat API (uses fetch for SSE streaming) ──────────────
export const sendChatMessage = async (data, onChunk, onDone) => {
  const baseUrl = import.meta.env.VITE_API_URL || '';
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Chat request failed');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') {
          onDone?.();
          return;
        }
        try {
          const parsed = JSON.parse(data);
          onChunk?.(parsed);
        } catch {
          // Non-JSON data, treat as text chunk
          onChunk?.({ token: data });
        }
      }
    }
  }
  onDone?.();
};

// ── Summary API (uses fetch for SSE streaming) ───────────
export const generateSummary = async (data, onChunk, onDone) => {
  const baseUrl = import.meta.env.VITE_API_URL || '';
  const response = await fetch(`${baseUrl}/api/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Summary request failed');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') {
          onDone?.();
          return;
        }
        try {
          const parsed = JSON.parse(data);
          onChunk?.(parsed);
        } catch {
          onChunk?.({ token: data });
        }
      }
    }
  }
  onDone?.();
};

// ── Quiz API ──────────────────────────────────────────────
export const generateQuiz = (data) =>
  api.post('/api/quiz', data);

// ── Analytics API ─────────────────────────────────────────
export const getAnalytics = () =>
  api.get('/api/analytics');

export default api;

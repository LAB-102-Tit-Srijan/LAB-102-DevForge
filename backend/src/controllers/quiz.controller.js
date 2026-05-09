import { z } from 'zod';
import { getAllChunks, searchChunks } from '../services/chroma.service.js';
import { generateQuiz as genQuiz } from '../services/groq.service.js';
import { cacheGet, cacheSet, cacheKey } from '../services/cache.service.js';
import logger from '../utils/logger.js';

const quizSchema = z.object({
  videoId: z.string().min(1),
  type: z.enum(['video', 'topic', 'conversation']).default('video'),
  topic: z.string().optional(),
  history: z.array(z.object({ role: z.string(), content: z.string() })).optional(),
});

export async function generateQuizHandler(req, res) {
  try {
    const { videoId, type, topic, history } = quizSchema.parse(req.body);

    // Check cache (skip for conversation-based quizzes)
    if (type !== 'conversation') {
      const key = cacheKey(videoId, `quiz:${type}:${topic || 'all'}`);
      const cached = await cacheGet(key);
      if (cached) return res.json(cached);
    }

    let chunks;
    if (type === 'topic' && topic) {
      chunks = await searchChunks(videoId, topic, 8);
    } else {
      chunks = await getAllChunks(videoId);
      chunks.sort((a, b) => (a.startSeconds || 0) - (b.startSeconds || 0));
    }

    if (chunks.length === 0) return res.status(404).json({ error: 'No content found' });

    const quiz = await genQuiz(chunks, { topic, type, history });

    // Cache result
    if (type !== 'conversation') {
      const key = cacheKey(videoId, `quiz:${type}:${topic || 'all'}`);
      await cacheSet(key, quiz);
    }

    res.json(quiz);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    logger.error(`Quiz error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
}

import { z } from 'zod';
import { searchChunks } from '../services/chroma.service.js';
import { generateAnswer } from '../services/groq.service.js';
import { cacheGet, cacheSet, cacheKey } from '../services/cache.service.js';
import Analytics from '../models/Analytics.js';
import logger from '../utils/logger.js';

const chatSchema = z.object({
  videoId: z.string().min(1),
  question: z.string().min(1).max(1000),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().default([]),
});

export async function chat(req, res) {
  const startTime = Date.now();
  try {
    const { videoId, question, history } = chatSchema.parse(req.body);

    // Check cache first
    const key = cacheKey(videoId, question);
    const cached = await cacheGet(key);
    if (cached) {
      await Analytics.incrementCacheHits?.().catch(() => {});
      await Analytics.incrementQueries?.(Date.now() - startTime).catch(() => {});
      // Return cached response as SSE
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });
      res.write(`data: ${JSON.stringify({ token: cached.answer })}\n\n`);
      res.write(`data: ${JSON.stringify({ timestamps: cached.timestamps })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    // Semantic search for relevant chunks
    const chunks = await searchChunks(videoId, question, 5);
    if (chunks.length === 0) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });
      res.write(`data: ${JSON.stringify({ token: 'This topic was not covered in this lecture. Try asking about something that was discussed in the video.' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    // Extract timestamps from relevant chunks
    const timestamps = chunks.map((c) => ({
      startSeconds: c.startSeconds,
      endSeconds: c.endSeconds,
      startTimestamp: c.startTimestamp,
    }));

    // Stream LLM response
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    // Send timestamps immediately
    res.write(`data: ${JSON.stringify({ timestamps })}\n\n`);

    const stream = await generateAnswer(chunks, question, history);
    let fullAnswer = '';

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || '';
      if (token) {
        fullAnswer += token;
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      }
    }

    // Cache the answer
    await cacheSet(key, { answer: fullAnswer, timestamps });
    await Analytics.incrementQueries?.(Date.now() - startTime).catch(() => {});

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    logger.error(`Chat error: ${err.message}`);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    } else {
      res.write(`data: ${JSON.stringify({ token: `\n\nError: ${err.message}` })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
}

import { z } from 'zod';
import { getAllChunks } from '../services/chroma.service.js';
import { generateSummary as genSummary } from '../services/groq.service.js';
import { cacheGet, cacheSet, cacheKey } from '../services/cache.service.js';
import logger from '../utils/logger.js';

const summarySchema = z.object({
  videoId: z.string().min(1),
  mode: z.enum(['last5', 'short', 'normal', 'detailed']).default('normal'),
});

export async function generateSummary(req, res) {
  try {
    const { videoId, mode } = summarySchema.parse(req.body);

    // Check cache
    const key = cacheKey(videoId, `summary:${mode}`);
    const cached = await cacheGet(key);
    if (cached) {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
      res.write(`data: ${JSON.stringify({ token: cached.summary })}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    // Get all chunks
    let chunks = await getAllChunks(videoId);
    if (chunks.length === 0) {
      return res.status(404).json({ error: 'No transcript found for this video' });
    }

    // For last5 mode, only use chunks from last 5 minutes
    if (mode === 'last5') {
      const maxEnd = Math.max(...chunks.map(c => c.endSeconds || 0));
      chunks = chunks.filter(c => (c.startSeconds || 0) >= maxEnd - 300);
    }

    // Sort by timestamp
    chunks.sort((a, b) => (a.startSeconds || 0) - (b.startSeconds || 0));

    // Stream response
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });

    const stream = await genSummary(chunks, mode);
    let fullSummary = '';

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || '';
      if (token) {
        fullSummary += token;
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      }
    }

    await cacheSet(key, { summary: fullSummary });
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    logger.error(`Summary error: ${err.message}`);
    if (!res.headersSent) res.status(500).json({ error: err.message });
    else { res.write('data: [DONE]\n\n'); res.end(); }
  }
}

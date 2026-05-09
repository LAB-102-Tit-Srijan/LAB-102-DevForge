import { Worker } from 'bullmq';
import Redis from 'ioredis';
import mongoose from 'mongoose';
import { fetchTranscript, chunkTranscript } from '../services/transcript.service.js';
import { upsertChunks } from '../services/chroma.service.js';
import Video from '../models/Video.js';
import Analytics from '../models/Analytics.js';
import logger from '../utils/logger.js';

/**
 * Video Processing Worker
 *
 * Runs as a separate process consuming BullMQ jobs.
 * Pipeline: Fetch transcript → Chunk → Embed → Store → Update status
 *
 * Scalability: Multiple worker instances can run in parallel
 * to handle increased processing load.
 */

// Connect MongoDB
const mongoUri = process.env.MONGODB_URI;
if (mongoUri) {
  mongoose.connect(mongoUri).then(() => logger.info('Worker: MongoDB connected'));
}

// Redis connection for BullMQ
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const worker = new Worker('video-processing', async (job) => {
  const { videoId, youtubeUrl } = job.data;
  logger.info(`Processing video: ${videoId}`);

  try {
    // Step 1: Update status to processing
    await Video.findOneAndUpdate({ videoId }, { status: 'processing' });
    await job.updateProgress(20);

    // Step 2: Fetch transcript
    logger.info(`Fetching transcript for ${videoId}...`);
    const transcript = await fetchTranscript(videoId);
    await job.updateProgress(40);

    // Step 3: Chunk transcript
    logger.info(`Chunking transcript...`);
    const chunks = chunkTranscript(transcript);
    await job.updateProgress(60);

    // Step 4: Update status to embedding
    await Video.findOneAndUpdate({ videoId }, { status: 'embedding' });

    // Step 5: Store in ChromaDB (embeddings generated server-side)
    logger.info(`Storing ${chunks.length} chunks in ChromaDB...`);
    await upsertChunks(videoId, chunks);
    await job.updateProgress(90);

    // Step 6: Update video record
    const fullTranscript = chunks.map((c) => c.text).join(' ');
    const duration = chunks.length > 0
      ? chunks[chunks.length - 1].endSeconds
      : 0;

    await Video.findOneAndUpdate({ videoId }, {
      status: 'ready',
      transcript: fullTranscript.slice(0, 10000), // Store first 10k chars
      chunkCount: chunks.length,
      duration,
    });

    // Track analytics
    await Analytics.incrementVideos?.().catch(() => {});

    logger.info(`✅ Video ${videoId} processed successfully (${chunks.length} chunks)`);
    return { chunks: chunks.length, duration };

  } catch (err) {
    logger.error(`❌ Video processing failed for ${videoId}: ${err.message}`);
    await Video.findOneAndUpdate({ videoId }, {
      status: 'failed',
      errorMessage: err.message,
    }).catch(() => {});
    throw err;
  }
}, {
  connection,
  concurrency: 2, // Process 2 videos simultaneously
  limiter: { max: 5, duration: 60000 }, // Max 5 jobs per minute
});

worker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed: ${err.message}`);
});

worker.on('error', (err) => {
  logger.error(`Worker error: ${err.message}`);
});

logger.info('🔧 Video processing worker started');

import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import { Worker } from 'bullmq';
import Redis from 'ioredis';
import mongoose from 'mongoose';
import { resolve } from 'path';
import { downloadYoutubeAudio, extractAudio, cleanupTempFiles, getAudioDuration, downloadHttpVideo } from '../services/video-download.service.js';
import { transcribeAudio } from '../services/transcription.service.js';
import { chunkTranscript } from '../services/chunking.service.js';
import { upsertChunks } from '../services/chroma.service.js';
import Video from '../models/Video.js';
import Analytics from '../models/Analytics.js';
import logger from '../utils/logger.js';
import cloudinary from '../config/cloudinary.js';

/**
 * Video Processing Worker
 *
 * Runs as a separate process consuming BullMQ jobs.
 * 
 * Pipeline:
 *   1. Download audio (yt-dlp for YouTube) or extract audio (ffmpeg for uploads)
 *   2. Transcribe with Groq Whisper (auto-splits large files)
 *   3. Chunk transcript into semantic groups
 *   4. Store chunks + embeddings in ChromaDB
 *   5. Update video status in MongoDB
 *   6. Cleanup temporary files
 *
 * Scalability: Multiple worker instances can run in parallel
 * to handle increased processing load. Each worker processes
 * 2 concurrent jobs with rate limiting (5 jobs/min).
 */

// Connect MongoDB
const mongoUri = process.env.MONGODB_URI;
if (mongoUri) {
  mongoose.connect(mongoUri).then(() => logger.info('Worker: MongoDB connected'));
}

// Redis connection for BullMQ
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  retryStrategy: (times) => {
    if (times > 10) {
      logger.warn('⚠️ Redis is unavailable. BullMQ worker cannot process jobs.');
      return null; // Stop retrying after 10 attempts
    }
    return Math.min(times * 200, 3000);
  },
});

connection.on('error', () => {}); // Suppress noisy low-level redis errors

const worker = new Worker('video-processing', async (job) => {
  const { videoId, youtubeUrl, filePath, inputType } = job.data;
  const tempFiles = []; // Track files for cleanup

  logger.info(`Processing video: ${videoId} (type: ${inputType || 'youtube'})`);

  try {
    // ── Step 1: Update status to processing ──────────────
    await Video.findOneAndUpdate({ videoId }, { status: 'processing', processingStatus: 'processing' });
    await job.updateProgress(10);

    // ── Step 1.5: Upload to Cloudinary (if needed) ────────
    let finalCloudinaryUrl = null;
    let finalPublicId = null;

    if (inputType === 'upload' && filePath && !filePath.startsWith('http')) {
      // Resolve to absolute path so Cloudinary SDK can find the file regardless of CWD
      const absoluteFilePath = resolve(process.cwd(), filePath);
      logger.info(`Uploading to Cloudinary (absolute path): ${absoluteFilePath}`);

      // NOTE: upload_large returns a stream when called with a local file path,
      // not a Promise. We must use the explicit callback pattern to get the result.
      const cloudinaryResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_large(
          absoluteFilePath,
          {
            resource_type: 'video',
            folder: 'sherysense/videos',
            chunk_size: 6000000, // 6MB chunks
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
      });

      if (!cloudinaryResult?.secure_url) {
        throw new Error(`Cloudinary upload returned no URL. Result: ${JSON.stringify(cloudinaryResult)}`);
      }

      finalCloudinaryUrl = cloudinaryResult.secure_url;
      finalPublicId = cloudinaryResult.public_id;
      
      // Update DB with Cloudinary info
      await Video.findOneAndUpdate({ videoId }, {
        sourceUrl: finalCloudinaryUrl,
        cloudinaryUrl: finalCloudinaryUrl,
        cloudinaryPublicId: finalPublicId
      });
      logger.info(`✅ Cloudinary upload complete: ${finalCloudinaryUrl}`);
    }

    // ── Step 2: Get audio file ───────────────────────────
    let audioPath;
    if (inputType === 'upload' && filePath) {
      let localVideoPath = filePath;
      // If it's a remote URL (Cloudinary backward compat), download it
      if (filePath.startsWith('http')) {
        logger.info(`Downloading remote Cloudinary video to local temp folder...`);
        localVideoPath = await downloadHttpVideo(filePath);
        tempFiles.push(localVideoPath); 
      }
      logger.info(`Extracting audio from local file: ${localVideoPath}`);
      audioPath = await extractAudio(localVideoPath);
      // We do NOT add the original Cloudinary URL to tempFiles yet.
    } else {
      logger.info(`Downloading audio from YouTube: ${youtubeUrl}`);
      audioPath = await downloadYoutubeAudio(youtubeUrl);
    }
    tempFiles.push(audioPath);
    await job.updateProgress(30);

    // ── Step 3: Transcribe with Groq Whisper ─────────────
    await Video.findOneAndUpdate({ videoId }, { status: 'transcribing', processingStatus: 'transcribing' });
    logger.info('Transcribing audio with Groq Whisper...');
    const segments = await transcribeAudio(audioPath);

    if (!segments || segments.length === 0) {
      throw new Error('Transcription returned no segments');
    }
    logger.info(`Transcription complete: ${segments.length} segments`);
    await job.updateProgress(60);

    // ── Step 4: Chunk transcript ─────────────────────────
    logger.info('Chunking transcript into semantic groups...');
    const chunks = chunkTranscript(segments);
    await job.updateProgress(70);

    // ── Step 5: Store in ChromaDB ────────────────────────
    await Video.findOneAndUpdate({ videoId }, { status: 'embedding', processingStatus: 'embedding' });
    logger.info(`Storing ${chunks.length} chunks in ChromaDB...`);
    await upsertChunks(videoId, chunks);
    await job.updateProgress(90);

    const fullTranscript = chunks.map((c) => c.text).join(' ');
    const duration = chunks.length > 0
      ? chunks[chunks.length - 1].endSeconds
      : 0;

    await Video.findOneAndUpdate({ videoId }, {
      status: 'ready',
      processingStatus: 'ready',
      transcript: fullTranscript.slice(0, 10000), // Store first 10k chars
      chunks: chunks.map(c => ({
        text: c.text,
        startTime: c.startSeconds,
        endTime: c.endSeconds,
        embeddingId: c.chunkId
      })),
      chunkCount: chunks.length,
      duration,
    });

    // Track analytics
    await Analytics.incrementVideos?.().catch(() => {});

    logger.info(`✅ Video ${videoId} processed successfully (${chunks.length} chunks, ${Math.round(duration)}s)`);

    // ── Step 7: Cleanup temporary files ──────────────────
    if (inputType === 'upload' && filePath) {
      tempFiles.push(filePath); // Safe to delete original upload now that it's processed
    }
    await cleanupTempFiles(tempFiles);

    return { chunks: chunks.length, duration, segments: segments.length };

  } catch (err) {
    logger.error(`❌ Video processing failed for ${videoId}: ${err.message}`);
    await Video.findOneAndUpdate({ videoId }, {
      status: 'failed',
      processingStatus: 'failed',
      errorMessage: err.message,
    }).catch(() => {});

    // Cleanup temporary files
    await cleanupTempFiles(tempFiles);
    
    // If it's an upload and this is the final attempt, clean up the original file
    if (inputType === 'upload' && filePath) {
      const maxAttempts = job.opts?.attempts || 1;
      if (job.attemptsMade >= maxAttempts - 1) {
        await cleanupTempFiles([filePath]);
      }
    }

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
  logger.error(`Worker error: ${err.message || err}`);
});

logger.info('🔧 Video processing worker started (yt-dlp + Whisper pipeline)');

import { z } from 'zod';
import path from 'path';
import Video from '../models/Video.js';
import { enqueueVideoProcessing } from '../services/queue.service.js';
import logger from '../utils/logger.js';

const processSchema = z.object({
  youtubeUrl: z.string().url().refine(
    (url) => /youtube\.com\/watch|youtu\.be\/|youtube\.com\/embed/.test(url),
    { message: 'Must be a valid YouTube URL' }
  ),
});

function extractVideoId(url) {
  const patterns = [
    /[?&]v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /embed\/([^?]+)/,
  ];
  for (const p of patterns) {
    const match = url.match(p);
    if (match) return match[1];
  }
  return null;
}

/**
 * Process a YouTube video URL.
 * Downloads audio via yt-dlp, transcribes with Whisper.
 */
export async function processVideo(req, res) {
  try {
    const { youtubeUrl } = processSchema.parse(req.body);
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) return res.status(400).json({ error: 'Could not extract video ID' });

    // Check if already processed
    let video = await Video.findOne({ videoId });
    if (video && video.status === 'ready') {
      return res.json({ videoId, status: 'ready', message: 'Video already processed' });
    }

    // Create or update video record
    if (!video) {
      video = await Video.create({ videoId, youtubeUrl, status: 'queued' });
    } else {
      video.status = 'queued';
      video.errorMessage = '';
      await video.save();
    }

    // Enqueue processing job
    await enqueueVideoProcessing({
      videoId,
      youtubeUrl,
      inputType: 'youtube',
    });
    logger.info(`YouTube video processing enqueued: ${videoId}`);

    res.status(202).json({ videoId, status: 'queued' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    logger.error(`processVideo error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Upload and process an MP4 video file.
 * Extracts audio via ffmpeg, transcribes with Whisper.
 */
export async function uploadVideo(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const file = req.file;
    const videoId = `upload_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const filePath = file.path;

    logger.info(`File uploaded: ${file.originalname} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);

    // Create video record
    const video = await Video.create({
      videoId,
      youtubeUrl: '', // No YouTube URL for uploads
      title: path.parse(file.originalname).name,
      status: 'queued',
    });

    // Enqueue processing job
    await enqueueVideoProcessing({
      videoId,
      filePath,
      inputType: 'upload',
    });

    logger.info(`Uploaded video processing enqueued: ${videoId}`);
    res.status(202).json({ videoId, status: 'queued' });
  } catch (err) {
    logger.error(`uploadVideo error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
}

export async function getVideoStatus(req, res) {
  try {
    const { id } = req.params;
    const video = await Video.findOne({ videoId: id });
    if (!video) return res.status(404).json({ error: 'Video not found' });
    res.json({
      videoId: video.videoId,
      status: video.status,
      title: video.title,
      errorMessage: video.errorMessage,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getVideo(req, res) {
  try {
    const { id } = req.params;
    const video = await Video.findOne({ videoId: id });
    if (!video) return res.status(404).json({ error: 'Video not found' });
    res.json(video);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

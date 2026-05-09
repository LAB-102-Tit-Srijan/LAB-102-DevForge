import { z } from 'zod';
import path from 'path';
import Video from '../models/Video.js';
import { enqueueVideoProcessing } from '../services/queue.service.js';
import { deleteVideoChunks } from '../services/chroma.service.js';
import cloudinary from '../config/cloudinary.js';
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
    if (video && (video.processingStatus === 'ready' || video.status === 'ready')) {
      return res.json({ videoId, status: 'ready', message: 'Video already processed', video });
    }

    // Create or update video record
    if (!video) {
      video = await Video.create({
        videoId,
        sourceType: 'youtube',
        sourceUrl: youtubeUrl,
        youtubeUrl, // backward compatibility
        title: `YouTube Video ${videoId}`,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        processingStatus: 'queued',
        status: 'queued'
      });
    } else {
      video.processingStatus = 'queued';
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

    res.status(202).json({ videoId, status: 'queued', video });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    logger.error(`processVideo error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Upload and process an MP4 video file to Cloudinary.
 */
export async function uploadVideo(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const file = req.file;
    const videoId = `upload_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    
    // Create placeholder video record without Cloudinary URL yet
    const video = await Video.create({
      videoId,
      title: path.parse(file.originalname).name,
      originalFileName: file.originalname,
      sourceType: 'upload',
      processingStatus: 'queued',
      status: 'queued',
    });

    // Enqueue processing job. Pass the local file path.
    // The worker will upload to Cloudinary and extract audio.
    await enqueueVideoProcessing({
      videoId,
      filePath: file.path, 
      inputType: 'upload',
    });

    logger.info(`Uploaded video processing enqueued: ${videoId}`);
    res.status(202).json({ videoId, status: 'queued', video });
  } catch (err) {
    logger.error(`uploadVideo error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
}

/**
 * List all videos, newest first.
 */
export async function getVideos(req, res) {
  try {
    // Exclude heavy fields for the list view
    const videos = await Video.find()
      .sort({ createdAt: -1 })
      .select('-chunks -transcript -__v');
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * Delete a video from MongoDB, Cloudinary, and ChromaDB.
 */
export async function deleteVideo(req, res) {
  try {
    const { id } = req.params;
    const video = await Video.findOne({ videoId: id }).select('videoId cloudinaryPublicId');
    if (!video) return res.status(404).json({ error: 'Video not found' });

    // 1. Delete from Cloudinary
    if (video.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(video.cloudinaryPublicId, { resource_type: 'video' });
      logger.info(`Deleted from Cloudinary: ${video.cloudinaryPublicId}`);
    }

    // 2. Delete embeddings from ChromaDB
    await deleteVideoChunks(video.videoId);

    // 3. Delete from MongoDB
    await Video.deleteOne({ videoId: id });

    res.json({ success: true, message: 'Video deleted successfully' });
  } catch (err) {
    logger.error(`deleteVideo error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
}

export async function getVideoStatus(req, res) {
  try {
    const { id } = req.params;
    const video = await Video.findOne({ videoId: id }).select('videoId status processingStatus title errorMessage');
    if (!video) return res.status(404).json({ error: 'Video not found' });
    res.json({
      videoId: video.videoId,
      status: video.processingStatus || video.status, 
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
    const video = await Video.findOne({ videoId: id }).select('-chunks -transcript -__v');
    if (!video) return res.status(404).json({ error: 'Video not found' });
    res.json(video);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

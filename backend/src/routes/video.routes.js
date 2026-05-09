import { Router } from 'express';
import { processVideo, uploadVideo, getVideoStatus, getVideo, getVideos, deleteVideo } from '../controllers/video.controller.js';
import cloudinaryUpload from '../middleware/cloudinaryUpload.js';

const router = Router();

// ── Routes ────────────────────────────────────────────────
router.post('/process', processVideo);                      // YouTube URL
router.post('/upload', cloudinaryUpload.single('video'), uploadVideo); // Cloudinary upload
router.get('/', getVideos);                                 // List all videos
router.get('/:id/status', getVideoStatus);                  // Get status
router.get('/:id', getVideo);                               // Get single video
router.delete('/:id', deleteVideo);                         // Delete video

export default router;

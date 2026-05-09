import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { processVideo, uploadVideo, getVideoStatus, getVideo } from '../controllers/video.controller.js';

const router = Router();

// ── Multer configuration for video uploads ────────────────
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
await fs.ensureDir(UPLOAD_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.mp3', '.wav'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not supported. Allowed: ${allowedTypes.join(', ')}`));
    }
  },
});

// ── Routes ────────────────────────────────────────────────
router.post('/process', processVideo);                      // YouTube URL
router.post('/upload', upload.single('video'), uploadVideo); // MP4 file upload
router.get('/:id/status', getVideoStatus);
router.get('/:id', getVideo);

export default router;

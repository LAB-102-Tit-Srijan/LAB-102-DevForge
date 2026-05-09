import { Router } from 'express';
import { processVideo, getVideoStatus, getVideo } from '../controllers/video.controller.js';

const router = Router();

router.post('/process', processVideo);
router.get('/:id/status', getVideoStatus);
router.get('/:id', getVideo);

export default router;

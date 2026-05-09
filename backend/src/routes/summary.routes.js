import { Router } from 'express';
import { generateSummary } from '../controllers/summary.controller.js';

const router = Router();
router.post('/', generateSummary);
export default router;

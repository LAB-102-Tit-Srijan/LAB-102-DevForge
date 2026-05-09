import { Router } from 'express';
import { generateQuizHandler } from '../controllers/quiz.controller.js';

const router = Router();
router.post('/', generateQuizHandler);
export default router;

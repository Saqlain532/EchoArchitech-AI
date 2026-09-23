import { Router } from 'express';
import { AIController } from './ai.controller.js';

const router = Router();

router.post('/preview', AIController.previewRoadmap);

export default router;

import { Router } from 'express';
import { GitHubController } from './github.controller.js';

const router = Router();

router.post('/sync/:projectId', GitHubController.syncRepo);
router.get('/status/:projectId', GitHubController.getMonitoringStatus);
router.post('/simulate/:projectId', GitHubController.submitSimulatedCommit);

export default router;

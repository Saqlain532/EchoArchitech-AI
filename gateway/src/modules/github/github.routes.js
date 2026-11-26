import { Router } from 'express';
import { GitHubController } from './github.controller.js';
import { optionalAuth } from '../../middleware/auth.middleware.js';

const router = Router();

router.post('/sync/:projectId', GitHubController.syncRepo);
router.get('/status/:projectId', GitHubController.getMonitoringStatus);
router.get('/green/:projectId', optionalAuth, GitHubController.getGreenInsights);
router.post('/green/:projectId/scan', optionalAuth, GitHubController.scanGreenInsights);
router.post('/simulate/:projectId', GitHubController.submitSimulatedCommit);

export default router;

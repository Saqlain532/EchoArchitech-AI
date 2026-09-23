import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();

// Public endpoints
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/github', AuthController.githubLogin);
router.get('/repos/:username', AuthController.getRepos);

// Protected endpoints
router.get('/me', requireAuth, AuthController.getMe);
router.put('/profile', requireAuth, AuthController.updateProfile);

export default router;

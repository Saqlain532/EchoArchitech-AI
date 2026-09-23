import { Router } from 'express';
import { UserController } from './user.controller.js';

const router = Router();

router.get('/profile', UserController.getProfile);
router.put('/profile', UserController.updateProfile);
router.post('/github', UserController.connectGithub);

export default router;

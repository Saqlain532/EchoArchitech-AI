import { Router } from 'express';
import { ProjectController } from './project.controller.js';
import { optionalAuth, requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();

// Project listing and details: optionalAuth attaches req.user if a valid token is provided
router.get('/', optionalAuth, ProjectController.getAll);
router.post('/', requireAuth, ProjectController.create);
router.get('/:id', optionalAuth, ProjectController.getOne);
router.get('/:id/tasks', optionalAuth, ProjectController.getTasks);
router.post('/:id/connect-repo', requireAuth, ProjectController.connectRepo);
router.delete('/:id', requireAuth, ProjectController.delete);

export default router;

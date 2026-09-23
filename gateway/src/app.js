import express from 'express';
import cors from 'cors';
import { ENV } from './config/env.js';
import { getDbStatus } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import userRoutes from './modules/user/user.routes.js';
import projectRoutes from './modules/project/project.routes.js';
import aiRoutes from './modules/ai/ai.routes.js';
import githubRoutes from './modules/github/github.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import { optionalAuth } from './middleware/auth.middleware.js';

const app = express();

// Cross-Origin Resource Sharing
app.use(
  cors({
    origin: [ENV.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);

// Body parser
app.use(express.json());

// Request logger in dev
if (ENV.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`📡 [${req.method}] ${req.url}`);
    next();
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'gateway',
    timestamp: new Date().toISOString(),
    database: getDbStatus(),
  });
});

// Domain Modular Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/projects', optionalAuth, projectRoutes);
app.use('/api/ai', optionalAuth, aiRoutes);
app.use('/api/github', githubRoutes);

// Centralized Error Handling
app.use(errorHandler);

export default app;

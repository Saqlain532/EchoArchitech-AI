import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from the gateway directory (one level up from src/config)
dotenv.config({ path: path.resolve(__dirname, '../../../gateway/.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config(); // fallback to cwd

export const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || '',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  ENGINE_URL: process.env.ENGINE_URL || 'http://localhost:8000',
  JWT_SECRET: process.env.JWT_SECRET || 'echoarchitect_jwt_super_secret_key_2026_x89a_prod',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
};


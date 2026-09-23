import mongoose from 'mongoose';
import { ENV } from './env.js';

// Disable command buffering so queries fail immediately or fallback if DB is not connected
mongoose.set('bufferCommands', false);

let isConnected = false;

/**
 * Connect to MongoDB Atlas
 */
export async function connectDB() {
  if (!ENV.MONGODB_URI) {
    console.warn('\n⚠️ [Database Notice]: MONGODB_URI is empty in gateway/.env.');
    console.warn('👉 To use live cloud persistence, set your MongoDB Atlas URI in gateway/.env.\n');
    return false;
  }

  if (isConnected) {
    return true;
  }

  try {
    const conn = await mongoose.connect(ENV.MONGODB_URI, {
      dbName: 'echoarchitect',
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    console.log(`\n✅ [MongoDB Atlas Connected]: ${conn.connection.host}`);
    console.log(`📂 [Database Name]: ${conn.connection.name}\n`);
    return true;
  } catch (error) {
    console.warn(`\n⚠️ [MongoDB Atlas Not Reachable]: ${error.message}`);
    console.warn('ℹ️ Gateway running with in-memory store fallback until Atlas is connected.\n');
    return false;
  }
}

mongoose.connection.on('disconnected', () => {
  isConnected = false;
});

mongoose.connection.on('reconnected', () => {
  isConnected = true;
  console.log('✅ [MongoDB Reconnected]');
});

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

export function getDbStatus() {
  return {
    connected: isDbConnected(),
    readyState: mongoose.connection.readyState, // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  };
}

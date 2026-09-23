import app from './app.js';
import { ENV } from './config/env.js';
import { connectDB } from './config/db.js';
import { seedDatabase } from './utils/seed.js';

async function bootstrap() {
  console.log('🚀 Starting EchoArchitech AI API Gateway Service...');

  // Connect to MongoDB Atlas
  const dbConnected = await connectDB();

  if (dbConnected) {
    // Seed initial data if database is empty
    await seedDatabase();
  }

  // Start HTTP Listener
  const server = app.listen(ENV.PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🌐 [API Gateway Service Running]: http://localhost:${ENV.PORT}`);
    console.log(`🔍 [Health Check]: http://localhost:${ENV.PORT}/api/health`);
    console.log(`👤 [User Profile API]: http://localhost:${ENV.PORT}/api/user/profile`);
    console.log(`📁 [Projects API]: http://localhost:${ENV.PORT}/api/projects`);
    console.log(`======================================================\n`);
  });

  // Graceful Shutdown
  const handleShutdown = () => {
    console.log('\n🛑 Shutting down Gateway Service gracefully...');
    server.close(() => {
      console.log('🏁 Server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', handleShutdown);
  process.on('SIGINT', handleShutdown);
}

bootstrap().catch((err) => {
  console.error('Fatal Bootstrap Error:', err);
  process.exit(1);
});

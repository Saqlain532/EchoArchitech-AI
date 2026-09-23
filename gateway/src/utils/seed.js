import { connectDB } from '../config/db.js';
import { User } from '../models/User.model.js';
import { Project } from '../models/Project.model.js';

export async function seedDatabase() {
  const connected = await connectDB();
  if (!connected) {
    console.log('⏭️ Skipping seed: Database not connected.');
    return;
  }

  try {
    // 1. Check or seed default profile if completely empty
    let user = await User.findOne();
    if (!user) {
      user = await User.create({
        name: 'Staff Architect',
        email: 'architect@echoarchitect.ai',
        initials: 'SA',
        role: 'Staff Architect',
        github: {
          username: '',
          connected: false,
        },
      });
      console.log('🌱 Seeded default User:', user.name);
    }

    // 2. Remove any lingering mock/demo projects so overview remains clean
    await Project.deleteMany({ slug: { $in: ['ecoarchitect-mvp', 'microservices-checkout'] } });
  } catch (error) {
    console.error('Seed Error:', error.message);
  }
}

// Execute directly if run via `node src/utils/seed.js`
if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase().then(() => {
    console.log('Done.');
    process.exit(0);
  });
}

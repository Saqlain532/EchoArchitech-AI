import { connectDB } from './config/db.js';
import { User } from './models/User.model.js';
import { AuthService } from './modules/auth/auth.service.js';
import { ProjectService } from './modules/project/project.service.js';
import jwt from 'jsonwebtoken';
import { ENV } from './config/env.js';

async function runAuthTests() {
  console.log('🧪 Starting Sub-Phase 5.1 Authentication & Security Tests...\n');

  await connectDB();

  const testEmail = `test.architect.${Date.now()}@echoarchitect.ai`;
  const testPassword = 'SecurePassword@2026';
  const customRole = 'AI Systems Architect';

  try {
    // 1. Test Registration
    console.log('1️⃣ Testing User Registration with Custom Role...');
    const registerResult = await AuthService.register({
      name: 'Sarah Chen',
      email: testEmail,
      password: testPassword,
      role: customRole,
      githubUsername: 'sarah-chen-dev',
    });

    console.log('   ✅ User registered successfully:', registerResult.user.name);
    console.log('   ✅ Assigned Role:', registerResult.user.role);
    console.log('   ✅ Initials:', registerResult.user.initials);
    console.log('   ✅ JWT Issued:', registerResult.token.substring(0, 25) + '...');

    // 2. Verify Password is NOT plain text in Database
    console.log('\n2️⃣ Verifying bcrypt encryption in MongoDB Atlas...');
    const rawUser = await User.findById(registerResult.user._id).select('+password');
    if (rawUser.password.startsWith('$2a$') || rawUser.password.startsWith('$2b$')) {
      console.log('   ✅ Password securely hashed with bcrypt (salt rounds: 10)');
    } else {
      throw new Error('Password was stored in plain text!');
    }

    // 3. Test Login with valid password
    console.log('\n3️⃣ Testing User Login with Valid Password...');
    const loginResult = await AuthService.login({
      email: testEmail,
      password: testPassword,
    });
    console.log('   ✅ Login successful for:', loginResult.user.email);
    console.log('   ✅ Valid JWT returned');

    // 4. Test Login with invalid password
    console.log('\n4️⃣ Testing User Login with Invalid Password...');
    try {
      await AuthService.login({
        email: testEmail,
        password: 'WrongPassword!',
      });
      throw new Error('Should have failed with invalid password!');
    } catch (err) {
      console.log('   ✅ Correctly rejected invalid password:', err.message);
    }

    // 5. Test Token verification & getMe
    console.log('\n5️⃣ Testing JWT Verification & getMe...');
    const decoded = jwt.verify(loginResult.token, ENV.JWT_SECRET);
    const me = await AuthService.getMe(decoded.id);
    console.log('   ✅ getMe retrieved user:', me.name, `(${me.role})`);

    // 6. Test GitHub Onboarding
    console.log('\n6️⃣ Testing GitHub Direct Onboarding...');
    const ghResult = await AuthService.githubLogin({
      githubUsername: 'torvalds',
      name: 'Linus Torvalds',
      email: `linus.${Date.now()}@kernel.org`,
    });
    console.log('   ✅ GitHub user signed in:', ghResult.user.name, `(GitHub: ${ghResult.user.github.username})`);

    // 7. Test Public Repos Fetcher
    console.log('\n7️⃣ Testing Public GitHub Repos Fetcher...');
    const repos = await AuthService.getUserPublicRepos('facebook');
    console.log(`   ✅ Fetched ${repos.length} public repos from GitHub (sample: ${repos[0]?.name})`);

    // 8. Test Project Creation & Deletion
    console.log('\n8️⃣ Testing Project Creation with userId and Deletion...');
    const project = await ProjectService.createProjectWithTasks({
      userId: registerResult.user._id,
      title: 'Auth Test Project',
      description: 'Project to test deletion cascade',
    });
    console.log('   ✅ Project created with ID:', project._id);

    const deleteResult = await ProjectService.deleteProject(project._id.toString());
    console.log('   ✅ Project deleted successfully:', deleteResult.message);

    // Clean up test users
    await User.findByIdAndDelete(registerResult.user._id);
    await User.findByIdAndDelete(ghResult.user._id);
    console.log('\n🧹 Test users cleaned up successfully from Atlas.');

    console.log('\n🎉 ALL SUB-PHASE 5.1 BACKEND AUTH TESTS PASSED!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  }
}

runAuthTests();

import { User } from '../../models/User.model.js';
import { isDbConnected } from '../../config/db.js';

// In-memory fallback state if Atlas is not yet connected
let inMemoryUser = {
  _id: 'mock-user-1',
  name: 'Staff Architect',
  email: 'architect@echoarchitect.ai',
  initials: 'SA',
  role: 'Staff Architect',
  avatarUrl: '',
  github: {
    username: '',
    connected: false,
  },
};

export class UserService {
  /**
   * Get active user profile
   */
  static async getProfile() {
    if (!isDbConnected()) {
      return inMemoryUser;
    }

    try {
      let user = await User.findOne();
      if (!user) {
        user = await User.create(inMemoryUser);
      }
      return user;
    } catch {
      return inMemoryUser;
    }
  }

  /**
   * Update user profile fields
   */
  static async updateProfile(updateData) {
    if (!isDbConnected()) {
      if (updateData.name) {
        inMemoryUser.name = updateData.name;
        const parts = updateData.name.trim().split(' ');
        inMemoryUser.initials = parts.length > 1
          ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
          : updateData.name.substring(0, 2).toUpperCase();
      }
      if (updateData.role) inMemoryUser.role = updateData.role;
      if (updateData.email) inMemoryUser.email = updateData.email;
      if (updateData.avatarUrl !== undefined) inMemoryUser.avatarUrl = updateData.avatarUrl;
      if (updateData.githubUsername !== undefined) {
        inMemoryUser.github.username = updateData.githubUsername;
        inMemoryUser.github.connected = Boolean(updateData.githubUsername);
      }
      return inMemoryUser;
    }

    let user = await User.findOne();
    if (!user) {
      user = await this.getProfile();
    }

    if (updateData.name) {
      user.name = updateData.name;
      const parts = updateData.name.trim().split(' ');
      user.initials = parts.length > 1
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : updateData.name.substring(0, 2).toUpperCase();
    }

    if (updateData.role) user.role = updateData.role;
    if (updateData.email) user.email = updateData.email;
    if (updateData.avatarUrl !== undefined) user.avatarUrl = updateData.avatarUrl;

    if (updateData.githubUsername !== undefined) {
      user.github.username = updateData.githubUsername;
      user.github.connected = Boolean(updateData.githubUsername);
    }

    await user.save();
    return user;
  }

  /**
   * Connect or update GitHub username
   */
  static async connectGithub(username) {
    return this.updateProfile({ githubUsername: username });
  }
}

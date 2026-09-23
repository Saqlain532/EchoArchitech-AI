import jwt from 'jsonwebtoken';
import { User } from '../../models/User.model.js';
import { ENV } from '../../config/env.js';

export class AuthService {
  /**
   * Issue signed JWT token
   */
  static signToken(user) {
    return jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      ENV.JWT_SECRET,
      {
        expiresIn: ENV.JWT_EXPIRES_IN || '7d',
      }
    );
  }

  /**
   * Register a new user
   */
  static async register({ name, email, password, role, githubUsername }) {
    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      const err = new Error('An account with this email already exists. Please sign in.');
      err.status = 409;
      throw err;
    }

    const userData = {
      name: name?.trim() || 'New Architect',
      email: cleanEmail,
      password,
      role: role?.trim() || 'Lead Cloud Architect',
      github: {
        username: githubUsername?.trim() || '',
        connected: Boolean(githubUsername?.trim()),
      },
    };

    const user = await User.create(userData);
    const token = this.signToken(user);

    // Return sanitized user object
    const cleanUser = user.toObject();
    delete cleanUser.password;

    return { user: cleanUser, token };
  }

  /**
   * Authenticate existing user with email and password
   */
  static async login({ email, password }) {
    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail }).select('+password');

    if (!user) {
      const err = new Error('Invalid email or password.');
      err.status = 401;
      throw err;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const err = new Error('Invalid email or password.');
      err.status = 401;
      throw err;
    }

    const token = this.signToken(user);
    const cleanUser = user.toObject();
    delete cleanUser.password;

    return { user: cleanUser, token };
  }

  /**
   * Sign in or register directly using a public GitHub username
   */
  static async githubLogin({ githubUsername, name, email }) {
    if (!githubUsername) {
      const err = new Error('GitHub username is required.');
      err.status = 400;
      throw err;
    }

    const cleanUsername = githubUsername.trim().toLowerCase();
    const cleanEmail = email ? email.toLowerCase().trim() : `${cleanUsername}@github.echoarchitect.ai`;

    // Check if user already exists with this GitHub username or email
    let user = await User.findOne({
      $or: [
        { 'github.username': new RegExp(`^${cleanUsername}$`, 'i') },
        { email: cleanEmail },
      ],
    });

    if (!user) {
      // Create new user linked to this GitHub identity
      user = await User.create({
        name: name || githubUsername,
        email: cleanEmail,
        role: 'Fullstack Developer',
        avatarUrl: `https://github.com/${cleanUsername}.png`,
        github: {
          username: githubUsername,
          connected: true,
        },
      });
    } else if (!user.github?.connected) {
      user.github = {
        username: githubUsername,
        connected: true,
      };
      await user.save();
    }

    const token = this.signToken(user);
    const cleanUser = user.toObject();
    delete cleanUser.password;

    return { user: cleanUser, token };
  }

  /**
   * Get current authenticated user profile
   */
  static async getMe(userId) {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error('User not found.');
      err.status = 404;
      throw err;
    }
    return user;
  }

  /**
   * Update user profile fields
   */
  static async updateProfile(userId, updateData) {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error('User not found.');
      err.status = 404;
      throw err;
    }

    if (updateData.name) user.name = updateData.name.trim();
    if (updateData.role) user.role = updateData.role.trim();
    if (updateData.avatarUrl !== undefined) user.avatarUrl = updateData.avatarUrl;
    if (updateData.githubUsername !== undefined) {
      user.github.username = updateData.githubUsername.trim();
      user.github.connected = Boolean(updateData.githubUsername.trim());
    }

    await user.save();
    const cleanUser = user.toObject();
    delete cleanUser.password;
    return cleanUser;
  }

  /**
   * Fetch user's public repositories from GitHub API
   */
  static async getUserPublicRepos(githubUsername) {
    if (!githubUsername) return [];

    try {
      const url = `https://api.github.com/users/${encodeURIComponent(githubUsername)}/repos?sort=updated&per_page=30`;
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'EchoArchitech-AI/1.0',
        },
      });

      if (!res.ok) {
        return [];
      }

      const repos = await res.json();
      if (!Array.isArray(repos)) return [];

      return repos.map((r) => ({
        id: r.id,
        name: r.name,
        fullName: r.full_name,
        url: r.html_url,
        description: r.description || '',
        language: r.language || 'Code',
        stars: r.stargazers_count || 0,
        forks: r.forks_count || 0,
        defaultBranch: r.default_branch || 'main',
        updatedAt: r.updated_at,
      }));
    } catch (err) {
      console.warn(`[AuthService]: Failed to fetch public repos for ${githubUsername}:`, err.message);
      return [];
    }
  }
}

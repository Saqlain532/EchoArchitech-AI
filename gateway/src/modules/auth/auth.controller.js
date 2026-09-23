import { AuthService } from './auth.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export class AuthController {
  static async register(req, res) {
    try {
      const { name, email, password, role, githubUsername } = req.body;
      if (!email || !password) {
        return errorResponse(res, 'Email and password are required.', 400);
      }

      if (password.length < 6) {
        return errorResponse(res, 'Password must be at least 6 characters long.', 400);
      }

      const result = await AuthService.register({
        name,
        email,
        password,
        role,
        githubUsername,
      });

      return successResponse(res, result, 'Account registered successfully', 201);
    } catch (err) {
      return errorResponse(res, err);
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return errorResponse(res, 'Email and password are required.', 400);
      }

      const result = await AuthService.login({ email, password });
      return successResponse(res, result, 'Logged in successfully');
    } catch (err) {
      return errorResponse(res, err);
    }
  }

  static async githubLogin(req, res) {
    try {
      const { githubUsername, name, email } = req.body;
      if (!githubUsername) {
        return errorResponse(res, 'GitHub username is required.', 400);
      }

      const result = await AuthService.githubLogin({ githubUsername, name, email });
      return successResponse(res, result, 'Signed in with GitHub successfully');
    } catch (err) {
      return errorResponse(res, err);
    }
  }

  static async getMe(req, res) {
    try {
      const user = await AuthService.getMe(req.user._id);
      return successResponse(res, user, 'User profile retrieved');
    } catch (err) {
      return errorResponse(res, err);
    }
  }

  static async updateProfile(req, res) {
    try {
      const updated = await AuthService.updateProfile(req.user._id, req.body);
      return successResponse(res, updated, 'Profile updated successfully');
    } catch (err) {
      return errorResponse(res, err);
    }
  }

  static async getRepos(req, res) {
    try {
      const { username } = req.params;
      const repos = await AuthService.getUserPublicRepos(username);
      return successResponse(res, repos, `Fetched public repositories for ${username}`);
    } catch (err) {
      return errorResponse(res, err);
    }
  }
}

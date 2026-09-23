import { UserService } from './user.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export class UserController {
  static async getProfile(req, res) {
    try {
      const user = await UserService.getProfile();
      return successResponse(res, user, 'Profile retrieved successfully');
    } catch (err) {
      return errorResponse(res, err);
    }
  }

  static async updateProfile(req, res) {
    try {
      const updatedUser = await UserService.updateProfile(req.body);
      return successResponse(res, updatedUser, 'Profile updated successfully');
    } catch (err) {
      return errorResponse(res, err);
    }
  }

  static async connectGithub(req, res) {
    try {
      const { username } = req.body;
      const updatedUser = await UserService.connectGithub(username);
      return successResponse(res, updatedUser, 'GitHub account connected');
    } catch (err) {
      return errorResponse(res, err);
    }
  }
}

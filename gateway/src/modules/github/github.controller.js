import { GitHubService } from './github.service.js';
import { ProjectService } from '../project/project.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export class GitHubController {
  static async syncRepo(req, res) {
    try {
      const { projectId } = req.params;
      const project = await ProjectService.getProjectByIdOrSlug(projectId);
      if (!project) {
        return errorResponse(res, 'Project not found', 404);
      }

      const syncResult = await GitHubService.syncProjectWithEngine(project._id.toString());
      return successResponse(res, syncResult, 'Repository synced and tasks updated successfully');
    } catch (err) {
      return errorResponse(res, err.message || 'Failed to sync repository with engine', 500);
    }
  }

  static async getMonitoringStatus(req, res) {
    try {
      const { projectId } = req.params;
      const project = await ProjectService.getProjectByIdOrSlug(projectId);
      if (!project) {
        return errorResponse(res, 'Project not found', 404);
      }

      const status = await GitHubService.getEngineProjectStatus(project._id.toString());
      return successResponse(res, status, 'Live monitoring status retrieved');
    } catch (err) {
      return errorResponse(res, err.message || 'Failed to retrieve engine monitoring status', 500);
    }
  }

  static async getGreenInsights(req, res) {
    try {
      const { projectId } = req.params;
      const project = await ProjectService.getProjectByIdOrSlug(projectId);
      if (!project) {
        return errorResponse(res, 'Project not found', 404);
      }

      if (project.userId) {
        const requesterId = req.user?._id ? req.user._id.toString() : null;
        if (!requesterId || project.userId.toString() !== requesterId) {
          return errorResponse(res, 'Project not found', 404);
        }
      }

      const insights = await GitHubService.getGreenInsights(project._id.toString());
      return successResponse(res, insights, 'Green Insights retrieved');
    } catch (err) {
      return errorResponse(res, err.message || 'Failed to retrieve Green Insights', 500);
    }
  }

  static async scanGreenInsights(req, res) {
    try {
      const { projectId } = req.params;
      const project = await ProjectService.getProjectByIdOrSlug(projectId);
      if (!project) {
        return errorResponse(res, 'Project not found', 404);
      }

      if (project.userId) {
        const requesterId = req.user?._id ? req.user._id.toString() : null;
        if (!requesterId || project.userId.toString() !== requesterId) {
          return errorResponse(res, 'Project not found', 404);
        }
      }

      const result = await GitHubService.scanGreenInsights(project._id.toString());
      return successResponse(res, result, 'Green Insights scan completed');
    } catch (err) {
      return errorResponse(res, err.message || 'Failed to scan Green Insights', 500);
    }
  }

  static async submitSimulatedCommit(req, res) {
    try {
      const { projectId } = req.params;
      const { commits } = req.body;

      if (!commits || !Array.isArray(commits) || commits.length === 0) {
        return errorResponse(res, 'Commits array is required', 400);
      }

      const project = await ProjectService.getProjectByIdOrSlug(projectId);
      if (!project) {
        return errorResponse(res, 'Project not found', 404);
      }

      const result = await GitHubService.submitManualCommit(project._id.toString(), commits);
      return successResponse(res, result, 'Commits evaluated and tasks updated');
    } catch (err) {
      return errorResponse(res, err.message || 'Failed to process commits', 500);
    }
  }
}

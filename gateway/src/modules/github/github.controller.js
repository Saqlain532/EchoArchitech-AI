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

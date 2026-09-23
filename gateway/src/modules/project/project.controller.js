import { ProjectService } from './project.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export class ProjectController {
  static async getAll(req, res) {
    try {
      // Isolate projects: return only projects owned by the currently authenticated user
      const userId = req.user?._id || null;
      if (!userId) {
        return successResponse(res, [], 'No projects for unauthenticated session');
      }

      const projects = await ProjectService.getAllProjects(userId);
      return successResponse(res, projects, 'Projects fetched successfully');
    } catch (err) {
      return errorResponse(res, err);
    }
  }

  static async getOne(req, res) {
    try {
      const { id } = req.params;
      const project = await ProjectService.getProjectByIdOrSlug(id);
      if (!project) {
        return errorResponse(res, 'Project not found', 404);
      }

      // Security: verify requester owns this project if project has an owner
      if (project.userId) {
        const requesterId = req.user?._id ? req.user._id.toString() : null;
        if (!requesterId || project.userId.toString() !== requesterId) {
          return errorResponse(res, 'Project not found', 404);
        }
      }

      const [tasks, commits] = await Promise.all([
        ProjectService.getTasks(project._id),
        ProjectService.getCommits(project._id),
      ]);

      return successResponse(
        res,
        {
          ...project,
          tasks,
          commits,
        },
        'Project details retrieved'
      );
    } catch (err) {
      return errorResponse(res, err);
    }
  }

  static async getTasks(req, res) {
    try {
      const { id } = req.params;
      const project = await ProjectService.getProjectByIdOrSlug(id);
      if (!project) {
        return errorResponse(res, 'Project not found', 404);
      }

      if (project.userId) {
        const requesterId = req.user?._id ? req.user._id.toString() : null;
        if (!requesterId || project.userId.toString() !== requesterId) {
          return errorResponse(res, 'Project not found', 404);
        }
      }

      const tasks = await ProjectService.getTasks(project._id);
      return successResponse(res, tasks, 'Tasks retrieved successfully');
    } catch (err) {
      return errorResponse(res, err);
    }
  }

  static async create(req, res) {
    try {
      const { title, description, prompt, architecture, roadmap, repoUrl, tasks } = req.body;
      if (!title) {
        return errorResponse(res, 'Project title is required', 400);
      }

      const userId = req.user?._id || null;
      if (!userId) {
        return errorResponse(res, 'Authentication required to create and own a project', 401);
      }

      // Parse public repo URL if provided
      let repo = { branch: 'main' };
      if (repoUrl && typeof repoUrl === 'string' && repoUrl.trim()) {
        const cleaned = repoUrl.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '');
        const parts = cleaned.split('/');
        if (parts.length >= 2) {
          repo.owner = parts[0];
          repo.name = parts[1];
          repo.fullName = `${parts[0]}/${parts[1]}`;
          repo.url = `https://github.com/${parts[0]}/${parts[1]}`;
        }
      }

      const projectData = {
        userId,
        title,
        description,
        prompt,
        architecture,
        roadmap,
        repo,
        totalDays: roadmap?.totalDays || 14,
        status: repo.fullName ? 'Active Sync' : 'In Progress',
      };

      const tasksList = tasks || roadmap?.tasks || [];
      const created = await ProjectService.createProjectWithTasks(projectData, tasksList);

      return successResponse(res, created, 'Project created and initialized successfully', 201);
    } catch (err) {
      return errorResponse(res, err);
    }
  }

  static async connectRepo(req, res) {
    try {
      const { id } = req.params;
      const project = await ProjectService.getProjectByIdOrSlug(id);
      if (!project) {
        return errorResponse(res, 'Project not found', 404);
      }

      if (project.userId) {
        const requesterId = req.user?._id ? req.user._id.toString() : null;
        if (!requesterId || project.userId.toString() !== requesterId) {
          return errorResponse(res, 'Access denied. You do not own this project.', 403);
        }
      }

      const updatedProject = await ProjectService.connectRepo(project._id, req.body);
      return successResponse(res, updatedProject, 'Repository connected to project');
    } catch (err) {
      return errorResponse(res, err);
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      const project = await ProjectService.getProjectByIdOrSlug(id);
      if (!project) {
        return errorResponse(res, 'Project not found', 404);
      }

      if (project.userId) {
        const requesterId = req.user?._id ? req.user._id.toString() : null;
        if (!requesterId || project.userId.toString() !== requesterId) {
          return errorResponse(res, 'Access denied. You do not have permission to delete this project.', 403);
        }
      }

      const result = await ProjectService.deleteProject(project._id);
      return successResponse(res, result, 'Project deleted successfully');
    } catch (err) {
      return errorResponse(res, err);
    }
  }
}

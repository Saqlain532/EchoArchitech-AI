import { httpClient } from './httpClient';

export const projectApi = {
  /**
   * Get all projects
   */
  async getAllProjects() {
    const res = await httpClient.get('projects');
    return res.data || [];
  },

  /**
   * Get single project by ID or slug (including tasks & commits)
   */
  async getProjectById(id) {
    const res = await httpClient.get(`projects/${id}`);
    return res.data;
  },

  /**
   * Get tasks for a project
   */
  async getProjectTasks(id) {
    const res = await httpClient.get(`projects/${id}/tasks`);
    return res.data || [];
  },

  /**
   * Create a new project with tasks
   */
  async createProject(projectData) {
    const res = await httpClient.post('projects', projectData);
    return res.data;
  },

  /**
   * Connect public repository to an existing project
   */
  async connectRepo(id, repoData) {
    const res = await httpClient.post(`projects/${id}/connect-repo`, repoData);
    return res.data;
  },

  /**
   * Delete project and its tasks/commits
   */
  async deleteProject(id) {
    const res = await httpClient.delete(`projects/${id}`);
    return res.data;
  },
};


import { httpClient } from './httpClient';

export const githubApi = {
  /**
   * Trigger immediate repository sync and task diff evaluation
   */
  async syncProject(projectId) {
    const res = await httpClient.post(`github/sync/${projectId}`);
    return res.data;
  },

  /**
   * Get live monitoring and sprint status
   */
  async getMonitoringStatus(projectId) {
    const res = await httpClient.get(`github/status/${projectId}`);
    return res.data;
  },

  /**
   * Get recent static Green analysis reports for a project
   */
  async getGreenInsights(projectId) {
    const res = await httpClient.get(`github/green/${projectId}`);
    return res.data;
  },

  /**
   * Re-scan source files from recent commits without syncing task diffs
   */
  async scanGreenInsights(projectId) {
    const res = await httpClient.post(`github/green/${projectId}/scan`);
    return res.data;
  },

  /**
   * Submit simulated commits for testing diff matching
   */
  async simulateCommits(projectId, commits) {
    const res = await httpClient.post(`github/simulate/${projectId}`, { commits });
    return res.data;
  },
};

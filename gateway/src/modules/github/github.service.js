import { ENV } from '../../config/env.js';

export class GitHubService {
  /**
   * Triggers the Python Engine to poll public GitHub commits and evaluate task diffs
   */
  static async syncProjectWithEngine(projectId) {
    const engineUrl = ENV.ENGINE_URL || 'http://localhost:8000';
    try {
      const response = await fetch(`${engineUrl}/api/sync/${projectId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Engine returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (err) {
      console.warn(`⚠️ [GitHub Service]: Could not sync via Python Engine (${err.message}).`);
      throw err;
    }
  }

  /**
   * Retrieves live project monitoring status from Python Engine
   */
  static async getEngineProjectStatus(projectId) {
    const engineUrl = ENV.ENGINE_URL || 'http://localhost:8000';
    try {
      const response = await fetch(`${engineUrl}/api/project/${projectId}/status`);
      if (!response.ok) {
        throw new Error(`Engine returned status ${response.status}`);
      }
      const data = await response.json();
      return data.data;
    } catch (err) {
      console.warn(`⚠️ [GitHub Service]: Could not fetch status from Engine (${err.message})`);
      throw err;
    }
  }

  /**
   * Submit manual / simulated commit for testing
   */
  static async submitManualCommit(projectId, commits) {
    const engineUrl = ENV.ENGINE_URL || 'http://localhost:8000';
    const response = await fetch(`${engineUrl}/api/sync/manual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ projectId, commits }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Engine returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.data;
  }
}

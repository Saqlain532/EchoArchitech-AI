import { httpClient } from './httpClient';

export const authApi = {
  /**
   * Log in with email and password
   */
  async login(credentials) {
    const res = await httpClient.post('auth/login', credentials);
    return res.data;
  },

  /**
   * Register new user account
   */
  async register(userData) {
    const res = await httpClient.post('auth/register', userData);
    return res.data;
  },

  /**
   * Direct login / sign-up with public GitHub username
   */
  async loginWithGithub(payload) {
    const res = await httpClient.post('auth/github', payload);
    return res.data;
  },

  /**
   * Fetch current authenticated user profile
   */
  async getMe() {
    const res = await httpClient.get('auth/me');
    return res.data;
  },

  /**
   * Update profile fields
   */
  async updateProfile(updates) {
    const res = await httpClient.put('auth/profile', updates);
    return res.data;
  },

  /**
   * Fetch public repositories for a GitHub username
   */
  async fetchUserRepos(username) {
    if (!username) return [];
    try {
      const res = await httpClient.get(`auth/repos/${encodeURIComponent(username)}`);
      return res.data || [];
    } catch {
      // Fallback: direct public GitHub API fetch from client
      try {
        const ghRes = await fetch(
          `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=30`
        );
        if (!ghRes.ok) return [];
        const data = await ghRes.json();
        return Array.isArray(data)
          ? data.map((r) => ({
              id: r.id,
              name: r.name,
              fullName: r.full_name,
              url: r.html_url,
              description: r.description || '',
              language: r.language || 'Code',
              stars: r.stargazers_count || 0,
              defaultBranch: r.default_branch || 'main',
              updatedAt: r.updated_at,
            }))
          : [];
      } catch {
        return [];
      }
    }
  },
};

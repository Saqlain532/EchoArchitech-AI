import { httpClient } from './httpClient';

export const userApi = {
  /**
   * Get user profile
   */
  async getProfile() {
    const res = await httpClient.get('user/profile');
    return res.data;
  },

  /**
   * Update user profile
   */
  async updateProfile(profileData) {
    const res = await httpClient.put('user/profile', profileData);
    return res.data;
  },

  /**
   * Connect GitHub account
   */
  async connectGitHub(githubData) {
    const res = await httpClient.post('user/github', githubData);
    return res.data;
  },
};

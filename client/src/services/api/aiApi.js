import { httpClient } from './httpClient';

export const aiApi = {
  /**
   * Request multi-model AI synthesis of architecture & roadmap
   * @param {Object} payload { prompt: string, options?: { totalDays?: number } }
   */
  async previewRoadmap(payload) {
    const res = await httpClient.post('ai/preview', payload);
    return res.data;
  },
};

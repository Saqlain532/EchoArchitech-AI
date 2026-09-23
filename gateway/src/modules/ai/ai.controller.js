import { AIService } from './ai.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export class AIController {
  /**
   * Synthesize Architecture Blueprint & Roadmap for preview
   * POST /api/ai/preview
   */
  static async previewRoadmap(req, res) {
    try {
      const { prompt, options } = req.body;
      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return errorResponse(res, 'Prompt is required to synthesize architecture', 400);
      }

      const blueprint = await AIService.generateArchitectureAndRoadmap(prompt.trim(), options || {});
      return successResponse(res, blueprint, 'Architecture and roadmap synthesized successfully');
    } catch (err) {
      return errorResponse(res, err);
    }
  }
}

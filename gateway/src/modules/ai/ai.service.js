import { ENV } from '../../config/env.js';
import { buildArchitecturePrompt } from './prompts/architecture.prompt.js';

export class AIService {
  /**
   * Primary entry point: Generate Architecture & Sprint Roadmap
   */
  static async generateArchitectureAndRoadmap(userPrompt, options = {}) {
    const prompt = buildArchitecturePrompt(userPrompt, options);

    // 1. Try Gemini Free models in sequence
    const geminiModels = ['gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-pro-latest'];
    if (ENV.GEMINI_API_KEY) {
      for (const model of geminiModels) {
        try {
          console.log(`🤖 [AI Engine]: Attempting synthesis with Gemini model: ${model}...`);
          const result = await this.callGemini(model, prompt);
          if (result) {
            console.log(`✨ [AI Engine]: Synthesis succeeded with ${model}!`);
            return this.validateAndFormat(result, userPrompt, options);
          }
        } catch (err) {
          console.warn(`⚠️ [AI Engine]: ${model} failed (${err.message}). Trying fallback...`);
        }
      }
    }

    // 2. Try Groq Free tier
    if (ENV.GROQ_API_KEY) {
      try {
        console.log('🤖 [AI Engine]: Attempting synthesis with Groq (openai/gpt-oss-120b)...');
        const result = await this.callGroq(prompt);
        if (result) {
          console.log('✨ [AI Engine]: Synthesis succeeded with Groq!');
          return this.validateAndFormat(result, userPrompt, options);
        }
      } catch (err) {
        console.warn(`⚠️ [AI Engine]: Groq failed (${err.message}). Trying deterministic fallback...`);
      }
    }

    // 3. Resilient Deterministic Fallback Generator
    console.log('⚙️ [AI Engine]: Using intelligent deterministic architectural synthesizer...');
    return this.generateDeterministicFallback(userPrompt, options);
  }

  /**
   * Call Google Gemini API
   */
  static async callGemini(modelName, promptText) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${ENV.GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('Empty response from Gemini');

    return JSON.parse(this.cleanJsonString(rawText));
  }

  /**
   * Call Groq Cloud API
   */
  static async callGroq(promptText) {
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ENV.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [{ role: 'user', content: promptText }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content;
    if (!rawText) throw new Error('Empty response from Groq');

    return JSON.parse(this.cleanJsonString(rawText));
  }

  /**
   * Strip markdown backticks if present
   */
  static cleanJsonString(str) {
    return str
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
  }

  /**
   * Ensure generated payload strictly satisfies project requirements
   */
  static validateAndFormat(payload, userPrompt, options) {
    const totalDays = options.totalDays || payload.roadmap?.totalDays || 14;

    const validated = {
      title: payload.title || 'Modular System Architecture',
      description: payload.description || userPrompt,
      architecture: {
        techStack: {
          frontend: payload.architecture?.techStack?.frontend || 'React + TailwindCSS',
          backend: payload.architecture?.techStack?.backend || 'Node.js Express / Python',
          database: payload.architecture?.techStack?.database || 'MongoDB Atlas',
        },
        mermaidDiagram:
          payload.architecture?.mermaidDiagram ||
          `graph TD\n    Client["Web Client"] --> Gateway["API Gateway"]\n    Gateway --> CoreService["Core Application Service"]\n    CoreService --> DB[("MongoDB Atlas")]`,
        components: payload.architecture?.components || [
          { name: 'API Gateway', type: 'backend', description: 'Central routing and auth proxy' },
          { name: 'Core Service', type: 'service', description: 'Business logic execution' },
          { name: 'Primary Database', type: 'database', description: 'Data storage' },
        ],
        scaffoldTree: payload.architecture?.scaffoldTree || [
          'src/index.js',
          'src/routes/api.js',
          'src/models/schema.js',
          'package.json',
          'README.md',
        ],
      },
      roadmap: {
        totalDays,
        mermaidGantt:
          payload.roadmap?.mermaidGantt ||
          `gantt\n    title Sprint Execution Timeline\n    dateFormat YYYY-MM-DD\n    section Foundation\n    Architecture Setup :active, d1, 2026-10-01, 3d\n    section Core Implementation\n    API Development :d2, 2026-10-04, 5d`,
        tasks: Array.isArray(payload.roadmap?.tasks) && payload.roadmap.tasks.length > 0
          ? payload.roadmap.tasks.map((t, i) => ({
            dayNumber: t.dayNumber || i + 1,
            title: t.title || `Day ${i + 1} Implementation Task`,
            description: t.description || 'Implement target file specifications and unit tests.',
            estimate: t.estimate || '2.5h',
            targetFiles: Array.isArray(t.targetFiles) && t.targetFiles.length > 0
              ? t.targetFiles
              : ['src/services/core.js'],
          }))
          : this.generateDefaultTasks(totalDays, userPrompt),
      },
    };

    return validated;
  }

  /**
   * Generate robust architecture & roadmap if offline or APIs limit
   */
  static generateDeterministicFallback(prompt, options = {}) {
    const totalDays = options.totalDays || 14;
    const lower = prompt.toLowerCase();

    const isPython = lower.includes('python') || lower.includes('fastapi') || lower.includes('django');
    const isEcom = lower.includes('e-commerce') || lower.includes('cart') || lower.includes('shop');

    const title = isEcom
      ? 'Headless Commerce Architecture'
      : isPython
        ? 'FastAPI Real-Time Telemetry Engine'
        : 'Modern Microservice Application Suite';

    const techStack = {
      frontend: lower.includes('next') ? 'Next.js 15 App Router' : 'React 19 + TailwindCSS',
      backend: isPython ? 'Python FastAPI' : 'Node.js Express Gateway',
      database: lower.includes('postgres') ? 'PostgreSQL' : 'MongoDB Atlas + Redis',
    };

    const mermaidDiagram = `graph TD
    Client["Client Interface"] --> Gateway["${techStack.backend}"]
    Gateway --> AuthService["Authentication Service"]
    Gateway --> CoreAPI["Core Domain Engine"]
    CoreAPI --> DB[("${techStack.database}")]
    CoreAPI --> Cache[("Redis Cache")]`;

    const mermaidGantt = `gantt
    title ${title} Sprint Roadmap
    dateFormat YYYY-MM-DD
    section Phase 1: Foundation
    System Architecture & Models :active, d1, 2026-10-01, 3d
    section Phase 2: Core Services
    API Routes & Data Access    :d2, 2026-10-04, 4d
    section Phase 3: Integration
    GitHub Sync & Production E2E:d3, 2026-10-08, 5d`;

    const tasks = this.generateDefaultTasks(totalDays, prompt);

    return {
      title,
      description: `Production-ready modular architecture synthesized for "${prompt}". Features isolated service layers, scalable database schemas, and daily test-driven tasks.`,
      architecture: {
        techStack,
        mermaidDiagram,
        components: [
          { name: 'Client Portal', type: 'frontend', description: 'Responsive web application' },
          { name: 'API Gateway', type: 'backend', description: 'Centralized route authorization and proxying' },
          { name: 'Core Engine', type: 'service', description: 'Domain business logic and data processing' },
          { name: 'Primary Store', type: 'database', description: 'Cloud persistence store' },
        ],
        scaffoldTree: [
          'src/server.js',
          'src/config/db.js',
          'src/modules/core/core.routes.js',
          'src/modules/core/core.service.js',
          'src/models/schema.js',
          'package.json',
          'README.md',
        ],
      },
      roadmap: {
        totalDays,
        mermaidGantt,
        tasks,
      },
    };
  }

  static generateDefaultTasks(totalDays, prompt) {
    const tasks = [];
    const stepCount = Math.min(totalDays, 10);

    const taskTemplates = [
      {
        title: 'Project Architecture & Schema Initialization',
        desc: 'Scaffold file tree, configure database connections, and initialize data models.',
        files: ['src/config/db.js', 'src/models/core.model.js'],
      },
      {
        title: 'Authentication & Session Token Middleware',
        desc: 'Implement JWT authentication, authorization guards, and security headers.',
        files: ['src/middleware/auth.js', 'src/routes/auth.routes.js'],
      },
      {
        title: 'Core Domain Controller & Service Layer',
        desc: 'Implement primary CRUD endpoints and business logic handling user requirements.',
        files: ['src/controllers/core.controller.js', 'src/services/core.service.js'],
      },
      {
        title: 'Cache Layer & Query Optimization',
        desc: 'Introduce Redis memory caching and optimize database indexing for frequent queries.',
        files: ['src/config/redis.js', 'src/services/cache.service.js'],
      },
      {
        title: 'Validation & Error Handling Pipeline',
        desc: 'Add schema validation middleware and centralized standard error response handlers.',
        files: ['src/middleware/validate.js', 'src/middleware/errorHandler.js'],
      },
      {
        title: 'End-to-End Test Suite & Mock Fixtures',
        desc: 'Write integration test specs and automated test suites for primary user flows.',
        files: ['tests/integration/api.test.js', 'tests/fixtures/mockData.json'],
      },
      {
        title: 'Continuous Integration & GitHub Actions Workflow',
        desc: 'Configure automated test runner, linting, and build verification on push events.',
        files: ['.github/workflows/ci.yml', 'Dockerfile'],
      },
      {
        title: 'Production Scaffolding & Health Telemetry',
        desc: 'Finalize environment variable documentation, health check endpoints, and README.',
        files: ['README.md', 'src/routes/health.routes.js'],
      },
    ];

    for (let i = 0; i < stepCount; i++) {
      const template = taskTemplates[i % taskTemplates.length];
      tasks.push({
        dayNumber: i + 1,
        title: template.title,
        description: template.desc,
        estimate: `${2 + (i % 3) * 0.5}h`,
        targetFiles: template.files,
      });
    }

    return tasks;
  }
}

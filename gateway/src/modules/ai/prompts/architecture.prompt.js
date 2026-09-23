/**
 * Architecture & Roadmap Generation Prompt Template
 */

export function buildArchitecturePrompt(userPrompt, options = {}) {
  const totalDays = options.totalDays || 14;

  return `You are a Principal Software & Systems Architect.
Analyze the following user application requirement and synthesize a comprehensive technical architecture blueprint and daily sprint roadmap.

USER REQUIREMENT:
"${userPrompt}"

SPECIFICATIONS:
- Total Sprint Duration: ${totalDays} Days
- Deliver a production-grade system architecture and daily coding task breakdown.
- Ensure targetFiles for each task are concrete file paths that a developer would create or edit (e.g. "src/routes/auth.js", "src/models/user.js", "config/db.js").
- Ensure mermaidDiagram is valid Mermaid.js flowchart syntax (e.g. starting with "graph TD\\n").
- Ensure mermaidGantt is valid Mermaid.js Gantt chart syntax (e.g. starting with "gantt\\n    title Sprint Timeline\\n").

You MUST return a valid JSON object strictly matching this schema:
{
  "title": "Concise Project Title (3-5 words)",
  "description": "Clear 2-3 sentence technical overview of the system architecture and purpose.",
  "architecture": {
    "techStack": {
      "frontend": "Frontend framework and styling (e.g. React 19 + TailwindCSS)",
      "backend": "Backend framework and runtime (e.g. Node.js Express Gateway / FastAPI)",
      "database": "Primary database and caching (e.g. MongoDB Atlas + Redis)"
    },
    "mermaidDiagram": "graph TD\\n    Client[\\"Web Client\\"] --> API[\\"API Gateway\\"]\\n    API --> DB[(\\"MongoDB Atlas\\")]",
    "components": [
      {
        "name": "Component Name",
        "type": "frontend | backend | database | cache | worker",
        "description": "Brief role of this component"
      }
    ],
    "scaffoldTree": [
      "src/index.js",
      "src/routes/auth.js",
      "src/controllers/auth.controller.js",
      "src/models/user.model.js",
      "config/db.js",
      "package.json",
      "README.md"
    ]
  },
  "roadmap": {
    "totalDays": ${totalDays},
    "mermaidGantt": "gantt\\n    title Sprint Roadmap\\n    dateFormat YYYY-MM-DD\\n    section Phase 1\\n    Core Architecture :active, d1, 2026-10-01, 3d\\n    section Phase 2\\n    API Implementation :d2, 2026-10-04, 4d",
    "tasks": [
      {
        "dayNumber": 1,
        "title": "Task title",
        "description": "Detailed explanation of what coding work must be done",
        "estimate": "2h",
        "targetFiles": [
          "src/routes/auth.js",
          "src/models/user.model.js"
        ]
      }
    ]
  }
}

Do not wrap in markdown quotes if possible, output pure JSON.`;
}

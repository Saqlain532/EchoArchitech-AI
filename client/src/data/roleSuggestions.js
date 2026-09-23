/**
 * Curated template blueprints categorized by user role.
 * Displayed on the Homepage for new users with 0 projects,
 * and as recommendations for returning users.
 */

export const ROLE_SUGGESTIONS = {
  'Lead Cloud Architect': [
    {
      id: 'arch-event-microservices',
      title: 'Distributed Event-Driven Microservices Suite',
      description: 'Decoupled domain services with Kafka message streams, Redis cache cluster, and resilient circuit breakers.',
      techStack: {
        frontend: 'React 19 + TailwindCSS',
        backend: 'Node.js Express + Kafka',
        database: 'MongoDB Atlas + Redis',
      },
      duration: '14-Day Sprint',
      prompt: 'Distributed event-driven microservices architecture with Kafka event bus, Redis edge cache, MongoDB Atlas persistence, and resilient circuit breakers.',
      badge: 'Architecture Archetype',
    },
    {
      id: 'arch-multi-tenant-gateway',
      title: 'Multi-Tenant Cloud API Gateway',
      description: 'High-availability reverse proxy with rate-limiting, JWT tenancy isolation, and telemetry aggregation.',
      techStack: {
        frontend: 'Next.js 15 Admin Console',
        backend: 'Express Gateway + Go Workers',
        database: 'PostgreSQL + Redis',
      },
      duration: '21-Day Sprint',
      prompt: 'High-availability multi-tenant API gateway with JWT tenant isolation, distributed rate-limiting via Redis, and PostgreSQL analytics.',
      badge: 'Enterprise Pattern',
    },
  ],

  'Senior Backend Engineer': [
    {
      id: 'be-telemetry-engine',
      title: 'High-Throughput Telemetry Ingestion Engine',
      description: 'Real-time sensor telemetry ingestion pipeline with streaming WebSockets and time-series analytical storage.',
      techStack: {
        frontend: 'React 19 Telemetry Dashboard',
        backend: 'FastAPI Async Python',
        database: 'TimescaleDB / PostgreSQL',
      },
      duration: '14-Day Sprint',
      prompt: 'FastAPI async real-time telemetry ingestion engine with TimescaleDB time-series storage, WebSocket live streams, and background worker queue.',
      badge: 'High Concurrency',
    },
    {
      id: 'be-grpc-microservices',
      title: 'High-Concurrency gRPC Microservices Suite',
      description: 'Protocol Buffers inter-service RPC communication with automated protobuf generation and distributed tracing.',
      techStack: {
        frontend: 'React 19 Dev Tools',
        backend: 'Go / Python gRPC Services',
        database: 'PostgreSQL + Redis',
      },
      duration: '21-Day Sprint',
      prompt: 'Microservices architecture communicating via gRPC and Protocol Buffers with distributed OpenTelemetry tracing and PostgreSQL storage.',
      badge: 'Microservices',
    },
  ],

  'Fullstack Developer': [
    {
      id: 'fs-nextjs-saas',
      title: 'Modern Next.js 15 Fullstack SaaS Starter',
      description: 'App router architecture with server actions, TailwindCSS v4, Stripe billing, and database migrations.',
      techStack: {
        frontend: 'Next.js 15 App Router',
        backend: 'Next.js Server Actions',
        database: 'PostgreSQL + Prisma',
      },
      duration: '14-Day Sprint',
      prompt: 'Fullstack Next.js 15 SaaS application with React Server Components, server actions, PostgreSQL with Prisma ORM, Stripe billing, and TailwindCSS.',
      badge: 'Fullstack Starter',
    },
    {
      id: 'fs-realtime-collab',
      title: 'React 19 Real-Time Collaborative Canvas',
      description: 'Live multi-user collaborative workspace with operational transform, CRDTs, and presence indicators.',
      techStack: {
        frontend: 'React 19 + Canvas API',
        backend: 'Node.js WebSockets',
        database: 'MongoDB Atlas',
      },
      duration: '14-Day Sprint',
      prompt: 'Real-time collaborative workspace with React 19, HTML5 canvas, WebSocket live cursor presence, and MongoDB Atlas persistence.',
      badge: 'Real-Time App',
    },
  ],

  'DevOps & Platform Lead': [
    {
      id: 'devops-gitops-controller',
      title: 'Kubernetes GitOps Infrastructure Controller',
      description: 'Declarative GitOps cluster configuration sync with automated canary rollouts and health probes.',
      techStack: {
        frontend: 'React 19 Cluster Console',
        backend: 'Go Operator + Helm',
        database: 'PostgreSQL',
      },
      duration: '21-Day Sprint',
      prompt: 'Kubernetes GitOps infrastructure controller with automated Helm release verification, Prometheus telemetry, and GitHub Actions CI/CD.',
      badge: 'Infrastructure',
    },
  ],

  'Default': [
    {
      id: 'default-modular-api',
      title: 'Modular Fullstack Microservice Suite',
      description: 'Clean layered architecture with Express API gateway, React 19 visualizer, and MongoDB Atlas cloud database.',
      techStack: {
        frontend: 'React 19 + TailwindCSS',
        backend: 'Node.js Express + Python Engine',
        database: 'MongoDB Atlas',
      },
      duration: '14-Day Sprint',
      prompt: 'Modular fullstack application with Express API gateway, Python diff analysis microservice, React 19 frontend, and MongoDB Atlas persistence.',
      badge: 'Recommended Blueprint',
    },
    {
      id: 'default-headless-commerce',
      title: 'Headless E-Commerce Architecture Suite',
      description: 'Decoupled storefront with high-performance product catalog, shopping cart sessions, and checkout pipelines.',
      techStack: {
        frontend: 'Next.js 15 Storefront',
        backend: 'Node.js Express Services',
        database: 'PostgreSQL + Redis Cache',
      },
      duration: '21-Day Sprint',
      prompt: 'Headless e-commerce platform with Redis session cart cache, PostgreSQL relational catalog, and modern checkout pipelines.',
      badge: 'E-Commerce',
    },
  ],
};

/**
 * Get suggestions matching a specific user role, or fallback to Default
 */
export function getSuggestionsForRole(role) {
  if (!role) return ROLE_SUGGESTIONS['Default'];

  // Check direct match
  if (ROLE_SUGGESTIONS[role]) {
    return ROLE_SUGGESTIONS[role];
  }

  // Check keyword matches
  const lowerRole = role.toLowerCase();
  if (lowerRole.includes('architect')) {
    return ROLE_SUGGESTIONS['Lead Cloud Architect'];
  }
  if (lowerRole.includes('backend') || lowerRole.includes('python') || lowerRole.includes('go') || lowerRole.includes('data')) {
    return ROLE_SUGGESTIONS['Senior Backend Engineer'];
  }
  if (lowerRole.includes('fullstack') || lowerRole.includes('frontend') || lowerRole.includes('react') || lowerRole.includes('web')) {
    return ROLE_SUGGESTIONS['Fullstack Developer'];
  }
  if (lowerRole.includes('devops') || lowerRole.includes('platform') || lowerRole.includes('sre') || lowerRole.includes('cloud')) {
    return ROLE_SUGGESTIONS['DevOps & Platform Lead'];
  }

  return ROLE_SUGGESTIONS['Default'];
}

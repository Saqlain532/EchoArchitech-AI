import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    prompt: {
      type: String,
      default: '',
    },
    architecture: {
      techStack: {
        frontend: { type: String, default: '' },
        backend: { type: String, default: '' },
        database: { type: String, default: '' },
      },
      mermaidDiagram: {
        type: String,
        default: '',
      },
      components: [
        {
          name: { type: String, required: true },
          type: { type: String, default: 'service' },
          description: { type: String, default: '' },
        },
      ],
      scaffoldTree: [
        {
          type: String,
        },
      ],
    },
    roadmap: {
      mermaidGantt: {
        type: String,
        default: '',
      },
      totalDays: {
        type: Number,
        default: 14,
      },
    },
    repo: {
      owner: { type: String, default: '' },
      name: { type: String, default: '' },
      fullName: { type: String, default: '' },
      branch: { type: String, default: 'main' },
      url: { type: String, default: '' },
      lastSync: { type: Date, default: Date.now },
    },
    currentDay: {
      type: Number,
      default: 1,
    },
    totalDays: {
      type: Number,
      default: 14,
    },
    status: {
      type: String,
      enum: ['Draft', 'In Progress', 'Active Sync', 'Completed'],
      default: 'In Progress',
    },
  },
  {
    timestamps: true,
  }
);

export const Project = mongoose.model('Project', ProjectSchema);

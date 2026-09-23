import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    dayNumber: {
      type: Number,
      required: true,
      index: true,
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
    estimate: {
      type: String,
      default: '2h',
    },
    targetFiles: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed'],
      default: 'Pending',
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    linkedCommits: [
      {
        hash: { type: String },
        message: { type: String },
        author: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Task = mongoose.model('Task', TaskSchema);

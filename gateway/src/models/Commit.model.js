import mongoose from 'mongoose';

const CommitSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    hash: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    fullHash: {
      type: String,
      default: '',
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      default: 'developer',
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    filesChanged: {
      type: Number,
      default: 1,
    },
    modifiedFiles: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate commits per project
CommitSchema.index({ projectId: 1, hash: 1 }, { unique: true });

export const Commit = mongoose.model('Commit', CommitSchema);

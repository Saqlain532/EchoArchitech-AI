import React from 'react';
import { GitCommitIcon } from '../../assets/icons';

/**
 * CommitItem Component
 * Single commit item representation in the sync feed.
 * Uses .theme-text-brand for commit hash and .theme-text-muted for timestamp.
 */
export default function CommitItem({
  hash = '7f8a92b',
  message = 'feat(routing): integrate carbon intensity threshold API',
  author = 'alex.dev',
  timestamp = '12m ago',
  filesChanged = 3,
}) {
  return (
    <div className="p-3.5 rounded-xl border theme-border-subtle theme-bg-surface-subtle space-y-2 transition-all duration-150 hover:theme-border-strong">
      {/* Commit Header: Message & Time */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <span className="mt-0.5 theme-text-brand shrink-0" aria-hidden="true">
            <GitCommitIcon />
          </span>
          <p className="text-xs sm:text-sm font-medium theme-text-primary line-clamp-2 leading-snug">
            {message}
          </p>
        </div>

        <span className="theme-text-muted text-[11px] shrink-0 font-mono">
          {timestamp}
        </span>
      </div>

      {/* Commit Metadata: Hash, Author & Stats */}
      <div className="flex flex-wrap items-center justify-between text-xs pt-1 border-t theme-border-subtle">
        <div className="flex items-center gap-2">
          {/* Commit Hash in brand accent */}
          <span className="theme-text-brand font-mono text-xs font-semibold px-1.5 py-0.5 rounded theme-bg-surface border theme-border-subtle">
            {hash}
          </span>
          <span className="theme-text-secondary text-xs">
            by <span className="font-medium theme-text-primary">{author}</span>
          </span>
        </div>

        <span className="theme-text-muted text-[11px] font-mono">
          {filesChanged} files modified
        </span>
      </div>
    </div>
  );
}

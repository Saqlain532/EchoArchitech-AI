import React from 'react';
import { Link } from 'react-router-dom';
import { GitHubIcon, TrashIcon } from '../assets/icons';

export default function ProjectCard({
  id,
  title,
  description,
  repo,
  currentDay = 1,
  totalDays = 14,
  onDelete,
}) {
  const repoDisplay =
    typeof repo === 'string'
      ? repo
      : repo?.fullName || repo?.url || 'No repo connected';

  const progressPercentage = Math.min(
    100,
    Math.max(0, Math.round((currentDay / totalDays) * 100))
  );

  return (
    <Link
      to={`/project/${id}`}
      className="theme-card group p-5 flex flex-col justify-between space-y-5 no-underline cursor-pointer relative"
      aria-label={`Open project ${title}`}
    >
      {/* Card Header: Title & Repo Badge */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold tracking-tight theme-text-primary group-hover:theme-text-brand transition-colors duration-150">
            {title}
          </h3>
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(id, title);
              }}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
              title="Delete project"
            >
              <TrashIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <p className="text-xs sm:text-sm theme-text-secondary line-clamp-2 leading-relaxed">
          {description || 'Modular architecture and automated GitHub schedule.'}
        </p>

        <div>
          <span className="theme-badge font-mono text-[11px] truncate max-w-full">
            <GitHubIcon />
            <span className="truncate">{repoDisplay}</span>
          </span>
        </div>
      </div>

      {/* Card Footer: Progress Bar & Active Day */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between text-xs">
          <span className="theme-text-muted font-medium">Sprint Progress</span>
          <span className="theme-text-muted font-mono">
            Day {currentDay} of {totalDays}
          </span>
        </div>

        {/* Progress Bar Track */}
        <div
          className="w-full h-1.5 rounded-full overflow-hidden theme-bg-surface-subtle"
          role="progressbar"
          aria-valuenow={progressPercentage}
          aria-valuemin="0"
          aria-valuemax="100"
        >
          {/* Progress Bar Fill with dynamic theme gradient */}
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progressPercentage}%`,
              background: 'var(--gradient-linear)',
            }}
          />
        </div>
      </div>
    </Link>
  );
}

import React from 'react';

/**
 * TodayFocus Component
 * Active sprint day focus banner with glowing border and dynamic progress bar.
 * Adheres strictly to semantic theme tokens.
 */
export default function TodayFocus({
  currentDay = 1,
  totalDays = 14,
  milestone = 'Sprint Implementation & Feature Development',
  description = 'Continuous monitoring of public repository commits to advance scheduled tasks.',
  targetTime = 'Daily Standup Sync',
  completedTasks = 0,
  totalTasks = 0,
}) {
  const progress = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : Math.min(100, Math.max(0, Math.round((currentDay / totalDays) * 100)));

  return (
    <div className="theme-card theme-card-glow p-5 sm:p-6 space-y-4">
      {/* Header Pill & Milestone Title */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="theme-badge theme-badge-cyan font-mono text-xs">
            Sprint In Progress &bull; Day {currentDay} of {totalDays}
          </span>
          <span className="theme-badge theme-badge-emerald text-xs">
            {completedTasks} / {totalTasks} Tasks Done
          </span>
        </div>

        <h2 className="text-lg sm:text-xl font-bold tracking-tight theme-text-primary">
          {milestone}
        </h2>
        <p className="text-xs sm:text-sm theme-text-secondary leading-relaxed">
          {description}
        </p>
      </div>

      {/* Progress Bar with Theme Gradient */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs">
          <span className="theme-text-muted font-medium">Sprint Completion</span>
          <span className="theme-text-brand font-mono font-semibold">
            {progress}%
          </span>
        </div>

        <div
          className="w-full h-2 rounded-full overflow-hidden theme-bg-surface-subtle"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: 'var(--gradient-linear)',
            }}
          />
        </div>
      </div>

      {/* Target Deadline Footer */}
      <div className="pt-2 border-t theme-border-subtle flex items-center justify-between text-xs theme-text-muted">
        <span>Target Sync Window:</span>
        <span className="font-mono font-medium theme-text-primary">
          {targetTime}
        </span>
      </div>
    </div>
  );
}

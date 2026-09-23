import React, { useState } from 'react';
import { ChevronDownIcon, FileCodeIcon } from '../../assets/icons';

/**
 * Static lookup mapping task status strings directly to theme badge classes.
 */
const STATUS_BADGE_MAP = {
  'Completed': 'theme-badge-emerald',
  'In Progress': 'theme-badge-cyan',
  'Pending': 'theme-badge',
};

/**
 * TaskCard Component
 * An expandable task item within the schedule timeline.
 * Employs a static status-to-badge lookup and expandable code block for target files.
 */
export default function TaskCard({
  title,
  description,
  status = 'Pending',
  estimate = '2h',
  targetFiles = [],
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const badgeClass = STATUS_BADGE_MAP[status] || 'theme-badge';

  return (
    <div className="theme-card p-4 sm:p-5 space-y-3 transition-all duration-150">
      {/* Task Header: Title & Status Badge */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1 max-w-[80%]">
          <h3 className="text-sm sm:text-base font-semibold tracking-tight theme-text-primary">
            {title}
          </h3>
          <p className="text-xs sm:text-sm theme-text-secondary leading-relaxed">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono theme-text-muted">
            {estimate}
          </span>
          <span className={`${badgeClass} text-xs font-medium`}>
            {status}
          </span>
        </div>
      </div>

      {/* Expand / Collapse Target Files Trigger */}
      {targetFiles.length > 0 && (
        <div className="pt-2 border-t theme-border-subtle flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="theme-btn-ghost text-xs py-1 px-2.5 flex items-center gap-1.5 cursor-pointer"
              aria-expanded={isExpanded}
            >
              <FileCodeIcon className="w-3.5 h-3.5 shrink-0 opacity-80" />
              <span>
                {isExpanded ? 'Hide Target Files' : `View Target Files (${targetFiles.length})`}
              </span>
              <ChevronDownIcon
                className={`w-3 h-3 theme-text-muted shrink-0 transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>

          {/* Expandable Target Files Code Block */}
          {isExpanded && (
            <pre className="theme-code-block text-xs leading-relaxed overflow-x-auto">
              <code>
                {targetFiles.map((file) => `// target: ${file}`).join('\n')}
              </code>
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

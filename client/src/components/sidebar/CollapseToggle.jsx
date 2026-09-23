import React from 'react';
import { ChevronLeftIcon } from '../LayoutIcons';

/**
 * CollapseToggle Component
 * Desktop sidebar collapse trigger button.
 * Only rendered when the sidebar is expanded. When collapsed, the open trigger is integrated into the badge on hover.
 */
export default function CollapseToggle({
  isCollapsed,
  onToggle,
  className = '',
}) {
  if (isCollapsed) return null;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`hidden md:inline-flex h-7 w-7 items-center justify-center rounded-lg border theme-border-subtle theme-bg-surface-elevated theme-text-muted hover:theme-text-primary transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent-brand)] ${className}`}
      title="Collapse Sidebar"
      aria-label="Collapse Sidebar"
    >
      <ChevronLeftIcon className="h-3.5 w-3.5" />
    </button>
  );
}

import React from 'react';
import { LeafIcon, ChevronRightIcon } from '../LayoutIcons';

/**
 * SidebarBrand Component
 * Brand logo, app name, and micro-tagline.
 * In collapsed state:
 * - Default: Displays the green EcoArchitect AI brand badge.
 * - On Hover: The opening icon appears with the neutral sidebar button background (`theme-bg-surface-elevated`),
 *   removing the green background for a clean, cohesive tech aesthetic.
 */
export default function SidebarBrand({
  isCollapsed,
  onExpand,
  className = '',
}) {
  if (isCollapsed) {
    return (
      <button
        type="button"
        onClick={onExpand}
        className={`group relative flex items-center justify-center cursor-pointer rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-brand)] ${className}`}
        title="Expand Sidebar"
        aria-label="Expand Sidebar"
      >
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl overflow-hidden transition-all duration-200">
          {/* Default State: Green Brand Badge */}
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-500 via-teal-600 to-indigo-600 text-white shadow-sm transition-all duration-200 group-hover:opacity-0 group-hover:scale-90">
            <LeafIcon className="h-5 w-5" />
          </div>

          {/* Hover State: Opening Icon with sidebar button background (not green) */}
          <div className="absolute inset-0 flex items-center justify-center rounded-xl border theme-border-subtle theme-bg-surface-elevated theme-text-primary shadow-xs opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 group-hover:theme-border-strong transition-all duration-200">
            <ChevronRightIcon className="h-4 w-4 theme-text-primary" />
          </div>
        </div>

        {/* Floating Tooltip */}
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover:flex items-center z-50 pointer-events-none">
          <div className="rounded-lg border theme-border-subtle theme-bg-surface-elevated px-2.5 py-1 text-xs font-medium theme-text-primary shadow-xl whitespace-nowrap">
            Expand Sidebar
          </div>
        </div>
      </button>
    );
  }

  // Expanded State: Normal Brand with Title
  return (
    <div className={`flex items-center gap-3 overflow-hidden ${className}`}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-indigo-600 text-white shadow-md shadow-emerald-500/10">
        <LeafIcon className="h-5 w-5" />
      </div>
      <div className="flex flex-col truncate">
        <span className="text-sm font-semibold tracking-tight theme-text-primary">
          EcoArchitech <span className="text-emerald-500">AI</span>
        </span>
      </div>
    </div>
  );
}

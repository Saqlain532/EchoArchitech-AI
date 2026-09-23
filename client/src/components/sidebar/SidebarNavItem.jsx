import React from 'react';
import { Link } from 'react-router-dom';

/**
 * SidebarNavItem Component
 * Isolated navigation link supporting both direct React Router links and interactive action buttons.
 */
export default function SidebarNavItem({
  item,
  isCollapsed,
  onClick,
}) {
  const Icon = item.icon;

  const content = (
    <>
      <div className="flex items-center gap-3 min-w-0">
        <Icon
          className={`h-4 w-4 shrink-0 ${
            item.active ? 'theme-text-brand' : 'theme-text-muted'
          }`}
        />
        {!isCollapsed && <span className="truncate">{item.label}</span>}
      </div>

      {!isCollapsed && item.disabled && (
        <span className="shrink-0 rounded-md border theme-border-subtle px-1.5 py-0.5 text-[9px] font-mono theme-text-muted bg-[var(--bg-surface-subtle)]">
          {item.status}
        </span>
      )}
    </>
  );

  const sharedClasses = `w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-all duration-150 ${
    item.active
      ? 'theme-bg-brand-subtle theme-text-brand border theme-border-accent'
      : item.disabled
      ? 'opacity-45 cursor-not-allowed theme-text-muted'
      : 'theme-text-secondary hover:theme-text-primary hover:bg-[var(--bg-hover)]'
  } ${isCollapsed ? 'justify-center' : 'justify-between'}`;

  return (
    <div className="relative group">
      {item.path && !item.disabled ? (
        <Link
          to={item.path}
          onClick={() => onClick?.(item.id)}
          className={`${sharedClasses} no-underline cursor-pointer`}
          title={isCollapsed ? item.label : undefined}
        >
          {content}
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => !item.disabled && onClick?.(item.id)}
          disabled={item.disabled}
          className={sharedClasses}
          title={isCollapsed ? `${item.label} (${item.status})` : undefined}
        >
          {content}
        </button>
      )}

      {/* Hover Tooltip when sidebar is collapsed */}
      {isCollapsed && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover:flex items-center z-50 pointer-events-none">
          <div className="rounded-lg border theme-border-subtle theme-bg-surface-elevated px-2.5 py-1 text-xs font-medium theme-text-primary shadow-xl whitespace-nowrap">
            {item.label}
            {item.disabled && (
              <span className="ml-1.5 text-[10px] font-mono theme-text-muted">
                ({item.status})
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

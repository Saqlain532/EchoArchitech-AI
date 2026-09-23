import React from 'react';

/**
 * UserProfile Component
 * User avatar and status indicator.
 * Isolated to accommodate future authentication services, account switching, and dropdown menus.
 */
export default function UserProfile({
  initials = 'SA',
  role = 'Staff Architect',
  isOnline = true,
  onClick,
  className = '',
}) {
  return (
    <div className={`relative group ${className}`}>
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-2 p-0.5 rounded-full border theme-border-subtle theme-bg-surface hover:theme-border-strong transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent-brand)]"
        aria-label={`User Profile (${role})`}
        title={`Logged in as ${role}`}
      >
        <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-xs font-bold text-white shadow-xs">
          {initials}
          {isOnline && (
            <span
              className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-[var(--bg-surface)]"
              aria-hidden="true"
            />
          )}
        </div>
      </button>
    </div>
  );
}

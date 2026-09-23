import React from 'react';
import { SearchIcon } from '../../assets/icons';

/**
 * SearchBar Component
 * Standalone search input with hotkey indicator.
 * Isolated to allow future expansion into a full command palette / spotlight search modal.
 */
export default function SearchBar({
  placeholder = 'Search architecture or specs...',
  shortcut = '⌘K',
  onTrigger,
  className = '',
}) {
  return (
    <button
      type="button"
      onClick={onTrigger}
      className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border theme-border-subtle theme-bg-surface-subtle hover:theme-border-strong hover:theme-bg-surface transition-all duration-150 text-xs theme-text-muted w-72 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent-brand)] ${className}`}
      aria-label="Search"
    >
      <SearchIcon className="w-3.5 h-3.5 text-muted shrink-0" />
      <span className="flex-1 truncate">{placeholder}</span>
      <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono theme-bg-surface border theme-border-subtle shadow-xs select-none">
        {shortcut}
      </kbd>
    </button>
  );
}

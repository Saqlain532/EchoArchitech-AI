import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context';
import {
  GitHubIcon,
  PlusIcon,
  GridIcon,
} from '../../assets/icons';

export default function UserProfileDropdown() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!user) return null;

  const initials = user.initials || (user.name ? user.name.slice(0, 2).toUpperCase() : 'AR');

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 p-0.5 rounded-full border theme-border-subtle theme-bg-surface hover:theme-border-strong transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent-brand)]"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        title={`${user.name} (${user.role})`}
      >
        <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-xs font-bold text-white shadow-xs">
          {initials}
          <span
            className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-[var(--bg-surface)]"
            aria-hidden="true"
          />
        </div>
      </button>

      {/* Glassmorphic Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl border theme-border-subtle theme-bg-surface-elevated p-2 shadow-2xl backdrop-blur-md z-50 animate-in fade-in zoom-in-95 duration-100 space-y-2"
          role="menu"
        >
          {/* User Info Header */}
          <div className="px-3 py-2 border-b theme-border-subtle space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs theme-text-primary truncate">
                {user.name}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-500 font-semibold truncate max-w-[120px]">
                {user.role}
              </span>
            </div>
            <p className="text-[11px] theme-text-muted truncate">
              {user.email}
            </p>
            {user.github?.username && (
              <div className="flex items-center gap-1.5 pt-1 text-[11px] font-mono text-emerald-500">
                <GitHubIcon className="w-3 h-3" />
                <span>@{user.github.username}</span>
              </div>
            )}
          </div>

          {/* Shortcuts */}
          <div className="space-y-0.5">
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg theme-text-secondary hover:theme-text-primary hover:bg-[var(--bg-hover)] transition-colors no-underline cursor-pointer"
            >
              <GridIcon />
              <span>All Projects (Overview)</span>
            </Link>

            <Link
              to="/new"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg theme-text-brand hover:bg-[var(--bg-hover)] transition-colors no-underline font-medium cursor-pointer"
            >
              <PlusIcon />
              <span>Generate New Architecture</span>
            </Link>
          </div>

          {/* Logout Button */}
          <div className="border-t theme-border-subtle pt-1.5">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer font-medium text-left"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

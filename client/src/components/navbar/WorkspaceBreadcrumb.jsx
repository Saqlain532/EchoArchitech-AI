import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useProject } from '../../context';
import {
  ChevronDownIcon,
  ArrowUpRightIcon,
  PlusIcon,
  GridIcon,
} from '../../assets/icons';

export default function WorkspaceBreadcrumb({
  workspace = 'Workspace',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { projects, activeProject } = useProject();

  // Determine active project from URL pathname or context
  const pathParts = location.pathname.split('/').filter(Boolean);
  let routeProjectId = null;
  if ((pathParts[0] === 'project' || pathParts[0] === 'sync') && pathParts[1]) {
    routeProjectId = pathParts[1];
  }

  const currentProject =
    projects.find((p) => p.slug === routeProjectId || p._id === routeProjectId || p.id === routeProjectId) ||
    activeProject ||
    projects[0];

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectProject = (proj) => {
    setIsOpen(false);
    const targetId = proj.slug || proj._id || proj.id;
    if (location.pathname.startsWith('/sync')) {
      navigate(`/sync/${targetId}`);
    } else {
      navigate(`/project/${targetId}`);
    }
  };

  return (
    <div className={`flex items-center gap-2 text-xs sm:text-sm ${className}`}>
      {/* Workspace Brand / Link to Overview */}
      <Link
        to="/"
        className="font-semibold tracking-tight theme-text-primary hover:theme-text-brand transition-colors no-underline cursor-pointer"
      >
        {workspace}
      </Link>
      <span className="theme-text-muted select-none">/</span>

      {/* Project Switcher Dropdown Anchor */}
      <div className="relative inline-block text-left" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2 px-2.5 py-1 rounded-lg theme-bg-surface-elevated border theme-border-subtle hover:theme-border-strong hover:bg-[var(--bg-hover)] transition-all duration-150 cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--accent-brand)]"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label="Switch project dropdown"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="font-mono text-xs font-semibold theme-text-primary max-w-[130px] sm:max-w-[200px] truncate">
            {currentProject ? currentProject.title : 'Select Project'}
          </span>
          <ChevronDownIcon
            className={`w-3.5 h-3.5 theme-text-muted transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            className="absolute left-0 mt-2 w-72 sm:w-80 origin-top-left rounded-xl border theme-border-subtle theme-bg-surface-elevated p-2 shadow-2xl backdrop-blur-md z-50 animate-in fade-in zoom-in-95 duration-100 space-y-1"
            role="listbox"
            aria-label="Active projects list"
          >
            {/* Dropdown Header */}
            <div className="flex items-center justify-between px-2.5 py-1.5 border-b theme-border-subtle">
              <span className="text-[11px] font-semibold uppercase tracking-wider theme-text-muted">
                Switch Project
              </span>
              <span className="text-[10px] font-mono theme-text-muted">
                {projects.length} available
              </span>
            </div>

            {/* Project List */}
            <div className="max-h-64 overflow-y-auto space-y-1 py-1">
              {projects.map((proj) => {
                const targetId = proj.slug || proj._id || proj.id;
                const isSelected =
                  currentProject &&
                  (currentProject._id === proj._id ||
                    currentProject.slug === proj.slug ||
                    currentProject.id === proj.id);

                const repoStr =
                  typeof proj.repo === 'string'
                    ? proj.repo
                    : proj.repo?.fullName || proj.repo?.url || 'No repo';

                return (
                  <button
                    key={targetId}
                    type="button"
                    onClick={() => handleSelectProject(proj)}
                    className={`group w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'theme-bg-brand-subtle theme-text-brand'
                        : 'hover:bg-[var(--bg-hover)] theme-text-secondary hover:theme-text-primary'
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 pr-2">
                      <span
                        className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                          isSelected
                            ? 'bg-[var(--accent-brand)] ring-2 ring-[var(--accent-brand)]/30'
                            : 'bg-emerald-500'
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs truncate">
                            {proj.title}
                          </span>
                          {isSelected && (
                            <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded theme-bg-surface border theme-border-subtle theme-text-brand font-medium">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-[11px] theme-text-muted truncate mt-0.5">
                          {repoStr}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-mono theme-text-muted">
                        Day {proj.currentDay || 1}/{proj.totalDays || 14}
                      </span>
                      <ArrowUpRightIcon
                        className={`w-3.5 h-3.5 transition-transform duration-150 ${
                          isSelected
                            ? 'theme-text-brand'
                            : 'theme-text-muted group-hover:theme-text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Actions Footer */}
            <div className="border-t theme-border-subtle pt-1.5 flex flex-col gap-0.5">
              <Link
                to="/"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg theme-text-secondary hover:theme-text-primary hover:bg-[var(--bg-hover)] transition-colors no-underline cursor-pointer"
              >
                <GridIcon />
                <span>All Projects (Overview)</span>
              </Link>
              <Link
                to="/new"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg theme-text-brand hover:bg-[var(--bg-hover)] transition-colors no-underline font-medium cursor-pointer"
              >
                <PlusIcon />
                <span>Generate New Project</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

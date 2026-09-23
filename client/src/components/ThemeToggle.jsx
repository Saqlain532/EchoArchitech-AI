import React, { useState, useEffect, useRef } from 'react';
import useTheme from '../hooks/useTheme';
import {
  SunIcon,
  MoonIcon,
  MonitorIcon,
  CheckIcon,
  ChevronDownIcon,
} from '../assets/icons';

/**
 * Modern Tech Theme Dropdown Component
 * Features Light, Dark, and System modes with smooth transitions.
 */
export default function ThemeToggle({ className = '' }) {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const options = [
    { id: 'light', label: 'Light', icon: SunIcon },
    { id: 'dark', label: 'Dark', icon: MoonIcon },
    { id: 'system', label: 'System', icon: MonitorIcon },
  ];

  const CurrentIcon =
    theme === 'light' ? SunIcon : theme === 'dark' ? MoonIcon : MonitorIcon;

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

    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center justify-center gap-2 rounded-lg border theme-border-subtle theme-bg-surface px-3 py-1.5 text-xs font-medium theme-text-secondary hover:theme-text-primary hover:theme-border-strong transition-all duration-150 cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-brand)]"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Select theme"
      >
        <CurrentIcon className="w-4 h-4 text-[var(--accent-brand)]" />
        <span className="capitalize">{theme}</span>
        <ChevronDownIcon
          className={`w-3 h-3 text-[var(--text-muted)] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-1.5 w-36 origin-top-right rounded-xl border theme-border-subtle theme-bg-surface-elevated p-1 shadow-lg backdrop-blur-md z-50 animate-in fade-in zoom-in-95 duration-100"
          role="menu"
          aria-orientation="vertical"
        >
          {options.map((opt) => {
            const Icon = opt.icon;
            const isActive = theme === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setTheme(opt.id);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? 'theme-bg-brand-subtle theme-text-brand font-medium'
                    : 'theme-text-secondary hover:theme-text-primary hover:bg-[var(--bg-hover)]'
                }`}
                role="menuitem"
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5" />
                  <span>{opt.label}</span>
                </div>
                {isActive && <CheckIcon className="w-3.5 h-3.5 theme-text-brand" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

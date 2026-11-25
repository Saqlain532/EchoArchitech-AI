import React, { useState } from 'react';
import ThemeToggle from './ThemeToggle';
import {
  WorkspaceBreadcrumb,
  SearchBar,
  UserProfileDropdown,
} from './navbar/index.js';
import AuthModal from './auth/AuthModal.jsx';
import { MenuIcon, UserIcon } from '../assets/icons';
import { useAuth } from '../context';

export default function Navbar({ onMobileMenuToggle }) {
  const { user, isAuthenticated } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 h-16 border-b theme-border-subtle theme-bg-glass backdrop-blur-md px-3 sm:px-4 xl:px-6 flex items-center justify-between gap-2 transition-colors">
        {/* Left: Mobile Toggle & Workspace Breadcrumb */}
        <div className="flex min-w-0 flex-1 items-center gap-2 xl:gap-3">
          <button
            type="button"
            onClick={onMobileMenuToggle}
            className="md:hidden inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border theme-border-subtle theme-bg-surface text-muted hover:text-primary transition-colors cursor-pointer"
            aria-label="Open navigation menu"
          >
            <MenuIcon className="h-5 w-5" />
          </button>

          <WorkspaceBreadcrumb workspace="EchoArchitech" className="min-w-0 flex-1" />
        </div>

        {/* Center: Search Command Bar */}
        <SearchBar />

        {/* Right: Theme Switcher & Profile / Sign In */}
        <div className="flex shrink-0 items-center gap-2 xl:gap-3">
          <ThemeToggle className="shrink-0" />

          {isAuthenticated && user ? (
            <UserProfileDropdown />
          ) : (
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="theme-btn-brand text-xs py-1.5 px-2 sm:px-3 flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}
        </div>
      </header>

      {/* Global Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}

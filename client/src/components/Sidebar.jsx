import React from 'react';
import {
  SidebarBrand,
  SidebarNav,
  CollapseToggle,
} from './sidebar/index.js';

/**
 * Sidebar Component (Orchestrator)
 * Composes isolated, modular micro-components:
 * - SidebarBrand (with hover-to-expand badge interaction in collapsed state)
 * - CollapseToggle (visible only when expanded)
 * - SidebarNav (and SidebarNavItem)
 * - EcoFootprintWidget
 */
export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  activeModuleId = 'roadmap',
  onSelectModule,
}) {
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container Shell */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col justify-between border-r theme-border-subtle theme-bg-surface transition-all duration-300 ease-in-out ${isCollapsed ? 'w-16' : 'w-64'
          } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
      >
        {/* Brand / Logo & Collapse Header */}
        <div
          className={`flex h-16 items-center border-b theme-border-subtle transition-all duration-300 ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
            }`}
        >
          <SidebarBrand
            isCollapsed={isCollapsed}
            onExpand={() => setIsCollapsed(false)}
          />
          <CollapseToggle
            isCollapsed={isCollapsed}
            onToggle={() => setIsCollapsed(!isCollapsed)}
          />
        </div>

        {/* Navigation Core Modules */}
        <SidebarNav
          isCollapsed={isCollapsed}
          activeId={activeModuleId}
          onSelect={onSelectModule}
        />
      </aside>
    </>
  );
}

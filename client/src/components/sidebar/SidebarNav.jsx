import React from 'react';
import { useLocation } from 'react-router-dom';
import SidebarNavItem from './SidebarNavItem';
import {
  OverviewIcon,
  RoadmapIcon,
  GitHubIcon,
} from '../LayoutIcons';
import { useProject } from '../../context';

/**
 * SidebarNav Component
 * Connects directly to React Router location so Overview, Roadmap Generator, and GitHub Sync
 * highlight dynamically based on the active route.
 */
export default function SidebarNav({
  isCollapsed,
  onSelect,
  className = '',
}) {
  const location = useLocation();
  const { activeProject, projects } = useProject();

  const isOverviewActive =
    location.pathname === '/' || location.pathname.startsWith('/overview');
  const isRoadmapActive = location.pathname === '/new';
  const isWorkspaceActive =
    location.pathname.startsWith('/project') || location.pathname.startsWith('/sync');

  const currentProjectId =
    activeProject?._id || activeProject?.slug || projects[0]?._id || projects[0]?.slug;

  const workspacePath = currentProjectId ? `/project/${currentProjectId}` : '/project';

  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: OverviewIcon,
      path: '/',
      status: 'Active',
      disabled: false,
      active: isOverviewActive,
    },
    {
      id: 'roadmap',
      label: 'Roadmap Generator',
      icon: RoadmapIcon,
      path: '/new',
      status: 'Ready',
      disabled: false,
      active: isRoadmapActive,
    },
    {
      id: 'github-sync',
      label: 'GitHub Sync',
      icon: GitHubIcon,
      path: workspacePath,
      status: 'Connected',
      disabled: false,
      active: isWorkspaceActive,
    },
  ];

  return (
    <nav className={`flex-1 overflow-y-auto px-3 py-4 space-y-1 ${className}`}>
      {!isCollapsed && (
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider theme-text-muted">
          Core Modules
        </div>
      )}

      {navItems.map((item) => (
        <SidebarNavItem
          key={item.id}
          item={item}
          isCollapsed={isCollapsed}
          onClick={onSelect}
        />
      ))}
    </nav>
  );
}

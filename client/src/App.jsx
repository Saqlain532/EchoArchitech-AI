import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { DashboardLayout } from './layouts';
import Homepage from './pages/Homepage';
import RoadmapGenerator from './pages/RoadmapGenerator';
import ProjectWorkspace from './pages/ProjectWorkspace';

export default function App() {
  return (
    <DashboardLayout>
      <Routes>
        {/* Overview: Displays all projects listed */}
        <Route path="/" element={<Homepage />} />
        <Route path="/overview" element={<Homepage />} />

        {/* AI Roadmap Generator: Onboarding View */}
        <Route path="/new" element={<RoadmapGenerator />} />

        {/* Project Workspace & GitHub Sync: Single Unified Page */}
        <Route path="/project/:id" element={<ProjectWorkspace />} />
        <Route path="/project" element={<ProjectWorkspace />} />
        <Route path="/sync" element={<ProjectWorkspace />} />
        <Route path="/sync/:id" element={<ProjectWorkspace />} />

        {/* Fallback to Overview */}
        <Route path="*" element={<Homepage />} />
      </Routes>
    </DashboardLayout>
  );
}

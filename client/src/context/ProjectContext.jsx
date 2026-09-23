import React, { useState, useEffect, useCallback } from 'react';
import { ProjectContext } from './ProjectContextObject';
import { projectApi, githubApi } from '../services/api';
import { useAuth } from './useAuth';

export function ProjectProvider({ children }) {
  const { user, token, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [activeTasks, setActiveTasks] = useState([]);
  const [activeCommits, setActiveCommits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  // Sync projects whenever the authenticated user or token changes
  useEffect(() => {
    if (authLoading) return;

    let active = true;

    const syncUserProjects = async () => {
      if (!token || !user) {
        if (active) {
          setProjects([]);
          setActiveProject(null);
          setActiveTasks([]);
          setActiveCommits([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const data = await projectApi.getAllProjects();
        if (active) {
          if (Array.isArray(data)) {
            setProjects(data);
            setError(null);
          } else {
            setProjects([]);
          }
        }
      } catch (err) {
        if (active) {
          console.warn('⚠️ [ProjectContext]: Could not fetch user projects:', err.message);
          setProjects([]);
          setError(err.message);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    syncUserProjects();

    return () => {
      active = false;
    };
  }, [user, token, authLoading]);

  const fetchProjects = useCallback(async () => {
    if (!token || !user) {
      setProjects([]);
      return;
    }
    try {
      const data = await projectApi.getAllProjects();
      if (Array.isArray(data)) {
        setProjects(data);
        setError(null);
      } else {
        setProjects([]);
      }
    } catch (err) {
      console.warn('⚠️ [ProjectContext]: Refresh error:', err.message);
    }
  }, [token, user]);

  // Load a single project by ID or slug
  const selectProject = useCallback(async (idOrSlug) => {
    if (!idOrSlug) return null;

    try {
      const data = await projectApi.getProjectById(idOrSlug);
      if (data) {
        setActiveProject(data);
        setActiveTasks(data.tasks || []);
        setActiveCommits(data.commits || []);
        setError(null);
        return data;
      }
    } catch (err) {
      console.warn(`[ProjectContext]: Could not load project "${idOrSlug}" from API:`, err.message);
      setError(err.message);
    }
    return null;
  }, []);

  // Create a new project
  const createNewProject = async (projectPayload) => {
    setLoading(true);
    try {
      const created = await projectApi.createProject(projectPayload);
      if (created) {
        setProjects((prev) => [created, ...prev]);
        setActiveProject(created);
        setActiveTasks(created.tasks || projectPayload.tasks || []);
        return created;
      }
    } catch (err) {
      console.error('Failed to create project via API:', err);
      // Local fallback creation
      const localProject = {
        _id: `local-${Date.now()}`,
        slug: projectPayload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        title: projectPayload.title,
        description: projectPayload.description || '',
        prompt: projectPayload.prompt || '',
        architecture: projectPayload.architecture,
        roadmap: projectPayload.roadmap,
        repo: {
          fullName: projectPayload.repoUrl || 'user/repo',
          url: projectPayload.repoUrl || '',
          branch: 'main',
        },
        currentDay: 1,
        totalDays: projectPayload.roadmap?.totalDays || 14,
        status: 'In Progress',
        tasks: projectPayload.tasks || projectPayload.roadmap?.tasks || [],
        commits: [],
      };
      setProjects((prev) => [localProject, ...prev]);
      setActiveProject(localProject);
      setActiveTasks(localProject.tasks);
      return localProject;
    } finally {
      setLoading(false);
    }
  };

  // Sync active project with GitHub
  const syncActiveProject = async (projectId) => {
    const targetId = projectId || activeProject?._id || activeProject?.id;
    if (!targetId) return null;

    setSyncing(true);
    try {
      const result = await githubApi.syncProject(targetId);
      // Re-fetch project to update tasks, commits, and currentDay
      await selectProject(targetId);
      await fetchProjects();
      return result;
    } catch (err) {
      console.error('Sync error:', err);
      throw err;
    } finally {
      setSyncing(false);
    }
  };

  // Delete project and update local state
  const removeProject = async (projectId) => {
    try {
      await projectApi.deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p._id !== projectId && p.id !== projectId));
      if (activeProject?._id === projectId || activeProject?.id === projectId) {
        setActiveProject(null);
        setActiveTasks([]);
        setActiveCommits([]);
      }
      return true;
    } catch (err) {
      console.error('Failed to delete project:', err);
      setProjects((prev) => prev.filter((p) => p._id !== projectId && p.id !== projectId));
      return false;
    }
  };

  const value = {
    projects,
    activeProject,
    activeTasks,
    activeCommits,
    loading,
    syncing,
    error,
    refreshProjects: fetchProjects,
    selectProject,
    setActiveProject,
    createProject: createNewProject,
    deleteProject: removeProject,
    syncActiveProject,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

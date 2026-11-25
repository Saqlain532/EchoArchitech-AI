import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProjectCard from '../components/ProjectCard';
import { PlusIcon, LoadingSpinner, TrashIcon, SparklesIcon, ArrowUpRightIcon } from '../assets/icons';
import { useProject, useAuth } from '../context';
import { getSuggestionsForRole } from '../data/roleSuggestions';

export default function Homepage() {
  const { projects, loading, deleteProject } = useProject();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [deleteTarget, setDeleteTarget] = useState(null); // { id, title } | null
  const [isDeleting, setIsDeleting] = useState(false);

  const userRole = user?.role || 'Fullstack Developer';
  const roleSuggestions = getSuggestionsForRole(userRole);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteProject) {
        await deleteProject(deleteTarget.id);
      }
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to delete project:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStartSuggestion = (suggestionPrompt) => {
    navigate('/new', { state: { initialPrompt: suggestionPrompt } });
  };

  return (
    <div className="space-y-10">
      {/* Header Section: Greeting & Action Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b theme-border-subtle pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight theme-text-primary">
              {isAuthenticated ? `Welcome back, ${user?.name || 'Architect'}` : 'Overview Dashboard'}
            </h1>
            {isAuthenticated && (
              <span className="theme-badge theme-badge-cyan text-xs font-mono">
                {userRole}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm theme-text-secondary">
            Synthesize architecture blueprints, monitor public GitHub repos, and track daily coding tasks.
          </p>
        </div>

        <div>
          <Link
            to="/new"
            className="theme-btn-brand text-xs sm:text-sm no-underline cursor-pointer flex items-center gap-1.5"
          >
            <PlusIcon />
            <span>Generate New Project</span>
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      {loading && projects.length === 0 ? (
        <div className="p-16 flex flex-col items-center justify-center space-y-3">
          <LoadingSpinner className="w-8 h-8 theme-text-brand" />
          <span className="text-xs theme-text-muted">Loading projects from MongoDB Atlas...</span>
        </div>
      ) : projects.length > 0 ? (
        <div className="space-y-12">
          {/* Active Projects Grid */}
          <section aria-labelledby="active-projects-heading" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2
                id="active-projects-heading"
                className="text-sm font-semibold uppercase tracking-wider theme-text-muted flex items-center gap-2"
              >
                <span>Active Projects</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono theme-bg-cyan-subtle theme-text-cyan border theme-border-subtle">
                  {projects.length}
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => {
                const projId = project._id || project.slug || project.id;
                return (
                  <ProjectCard
                    key={projId}
                    id={projId}
                    title={project.title}
                    description={project.description}
                    repo={project.repo}
                    currentDay={project.currentDay || 1}
                    totalDays={project.totalDays || 14}
                    onDelete={(id, title) => setDeleteTarget({ id, title })}
                  />
                );
              })}
            </div>
          </section>

          {/* Suggested Next Blueprints for Returning Users */}
          <section className="space-y-4 pt-6 border-t theme-border-subtle">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-base font-bold theme-text-primary flex items-center gap-2">
                  <SparklesIcon className="w-4 h-4 theme-text-cyan" />
                  <span>Suggested Next Blueprints</span>
                </h3>
                <p className="text-xs theme-text-secondary">
                  Curated architecture patterns tailored for your role as <strong className="theme-text-cyan">{userRole}</strong>.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roleSuggestions.map((item) => (
                <div
                  key={item.id}
                  className="theme-card theme-hover-border-brand p-5 space-y-4 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono theme-bg-cyan-subtle theme-text-cyan border theme-border-subtle">
                        {item.badge}
                      </span>
                      <span className="text-[11px] font-mono theme-text-muted">{item.duration}</span>
                    </div>

                    <h4 className="text-sm font-semibold theme-text-primary">{item.title}</h4>
                    <p className="text-xs theme-text-secondary line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    {item.techStack && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono theme-bg-cyan-subtle theme-text-cyan border theme-border-subtle">
                          {item.techStack.frontend}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono theme-bg-emerald-subtle theme-text-emerald border theme-border-subtle">
                          {item.techStack.backend}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono theme-bg-brand-subtle theme-text-brand border theme-border-subtle">
                          {item.techStack.database}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleStartSuggestion(item.prompt)}
                      className="w-full py-2 px-3 rounded-lg border theme-border-subtle theme-bg-surface-elevated theme-hover-bg text-xs font-medium theme-text-cyan theme-hover-text-cyan flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <SparklesIcon className="w-3.5 h-3.5" />
                      <span>Synthesize This Blueprint</span>
                      <ArrowUpRightIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        /* Empty State with Curated Role Suggestions */
        <div className="space-y-8">
          <div className="p-8 sm:p-10 rounded-2xl border theme-border-subtle bg-gradient-mesh text-center space-y-4 theme-shadow-card">
            <div className="w-12 h-12 rounded-2xl theme-bg-cyan-subtle border theme-border-subtle flex items-center justify-center mx-auto theme-text-cyan">
              <SparklesIcon className="w-6 h-6" />
            </div>
            <div className="space-y-1.5 max-w-xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-bold theme-text-primary">
                Ready to Architect Your Next System?
              </h2>
              <p className="text-xs sm:text-sm theme-text-secondary leading-relaxed">
                You haven't generated any projects yet. Select one of the curated blueprints below tailored for your role as{' '}
                <strong className="theme-text-cyan">{userRole}</strong>, or formulate your own custom architecture.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/new"
                className="theme-btn-brand text-xs sm:text-sm px-5 py-2.5 inline-flex items-center gap-2 cursor-pointer no-underline"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Custom Architecture Generator</span>
              </Link>
            </div>
          </div>

          {/* Curated Role Suggestions for New Users */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider theme-text-muted flex items-center gap-2">
                <span>Recommended Blueprints for {userRole}</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {roleSuggestions.map((item) => (
                <div
                  key={item.id}
                  className="theme-card theme-hover-border-brand p-6 space-y-5 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded text-xs font-mono theme-bg-cyan-subtle theme-text-cyan border theme-border-subtle">
                        {item.badge}
                      </span>
                      <span className="text-xs font-mono theme-text-muted">{item.duration}</span>
                    </div>

                    <h4 className="text-base font-bold theme-text-primary">{item.title}</h4>
                    <p className="text-xs sm:text-sm theme-text-secondary leading-relaxed">
                      {item.description}
                    </p>

                    {item.techStack && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="px-2.5 py-1 rounded text-[11px] font-mono theme-bg-cyan-subtle theme-text-cyan border theme-border-subtle">
                          {item.techStack.frontend}
                        </span>
                        <span className="px-2.5 py-1 rounded text-[11px] font-mono theme-bg-emerald-subtle theme-text-emerald border theme-border-subtle">
                          {item.techStack.backend}
                        </span>
                        <span className="px-2.5 py-1 rounded text-[11px] font-mono theme-bg-brand-subtle theme-text-brand border theme-border-subtle">
                          {item.techStack.database}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t theme-border-subtle">
                    <button
                      type="button"
                      onClick={() => handleStartSuggestion(item.prompt)}
                      className="w-full py-2.5 px-4 rounded-xl theme-bg-cyan-subtle theme-hover-bg theme-border-cyan-subtle border text-xs font-semibold theme-text-cyan theme-hover-text-cyan flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <SparklesIcon className="w-4 h-4" />
                      <span>Synthesize This Blueprint</span>
                      <ArrowUpRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Delete Project Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 theme-bg-overlay backdrop-blur-sm animate-in fade-in duration-200">
          <div className="theme-card max-w-md w-full p-6 space-y-5 border theme-border-rose-subtle">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl theme-bg-rose-subtle border theme-border-rose-subtle flex items-center justify-center theme-text-rose shrink-0">
                <TrashIcon className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold theme-text-primary">Delete Project</h3>
                <p className="text-xs theme-text-secondary">
                  Are you sure you want to permanently delete <strong className="theme-text-rose">{deleteTarget.title}</strong>?
                </p>
              </div>
            </div>

            <p className="text-xs theme-text-muted theme-bg-surface-subtle p-3 rounded-lg border theme-border-subtle">
              ⚠️ This will remove the project, sprint tasks, and synced commit log from MongoDB Atlas. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="theme-btn-ghost text-xs px-3.5 py-2 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg theme-bg-rose hover:brightness-110 theme-text-inverse font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <LoadingSpinner className="w-3.5 h-3.5" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <TrashIcon className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

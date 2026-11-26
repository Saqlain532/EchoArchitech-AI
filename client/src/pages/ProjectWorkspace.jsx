import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ScheduleTimeline from '../components/schedule/ScheduleTimeline';
import GitHubSyncPanel from '../components/github/GitHubSyncPanel';
import GreenInsightsPanel from '../components/green/GreenInsightsPanel';
import {
  ArrowLeftIcon,
  LoadingSpinner,
  DownloadIcon,
  TrashIcon,
  FileTextIcon,
  GitHubIcon,
  PlusIcon,
} from '../assets/icons';
import { useProject } from '../context';
import { MermaidViewer } from '../components/visualizer';

export default function ProjectWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    selectProject,
    activeProject,
    activeTasks,
    activeCommits,
    loading,
    deleteProject,
    projects,
  } = useProject();
  const [activeTab, setActiveTab] = useState('sprint'); // 'sprint' | 'green' | 'architecture' | 'gantt' | 'scaffold'
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [copiedExport, setCopiedExport] = useState(false);

  useEffect(() => {
    if (id) {
      selectProject(id);
    } else if (projects.length > 0 && !activeProject) {
      const first = projects[0];
      selectProject(first._id || first.slug || first.id);
    }
  }, [id, projects, activeProject, selectProject]);

  const project = activeProject || {
    title: 'Loading Project...',
    description: '',
    repo: { fullName: '', branch: 'main' },
    currentDay: 1,
    totalDays: 14,
    status: 'In Progress',
  };

  const formatRepoDisplay = (rawRepo) => {
    if (!rawRepo) return 'Not Connected';
    if (typeof rawRepo === 'string') {
      return rawRepo.replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '');
    }
    if (rawRepo.fullName && rawRepo.fullName !== 'undefined/undefined' && !rawRepo.fullName.includes('undefined')) {
      return rawRepo.fullName;
    }
    if (rawRepo.url && !rawRepo.url.includes('undefined/undefined')) {
      const clean = rawRepo.url.replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '');
      if (clean) return clean;
    }
    if (rawRepo.owner && rawRepo.name && rawRepo.owner !== 'undefined') {
      return `${rawRepo.owner}/${rawRepo.name}`;
    }
    return 'Not Connected';
  };

  const repoDisplay = formatRepoDisplay(project.repo);

  const branchDisplay = project.repo?.branch || 'main';

  // Export ARCHITECTURE.md file download handler
  const handleExportArchitecture = () => {
    const arch = project.architecture || {};
    const roadmap = project.roadmap || {};
    const tech = arch.techStack || {};

    let markdown = `# ${project.title || 'EchoArchitech AI Project'} - Architecture & Sprint Blueprint\n\n`;
    markdown += `> **Generated with EchoArchitech AI**  \n`;
    markdown += `> *Continuous Architectural Alignment & Sprint Tracking*\n\n`;

    markdown += `## 1. Project Overview\n\n`;
    markdown += `${project.description || 'No description provided.'}\n\n`;
    markdown += `- **Sprint Duration**: ${project.totalDays || 14} Days\n`;
    markdown += `- **Current Day**: Day ${project.currentDay || 1}\n`;
    markdown += `- **Status**: ${project.status || 'Active'}\n`;
    markdown += `- **Repository**: ${repoDisplay} (Branch: \`${branchDisplay}\`)\n\n`;

    markdown += `## 2. Technology Stack\n\n`;
    markdown += `| Component | Technology |\n| :--- | :--- |\n`;
    markdown += `| **Frontend** | ${tech.frontend || 'N/A'} |\n`;
    markdown += `| **Backend** | ${tech.backend || 'N/A'} |\n`;
    markdown += `| **Database** | ${tech.database || 'N/A'} |\n`;
    markdown += `| **DevOps / Cloud** | ${tech.devops || 'N/A'} |\n\n`;

    if (arch.components && arch.components.length > 0) {
      markdown += `## 3. Synthesized Architectural Components\n\n`;
      arch.components.forEach((c) => {
        markdown += `### ${c.name} (${c.type || 'Service'})\n`;
        markdown += `${c.description}\n\n`;
      });
    }

    if (arch.mermaidDiagram) {
      markdown += `## 4. System Architecture Diagram\n\n`;
      markdown += `\`\`\`mermaid\n${arch.mermaidDiagram}\n\`\`\`\n\n`;
    }

    if (roadmap.mermaidGantt) {
      markdown += `## 5. Sprint Execution Roadmap (Gantt)\n\n`;
      markdown += `\`\`\`mermaid\n${roadmap.mermaidGantt}\n\`\`\`\n\n`;
    }

    if (activeTasks && activeTasks.length > 0) {
      markdown += `## 6. Daily Task Execution Checklist\n\n`;
      const sortedTasks = [...activeTasks].sort((a, b) => (a.day || 0) - (b.day || 0));
      sortedTasks.forEach((t) => {
        const isDone = t.status === 'Completed' || t.status === 'Done';
        markdown += `- [${isDone ? 'x' : ' '}] **Day ${t.day || 1}**: ${t.title} (${t.phase || 'Development'})\n`;
        if (t.description) {
          markdown += `  - *Details*: ${t.description}\n`;
        }
        if (t.targetFiles && t.targetFiles.length > 0) {
          markdown += `  - *Target Files*: \`${t.targetFiles.join('`, `')}\`\n`;
        }
      });
      markdown += `\n`;
    }

    if (arch.scaffoldTree && arch.scaffoldTree.length > 0) {
      markdown += `## 7. Target File Scaffold Structure\n\n\`\`\`text\n`;
      arch.scaffoldTree.forEach((file) => {
        markdown += `├── ${file}\n`;
      });
      markdown += `\`\`\`\n\n`;
    }

    markdown += `---\n*Exported on ${new Date().toLocaleDateString()} from EchoArchitech AI Workspace.*\n`;

    // Trigger browser download
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `${(project.slug || project.title || 'project').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_ARCHITECTURE.md`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 3000);
  };

  const handleConfirmDelete = async () => {
    const targetId = project._id || project.id || id;
    if (!targetId) return;

    setIsDeleting(true);
    try {
      if (deleteProject) {
        await deleteProject(targetId);
      }
      setShowDeleteModal(false);
      navigate('/');
    } catch (err) {
      console.error('Failed to delete project:', err);
      setIsDeleting(false);
    }
  };

  // If no projects exist, render clean empty state asking user to generate one
  if (!loading && !activeProject && (!projects || projects.length === 0)) {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-4 sm:space-y-6 pt-4 sm:pt-8">
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="w-fit max-w-full theme-btn-ghost text-xs px-2.5 py-1.5 flex items-center gap-1.5 no-underline cursor-pointer"
            aria-label="Back to Overview"
          >
            <ArrowLeftIcon />
            <span className="sm:hidden">Back</span>
            <span className="hidden sm:inline">Back to Projects Overview</span>
          </Link>
        </div>

        <div className="p-6 sm:p-10 rounded-2xl border theme-border-subtle theme-bg-mesh text-center space-y-4 theme-shadow-card">
          <div className="w-12 h-12 rounded-2xl theme-bg-cyan-subtle border theme-border-subtle flex items-center justify-center mx-auto theme-text-cyan">
            <GitHubIcon className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="text-lg sm:text-2xl font-bold theme-text-primary">
              No Projects Ready for GitHub Sync
            </h2>
            <p className="text-xs sm:text-sm theme-text-secondary leading-relaxed">
              You haven't generated any project architectures yet. To view daily sprint tasks, architecture diagrams, and synchronized commit diffs, synthesize an architecture blueprint first.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/new"
              className="w-full sm:w-auto justify-center text-center theme-btn-brand text-xs sm:text-sm px-4 sm:px-5 py-2.5 inline-flex items-center gap-2 cursor-pointer no-underline"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Generate Architecture Roadmap</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Workspace Header & Back Navigation */}
      <div className="space-y-4 border-b theme-border-subtle pb-6">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
            <Link
              to="/"
              className="theme-btn-ghost text-xs px-2.5 py-1.5 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              aria-label="Back to Overview"
            >
              <ArrowLeftIcon />
              <span className="sm:hidden">Back</span>
              <span className="hidden sm:inline">Back to Projects</span>
            </Link>

            {projects && projects.length > 1 && (
              <div className="flex min-w-0 items-center gap-1.5 border-l theme-border-subtle pl-2 sm:pl-3">
                <span className="text-[11px] theme-text-muted">Switch:</span>
                <select
                  value={project._id || project.slug || project.id || ''}
                  onChange={(e) => navigate(`/project/${e.target.value}`)}
                  className="theme-input max-w-[140px] sm:max-w-[220px] truncate text-xs py-1 px-2.5 font-medium cursor-pointer"
                >
                  {projects.map((p) => {
                    const val = p._id || p.slug || p.id;
                    return (
                      <option key={val} value={val}>
                        {p.title}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>

          {/* Action Toolbar: Export ARCHITECTURE.md & Delete Project */}
          <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
            <button
              type="button"
              onClick={handleExportArchitecture}
              className="px-2 sm:px-3 py-1.5 rounded-lg border theme-border-subtle theme-bg-surface-elevated theme-hover-bg text-xs font-medium theme-text-cyan theme-hover-text-cyan flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
              title="Download compiled architecture, Gantt, and sprint checklist as ARCHITECTURE.md"
            >
              {copiedExport ? <FileTextIcon className="w-3.5 h-3.5 theme-text-emerald" /> : <DownloadIcon className="w-3.5 h-3.5" />}
              <span className="sm:hidden">{copiedExport ? 'Done' : 'Export'}</span>
              <span className="hidden sm:inline">{copiedExport ? 'Exported!' : 'Export ARCHITECTURE.md'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-2 sm:px-3 py-1.5 rounded-lg border theme-border-rose-subtle theme-bg-rose-subtle theme-hover-bg-rose text-xs font-medium theme-text-rose theme-hover-text-rose flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
              title="Permanently delete project and tasks"
            >
              <TrashIcon className="w-3.5 h-3.5" />
              <span>Delete Project</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="break-words text-2xl sm:text-3xl font-bold tracking-tight theme-text-primary">
                {project.title}
              </h1>
              <span className="theme-badge theme-badge-cyan text-xs font-mono">
                Day {project.currentDay || 1} of {project.totalDays || 14}
              </span>
              <span className="theme-badge theme-badge-emerald text-xs font-mono">
                {project.status || 'Active Sync'}
              </span>
            </div>
            <p className="break-words text-xs sm:text-sm theme-text-secondary max-w-2xl">
              {project.description || 'Continuous architecture blueprint and automated GitHub commit monitor.'}
            </p>
          </div>

          {/* Tech Stack Indicators */}
          {project.architecture?.techStack && (
            <div className="flex flex-wrap items-center gap-2">
              {project.architecture.techStack.frontend && (
                <span className="px-2.5 py-1 rounded text-xs font-mono theme-bg-cyan-subtle theme-text-cyan border theme-border-subtle">
                  {project.architecture.techStack.frontend}
                </span>
              )}
              {project.architecture.techStack.backend && (
                <span className="px-2.5 py-1 rounded text-xs font-mono theme-bg-emerald-subtle theme-text-emerald border theme-border-subtle">
                  {project.architecture.techStack.backend}
                </span>
              )}
              {project.architecture.techStack.database && (
                <span className="px-2.5 py-1 rounded text-xs font-mono theme-bg-brand-subtle theme-text-brand border theme-border-subtle">
                  {project.architecture.techStack.database}
                </span>
              )}
            </div>
          )}
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t theme-border-subtle overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('sprint')}
            className={`px-3.5 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer ${activeTab === 'sprint'
              ? 'theme-border-brand theme-text-brand font-semibold'
              : 'border-transparent theme-text-secondary hover:theme-text-primary'
              }`}
          >
            Sprint Execution & Git Monitor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('architecture')}
            className={`px-3.5 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer ${activeTab === 'architecture'
              ? 'theme-border-brand theme-text-brand font-semibold'
              : 'border-transparent theme-text-secondary hover:theme-text-primary'
              }`}
          >
            Architecture Flowchart (Mermaid)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('green')}
            className={`px-3.5 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer ${activeTab === 'green'
              ? 'theme-border-brand theme-text-brand font-semibold'
              : 'border-transparent theme-text-secondary hover:theme-text-primary'
              }`}
          >
            Green Insights
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gantt')}
            className={`px-3.5 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer ${activeTab === 'gantt'
              ? 'theme-border-brand theme-text-brand font-semibold'
              : 'border-transparent theme-text-secondary hover:theme-text-primary'
              }`}
          >
            Sprint Roadmap (Gantt)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('scaffold')}
            className={`px-3.5 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer ${activeTab === 'scaffold'
              ? 'theme-border-brand theme-text-brand font-semibold'
              : 'border-transparent theme-text-secondary hover:theme-text-primary'
              }`}
          >
            File Scaffold ({project.architecture?.scaffoldTree?.length || 0})
          </button>
        </div>
      </div>

      {loading && !activeProject ? (
        <div className="p-16 flex flex-col items-center justify-center space-y-3">
          <LoadingSpinner className="w-8 h-8 theme-text-brand" />
          <span className="text-xs theme-text-muted">Loading project workspace from MongoDB Atlas...</span>
        </div>
      ) : (
        <>
          {/* View 1: Sprint Schedule + GitHub Sync (Split-Pane 60/40) */}
          {activeTab === 'sprint' && (
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Pane: Daily Schedule Timeline (~60% width) */}
              <section
                className="lg:col-span-7 lg:h-[calc(100vh-21rem)] lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain scrollbar-hidden space-y-6"
                aria-label="Daily Schedule Timeline"
              >
                <ScheduleTimeline
                  tasks={activeTasks}
                  currentDay={project.currentDay || 1}
                  totalDays={project.totalDays || 14}
                  milestone={project.title}
                />
              </section>

              {/* Right Pane: GitHub Sync Panel (~40% width) */}
              <aside
                className="lg:col-span-5 lg:h-[calc(100vh-21rem)] lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain scrollbar-hidden"
                aria-label="GitHub Synchronization Panel"
              >
                <GitHubSyncPanel
                  project={project}
                  repo={repoDisplay}
                  branch={branchDisplay}
                  commits={activeCommits}
                />
              </aside>
            </div>
          )}

          {/* View 2: Full Architecture Flowchart (Mermaid) */}
          {activeTab === 'architecture' && (
            <div className="space-y-6">
              <MermaidViewer
                chart={project.architecture?.mermaidDiagram}
                title={`${project.title} - Architecture Flowchart`}
              />

              {project.architecture?.components?.length > 0 && (
                <div className="theme-card p-5 space-y-4">
                  <h3 className="text-sm font-bold theme-text-primary">
                    Synthesized Architecture Components
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {project.architecture.components.map((comp, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border theme-border-subtle theme-bg-surface-elevated space-y-1"
                      >
                        <div className="flex items-center justify-between text-xs font-semibold theme-text-primary">
                          <span>{comp.name}</span>
                          <span className="text-[10px] font-mono uppercase theme-text-cyan">
                            {comp.type}
                          </span>
                        </div>
                        <p className="text-[11px] theme-text-secondary leading-snug">
                          {comp.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'green' && (
            <GreenInsightsPanel key={project._id || project.id} project={project} />
          )}

          {/* View 3: Sprint Gantt Chart */}
          {activeTab === 'gantt' && (
            <div className="space-y-6">
              <MermaidViewer
                chart={project.roadmap?.mermaidGantt}
                title={`${project.title} - Sprint Timeline`}
              />
            </div>
          )}

          {/* View 4: File Scaffold Hierarchy */}
          {activeTab === 'scaffold' && (
            <div className="theme-card p-6 space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold theme-text-primary">
                  Project File Scaffold Tree
                </h3>
                <p className="text-xs theme-text-secondary">
                  The target file architecture defined by the AI synthesizer. Commits matching these file paths automatically advance scheduled tasks.
                </p>
              </div>

              <div className="p-4 rounded-xl border theme-border-subtle theme-bg-surface-subtle theme-text-primary font-mono text-xs overflow-x-auto space-y-1.5">
                {project.architecture?.scaffoldTree?.length > 0 ? (
                  project.architecture.scaffoldTree.map((path, idx) => (
                    <div key={idx} className="flex items-center gap-2 theme-hover-text-cyan transition-colors">
                      <span className="theme-text-muted">├──</span>
                      <span>{path}</span>
                    </div>
                  ))
                ) : (
                  <div className="theme-text-muted italic">No scaffold tree files defined.</div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Project Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 theme-bg-overlay backdrop-blur-sm animate-in fade-in duration-200">
          <div className="theme-card max-w-md w-full p-6 space-y-5 border theme-border-rose-subtle">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl theme-bg-rose-subtle border theme-border-rose-subtle flex items-center justify-center theme-text-rose shrink-0">
                <TrashIcon className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold theme-text-primary">Delete Project</h3>
                <p className="text-xs theme-text-secondary">
                  Are you sure you want to permanently delete <strong className="theme-text-rose">{project.title}</strong>?
                </p>
              </div>
            </div>

            <p className="text-xs theme-text-muted theme-bg-surface-subtle p-3 rounded-lg border theme-border-subtle">
              ⚠️ This will permanently remove the project, its sprint task schedule, and synced commit history from MongoDB Atlas. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="theme-btn-ghost text-xs px-3.5 py-2 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
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

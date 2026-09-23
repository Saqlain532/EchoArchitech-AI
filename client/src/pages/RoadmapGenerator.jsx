import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SparklesIcon, LoadingSpinner, CheckCircleIcon, GitHubIcon, ChevronLeftIcon } from '../assets/icons';
import { aiApi } from '../services/api';
import { useProject, useAuth } from '../context';
import { MermaidViewer } from '../components/visualizer';
import AuthModal from '../components/auth/AuthModal.jsx';

const GENERATION_STEPS = [
  'Querying Free AI Engine (Gemini / Groq fallback chain)...',
  'Synthesizing system components and Mermaid flowchart architecture...',
  'Scheduling daily tasks, target files, and sprint roadmap...',
  'Generating file scaffold hierarchy and Git tracking manifests...',
];

const SUGGESTED_PROMPTS = [
  'Node.js microservices e-commerce API with Redis edge cache and PostgreSQL',
  'Next.js 15 fullstack SaaS dashboard with role-based auth and TailwindCSS',
  'FastAPI real-time telemetry ingestion engine with TimescaleDB & WebSockets',
  'React 19 AI chat workspace with streaming responses and vector search',
];

export default function RoadmapGenerator() {
  const location = useLocation();
  const [prompt, setPrompt] = useState(location.state?.initialPrompt || '');
  const [totalDays, setTotalDays] = useState(location.state?.totalDays || 14);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [previewData, setPreviewData] = useState(null);
  const [activeTab, setActiveTab] = useState('architecture'); // 'architecture' | 'gantt' | 'tasks' | 'scaffold'

  // Repository selection state (Vercel-style)
  const [selectedRepoUrl, setSelectedRepoUrl] = useState('');
  const [repoSelectMode, setRepoSelectMode] = useState('dropdown'); // 'dropdown' | 'custom'
  const [repoSearch, setRepoSearch] = useState('');
  const [inlineGithub, setInlineGithub] = useState('');
  const [isFetchingRepos, setIsFetchingRepos] = useState(false);

  // Auth Gate & persistence state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorNotice, setErrorNotice] = useState(null);

  const { createProject } = useProject();
  const { user, isAuthenticated, userRepos, fetchRepos } = useAuth();
  const navigate = useNavigate();

  // Cycle through generation steps
  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % GENERATION_STEPS.length);
    }, 900);
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Filter user repos with search query
  const filteredRepos = (userRepos || []).filter((r) => {
    if (!repoSearch.trim()) return true;
    const q = repoSearch.toLowerCase();
    return (
      r.name?.toLowerCase().includes(q) ||
      r.fullName?.toLowerCase().includes(q) ||
      r.language?.toLowerCase().includes(q)
    );
  });

  const handleFetchInlineRepos = async (e) => {
    e.preventDefault();
    if (!inlineGithub.trim()) return;
    setIsFetchingRepos(true);
    try {
      await fetchRepos(inlineGithub.trim());
      setRepoSelectMode('dropdown');
    } finally {
      setIsFetchingRepos(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setCurrentStepIndex(0);
    setErrorNotice(null);

    try {
      const data = await aiApi.previewRoadmap({
        prompt: prompt.trim(),
        options: {
          totalDays: Number(totalDays),
          userRole: user?.role,
        },
      });

      if (data) {
        setPreviewData(data);
      }
    } catch (err) {
      console.warn('AI Synthesis preview error:', err);
      setErrorNotice(err.message || 'AI generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save project to MongoDB Atlas
  const handleSaveProject = async () => {
    if (!previewData) return;

    // Check if user is authenticated; if not, open AuthModal
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    setIsSaving(true);
    try {
      const projectPayload = {
        title: previewData.title || 'EchoArchitech Project',
        description: previewData.description || prompt,
        prompt: prompt,
        architecture: previewData.architecture,
        roadmap: previewData.roadmap,
        repoUrl: selectedRepoUrl.trim(),
        tasks: previewData.roadmap?.tasks || [],
      };

      const created = await createProject(projectPayload);
      if (created) {
        const targetId = created.slug || created._id || created.id;
        navigate(`/project/${targetId}`);
      }
    } catch (err) {
      console.error('Error creating project:', err);
      setErrorNotice('Failed to persist project. Please retry.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] theme-bg-canvas flex flex-col justify-start items-center px-4 py-6">
      <div className="w-full max-w-5xl space-y-8">
        {/* Header / Hero Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium theme-badge">
            <SparklesIcon className="w-3.5 h-3.5 theme-text-brand" />
            <span>AI Architecture & Sprint Synthesizer</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight theme-text-primary">
            {previewData ? 'AI Architecture Blueprint & Sprint Schedule' : 'What do you want to build?'}
          </h1>

          <p className="text-xs sm:text-sm theme-text-secondary max-w-xl mx-auto leading-relaxed">
            {previewData
              ? 'Review the synthesized system architecture and attach your GitHub repository to begin continuous tracking.'
              : 'Describe your application prompt. Our free multi-model AI generates a production-grade architecture blueprint, Mermaid flowchart, and scheduled tasks.'}
          </p>
        </div>

        {errorNotice && (
          <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-500 flex items-center justify-between">
            <span>{errorNotice}</span>
            <button
              type="button"
              onClick={() => setErrorNotice(null)}
              className="text-xs font-bold px-2 py-0.5 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* State A: Prompt Input Form */}
        {!previewData && (
          <div className="theme-card theme-card-glow p-6 space-y-6 max-w-3xl mx-auto">
            <form onSubmit={handleGenerate} className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="project-prompt"
                  className="block text-xs font-semibold uppercase tracking-wider theme-text-muted"
                >
                  Application Specification & Requirements
                </label>

                <textarea
                  id="project-prompt"
                  rows={4}
                  disabled={isGenerating}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the application you want to build (e.g., A Node.js e-commerce API with PostgreSQL, Redis cache, and Stripe checkout)..."
                  className="w-full theme-input resize-none text-xs sm:text-sm leading-relaxed p-4"
                />
              </div>

              {/* Sprint Duration & Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="sprint-duration"
                    className="block text-xs font-semibold uppercase tracking-wider theme-text-muted"
                  >
                    Sprint Duration
                  </label>
                  <select
                    id="sprint-duration"
                    value={totalDays}
                    disabled={isGenerating}
                    onChange={(e) => setTotalDays(Number(e.target.value))}
                    className="w-full theme-input text-xs sm:text-sm py-2 px-3"
                  >
                    <option value={7}>7-Day Rapid Sprint</option>
                    <option value={14}>14-Day Production Sprint (Recommended)</option>
                    <option value={21}>21-Day Comprehensive Sprint</option>
                    <option value={30}>30-Day Enterprise Sprint</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="ai-engine-model"
                    className="block text-xs font-semibold uppercase tracking-wider theme-text-muted"
                  >
                    AI Engine Model
                  </label>
                  <div
                    id="ai-engine-model"
                    className="w-full py-2 px-3 rounded-lg border theme-border-subtle theme-bg-surface-elevated dark:bg-slate-800/40 text-xs theme-text-secondary flex items-center justify-between"
                  >
                    <span>Google Gemini & Groq Free Tier</span>
                    <span className="text-[10px] font-mono text-emerald-500 font-semibold uppercase">
                      Cascading Fallback
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Prompt Suggestions */}
              {!isGenerating && (
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-medium theme-text-muted block">
                    Suggested Archetypes:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_PROMPTS.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setPrompt(suggestion)}
                        className="text-[11px] text-left px-2.5 py-1 rounded-lg border theme-border-subtle theme-bg-surface-elevated theme-text-secondary hover:theme-text-primary hover:theme-border-strong transition-all duration-150 cursor-pointer"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <hr className="theme-divider" />

              {/* Loading State or Submit Button */}
              {isGenerating ? (
                <div className="p-4 rounded-xl border theme-border-subtle theme-bg-surface-elevated space-y-3">
                  <div className="flex items-center gap-3">
                    <LoadingSpinner className="theme-text-brand w-6 h-6" />
                    <span className="text-xs sm:text-sm font-medium theme-text-primary">
                      {GENERATION_STEPS[currentStepIndex]}
                    </span>
                  </div>

                  <div className="w-full h-1.5 rounded-full overflow-hidden theme-bg-surface-subtle">
                    <div
                      className="h-full rounded-full transition-all duration-700 animate-pulse"
                      style={{
                        width: '100%',
                        background: 'var(--gradient-linear)',
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <span className="text-[11px] theme-text-muted">
                    Synthesizes full Mermaid AST blueprint & daily task schedule.
                  </span>

                  <button
                    type="submit"
                    disabled={!prompt.trim() || isGenerating}
                    className="w-full sm:w-auto theme-btn-brand text-xs sm:text-sm py-2.5 px-6 flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <SparklesIcon />
                    <span>Synthesize Architecture & Roadmap</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* State B: Synthesized Preview Dashboard */}
        {previewData && (
          <div className="space-y-6">
            {/* Top Project Overview Card */}
            <div className="theme-card p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight theme-text-primary">
                      {previewData.title}
                    </h2>
                    <span className="theme-badge theme-badge-cyan text-[11px]">
                      {previewData.roadmap?.totalDays || totalDays}-Day Sprint
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm theme-text-secondary mt-1">
                    {previewData.description}
                  </p>
                </div>

                {/* Tech Stack Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  {previewData.architecture?.techStack?.frontend && (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-mono border theme-border-subtle bg-sky-500/10 text-sky-500">
                      FE: {previewData.architecture.techStack.frontend}
                    </span>
                  )}
                  {previewData.architecture?.techStack?.backend && (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-mono border theme-border-subtle bg-emerald-500/10 text-emerald-500">
                      BE: {previewData.architecture.techStack.backend}
                    </span>
                  )}
                  {previewData.architecture?.techStack?.database && (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-mono border theme-border-subtle bg-purple-500/10 text-purple-500">
                      DB: {previewData.architecture.techStack.database}
                    </span>
                  )}
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 border-b theme-border-subtle pt-2 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('architecture')}
                  className={`px-3.5 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer ${activeTab === 'architecture'
                    ? 'border-cyan-500 text-cyan-500 font-semibold'
                    : 'border-transparent theme-text-secondary hover:theme-text-primary'
                    }`}
                >
                  Architecture Diagram (Mermaid)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('gantt')}
                  className={`px-3.5 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer ${activeTab === 'gantt'
                    ? 'border-cyan-500 text-cyan-500 font-semibold'
                    : 'border-transparent theme-text-secondary hover:theme-text-primary'
                    }`}
                >
                  Sprint Timeline (Gantt)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('tasks')}
                  className={`px-3.5 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer ${activeTab === 'tasks'
                    ? 'border-cyan-500 text-cyan-500 font-semibold'
                    : 'border-transparent theme-text-secondary hover:theme-text-primary'
                    }`}
                >
                  Daily Tasks ({previewData.roadmap?.tasks?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('scaffold')}
                  className={`px-3.5 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer ${activeTab === 'scaffold'
                    ? 'border-cyan-500 text-cyan-500 font-semibold'
                    : 'border-transparent theme-text-secondary hover:theme-text-primary'
                    }`}
                >
                  File Scaffold Tree
                </button>
              </div>

              {/* Tab 1: Architecture Flowchart */}
              {activeTab === 'architecture' && (
                <div className="space-y-4 pt-2">
                  <MermaidViewer
                    chart={previewData.architecture?.mermaidDiagram}
                    title="Synthesized Architecture Flowchart"
                  />
                  {previewData.architecture?.components?.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                      {previewData.architecture.components.map((comp, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg border theme-border-subtle bg-slate-50/50 dark:bg-slate-900/30 space-y-1"
                        >
                          <div className="flex items-center justify-between text-xs font-semibold theme-text-primary">
                            <span>{comp.name}</span>
                            <span className="text-[10px] font-mono uppercase text-cyan-500">
                              {comp.type}
                            </span>
                          </div>
                          <p className="text-[11px] theme-text-secondary leading-snug">
                            {comp.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Gantt Chart */}
              {activeTab === 'gantt' && (
                <div className="space-y-2 pt-2">
                  <MermaidViewer
                    chart={previewData.roadmap?.mermaidGantt}
                    title="Sprint Execution Gantt Chart"
                  />
                </div>
              )}

              {/* Tab 3: Daily Tasks Breakdown */}
              {activeTab === 'tasks' && (
                <div className="space-y-3 pt-2">
                  <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                    {previewData.roadmap?.tasks?.map((task, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border theme-border-subtle bg-slate-50/40 dark:bg-slate-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-cyan-500/10 text-cyan-500">
                              Day {task.dayNumber}
                            </span>
                            <h4 className="text-xs sm:text-sm font-semibold theme-text-primary">
                              {task.title}
                            </h4>
                          </div>
                          <p className="text-xs theme-text-secondary leading-relaxed">
                            {task.description}
                          </p>
                          {task.targetFiles?.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              <span className="text-[10px] uppercase font-bold theme-text-muted">
                                Target Files:
                              </span>
                              {task.targetFiles.map((file, fIdx) => (
                                <code
                                  key={fIdx}
                                  className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-slate-200/60 dark:bg-slate-800 text-cyan-600 dark:text-cyan-400"
                                >
                                  {file}
                                </code>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="text-xs font-mono theme-badge theme-badge-emerald">
                            {task.estimate || '2.5h'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 4: Scaffold Tree */}
              {activeTab === 'scaffold' && (
                <div className="pt-2">
                  <div className="p-4 rounded-xl border theme-border-subtle bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto space-y-1">
                    <div className="text-slate-400 pb-2 border-b border-slate-800 mb-2 font-sans font-medium">
                      Project Directory Scaffold Structure
                    </div>
                    {previewData.architecture?.scaffoldTree?.map((path, idx) => (
                      <div key={idx} className="flex items-center gap-2 hover:text-cyan-400 transition-colors">
                        <span className="text-slate-500">├──</span>
                        <span>{path}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Vercel-Style GitHub Repository Selection & Project Handoff */}
            <div className="theme-card p-6 space-y-5 border-cyan-500/30">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b theme-border-subtle pb-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold theme-text-primary flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                    <span>Select Public GitHub Repository (Vercel-Style)</span>
                  </h3>
                  <p className="text-xs theme-text-secondary">
                    Attach your repository to this architecture plan. Our engine monitors commit diffs to advance your scheduled sprint tasks.
                  </p>
                </div>

                {/* Mode Selector Toggle */}
                <div className="flex items-center bg-slate-200/60 dark:bg-slate-800/70 p-0.5 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setRepoSelectMode('dropdown')}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer font-medium ${repoSelectMode === 'dropdown'
                      ? 'bg-white dark:bg-slate-900 theme-text-primary shadow-xs'
                      : 'theme-text-muted hover:theme-text-primary'
                      }`}
                  >
                    Select From My Repos
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepoSelectMode('custom')}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer font-medium ${repoSelectMode === 'custom'
                      ? 'bg-white dark:bg-slate-900 theme-text-primary shadow-xs'
                      : 'theme-text-muted hover:theme-text-primary'
                      }`}
                  >
                    Custom URL
                  </button>
                </div>
              </div>

              {/* MODE 1: Searchable Vercel-Style Dropdown / List */}
              {repoSelectMode === 'dropdown' && (
                <div className="space-y-3">
                  {userRepos && userRepos.length > 0 ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          type="text"
                          value={repoSearch}
                          onChange={(e) => setRepoSearch(e.target.value)}
                          placeholder="    Search repositories (e.g. api, ecommerce, react)..."
                          className="w-full theme-input text-xs py-2 px-3 pl-8"
                        />
                        <span className="absolute left-2.5 top-2.5 text-xs text-slate-400">🔍  </span>
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-1.5 p-1 border theme-border-subtle rounded-xl bg-slate-50/30 dark:bg-slate-900/30">
                        {filteredRepos.map((repo) => {
                          const isSelected = selectedRepoUrl === repo.url;
                          return (
                            <button
                              key={repo.id}
                              type="button"
                              onClick={() => setSelectedRepoUrl(repo.url)}
                              className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all cursor-pointer ${isSelected
                                ? 'bg-cyan-500/10 border border-cyan-500 text-cyan-600 dark:text-cyan-400 font-semibold shadow-xs'
                                : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/60 theme-text-secondary hover:theme-text-primary border border-transparent'
                                }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <GitHubIcon className="w-3.5 h-3.5 shrink-0 opacity-70" />
                                <span className="text-xs font-mono font-medium truncate">
                                  {repo.fullName || repo.name}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0 text-[10px] font-mono">
                                <span className="px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  {repo.language}
                                </span>
                                {repo.stars > 0 && <span>⭐ {repo.stars}</span>}
                                <span className="theme-text-muted">{repo.defaultBranch}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {selectedRepoUrl && (
                        <div className="text-xs theme-text-secondary flex items-center gap-2 pt-1 font-mono">
                          <span className="text-emerald-500 font-bold">✓ Selected:</span>
                          <span className="truncate">{selectedRepoUrl}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* If no repos fetched yet: Prompt to enter GitHub username */
                    <form onSubmit={handleFetchInlineRepos} className="p-4 rounded-xl border border-dashed theme-border-subtle space-y-3 bg-slate-50/30 dark:bg-slate-900/20">
                      <div className="flex items-center gap-2">
                        <GitHubIcon className="w-4 h-4 theme-text-primary" />
                        <span className="text-xs font-semibold theme-text-primary">
                          Load Your Public GitHub Repositories
                        </span>
                      </div>
                      <p className="text-xs theme-text-secondary">
                        Enter your GitHub username to auto-fetch your public repos and select one with 1 click:
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={inlineGithub}
                          onChange={(e) => setInlineGithub(e.target.value)}
                          placeholder="your-github-username"
                          className="flex-1 theme-input text-xs py-2 px-3 font-mono"
                        />
                        <button
                          type="submit"
                          disabled={isFetchingRepos || !inlineGithub.trim()}
                          className="theme-btn-primary text-xs py-2 px-3 cursor-pointer whitespace-nowrap disabled:opacity-80"
                        >
                          {isFetchingRepos ? 'Fetching Repos...' : 'Fetch My Repos'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* MODE 2: Custom URL Input */}
              {repoSelectMode === 'custom' && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider theme-text-muted">
                    Any Public GitHub Repository URL
                  </label>
                  <input
                    type="url"
                    value={selectedRepoUrl}
                    onChange={(e) => setSelectedRepoUrl(e.target.value)}
                    placeholder="https://github.com/username/repository (e.g., https://github.com/facebook/react)"
                    className="w-full theme-input text-xs sm:text-sm py-2 px-3 font-mono"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t theme-border-subtle">
                <button
                  type="button"
                  onClick={() => setPreviewData(null)}
                  className="w-full sm:w-auto theme-btn-primary text-xs px-4 py-2.5 cursor-pointer "
                >
                  <ChevronLeftIcon /> Back to Prompt Specification
                </button>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveProject}
                  className="w-full sm:w-auto theme-btn-brand text-xs sm:text-sm py-2.5 px-6 flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <LoadingSpinner className="w-2 h-2" />
                      <span>Saving to Atlas...</span>
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="w-4 h-4" />
                      <span>Create Project & Start Tracking</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Smart Auth Modal Gating */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        bannerMessage="Sign in or register an account to save your generated architecture and connect your GitHub repository."
        onSuccess={() => {
          setIsAuthModalOpen(false);
          // Auto-resume save after authenticating
          handleSaveProject();
        }}
      />
    </div>
  );
}

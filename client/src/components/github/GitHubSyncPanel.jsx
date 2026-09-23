import React, { useState } from 'react';
import CommitItem from './CommitItem';
import { GitHubIcon, RefreshIcon, GitBranchIcon, SearchIcon, LoadingSpinner } from '../../assets/icons';
import { useProject, useAuth } from '../../context';
import { projectApi } from '../../services/api';

export default function GitHubSyncPanel({
  project,
  repo,
  branch = 'main',
  commits = [],
}) {
  const { syncActiveProject, activeProject, selectProject } = useProject();
  const { user, userRepos, fetchRepos } = useAuth();
  const currentProject = project || activeProject;

  const formatRepoDisplay = (rawRepo, fallback) => {
    if (!rawRepo && !fallback) return 'Not Connected';
    const obj = typeof rawRepo === 'object' ? rawRepo : null;
    const str = typeof rawRepo === 'string' ? rawRepo : (fallback || '');

    if (obj) {
      if (obj.fullName && obj.fullName !== 'undefined/undefined' && !obj.fullName.includes('undefined')) {
        return obj.fullName;
      }
      if (obj.url && !obj.url.includes('undefined/undefined')) {
        const clean = obj.url.replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '').replace(/\/+$/, '');
        if (clean) return clean;
      }
      if (obj.owner && obj.name && obj.owner !== 'undefined') {
        return `${obj.owner}/${obj.name}`;
      }
    }

    if (str && str !== 'undefined/undefined' && !str.includes('undefined')) {
      return str.replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '').replace(/\/+$/, '');
    }

    return 'Not Connected';
  };

  const repoDisplay = formatRepoDisplay(currentProject?.repo, repo);

  const branchDisplay =
    currentProject?.repo?.branch ||
    currentProject?.branch ||
    branch;

  const projectCommits =
    commits.length > 0
      ? commits
      : currentProject?.commits || [];

  const [isSyncing, setIsSyncing] = useState(false);
  const [connectUrl, setConnectUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState(null);
  const [repoMode, setRepoMode] = useState('dropdown'); // 'dropdown' | 'manual'
  const [repoSearch, setRepoSearch] = useState('');
  const [inlineGithub, setInlineGithub] = useState('');
  const [isFetchingRepos, setIsFetchingRepos] = useState(false);

  const handleSync = async () => {
    if (isSyncing || !currentProject) return;
    setIsSyncing(true);
    setSyncFeedback(null);

    const targetId = currentProject._id || currentProject.id;
    try {
      const result = await syncActiveProject(targetId);
      setSyncFeedback(
        result?.tasksCompleted > 0
          ? `Synced! Completed ${result.tasksCompleted} task(s).`
          : 'Repository checked. No new task diffs detected.'
      );
    } catch {
      setSyncFeedback('Sync triggered (polling public commits).');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  const handleConnectRepo = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const url = (connectUrl || '').trim();
    if (!url || !currentProject) return;

    setIsConnecting(true);
    const targetId = currentProject._id || currentProject.id;

    let owner = '';
    let name = '';
    let fullName = '';
    const clean = url.replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '').replace(/\/+$/, '');
    const parts = clean.split('/');
    if (parts.length >= 2) {
      owner = parts[0];
      name = parts[1];
      fullName = `${owner}/${name}`;
    } else {
      fullName = clean;
    }

    try {
      await projectApi.connectRepo(targetId, {
        url,
        owner,
        name,
        fullName: fullName || url,
        branch: 'main',
      });
      await selectProject(targetId);
      setConnectUrl('');
      setSyncFeedback('Repository linked successfully!');
    } catch {
      setSyncFeedback('Failed to link repository.');
    } finally {
      setIsConnecting(false);
      setTimeout(() => setSyncFeedback(null), 3000);
    }
  };

  const isConnected = repoDisplay !== 'Not Connected';

  return (
    <div className="theme-card-elevated p-5 sm:p-6 space-y-6">
      {/* Panel Header */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg theme-bg-surface border theme-border-subtle">
              <GitHubIcon className="w-4 h-4 theme-text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight theme-text-primary">
                GitHub Repository Monitor
              </h3>
              <p className="text-xs theme-text-muted">
                Public commit diff & task scheduler
              </p>
            </div>
          </div>

          <span className="theme-badge theme-badge-emerald text-[11px] font-mono">
            {currentProject?.status || 'Active Sync'}
          </span>
        </div>

        {/* Repository & Branch Metadata Card */}
        <div className="p-3.5 rounded-xl border theme-border-subtle theme-bg-surface space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="theme-text-muted">Public Repository</span>
            <span className="font-mono font-medium theme-text-primary max-w-[200px] truncate" title={repoDisplay}>
              {repoDisplay}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t theme-border-subtle">
            <span className="theme-text-muted flex items-center gap-1.5">
              <GitBranchIcon /> Active Branch
            </span>
            <span className="font-mono theme-text-brand font-medium">
              {branchDisplay}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t theme-border-subtle">
            <span className="theme-text-muted">Sprint Day Tracking</span>
            <span className="theme-badge theme-badge-cyan text-[11px] font-mono">
              Day {currentProject?.currentDay || 1} of {currentProject?.totalDays || 14}
            </span>
          </div>
        </div>

        {/* Quick Connect Repo if Not Connected */}
        {!isConnected && (
          <div className="p-4 rounded-xl border border-cyan-500/20 bg-slate-900 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400">
                Link Public GitHub Repository
              </label>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setRepoMode('dropdown')}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${repoMode === 'dropdown'
                    ? 'bg-cyan-500/20 text-cyan-300 font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  GitHub Repos
                </button>
                <span className="text-slate-600">|</span>
                <button
                  type="button"
                  onClick={() => setRepoMode('manual')}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${repoMode === 'manual'
                    ? 'bg-cyan-1000 text-cyan-300 font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  Direct URL
                </button>
              </div>
            </div>

            {repoMode === 'dropdown' ? (
              <div className="space-y-2.5">
                {userRepos && userRepos.length > 0 ? (
                  <>
                    <div className="relative">
                      <SearchIcon className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type="text"
                        value={repoSearch}
                        onChange={(e) => setRepoSearch(e.target.value)}
                        placeholder="   Search your repositories..."
                        className="w-full theme-input text-xs pl-8 pr-3 py-1.5 font-mono"
                      />
                    </div>

                    <div className="max-h-36 overflow-y-auto space-y-1 rounded-lg border theme-border-subtle p-1 bg-slate-850">
                      {userRepos
                        .filter((r) => {
                          if (!r) return false;
                          const q = (repoSearch || '').trim().toLowerCase();
                          if (!q) return true;
                          const name = (r.fullName || r.name || '').toLowerCase();
                          const desc = (r.description || '').toLowerCase();
                          return name.includes(q) || desc.includes(q);
                        })
                        .map((r) => {
                          const repoUrl =
                            r.url ||
                            r.html_url ||
                            (r.fullName ? `https://github.com/${r.fullName}` : '');
                          const isSelected = Boolean(connectUrl && (connectUrl === repoUrl || connectUrl === r.url || connectUrl === r.html_url));
                          return (
                            <button
                              key={r.id || r.name || repoUrl}
                              type="button"
                              onClick={() => setConnectUrl(repoUrl)}
                              className={`w-full text-left p-2 rounded text-xs flex items-center justify-between transition-colors cursor-pointer ${isSelected
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                : 'text-slate-300 hover:bg-slate-800'
                                }`}
                            >
                              <div className="truncate">
                                <div className="font-mono font-medium truncate">{r.fullName || r.name}</div>
                                {r.description && (
                                  <div className="text-[10px] text-slate-400 truncate">{r.description}</div>
                                )}
                              </div>
                              {r.language && (
                                <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 shrink-0">
                                  {r.language}
                                </span>
                              )}
                            </button>
                          );
                        })}
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-400">
                      Fetch public repositories from any GitHub username:
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={inlineGithub}
                        onChange={(e) => setInlineGithub(e.target.value)}
                        placeholder={user?.githubUsername || 'e.g. torvalds, vercel'}
                        className="flex-1 theme-input text-xs py-1.5 px-3 font-mono"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          const target = (inlineGithub || user?.githubUsername || '').trim();
                          if (!target) return;
                          setIsFetchingRepos(true);
                          try {
                            await fetchRepos(target);
                          } finally {
                            setIsFetchingRepos(false);
                          }
                        }}
                        disabled={isFetchingRepos}
                        className="theme-btn-ghost text-xs py-1.5 px-3 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {isFetchingRepos ? <LoadingSpinner className="w-3.5 h-3.5" /> : 'Fetch'}
                      </button>
                    </div>
                  </div>
                )}

                {connectUrl && (
                  <div className="text-[11px] font-mono text-cyan-400 truncate bg-slate-900 p-2 rounded border theme-border-subtle">
                    Selected: {connectUrl}
                  </div>
                )}
              </div>
            ) : (
              <input
                type="url"
                value={connectUrl || ''}
                onChange={(e) => setConnectUrl(e.target.value)}
                placeholder="https://github.com/owner/repository"
                className="w-full theme-input text-xs py-2 px-3 font-mono"
              />
            )}

            <button
              type="button"
              onClick={handleConnectRepo}
              disabled={isConnecting || !connectUrl || !String(connectUrl).trim()}
              className="w-full theme-btn-brand text-xs py-2 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
            >
              {isConnecting ? (
                <>
                  <LoadingSpinner className="w-3.5 h-3.5" />
                  <span>Connecting Repository...</span>
                </>
              ) : (
                <>
                  <GitHubIcon className="w-3.5 h-3.5" />
                  <span>Link This Repository</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Sync Trigger Action Button */}
        <button
          type="button"
          onClick={handleSync}
          disabled={isSyncing || !isConnected}
          className="w-full theme-btn-primary text-xs sm:text-sm py-2.5 flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshIcon
            className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`}
          />
          <span>{isSyncing ? 'Inspecting Commits & Diff Matcher...' : 'Sync Repository Now'}</span>
        </button>

        {syncFeedback && (
          <div className="p-2 rounded bg-cyan-500/10 text-cyan-500 text-xs text-center font-medium animate-fade-in">
            {syncFeedback}
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] theme-text-muted px-1">
          <span>Mode: Public API Polling</span>
          <span>Engine: Active (Port 8000)</span>
        </div>
      </div>

      {/* Commit Stream Feed */}
      <div className="space-y-3 pt-2 border-t theme-border-subtle">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider theme-text-muted">
            Recent Commits ({projectCommits.length})
          </h4>
          <span className="text-[11px] theme-text-muted">
            Continuous Stream
          </span>
        </div>

        <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
          {projectCommits.length > 0 ? (
            projectCommits.map((commit, idx) => (
              <CommitItem
                key={commit._id || commit.hash || idx}
                hash={commit.hash}
                message={commit.message}
                author={commit.author}
                timestamp={commit.timestamp}
                filesChanged={commit.filesChanged || commit.modifiedFiles?.length || 1}
              />
            ))
          ) : (
            <div className="p-4 text-center rounded-lg border border-dashed theme-border-subtle text-xs theme-text-muted">
              No commits recorded yet. Push to your repository or click &quot;Sync Repository Now&quot;.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

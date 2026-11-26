import React, { useCallback, useEffect, useState } from 'react';
import { githubApi } from '../../services/api';
import { LoadingSpinner } from '../../assets/icons';

const impactClasses = {
  high: 'theme-badge theme-text-rose theme-border-rose-subtle theme-bg-rose-subtle',
  medium: 'theme-badge theme-badge-brand',
  low: 'theme-badge theme-badge-emerald',
};

function formatDate(value) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString();
}

export default function GreenInsightsPanel({ project }) {
  const [analyses, setAnalyses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [scanFeedback, setScanFeedback] = useState('');
  const projectId = project?._id || project?.id;

  const loadInsights = useCallback(async (showLoading = true) => {
    if (!projectId) {
      setAnalyses([]);
      setIsLoading(false);
      setError('Project identifier is unavailable.');
      return;
    }

    if (showLoading) setIsLoading(true);
    setError('');
    try {
      const result = await githubApi.getGreenInsights(projectId);
      setAnalyses(Array.isArray(result?.analyses) ? result.analyses : []);
    } catch (err) {
      setError(err.message || 'Could not load Green Insights.');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [projectId]);

  const scanCode = async () => {
    if (!projectId || isScanning) return;

    setIsScanning(true);
    setScanFeedback('');
    setError('');
    try {
      const result = await githubApi.scanGreenInsights(projectId);
      await loadInsights(false);
      const scanned = result?.greenAnalysesScanned || 0;
      const errors = result?.greenAnalysisErrors || 0;
      setScanFeedback(
        errors > 0
          ? `Scanned ${scanned} recent commit(s); ${errors} analysis could not be saved.`
          : scanned > 0
            ? `Scanned code from ${scanned} recent commit(s).`
            : 'No recent commits were available to scan.'
      );
    } catch (err) {
      setError(err.message || 'Could not scan project code.');
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (!projectId) return () => {
      active = false;
    };

    githubApi.getGreenInsights(projectId)
      .then((result) => {
        if (active) {
          setError('');
          setAnalyses(Array.isArray(result?.analyses) ? result.analyses : []);
        }
      })
      .catch((err) => {
        if (active) setError(err.message || 'Could not load Green Insights.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [projectId, project?.updatedAt, project?.repo?.lastSync]);

  const hasRepo = Boolean(
    project?.repo?.fullName ||
    project?.repo?.url ||
    (typeof project?.repo === 'string' && project.repo)
  );

  if (!hasRepo) {
    return (
      <section className="theme-card-elevated p-5 sm:p-6 space-y-3" aria-label="Green Insights">
        <h2 className="text-base font-semibold theme-text-primary">Green Insights</h2>
        <p className="text-sm theme-text-secondary">
          Connect a public GitHub repository and sync its commits first. Then scan recent
          synced Python and JavaScript/TypeScript source files here.
        </p>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="theme-card-elevated p-5 sm:p-6 space-y-3" aria-label="Green Insights">
        <h2 className="text-base font-semibold theme-text-primary">Green Insights</h2>
        <p className="text-sm theme-text-muted" role="status">Loading commit analysis…</p>
      </section>
    );
  }

  return (
    <section className="theme-card-elevated p-5 sm:p-6 space-y-5" aria-label="Green Insights">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold theme-text-primary">Green Insights</h2>
          <p className="mt-1 text-xs theme-text-muted">
            Static CPU-efficiency hints from recent commits. Scan checks up to five recent
            synced commits and ten source files. Impact is relative, not measured energy or carbon;
            lookup structures may use more memory.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={scanCode}
            disabled={isScanning}
            className="theme-btn-brand text-xs px-3 py-1.5 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isScanning && <LoadingSpinner className="h-3.5 w-3.5" />}
            {isScanning ? 'Scanning code…' : 'Scan code'}
          </button>
          <button
            type="button"
            onClick={loadInsights}
            disabled={isScanning}
            className="theme-btn-ghost text-xs px-3 py-1.5 cursor-pointer disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {scanFeedback && (
        <p className="text-xs theme-text-emerald" role="status">{scanFeedback}</p>
      )}

      {error && (
        <div className="p-3 rounded-lg border theme-border-subtle theme-bg-surface text-sm theme-text-secondary">
          <p role="alert">{error}</p>
          <button
            type="button"
            onClick={loadInsights}
            className="mt-2 text-xs theme-text-brand underline cursor-pointer"
          >
            Try again
          </button>
        </div>
      )}

      {!error && analyses.length === 0 && (
        <div className="p-5 rounded-xl border border-dashed theme-border-subtle text-center space-y-2">
          <p className="text-sm font-medium theme-text-primary">No commit analyses yet</p>
          <p className="text-xs theme-text-muted">
            Sync the repository from the Sprint & Git Monitor tab. New commits are analyzed
            for supported source files.
          </p>
        </div>
      )}

      {analyses.map((analysis) => (
        <article
          key={analysis.commitHash}
          className="rounded-xl border theme-border-subtle theme-bg-surface p-4 sm:p-5 space-y-4"
        >
          <header className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-mono text-xs theme-text-brand">
                {analysis.repo} · {analysis.shortHash || analysis.commitHash?.slice(0, 7)}
              </p>
              <h3 className="mt-1 text-sm font-medium theme-text-primary break-words">
                {analysis.message || 'Commit message unavailable'}
              </h3>
              <p className="mt-1 text-[11px] theme-text-muted">
                Analyzed {formatDate(analysis.analyzedAt)} · {analysis.filesAnalyzed || 0} file(s)
              </p>
            </div>
            <span className="theme-badge theme-badge-cyan text-[10px]">
              {analysis.analysisStatus || 'complete'}
            </span>
          </header>

          {analysis.analysisStatus === 'unavailable' && (
            <p className="text-xs theme-text-muted">
              GitHub commit metadata was unavailable, so this commit could not be analyzed.
            </p>
          )}

          {analysis.findings?.length > 0 ? (
            <div className="space-y-3">
              {analysis.findings.map((finding) => (
                <div
                  key={`${finding.filePath}:${finding.line}:${finding.ruleId}`}
                  className="rounded-lg border theme-border-subtle theme-bg-surface-elevated p-3 sm:p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={impactClasses[finding.potentialImpact] || impactClasses.low}>
                      {finding.potentialImpact || 'potential'}
                    </span>
                    <span className="text-[11px] font-mono theme-text-secondary">
                      {finding.filePath}:{finding.line}
                    </span>
                    <span className="text-[10px] uppercase theme-text-muted">
                      {finding.language} · {finding.confidence} confidence
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold theme-text-primary">{finding.title}</h4>
                  <p className="text-xs leading-relaxed theme-text-secondary">{finding.explanation}</p>
                  <p className="text-xs leading-relaxed theme-text-secondary">{finding.suggestion}</p>
                  {finding.example && (
                    <pre className="overflow-x-auto rounded-md theme-bg-surface p-3 text-[11px] theme-text-secondary">
                      <code>{finding.example}</code>
                    </pre>
                  )}
                </div>
              ))}
              {analysis.findingsTruncatedCount > 0 && (
                <p className="text-xs theme-text-muted">
                  Showing {analysis.findings.length} of {analysis.findingCount} findings for this commit.
                </p>
              )}
            </div>
          ) : analysis.analysisStatus !== 'unavailable' ? (
            <p className="text-xs theme-text-secondary">
              No supported inefficiency patterns were detected in the scanned files.
            </p>
          ) : null}

          {analysis.filesSkipped?.length > 0 && (
            <details className="text-xs theme-text-muted">
              <summary className="cursor-pointer">
                {analysis.filesSkippedCount || analysis.filesSkipped.length} file(s) not analyzed
              </summary>
              <ul className="mt-2 space-y-1">
                {analysis.filesSkipped.map((item, index) => (
                  <li key={`${item.filePath}-${index}`} className="break-all">
                    {item.filePath || 'File'} — {item.reason}
                  </li>
                ))}
                {analysis.filesSkippedCount > analysis.filesSkipped.length && (
                  <li>{analysis.filesSkippedCount - analysis.filesSkipped.length} more omitted</li>
                )}
              </ul>
            </details>
          )}
        </article>
      ))}
    </section>
  );
}

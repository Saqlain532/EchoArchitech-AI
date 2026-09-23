import React, { useEffect, useRef, useState, useId, useCallback } from 'react';
import { createPortal } from 'react-dom';
import mermaid from 'mermaid';

export default function MermaidViewer({
  chart,
  title = 'Architecture Diagram',
  className = '',
  allowZoom = true,
  allowCopy = true,
}) {
  const containerRef = useRef(null);
  const fullscreenCanvasRef = useRef(null);
  const [svgContent, setSvgContent] = useState('');
  const [error, setError] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const rawId = useId();
  const renderId = 'mermaid-' + rawId.replace(/[^a-zA-Z0-9_-]/g, '');

  useEffect(() => {
    let isMounted = true;

    const renderDiagram = async () => {
      if (!chart || typeof chart !== 'string' || !chart.trim()) {
        if (isMounted) {
          setSvgContent('');
          setError(null);
        }
        return;
      }
      try {
        setError(null);
        // Determine theme from document or system
        const isDark =
          document.documentElement.classList.contains('dark') ||
          document.documentElement.getAttribute('data-theme') === 'dark';

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          theme: isDark ? 'dark' : 'neutral',
          fontFamily: 'Inter, system-ui, sans-serif',
          gantt: {
            titleTopMargin: 25,
            barHeight: 22,
            barGap: 6,
            topPadding: 50,
            sidePadding: 75,
          },
        });

        // Clean chart code if wrapped in markdown code blocks
        let cleanChart = chart.trim();
        if (cleanChart.startsWith('```mermaid')) {
          cleanChart = cleanChart.replace(/^```mermaid\s*/i, '').replace(/```$/, '').trim();
        } else if (cleanChart.startsWith('```')) {
          cleanChart = cleanChart.replace(/^```\s*/, '').replace(/```$/, '').trim();
        }

        const { svg } = await mermaid.render(renderId, cleanChart);
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err) {
        console.warn('[MermaidViewer]: Render failed for diagram:', err);
        if (isMounted) {
          setError(err.message || 'Unable to render Mermaid diagram');
        }
      }
    };

    renderDiagram();

    return () => {
      isMounted = false;
      // Cleanup temporary mermaid element created in DOM
      const tempElement = document.getElementById(renderId);
      if (tempElement) {
        tempElement.remove();
      }
    };
  }, [chart, renderId]);

  const handleCopy = () => {
    if (!chart) return;
    navigator.clipboard.writeText(chart);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const zoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.2, 3));
  const zoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.2, 0.3));
  const resetZoom = () => setZoomLevel(1);

  const openFullscreen = useCallback(() => {
    setIsFullscreen(true);
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch {
      // Fall back seamlessly to portal modal overlay
    }
  }, []);

  const closeFullscreen = useCallback(() => {
    setIsFullscreen(false);
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch {
      // Ignored
    }
  }, []);

  // Listen to native browser fullscreen changes (e.g. user hits ESC or F11)
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isFullscreen]);

  // Handle ESC key press and scroll locking when in fullscreen
  useEffect(() => {
    if (!isFullscreen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeFullscreen();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, closeFullscreen]);

  return (
    <>
      {/* Standard In-Page Card */}
      <div className={`theme-card flex flex-col overflow-hidden transition-all duration-300 ${className}`}>
        {/* Viewer Header / Toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b theme-border-subtle bg-slate-50/50 dark:bg-slate-900/40 text-xs">
          <div className="flex items-center gap-2 font-medium theme-text-primary">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
            <span>{title}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {allowZoom && (
              <div className="flex items-center bg-slate-200/50 dark:bg-slate-800/60 rounded px-1 py-0.5 space-x-1">
                <button
                  type="button"
                  onClick={zoomOut}
                  title="Zoom Out"
                  className="p-1 hover:text-cyan-500 transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={resetZoom}
                  title="Reset Zoom"
                  className="text-[11px] font-mono px-1 hover:text-cyan-500 cursor-pointer"
                >
                  {Math.round(zoomLevel * 100)}%
                </button>
                <button
                  type="button"
                  onClick={zoomIn}
                  title="Zoom In"
                  className="p-1 hover:text-cyan-500 transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            )}

            {allowCopy && (
              <button
                type="button"
                onClick={handleCopy}
                title="Copy Mermaid Code"
                className="p-1.5 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 theme-text-secondary hover:theme-text-primary transition-colors cursor-pointer"
              >
                {copied ? (
                  <span className="text-[11px] text-emerald-500 font-medium">Copied!</span>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={openFullscreen}
              title="Fullscreen"
              className="p-1.5 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 theme-text-secondary hover:theme-text-primary transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Diagram Canvas */}
        <div
          ref={containerRef}
          className="relative flex-1 overflow-auto p-4 min-h-[220px] max-h-[550px] flex items-center justify-center bg-slate-50/20 dark:bg-slate-950/20 [&_svg]:max-w-full [&_svg]:h-auto"
        >
          {error ? (
            <div className="text-center p-6 space-y-2">
              <span className="text-xs text-rose-500 font-semibold block">
                Mermaid Diagram Preview Unavailable
              </span>
              <pre className="text-[11px] text-left max-w-md overflow-x-auto bg-slate-100 dark:bg-slate-800 p-3 rounded font-mono theme-text-secondary">
                {chart}
              </pre>
            </div>
          ) : svgContent ? (
            <div
              className="transition-transform duration-150 ease-out origin-center"
              style={{ transform: `scale(${zoomLevel})` }}
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-xs theme-text-muted space-y-2">
              <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Rendering visual blueprint...</span>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Portal Overlay: Escapes any parent card, overflow, or transform */}
      {isFullscreen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex flex-col p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <div className="w-full h-full flex flex-col rounded-2xl border theme-border theme-bg-surface-elevated shadow-2xl overflow-hidden bg-white dark:bg-slate-900">
              {/* Fullscreen Toolbar */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b theme-border-subtle bg-slate-50/70 dark:bg-slate-900/70 text-xs sm:text-sm">
                <div className="flex items-center gap-2.5 font-semibold theme-text-primary min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse shrink-0"></span>
                  <span className="truncate">{title}</span>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono border theme-border-subtle bg-cyan-500/10 text-cyan-500 font-medium shrink-0">
                    Fullscreen Mode
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {allowZoom && (
                    <div className="flex items-center bg-slate-200/60 dark:bg-slate-800/80 rounded-lg px-2 py-1 space-x-1.5">
                      <button
                        type="button"
                        onClick={zoomOut}
                        title="Zoom Out"
                        className="p-1 hover:text-cyan-500 transition-colors cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={resetZoom}
                        title="Reset Zoom"
                        className="text-xs font-mono px-1.5 hover:text-cyan-500 cursor-pointer"
                      >
                        {Math.round(zoomLevel * 100)}%
                      </button>
                      <button
                        type="button"
                        onClick={zoomIn}
                        title="Zoom In"
                        className="p-1 hover:text-cyan-500 transition-colors cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={resetZoom}
                        title="Reset to 100%"
                        className="text-[11px] font-medium px-1.5 py-0.5 rounded hover:bg-slate-300/60 dark:hover:bg-slate-700 theme-text-secondary transition-colors cursor-pointer"
                      >
                        Fit
                      </button>
                    </div>
                  )}

                  {allowCopy && (
                    <button
                      type="button"
                      onClick={handleCopy}
                      title="Copy Mermaid Code"
                      className="px-2.5 py-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 theme-text-secondary hover:theme-text-primary transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                    >
                      {copied ? (
                        <span className="text-emerald-500 font-semibold">Copied!</span>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span className="hidden sm:inline">Copy Code</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={closeFullscreen}
                    title="Exit Fullscreen (Esc)"
                    className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Close</span>
                    <kbd className="hidden sm:inline-block px-1 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-400 font-mono">
                      ESC
                    </kbd>
                  </button>
                </div>
              </div>

              {/* Fullscreen Canvas - Fills 100% available space with scroll / pan support */}
              <div
                ref={fullscreenCanvasRef}
                className="relative flex-1 w-full h-full min-h-0 overflow-auto p-6 sm:p-8 flex items-center justify-center bg-slate-50/30 dark:bg-slate-950/40 [&_svg]:max-w-full [&_svg]:h-auto"
              >
                {error ? (
                  <div className="text-center p-6 space-y-2">
                    <span className="text-sm text-rose-500 font-semibold block">
                      Mermaid Diagram Preview Unavailable
                    </span>
                    <pre className="text-xs text-left max-w-xl overflow-x-auto bg-slate-100 dark:bg-slate-800 p-4 rounded font-mono theme-text-secondary">
                      {chart}
                    </pre>
                  </div>
                ) : svgContent ? (
                  <div
                    className="transition-transform duration-150 ease-out origin-center flex items-center justify-center min-w-full min-h-full"
                    style={{ transform: `scale(${zoomLevel})` }}
                    dangerouslySetInnerHTML={{ __html: svgContent }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-sm theme-text-muted space-y-3">
                    <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Rendering visual blueprint...</span>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

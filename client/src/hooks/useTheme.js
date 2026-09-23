import { useState, useEffect } from 'react';

/**
 * Custom hook to manage theme state, system preference listening, and DOM updates.
 * Easily reusable across any component in the application.
 */
export function useTheme(defaultTheme = 'system', storageKey = 'app-theme') {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === 'undefined') return defaultTheme;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    } catch {
      // Ignore localStorage access errors
    }
    return defaultTheme;
  });

  const [resolvedTheme, setResolvedTheme] = useState('dark');

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const computeResolved = (currentTheme) => {
      if (currentTheme === 'system') {
        return mediaQuery.matches ? 'dark' : 'light';
      }
      return currentTheme;
    };

    const applyTheme = (targetTheme, withTransition = true) => {
      const resolved = computeResolved(targetTheme);
      setResolvedTheme(resolved);

      if (withTransition) {
        root.classList.add('theme-transitioning');
      }

      if (resolved === 'dark') {
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
      } else {
        root.classList.remove('dark');
        root.setAttribute('data-theme', 'light');
      }

      if (withTransition) {
        const timeout = setTimeout(() => {
          root.classList.remove('theme-transitioning');
        }, 250);
        return () => clearTimeout(timeout);
      }
    };

    const cleanupTransition = applyTheme(theme, true);

    const handleSystemChange = () => {
      if (theme === 'system') {
        applyTheme('system', true);
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => {
      mediaQuery.removeEventListener('change', handleSystemChange);
      if (cleanupTransition) cleanupTransition();
    };
  }, [theme]);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(storageKey, newTheme);
    } catch {
      // Ignore storage errors
    }
  };

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    isDark: resolvedTheme === 'dark',
  };
}

export default useTheme;

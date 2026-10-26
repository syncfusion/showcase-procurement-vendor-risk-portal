// Theme provider: exactly light/dark, persisted in localStorage, applied to <html data-theme>.
// EJ2 Tailwind 3 ships light tokens on :root and dark tokens under .e-dark-mode.
// The pure React grid follows .sf-dark-mode. Both classes sit on <html> so portaled popups inherit them.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'procurement-vendor-risk-portal-theme';

export interface ThemeValue { theme: 'light' | 'dark'; toggle: () => void; ready: boolean }

const ThemeContext = createContext<ThemeValue>({ theme: 'light', toggle: () => {}, ready: false });

function current(): 'light' | 'dark' {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch { return 'light'; }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(current);
  // EJ2 CSS is imported with the app module, so the shell can render on the first commit.
  const ready = true;

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle('sf-dark-mode', theme === 'dark');
    root.classList.toggle('e-dark-mode', theme === 'dark');
    try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* blocked */ }
  }, [theme]);

  const toggle = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  return <ThemeContext.Provider value={{ theme, toggle, ready }}>{children}</ThemeContext.Provider>;
}

export const useTheme = (): ThemeValue => useContext(ThemeContext);
'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

type Theme = 'dark' | 'light';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  // Sync with whatever the pre-paint script already applied to <html>
  useEffect(() => {
    const current = (document.documentElement.dataset.theme as Theme) || 'dark';
    setTheme(current);
    setMounted(true);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* ignore storage errors (private mode, etc.) */
    }
  };

  // Avoid hydration mismatch: render a stable placeholder until mounted
  const isLight = theme === 'light';

  return (
    <button
      type="button"
      onClick={toggle}
      className="theme-toggle"
      aria-label={isLight ? 'Ativar tema escuro' : 'Ativar tema claro'}
      title={isLight ? 'Tema escuro' : 'Tema claro'}
      suppressHydrationWarning
    >
      {mounted && isLight ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}

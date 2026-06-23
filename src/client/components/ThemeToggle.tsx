'use client';

import React, { useSyncExternalStore } from 'react';
import { Sun, Moon } from 'lucide-react';
import { applyTheme, readClientTheme, type Theme } from '@/shared/theme';

function getTheme(): Theme {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

function subscribeToTheme(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  return () => observer.disconnect();
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeToTheme, getTheme, () => 'dark');
  const isLight = theme === 'light';

  const toggle = () => {
    const next: Theme = readClientTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="theme-toggle"
      aria-label={isLight ? 'Ativar tema escuro' : 'Ativar tema claro'}
      title={isLight ? 'Tema escuro' : 'Tema claro'}
      suppressHydrationWarning
    >
      {isLight ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}

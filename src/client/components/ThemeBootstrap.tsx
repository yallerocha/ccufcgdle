'use client';

import { useEffect } from 'react';
import { applyTheme, isTheme, THEME_STORAGE_KEY } from '@/shared/theme';

/** Re-sync theme after hydration (localStorage vs cookie) and paint body in strict WebViews. */
export default function ThemeBootstrap() {
  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      const fromDom = document.documentElement.dataset.theme;
      const theme = isTheme(stored) ? stored : isTheme(fromDom) ? fromDom : 'dark';
      applyTheme(theme);
    } catch {
      applyTheme('dark');
    }
  }, []);

  return null;
}

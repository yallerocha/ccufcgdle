'use client';

import React, { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n, { SUPPORTED_LANGS, type Lang } from './config';

export const LANG_STORAGE_KEY = 'lang';

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  // Apply the persisted language only after mount, so the initial client render
  // matches the server ('pt') and we don't trip hydration warnings.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LANG_STORAGE_KEY) as Lang | null;
      if (stored && SUPPORTED_LANGS.includes(stored) && stored !== i18n.language) {
        i18n.changeLanguage(stored);
        document.documentElement.lang = stored;
      }
    } catch {
      /* ignore storage errors (private mode, etc.) */
    }
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

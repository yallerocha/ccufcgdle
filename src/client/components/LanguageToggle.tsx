'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { LANG_STORAGE_KEY } from '@/client/i18n/I18nProvider';
import type { Lang } from '@/client/i18n/config';

export default function LanguageToggle() {
  const { i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const current: Lang = i18n.language?.startsWith('en') ? 'en' : 'pt';
  const next: Lang = current === 'pt' ? 'en' : 'pt';

  const change = () => {
    i18n.changeLanguage(next);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next);
      document.documentElement.lang = next;
    } catch {
      /* ignore storage errors */
    }
  };

  return (
    <button
      type="button"
      onClick={change}
      className="theme-toggle lang-toggle"
      aria-label={next === 'en' ? 'Switch to English' : 'Mudar para Português'}
      title={next === 'en' ? 'English' : 'Português'}
      suppressHydrationWarning
    >
      <Languages size={16} />
      <span>{(mounted ? current : 'pt').toUpperCase()}</span>
    </button>
  );
}

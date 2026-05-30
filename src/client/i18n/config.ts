'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { pt } from './locales/pt';
import { en } from './locales/en';

export const SUPPORTED_LANGS = ['pt', 'en'] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

// Initialize once. We deliberately pin the initial language to 'pt' (the SSR
// default) so the server render and the first client render match — the stored
// preference is applied in I18nProvider after mount to avoid hydration errors.
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      pt: { translation: pt },
      en: { translation: en },
    },
    lng: 'pt',
    fallbackLng: 'pt',
    supportedLngs: SUPPORTED_LANGS as unknown as string[],
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

export default i18n;

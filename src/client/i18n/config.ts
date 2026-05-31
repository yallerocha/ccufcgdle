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

// Always (re)apply the latest bundles. The i18n instance is a process-level
// singleton initialized only once, so without this an HMR edit to a locale file
// would not reach the already-initialized server instance — making SSR render
// raw keys while the freshly-loaded client renders translations (hydration
// mismatch). Re-adding the bundles on every module evaluation keeps SSR and
// client in sync without a dev-server restart. (No-op cost in production.)
i18n.addResourceBundle('pt', 'translation', pt, true, true);
i18n.addResourceBundle('en', 'translation', en, true, true);

export default i18n;

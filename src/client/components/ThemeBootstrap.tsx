'use client';

import { useLayoutEffect } from 'react';
import { applyTheme, readClientTheme } from '@/shared/theme';

/**
 * Re-apply theme immediately after React hydration.
 * Server HTML must not set data-theme (otherwise hydration reverts the head script).
 */
export default function ThemeBootstrap() {
  useLayoutEffect(() => {
    applyTheme(readClientTheme());
  }, []);

  return null;
}

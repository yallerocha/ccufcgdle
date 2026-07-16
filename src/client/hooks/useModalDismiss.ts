'use client';

import { useEffect, useRef } from 'react';

// Shared dismiss behavior for overlay modals: while `active`, pressing Escape
// closes the modal and the page behind it stops scrolling. Mirrors the nav
// drawer's rules so every layered surface on the site behaves the same way.
export function useModalDismiss(active: boolean, onClose?: () => void) {
  // Keep the latest onClose without re-binding the listener every render.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current?.();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [active]);
}

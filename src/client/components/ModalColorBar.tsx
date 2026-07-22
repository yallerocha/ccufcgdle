'use client';

import React from 'react';

/** Gold studio strip for modal footers (default) or header strip (--top). */
export function ModalColorBar({ position = 'bottom' }: { position?: 'bottom' | 'top' }) {
  const bar = <div className="brand-gradient-bg" style={{ flex: 1 }} />;

  if (position === 'top') {
    return <div className="modal-color-bar modal-color-bar--top">{bar}</div>;
  }

  return <div className="modal-color-bar">{bar}</div>;
}

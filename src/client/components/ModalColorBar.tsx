'use client';

import React from 'react';

/** Brand gradient strip + gray footer band for modal footers (default) or header strip (--top). */
export function ModalColorBar({ position = 'bottom' }: { position?: 'bottom' | 'top' }) {
  const stripes = (
    <>
      <div style={{ backgroundColor: 'var(--brand-teal)' }} />
      <div style={{ backgroundColor: 'var(--brand-blue)' }} />
      <div style={{ backgroundColor: 'var(--brand-purple)' }} />
      <div style={{ backgroundColor: 'var(--brand-magenta)' }} />
      <div style={{ backgroundColor: 'var(--brand-red)' }} />
      <div style={{ backgroundColor: 'var(--brand-orange)' }} />
    </>
  );

  if (position === 'top') {
    return (
      <div className="modal-color-bar modal-color-bar--top">
        {stripes}
      </div>
    );
  }

  return (
    <div className="modal-footer-bars">
      <div className="modal-color-bar">{stripes}</div>
      <div className="modal-gray-bar" aria-hidden="true" />
    </div>
  );
}

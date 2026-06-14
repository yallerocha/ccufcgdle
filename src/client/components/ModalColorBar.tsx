'use client';

import React from 'react';

/** LSD gradient strip + gray footer band for modal footers (default) or header strip (--top). */
export function ModalColorBar({ position = 'bottom' }: { position?: 'bottom' | 'top' }) {
  const stripes = (
    <>
      <div style={{ backgroundColor: 'var(--lsd-teal)' }} />
      <div style={{ backgroundColor: 'var(--lsd-blue)' }} />
      <div style={{ backgroundColor: 'var(--lsd-purple)' }} />
      <div style={{ backgroundColor: 'var(--lsd-magenta)' }} />
      <div style={{ backgroundColor: 'var(--lsd-red)' }} />
      <div style={{ backgroundColor: 'var(--lsd-orange)' }} />
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

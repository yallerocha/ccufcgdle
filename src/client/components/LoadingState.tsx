'use client';

import React from 'react';

interface LoadingStateProps {
  message?: string;
  /** Min height of the area (e.g. '60vh' for full-page loads). */
  minHeight?: string;
}

/** Unified loading indicator: spinner + optional message. */
export function LoadingState({ message, minHeight }: LoadingStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        minHeight,
      }}
    >
      <div className="loading-spinner" />
      {message && <p style={{ marginTop: '1.25rem', color: 'var(--text-muted)' }}>{message}</p>}
    </div>
  );
}

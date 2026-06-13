'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, RotateCw } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

/**
 * Inline error block with an optional retry action. Used instead of a transient
 * toast when the failure means the page has no data to show (otherwise the
 * empty state would wrongly suggest "no results").
 */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { t } = useTranslation();
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <AlertTriangle size={32} style={{ color: 'var(--color-partial)' }} />
      <p style={{ color: 'var(--text-muted)' }}>{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary" onClick={onRetry} style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem' }}>
          <RotateCw size={15} /> {t('common.retry')}
        </button>
      )}
    </div>
  );
}

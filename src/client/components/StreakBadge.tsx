'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Flame } from 'lucide-react';

export interface StreakInfo {
  current: number;
  best: number;
}

// Compact streak display for the result modals: current run + all-time best.
export function StreakBadge({ streak }: { streak: StreakInfo }) {
  const { t } = useTranslation();
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.25rem',
        padding: '0.6rem 0.75rem',
        borderRadius: 'var(--border-radius)',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border-color)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <Flame size={20} style={{ color: streak.current > 0 ? 'var(--lsd-orange)' : 'var(--text-dim)' }} />
        <span style={{ fontWeight: 800, fontSize: '1.3rem' }}>{streak.current}</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('streak.label')}</span>
      </div>
      <div style={{ width: 1, height: '1.6rem', backgroundColor: 'var(--border-color)' }} />
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('streak.best')}</span>
        <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{streak.best}</span>
      </div>
    </div>
  );
}

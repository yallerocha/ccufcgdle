'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Share2 } from 'lucide-react';

interface VictoryModalProps {
  show: boolean;
  targetName: string;
  targetPhoto: string;
  attempts: number;
  guesses: any[];
  shareSuccess: boolean;
  onShare: () => void;
  onClose: () => void;
  todayStr: string;
}

export function VictoryModal({
  show,
  targetName,
  targetPhoto,
  attempts,
  guesses,
  shareSuccess,
  onShare,
  onClose,
  todayStr,
}: VictoryModalProps) {
  const { t } = useTranslation();
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <Trophy size={48} style={{ color: 'var(--color-partial)', margin: '0 auto 1rem auto' }} />
        <h2 className="modal-title">{t('victory.title')}</h2>
        <p className="modal-subtitle">
          {t('victory.subtitlePre')}<strong>{targetName}</strong>!
        </p>

        {targetPhoto && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <img 
              src={targetPhoto} 
              alt={targetName} 
              style={{ 
                width: '120px', 
                height: '120px', 
                borderRadius: '50%', 
                objectFit: 'cover', 
                border: '3px solid var(--primary)',
                boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)' 
              }} 
            />
          </div>
        )}

        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-val">{attempts}</div>
            <div className="stat-lbl">{t('victory.attempts')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">{todayStr.split('-').reverse().slice(0, 2).join('/')}</div>
            <div className="stat-lbl">{t('victory.gameDate')}</div>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            {t('victory.gridPreview')}
          </p>
          <div className="share-blocks">
            {guesses.map((guess, idx) => {
              return Object.entries(guess.fields)
                .filter(([key]) => key !== 'name')
                .map(([_, f]: any) => {
                  if (f.result === 'correct') return '🟩';
                  if (f.result === 'higher' || f.result === 'lower') return '🟧';
                  return '⬛';
                })
                .join('');
            }).join('\n')}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button onClick={onShare} className="btn" style={{ width: '100%' }}>
            <Share2 size={18} />
            {shareSuccess ? t('victory.copied') : t('victory.share')}
          </button>
          <button onClick={onClose} className="btn btn-secondary">
            {t('victory.back')}
          </button>
        </div>
      </div>
    </div>
  );
}

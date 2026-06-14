'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Trophy, Frown, Clock } from 'lucide-react';
import { apiFetch } from '@/client/lib/api';
import { StreakBadge, type StreakInfo } from '@/client/components/StreakBadge';
import { ModalColorBar } from '@/client/components/ModalColorBar';

interface RankingEntry {
  rank: number;
  name: string;
  photoUrl?: string | null;
  attempts: number;
  durationMs: number;
}

function formatDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return m > 0 ? `${m}m ${s.toString().padStart(2, '0')}s` : `${s}s`;
}

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

interface ForcaResultModalProps {
  show: boolean;
  won: boolean;
  word: string;
  wrong: number;
  maxWrong: number;
  personName?: string | null;
  streak?: StreakInfo | null;
  todayStr: string;
  onClose: () => void;
}

export function ForcaResultModal({ show, won, word, wrong, maxWrong, personName, streak, todayStr, onClose }: ForcaResultModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [rankingPreview, setRankingPreview] = useState<RankingEntry[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (show && todayStr) {
      apiFetch(`/api/forca/ranking?date=${todayStr}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.ranking) setRankingPreview(data.ranking.slice(0, 3));
        })
        .catch((err) => console.error('Error loading forca ranking preview:', err));
    }
  }, [show, todayStr]);

  if (!show || !mounted) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-has-bottom-bar" onClick={(e) => e.stopPropagation()}>
        <div className="modal-body">
        {won ? (
          <Trophy size={48} style={{ color: 'var(--color-partial)', margin: '0 auto 1rem auto' }} />
        ) : (
          <Frown size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem auto' }} />
        )}

        <h2 className="modal-title">
          {won ? t('forca.modal.winTitle') : t('forca.modal.lossTitle')}
          <span className="modal-emoji"> {won ? '🎉' : '💀'}</span>
        </h2>
        {personName && (
          <p style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            {won
              ? t('forca.modal.savedPerson', { name: personName })
              : t('forca.modal.hangedPerson', { name: personName })}
          </p>
        )}
        <p className="modal-subtitle">
          {t('forca.modal.answerWas')} <strong>{word}</strong>
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div className="stat-grid" style={{ marginBottom: 0, width: '100%' }}>
            <div className="stat-card">
              <div className="stat-val">{wrong}/{maxWrong}</div>
              <div className="stat-lbl">{t('forca.modal.errors')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-val">{todayStr.split('-').reverse().slice(0, 2).join('/')}</div>
              <div className="stat-lbl">{t('forca.modal.date')}</div>
            </div>
          </div>

          {streak && <StreakBadge streak={streak} />}

          <Link href="/forca/ranking" className="ranking-preview-card" style={{
            padding: '0.75rem',
            borderRadius: 'var(--border-radius)',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-color)',
            textDecoration: 'none',
            color: 'inherit',
            textAlign: 'left',
          }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
              <Trophy size={14} style={{ color: 'var(--color-partial)' }} />
              {t('forca.modal.rankingTitle')}
            </h3>
            {rankingPreview.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {rankingPreview.map((entry) => (
                  <div key={entry.rank} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.25rem 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontWeight: 700, minWidth: '1.25rem', textAlign: 'center' }}>
                        {MEDALS[entry.rank] || `${entry.rank}.`}
                      </span>
                      {entry.photoUrl ? (
                        <img src={entry.photoUrl} alt={entry.name} style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 700 }}>
                          {entry.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '110px' }}>
                        {entry.name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      <span>{entry.attempts} {t('forca.modal.errorsShort')}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.1rem' }}>
                        <Clock size={10} /> {formatDuration(entry.durationMs)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70px', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '6px', padding: '0.5rem' }}>
                {t('forca.modal.rankingEmpty')}
              </div>
            )}
          </Link>
        </div>

        <button onClick={onClose} className="btn btn-secondary" style={{ width: '100%' }}>
          {t('forca.modal.close')}
        </button>
        </div>
        <ModalColorBar />
      </div>
    </div>,
    document.body
  );
}

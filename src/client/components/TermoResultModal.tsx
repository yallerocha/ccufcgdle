'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Trophy, Frown, Clock } from 'lucide-react';
import { apiFetch } from '@/client/lib/api';

type LetterResult = 'correct' | 'present' | 'absent';

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
const EMOJI: Record<LetterResult, string> = { correct: '🟩', present: '🟨', absent: '⬛' };

interface TermoResultModalProps {
  show: boolean;
  won: boolean;
  word: string;
  attempts: number;
  maxAttempts: number;
  results: LetterResult[][];
  todayStr: string;
  onClose: () => void;
}

export function TermoResultModal({
  show,
  won,
  word,
  attempts,
  maxAttempts,
  results,
  todayStr,
  onClose,
}: TermoResultModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [rankingPreview, setRankingPreview] = useState<RankingEntry[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (show && todayStr) {
      apiFetch(`/api/termo/ranking?date=${todayStr}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.ranking) setRankingPreview(data.ranking.slice(0, 3));
        })
        .catch((err) => console.error('Error loading termo ranking preview:', err));
    }
  }, [show, todayStr]);

  if (!show || !mounted) return null;

  const emojiGrid = results.map((row) => row.map((r) => EMOJI[r]).join('')).join('\n');

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-color-bar">
          <div style={{ backgroundColor: 'var(--lsd-teal)' }} />
          <div style={{ backgroundColor: 'var(--lsd-blue)' }} />
          <div style={{ backgroundColor: 'var(--lsd-purple)' }} />
          <div style={{ backgroundColor: 'var(--lsd-magenta)' }} />
          <div style={{ backgroundColor: 'var(--lsd-red)' }} />
          <div style={{ backgroundColor: 'var(--lsd-orange)' }} />
        </div>

        {won ? (
          <Trophy size={48} style={{ color: 'var(--color-partial)', margin: '0 auto 1rem auto' }} />
        ) : (
          <Frown size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem auto' }} />
        )}

        <h2 className="modal-title">
          {won ? t('termo.modal.winTitle') : t('termo.modal.lossTitle')}
          {won && <span className="modal-emoji"> 🎉</span>}
        </h2>
        <p className="modal-subtitle">
          {t('termo.modal.answerWas')} <strong>{word}</strong>
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div className="stat-grid" style={{ marginBottom: 0, width: '100%' }}>
            <div className="stat-card">
              <div className="stat-val">{won ? `${attempts}/${maxAttempts}` : `X/${maxAttempts}`}</div>
              <div className="stat-lbl">{t('termo.modal.attempts')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-val">{todayStr.split('-').reverse().slice(0, 2).join('/')}</div>
              <div className="stat-lbl">{t('termo.modal.date')}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'stretch', flexWrap: 'wrap' }}>
            {/* Emoji grid of the result */}
            <div style={{ flex: '1 1 120px', display: 'flex' }}>
              <div style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 'var(--border-radius)',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{ whiteSpace: 'pre', fontFamily: 'monospace', fontSize: '1rem', lineHeight: '1.4' }}>
                  {emojiGrid}
                </div>
              </div>
            </div>

            {/* Today's ranking preview */}
            <Link href="/termo/ranking" className="ranking-preview-card" style={{
              flex: '1.2 1 160px',
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
                {t('termo.modal.rankingTitle')}
              </h3>
              {rankingPreview.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {rankingPreview.map((entry) => (
                    <div key={entry.rank} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.25rem 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontWeight: 700, minWidth: '1.25rem', textAlign: 'center' }}>
                          {MEDALS[entry.rank] || `${entry.rank}.`}
                        </span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90px' }}>
                          {entry.name}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        <span>{entry.attempts}x</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.1rem' }}>
                          <Clock size={10} /> {formatDuration(entry.durationMs)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80px', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '6px', padding: '0.5rem' }}>
                  {t('termo.modal.rankingEmpty')}
                </div>
              )}
            </Link>
          </div>
        </div>

        <button onClick={onClose} className="btn btn-secondary" style={{ width: '100%' }}>
          {t('termo.modal.close')}
        </button>
      </div>
    </div>,
    document.body
  );
}

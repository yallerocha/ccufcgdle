'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Trophy, Clock, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { apiFetch } from '@/client/lib/api';

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

interface VictoryModalProps {
  show: boolean;
  targetName: string;
  targetPhoto: string;
  attempts: number;
  guesses: any[];
  onShareImage: () => void;
  imageSharing: boolean;
  onClose: () => void;
  todayStr: string;
}

export function VictoryModal({
  show,
  targetName,
  targetPhoto,
  attempts,
  guesses,
  onShareImage,
  imageSharing,
  onClose,
  todayStr,
}: VictoryModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [rankingPreview, setRankingPreview] = useState<RankingEntry[]>([]);
  const [loadingRanking, setLoadingRanking] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (show && todayStr) {
      setLoadingRanking(true);
      apiFetch(`/api/game/ranking?date=${todayStr}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.ranking) {
            setRankingPreview(data.ranking.slice(0, 3));
          }
          setLoadingRanking(false);
        })
        .catch((err) => {
          console.error('Error loading ranking preview:', err);
          setLoadingRanking(false);
        });
    }
  }, [show, todayStr]);

  if (!show || !mounted) return null;

  // Render through a portal on <body> so the fixed overlay isn't trapped by the
  // transformed `main.fade-in` ancestor and can span the full viewport.
  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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

      <div style={{
        display: 'flex',
        gap: '0.75rem',
        marginBottom: '1.5rem',
        alignItems: 'stretch',
        flexWrap: 'wrap',
        textAlign: 'left'
      }}>
        {/* Left Side: Grid Preview */}
        <div style={{
          flex: '1 1 120px',
          padding: '0.75rem',
          borderRadius: 'var(--border-radius)',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
            {t('victory.gridPreview')}
          </p>
          <div className="share-blocks" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {(() => {
              const MAX_ROWS = 6;
              const overflow = guesses.length > MAX_ROWS ? guesses.length - MAX_ROWS : 0;
              // Get the last 6 guesses and reverse them so latest is at the top (matches the board)
              const visibleGuesses = [...(overflow > 0 ? guesses.slice(-MAX_ROWS) : guesses)].reverse();
              const keysOrder = ['gender', 'role', 'entrySemester', 'area', 'projects', 'isColab', 'likesCoffee'];
              const rows = visibleGuesses.map((guess: any) => {
                return keysOrder
                  .map(key => {
                    const f = guess.fields[key];
                    if (f.result === 'correct') return '🟩';
                    if (f.result === 'higher' || f.result === 'lower' || f.result === 'partial') return '🟧';
                    return '⬛';
                  })
                  .join('');
              }).join('\n');
              return (
                <>
                  <div style={{ whiteSpace: 'pre', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: '1.4' }}>
                    {rows}
                  </div>
                  {overflow > 0 && (
                    <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: '1.4', textAlign: 'center' }}>
                      + {overflow}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        {/* Right Side: Ranking Preview */}
        <Link href="/ranking" className="ranking-preview-card" style={{
          flex: '1.2 1 160px',
          padding: '0.75rem',
          borderRadius: 'var(--border-radius)',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-color)',
          textDecoration: 'none',
          color: 'inherit',
          display: 'block'
        }}>
          <h3 style={{
            fontSize: '0.9rem',
            fontWeight: 700,
            marginBottom: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--text-primary)'
          }}>
            <Trophy size={14} style={{ color: 'var(--color-partial)' }} />
            {t('victory.rankingPreviewTitle') || 'Ranking de Hoje'}
          </h3>
          {rankingPreview.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {rankingPreview.map((entry) => (
                <div key={entry.rank} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.85rem',
                  padding: '0.25rem 0'
                }}>
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
                    <span style={{ 
                      fontWeight: 600, 
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '90px'
                    }}>
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
            <div style={{ 
              fontSize: '0.78rem', 
              color: 'var(--text-dim)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '80px',
              textAlign: 'center',
              border: '1px dashed var(--border-color)',
              borderRadius: '6px',
              padding: '0.5rem'
            }}>
              Ninguém no ranking hoje ainda. Seja o primeiro!
            </div>
          )}
        </Link>
      </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button onClick={onShareImage} disabled={imageSharing} className="btn" style={{ width: '100%' }}>
            <ImageIcon size={18} />
            {imageSharing ? t('victory.sharingImage') : t('victory.shareImage')}
          </button>
          <button onClick={onClose} className="btn btn-secondary">
            {t('victory.back')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

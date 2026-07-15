'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Trophy, Flame, Crown, Skull, Gamepad2, Type, Ban, Clock, Target, GraduationCap, TerminalSquare } from 'lucide-react';
import { apiFetch } from '@/client/lib/api';
import { ModalColorBar } from '@/client/components/ModalColorBar';

interface GameStats {
  wins: number;
  avgAttempts: number | null;
  bestAttempts: number | null;
  fastestMs: number | null;
  streakBest: number;
}

interface MemberStats {
  member: { id: string; name: string; photoUrl?: string | null; createdAt: string };
  totals: { wins: number; bestStreak: number; timesPersonOfDay: number; timesForcaTarget: number };
  games: { lsdle: GameStats; termo: GameStats; forca: GameStats; quiz?: GameStats; code?: GameStats };
}

function formatDuration(ms: number | null): string {
  if (ms == null) return '—';
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return m > 0 ? `${m}m ${s.toString().padStart(2, '0')}s` : `${s}s`;
}

interface MemberStatsModalProps {
  memberId: string | null;
  onClose: () => void;
}

export function MemberStatsModal({ memberId, onClose }: MemberStatsModalProps) {
  const { t, i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<MemberStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!memberId) return;
    let cancelled = false;
    setLoading(true);
    setData(null);
    setError('');
    apiFetch(`/api/game/members/${memberId}/stats`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setError(t('members.statsError')); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [memberId, t]);

  if (!memberId || !mounted) return null;

  const games = [
    { key: 'quiz', label: 'QUIZ', icon: GraduationCap, color: 'var(--lsd-orange)', unit: t('members.correctUnit') },
    { key: 'code', label: 'CODE', icon: TerminalSquare, color: 'var(--color-correct)', unit: t('members.submissionsUnit') },
    { key: 'termo', label: 'TERMO', icon: Type, color: 'var(--lsd-teal)', unit: t('members.attemptsUnit') },
    { key: 'forca', label: 'FORCA', icon: Ban, color: 'var(--lsd-red)', unit: t('members.mistakesUnit') },
    { key: 'lsdle', label: 'LSDLE', icon: Gamepad2, color: 'var(--lsd-magenta)', unit: t('members.attemptsUnit') },
  ] as const;

  const memberSince = data
    ? new Date(data.member.createdAt).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'pt-BR', { month: 'long', year: 'numeric' })
    : '';

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-wide modal-has-bottom-bar" onClick={(e) => e.stopPropagation()}>
        <div className="modal-body">
        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>{t('members.statsLoading')}</p>
        ) : error || !data ? (
          <p style={{ color: 'var(--accent)', textAlign: 'center', padding: '2rem' }}>{error || t('members.statsError')}</p>
        ) : (
          <>
            {/* Header: avatar + name + member since */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {data.member.photoUrl ? (
                <img src={data.member.photoUrl} alt={data.member.name} style={{ width: '88px', height: '88px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)', boxShadow: '0 0 15px var(--primary-glow)' }} />
              ) : (
                <div style={{ width: '88px', height: '88px', borderRadius: '50%', backgroundColor: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 700, border: '3px solid var(--primary)' }}>
                  {data.member.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <h2 className="modal-title" style={{ marginBottom: 0 }}>{data.member.name}</h2>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>{t('members.memberSince', { date: memberSince })}</p>
            </div>

            {/* Highlight totals */}
            <div className="member-stat-highlights">
              <div className="member-stat-hl">
                <Trophy size={20} style={{ color: 'var(--color-partial)' }} />
                <span className="member-stat-hl-val">{data.totals.wins}</span>
                <span className="member-stat-hl-lbl">{t('members.totalWins')}</span>
              </div>
              <div className="member-stat-hl">
                <Flame size={20} style={{ color: 'var(--lsd-orange)' }} />
                <span className="member-stat-hl-val">{data.totals.bestStreak}</span>
                <span className="member-stat-hl-lbl">{t('members.bestStreak')}</span>
              </div>
              <div className="member-stat-hl">
                <Crown size={20} style={{ color: 'var(--lsd-magenta)' }} />
                <span className="member-stat-hl-val">{data.totals.timesPersonOfDay}</span>
                <span className="member-stat-hl-lbl">{t('members.personOfDay')}</span>
              </div>
              <div className="member-stat-hl">
                <Skull size={20} style={{ color: 'var(--text-muted)' }} />
                <span className="member-stat-hl-val">{data.totals.timesForcaTarget}</span>
                <span className="member-stat-hl-lbl">{t('members.forcaTarget')}</span>
              </div>
            </div>

            {/* Per-game breakdown */}
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '1.5rem 0 0.75rem 0', color: 'var(--text-muted)' }}>{t('members.perGameTitle')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {games.map(({ key, label, icon: Icon, color, unit }) => {
                const g = data.games[key];
                if (!g) return null; // older API without this game's stats
                const played = g.wins > 0;
                return (
                  <div key={key} className="member-game-row">
                    <div className="member-game-row-label">
                      <Icon size={18} style={{ color }} />
                      <span style={{ fontWeight: 700 }}>{label}</span>
                    </div>
                    {played ? (
                      <div className="member-game-metrics">
                        <span title={t('members.wins')}><Trophy size={13} /> {g.wins}</span>
                        <span title={t('members.bestAttempts')}><Target size={13} /> {g.bestAttempts} {unit}</span>
                        <span title={t('members.fastest')}><Clock size={13} /> {formatDuration(g.fastestMs)}</span>
                        <span title={t('members.streakBest')}><Flame size={13} /> {g.streakBest}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>{t('members.noData')}</span>
                    )}
                  </div>
                );
              })}
            </div>

            <button onClick={onClose} className="btn btn-secondary" style={{ width: '100%', marginTop: '1.5rem' }}>
              {t('members.close')}
            </button>
          </>
        )}
        </div>
        <ModalColorBar />
      </div>
    </div>,
    document.body
  );
}

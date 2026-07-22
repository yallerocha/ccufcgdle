'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Trophy, Crown, Clock, Target, Gamepad2, Coins } from 'lucide-react';
import { apiFetch } from '@/client/lib/api';
import { avatarColorForName } from '@/client/lib/avatar';
import { formatPrize } from '@/client/lib/format';
import { ModalColorBar } from '@/client/components/ModalColorBar';
import { useModalDismiss } from '@/client/hooks/useModalDismiss';

interface ShowStats {
  runs: number;
  wins: number;
  totalWinnings: number;
  bestPrize: number;
  bestCleared: number;
  totalSteps: number;
  fastestMs: number | null;
}

interface MemberStats {
  member: { id: string; name: string; photoUrl?: string | null; createdAt: string };
  stats: ShowStats;
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
    apiFetch(`/api/community/members/${memberId}/stats`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setError(t('members.statsError')); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [memberId, t]);

  useModalDismiss(Boolean(memberId), onClose);

  if (!memberId || !mounted) return null;

  const memberSince = data
    ? new Date(data.member.createdAt).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'pt-BR', { month: 'long', year: 'numeric' })
    : '';

  const stats = data?.stats;
  const pct = stats && stats.totalSteps ? Math.round((stats.bestCleared / stats.totalSteps) * 100) : 0;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-has-bottom-bar player-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-body">
        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>{t('members.statsLoading')}</p>
        ) : error || !data || !stats ? (
          <p style={{ color: 'var(--accent)', textAlign: 'center', padding: '2rem' }}>{error || t('members.statsError')}</p>
        ) : (
          <>
            {/* Header: avatar + name + member since */}
            <div className="player-head">
              {data.member.photoUrl ? (
                <img src={data.member.photoUrl} alt={data.member.name} className="player-avatar" />
              ) : (
                <div className="player-avatar" style={{ backgroundColor: avatarColorForName(data.member.name), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.7rem', fontWeight: 700 }}>
                  {data.member.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="player-head-text">
                <h2 className="player-name">{data.member.name}</h2>
                <p className="player-since">{t('members.memberSince', { date: memberSince })}</p>
              </div>
            </div>

            {/* Total winnings showcase */}
            <div className="player-total">
              <span className="player-total-label"><Coins size={15} /> {t('members.totalWinnings')}</span>
              <span className="player-total-value">{formatPrize(stats.totalWinnings)}</span>
            </div>

            {/* Best-step progress */}
            <div className="player-progress">
              <div className="player-progress-head">
                <span><Target size={14} /> {t('members.bestStep')}</span>
                <strong>{stats.bestCleared}/{stats.totalSteps}</strong>
              </div>
              <div className="player-progress-track">
                <div className="player-progress-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>

            {/* Stat tiles */}
            <div className="player-tiles">
              <div className="player-tile">
                <Trophy size={18} />
                <span className="player-tile-val">{formatPrize(stats.bestPrize)}</span>
                <span className="player-tile-lbl">{t('members.bestPrize')}</span>
              </div>
              <div className="player-tile">
                <Gamepad2 size={18} />
                <span className="player-tile-val">{stats.runs}</span>
                <span className="player-tile-lbl">{t('members.runsPlayed')}</span>
              </div>
              <div className="player-tile">
                <Crown size={18} />
                <span className="player-tile-val">{stats.wins}</span>
                <span className="player-tile-lbl">{t('members.millionaire')}</span>
              </div>
            </div>

            {stats.wins > 0 && (
              <p className="player-fastest">
                <Clock size={14} /> {t('members.fastestWin', { time: formatDuration(stats.fastestMs) })}
              </p>
            )}

            <button onClick={onClose} className="btn btn-secondary" style={{ width: '100%', marginTop: '1.4rem' }}>
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

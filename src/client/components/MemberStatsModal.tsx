'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Trophy, Crown, Clock, Target, Gamepad2 } from 'lucide-react';
import { apiFetch } from '@/client/lib/api';
import { avatarColorForName } from '@/client/lib/avatar';
import { formatPrize } from '@/client/lib/format';
import { ModalColorBar } from '@/client/components/ModalColorBar';
import { useModalDismiss } from '@/client/hooks/useModalDismiss';

interface ShowStats {
  runs: number;
  wins: number;
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

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-wide modal-has-bottom-bar" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-body">
        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>{t('members.statsLoading')}</p>
        ) : error || !data || !stats ? (
          <p style={{ color: 'var(--accent)', textAlign: 'center', padding: '2rem' }}>{error || t('members.statsError')}</p>
        ) : (
          <>
            {/* Header: avatar + name + member since */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {data.member.photoUrl ? (
                <img src={data.member.photoUrl} alt={data.member.name} style={{ width: '88px', height: '88px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)', boxShadow: '0 0 15px var(--primary-glow)' }} />
              ) : (
                <div style={{ width: '88px', height: '88px', borderRadius: '50%', backgroundColor: avatarColorForName(data.member.name), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 700, border: '3px solid var(--primary)' }}>
                  {data.member.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <h2 className="modal-title" style={{ marginBottom: 0 }}>{data.member.name}</h2>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>{t('members.memberSince', { date: memberSince })}</p>
            </div>

            {/* Highlight totals — Show da Computação */}
            <div className="member-stat-highlights">
              <div className="member-stat-hl">
                <Trophy size={20} style={{ color: 'var(--color-partial)' }} />
                <span className="member-stat-hl-val">{formatPrize(stats.bestPrize)}</span>
                <span className="member-stat-hl-lbl">{t('members.bestPrize')}</span>
              </div>
              <div className="member-stat-hl">
                <Target size={20} style={{ color: 'var(--brand-teal)' }} />
                <span className="member-stat-hl-val">{stats.bestCleared}/{stats.totalSteps}</span>
                <span className="member-stat-hl-lbl">{t('members.bestStep')}</span>
              </div>
              <div className="member-stat-hl">
                <Gamepad2 size={20} style={{ color: 'var(--brand-magenta)' }} />
                <span className="member-stat-hl-val">{stats.runs}</span>
                <span className="member-stat-hl-lbl">{t('members.runsPlayed')}</span>
              </div>
              <div className="member-stat-hl">
                <Crown size={20} style={{ color: 'var(--brand-orange)' }} />
                <span className="member-stat-hl-val">{stats.wins}</span>
                <span className="member-stat-hl-lbl">{t('members.millionaire')}</span>
              </div>
            </div>

            {stats.wins > 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '1rem', textAlign: 'center', display: 'flex', gap: '0.4rem', justifyContent: 'center', alignItems: 'center' }}>
                <Clock size={14} /> {t('members.fastestWin', { time: formatDuration(stats.fastestMs) })}
              </p>
            )}

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

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/client/context/AuthContext';
import { Trophy, Info } from 'lucide-react';
import { apiFetch } from '@/client/lib/api';
import { avatarColorForName } from '@/client/lib/avatar';
import { formatPrize } from '@/client/lib/format';
import { BackLink } from '@/client/components/BackLink';
import { LoadingState } from '@/client/components/LoadingState';
import { ErrorState } from '@/client/components/ErrorState';
import { MemberStatsModal } from '@/client/components/MemberStatsModal';

interface Entry {
  rank: number;
  id: string;
  name: string;
  photoUrl?: string | null;
  points: number;
  wins: number;
}

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
// Visual order on the podium: 2nd (left), 1st (center, tallest), 3rd (right).
const PODIUM_ORDER = [2, 1, 3];
const PODIUM_HEIGHT: Record<number, string> = { 1: '7rem', 2: '5rem', 3: '4rem' };
const PODIUM_COLOR: Record<number, string> = {
  1: 'linear-gradient(180deg, #fde047, #eab308)',
  2: 'linear-gradient(180deg, #e2e8f0, #94a3b8)',
  3: 'linear-gradient(180deg, #fdba74, #c2792f)',
};

// Medal-tinted rings tie each avatar to its podium base; other avatars get a
// subtle gold ring to match the rest of the studio theme.
const RING_COLOR: Record<number, string> = { 1: '#f5c542', 2: '#cbd5e1', 3: '#d08a4a' };

function Avatar({ entry, size, place }: { entry: Entry; size: number; place?: number }) {
  const ring = place ? RING_COLOR[place] : 'rgba(255, 210, 74, 0.45)';
  const style: React.CSSProperties = {
    width: size,
    height: size,
    minWidth: size,
    flexShrink: 0,
    borderRadius: '50%',
    objectFit: 'cover',
    border: `${size >= 60 ? 3 : 2}px solid ${ring}`,
    boxSizing: 'border-box',
  };

  return entry.photoUrl ? (
    <img src={entry.photoUrl} alt={entry.name} style={style} />
  ) : (
    <div
      style={{
        ...style,
        backgroundColor: avatarColorForName(entry.name),
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: size * 0.32,
      }}
    >
      {entry.name.slice(0, 2).toUpperCase()}
    </div>
  );
}

export default function PodiumPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [ranking, setRanking] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await apiFetch('/api/community/leaderboard');
      const data = await res.json();
      if (res.ok) setRanking(data.ranking || []);
      else setErrorMsg(data.error || t('podium.error'));
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      setErrorMsg(t('podium.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const top3 = ranking.slice(0, 3);
  const rest = ranking.slice(3);

  return (
    <div style={{ margin: '2rem 0' }} className="fade-in">
      <BackLink href="/" label={t('nav.backToHub')} />

      <div className="hero" style={{ padding: '1rem 0 1.5rem 0' }}>
        <h1 className="page-heading">
          <Trophy size={30} style={{ color: 'var(--color-partial)' }} /> {t('podium.title')}
        </h1>
        <p>{t('podium.subtitle')}</p>
      </div>

      {loading ? (
        <LoadingState message={t('podium.loading')} />
      ) : errorMsg ? (
        <ErrorState message={errorMsg} onRetry={load} />
      ) : ranking.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>{t('podium.empty')}</p>
      ) : (
        <>
          {/* Top-3 podium */}
          <div className="podium">
            {PODIUM_ORDER.map((place) => {
              const entry = top3.find((e) => e.rank === place);
              if (!entry) return <div key={place} style={{ flex: 1 }} />;
              return (
                <button key={place} type="button" className="podium-col" onClick={() => setSelectedId(entry.id)}>
                  <span className="podium-medal">{MEDALS[place]}</span>
                  <Avatar entry={entry} size={place === 1 ? 88 : 64} place={place} />
                  <span className="podium-name">{entry.name}</span>
                  <span className="podium-points">{formatPrize(entry.points)}</span>
                  <div className="podium-base" style={{ height: PODIUM_HEIGHT[place], background: PODIUM_COLOR[place] }}>
                    <span className="podium-place">{place}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Remaining players */}
          {rest.length > 0 && (
            <div className="card podium-ranking-card">
              <div className="admin-table-container podium-ranking-scroll">
                <table className="admin-table podium-ranking-table">
                  <thead>
                    <tr>
                      <th style={{ width: '3rem' }}>{t('podium.thRank')}</th>
                      <th>{t('podium.thPlayer')}</th>
                      <th style={{ textAlign: 'center' }}>{t('podium.thWins')}</th>
                      <th style={{ textAlign: 'center' }}>{t('podium.thPoints')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rest.map((entry) => {
                      const isMe = user && user.name === entry.name;
                      return (
                        <tr key={entry.id} style={{ cursor: 'pointer', ...(isMe ? { backgroundColor: 'rgba(69, 98, 193, 0.08)' } : {}) }} onClick={() => setSelectedId(entry.id)}>
                          <td style={{ fontWeight: 700, textAlign: 'center' }}>{entry.rank}</td>
                          <td>
                            <div className="ranking-player-cell">
                              <Avatar entry={entry} size={28} />
                              <span className="ranking-player-name">{entry.name}</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{entry.wins}</td>
                          <td style={{ textAlign: 'center', fontWeight: 700 }}>{formatPrize(entry.points)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Scoring explainer */}
          <div className="card" style={{ maxWidth: '700px', margin: '1.5rem auto 0 auto' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Info size={16} style={{ color: 'var(--primary)' }} /> {t('podium.howTitle')}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('podium.howBody')}</p>
          </div>
        </>
      )}

      <MemberStatsModal memberId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}

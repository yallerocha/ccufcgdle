'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/client/context/AuthContext';
import { Trophy, ArrowLeft, Info } from 'lucide-react';
import { apiFetch } from '@/client/lib/api';
import { Toast } from '@/client/components/Toast';
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

function Avatar({ entry, size }: { entry: Entry; size: number }) {
  return entry.photoUrl ? (
    <img src={entry.photoUrl} alt={entry.name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)' }} />
  ) : (
    <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, border: '3px solid var(--primary)', fontSize: size * 0.32 }}>
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

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await apiFetch('/api/game/leaderboard');
        const data = await res.json();
        if (res.ok) setRanking(data.ranking || []);
        else setErrorMsg(data.error || t('podium.error'));
      } catch (err) {
        console.error('Error loading leaderboard:', err);
        setErrorMsg(t('podium.error'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [t]);

  const top3 = ranking.slice(0, 3);
  const rest = ranking.slice(3);

  return (
    <div style={{ margin: '2rem 0' }} className="fade-in">
      <div style={{ marginBottom: '0.5rem' }}>
        <Link href="/" className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', textDecoration: 'none' }}>
          <ArrowLeft size={16} /> {t('nav.backToHub')}
        </Link>
      </div>

      <div className="hero" style={{ padding: '1rem 0 1.5rem 0' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', fontSize: '2.2rem', fontWeight: 800 }}>
          <Trophy size={30} style={{ color: 'var(--color-partial)' }} /> {t('podium.title')}
        </h1>
        <p>{t('podium.subtitle')}</p>
      </div>

      <Toast message={errorMsg} type="error" onClose={() => setErrorMsg('')} />

      {loading ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>{t('podium.loading')}</p>
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
                  <Avatar entry={entry} size={place === 1 ? 88 : 64} />
                  <span className="podium-name">{entry.name}</span>
                  <span className="podium-points">{entry.points} {t('podium.points')}</span>
                  <div className="podium-base" style={{ height: PODIUM_HEIGHT[place], background: PODIUM_COLOR[place] }}>
                    <span className="podium-place">{place}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Remaining players */}
          {rest.length > 0 && (
            <div className="card" style={{ maxWidth: '700px', margin: '1.5rem auto 0 auto', padding: '1rem 1.5rem' }}>
              <div className="admin-table-container">
                <table className="admin-table">
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
                        <tr key={entry.id} style={{ cursor: 'pointer', ...(isMe ? { backgroundColor: 'rgba(139, 92, 246, 0.08)' } : {}) }} onClick={() => setSelectedId(entry.id)}>
                          <td style={{ fontWeight: 700, textAlign: 'center' }}>{entry.rank}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <Avatar entry={entry} size={28} />
                              <span style={{ fontWeight: 600 }}>{entry.name}</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{entry.wins}</td>
                          <td style={{ textAlign: 'center', fontWeight: 700 }}>{entry.points}</td>
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

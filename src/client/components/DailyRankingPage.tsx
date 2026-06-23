'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/client/context/AuthContext';
import { Trophy, Clock, Info } from 'lucide-react';
import { apiFetch } from '@/client/lib/api';
import { BackLink } from '@/client/components/BackLink';
import { LoadingState } from '@/client/components/LoadingState';
import { ErrorState } from '@/client/components/ErrorState';
import { MemberStatsModal } from '@/client/components/MemberStatsModal';

interface RankingEntry {
  rank: number;
  playerId?: string;
  name: string;
  photoUrl?: string | null;
  attempts: number;
  durationMs: number;
}

interface DailyRankingPageProps {
  /** API endpoint that returns `{ ranking: RankingEntry[] }`. */
  endpoint: string;
  /** Where the "back to game" button leads. */
  backHref: string;
  /** Subtitle explaining this game's tie-break rules. */
  subtitle: string;
  /** Header of the score column (attempts for LSDLE/Termo, mistakes for Forca). */
  metricHeader: string;
}

function formatDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return m > 0 ? `${m}m ${s.toString().padStart(2, '0')}s` : `${s}s`;
}

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

/** Shared daily-ranking screen used by the LSDLE, Termo and Forca rankings. */
export function DailyRankingPage({ endpoint, backHref, subtitle, metricHeader }: DailyRankingPageProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await apiFetch(endpoint);
      const data = await res.json();
      if (res.ok) {
        setRanking(data.ranking || []);
      } else {
        setErrorMsg(data.error || t('ranking.error'));
      }
    } catch (err) {
      console.error('Error loading ranking:', err);
      setErrorMsg(t('ranking.error'));
    } finally {
      setLoading(false);
    }
  }, [endpoint, t]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div style={{ margin: '2rem 0' }} className="fade-in">
      <BackLink href={backHref} label={t('ranking.backToGame')} />

      <div className="hero" style={{ padding: '1rem 0 2rem 0' }}>
        <h1 className="page-heading">
          <Trophy size={30} style={{ color: 'var(--color-partial)' }} /> {t('ranking.title')}
        </h1>
        <p>{subtitle}</p>
      </div>

      {!user && (
        <div className="alert alert-info" style={{ maxWidth: '600px', margin: '0 auto 1.5rem auto' }}>
          <Info size={18} /> {t('ranking.loginHint')}
        </div>
      )}

      <div className="card ranking-page-card" style={{ maxWidth: '700px', margin: '0 auto' }}>
        {loading ? (
          <LoadingState message={t('ranking.loading')} />
        ) : errorMsg ? (
          <ErrorState message={errorMsg} onRetry={load} />
        ) : ranking.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>{t('ranking.empty')}</p>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '3rem' }}>{t('ranking.thRank')}</th>
                  <th>{t('ranking.thPlayer')}</th>
                  <th style={{ textAlign: 'center' }}>{metricHeader}</th>
                  <th style={{ textAlign: 'center' }}>{t('ranking.thTime')}</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((entry) => {
                  const isMe = user && (entry.playerId ? entry.playerId === user.id : entry.name === user.name);
                  return (
                    <tr
                      key={entry.rank}
                      onClick={entry.playerId ? () => setSelectedId(entry.playerId!) : undefined}
                      style={{
                        ...(entry.playerId ? { cursor: 'pointer' } : {}),
                        ...(isMe ? { backgroundColor: 'rgba(69, 98, 193, 0.08)' } : {}),
                      }}
                    >
                      <td style={{ fontWeight: 700, fontSize: '1.05rem', textAlign: 'center' }}>
                        {MEDALS[entry.rank] || entry.rank}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          {entry.photoUrl ? (
                            <img src={entry.photoUrl} alt={entry.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)', flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)', flexShrink: 0 }}>
                              {entry.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span style={{ fontWeight: 600 }}>{entry.name}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{entry.attempts}</td>
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Clock size={13} /> {formatDuration(entry.durationMs)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <MemberStatsModal memberId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}

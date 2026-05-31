'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/client/context/AuthContext';
import { Trophy, Clock, Info, ArrowLeft } from 'lucide-react';
import { apiFetch } from '@/client/lib/api';
import { Toast } from '@/client/components/Toast';

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

export default function TermoRankingPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await apiFetch('/api/termo/ranking');
        const data = await res.json();
        if (res.ok) {
          setRanking(data.ranking || []);
        } else {
          setErrorMsg(data.error || t('ranking.error'));
        }
      } catch (err) {
        console.error('Error loading termo ranking:', err);
        setErrorMsg(t('ranking.error'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [t]);

  return (
    <div style={{ margin: '2rem 0' }} className="fade-in">
      <div style={{ marginBottom: '0.5rem' }}>
        <Link
          href="/termo"
          className="btn btn-secondary"
          style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', textDecoration: 'none' }}
        >
          <ArrowLeft size={16} /> {t('ranking.backToGame')}
        </Link>
      </div>

      <div className="hero" style={{ padding: '1rem 0 2rem 0' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', fontSize: '2.2rem', fontWeight: 800 }}>
          <Trophy size={30} style={{ color: 'var(--color-partial)' }} /> {t('ranking.title')}
        </h1>
        <p>{t('ranking.subtitle')}</p>
      </div>

      {!user && (
        <div className="alert alert-info" style={{ maxWidth: '600px', margin: '0 auto 1.5rem auto' }}>
          <Info size={18} /> {t('ranking.loginHint')}
        </div>
      )}

      <Toast message={errorMsg} type="error" onClose={() => setErrorMsg('')} />

      <div className="card" style={{ maxWidth: '700px', margin: '0 auto', padding: '1.5rem 2rem' }}>
        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>{t('ranking.loading')}</p>
        ) : ranking.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>{t('ranking.empty')}</p>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '3rem' }}>{t('ranking.thRank')}</th>
                  <th>{t('ranking.thPlayer')}</th>
                  <th style={{ textAlign: 'center' }}>{t('ranking.thAttempts')}</th>
                  <th style={{ textAlign: 'center' }}>{t('ranking.thTime')}</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((entry) => {
                  const isMe = user && user.name === entry.name;
                  return (
                    <tr key={entry.rank} style={isMe ? { backgroundColor: 'rgba(139, 92, 246, 0.08)' } : undefined}>
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
    </div>
  );
}

'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Search } from 'lucide-react';
import { apiFetch } from '@/client/lib/api';
import { BackLink } from '@/client/components/BackLink';
import { LoadingState } from '@/client/components/LoadingState';
import { ErrorState } from '@/client/components/ErrorState';
import { MemberStatsModal } from '@/client/components/MemberStatsModal';

interface Member {
  id: string;
  name: string;
  photoUrl?: string | null;
}

const PODIUM_MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

// Accent-insensitive lowercase form for name matching.
function normalizeName(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export default function MembersPage() {
  const { t } = useTranslation();
  const [members, setMembers] = useState<Member[]>([]);
  const [podiumRanks, setPodiumRanks] = useState<Map<string, number>>(() => new Map());
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const [membersRes, leaderboardRes] = await Promise.all([
        apiFetch('/api/game/members'),
        apiFetch('/api/game/leaderboard'),
      ]);
      const membersData = await membersRes.json();
      if (membersRes.ok) {
        setMembers(membersData.members || []);
      } else {
        setErrorMsg(membersData.error || t('members.error'));
      }

      if (leaderboardRes.ok) {
        const leaderboardData = await leaderboardRes.json();
        const ranks = new Map<string, number>();
        for (const entry of (leaderboardData.ranking || []).slice(0, 3)) {
          ranks.set(entry.id, entry.rank);
        }
        setPodiumRanks(ranks);
      } else {
        setPodiumRanks(new Map());
      }
    } catch (err) {
      console.error('Error loading members:', err);
      setErrorMsg(t('members.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = normalizeName(query.trim());
    if (!q) return members;
    return members.filter((m) => normalizeName(m.name).includes(q));
  }, [members, query]);

  return (
    <div style={{ margin: '2rem 0' }} className="fade-in">
      <BackLink href="/" label={t('nav.backToHub')} />

      <div className="hero" style={{ padding: '1rem 0 1.5rem 0' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', fontSize: '2.2rem', fontWeight: 800 }}>
          <Users size={30} style={{ color: 'var(--primary)' }} /> {t('members.title')}
        </h1>
        <p>{t('members.subtitle')}</p>
        {!loading && !errorMsg && members.length > 0 && (
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            {t('members.count', { count: members.length })}
          </p>
        )}
      </div>

      {loading ? (
        <LoadingState message={t('members.loading')} />
      ) : errorMsg ? (
        <ErrorState message={errorMsg} onRetry={load} />
      ) : members.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>{t('members.empty')}</p>
      ) : (
        <>
          <div style={{ position: 'relative', maxWidth: '380px', margin: '0 auto 1.75rem auto' }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('members.searchPlaceholder')}
              style={{ paddingLeft: '2.5rem' }}
            />
            <Search size={17} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          </div>

          {filtered.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>{t('members.noResults')}</p>
          ) : (
            <div className="members-grid">
              {filtered.map((m) => {
                const podiumPlace = podiumRanks.get(m.id);
                return (
                <button
                  key={m.id}
                  type="button"
                  className="card member-card member-card-button"
                  onClick={() => setSelectedId(m.id)}
                >
                  {podiumPlace != null && (
                    <span
                      className="member-podium-badge"
                      title={t('members.podiumBadge', { place: podiumPlace })}
                      aria-label={t('members.podiumBadge', { place: podiumPlace })}
                    >
                      {PODIUM_MEDALS[podiumPlace]}
                    </span>
                  )}
                  {m.photoUrl ? (
                    <img src={m.photoUrl} alt={m.name} className="member-photo" />
                  ) : (
                    <div className="member-photo member-photo-placeholder">
                      {m.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="member-name">{m.name}</span>
                </button>
                );
              })}
            </div>
          )}
        </>
      )}

      <MemberStatsModal memberId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}

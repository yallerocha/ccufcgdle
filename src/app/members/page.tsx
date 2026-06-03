'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Users, ArrowLeft } from 'lucide-react';
import { apiFetch } from '@/client/lib/api';
import { Toast } from '@/client/components/Toast';
import { MemberStatsModal } from '@/client/components/MemberStatsModal';

interface Member {
  id: string;
  name: string;
  photoUrl?: string | null;
}

export default function MembersPage() {
  const { t } = useTranslation();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await apiFetch('/api/game/members');
        const data = await res.json();
        if (res.ok) {
          setMembers(data.members || []);
        } else {
          setErrorMsg(data.error || t('members.error'));
        }
      } catch (err) {
        console.error('Error loading members:', err);
        setErrorMsg(t('members.error'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [t]);

  return (
    <div style={{ margin: '2rem 0' }} className="fade-in">
      <div style={{ marginBottom: '0.5rem' }}>
        <Link href="/" className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', textDecoration: 'none' }}>
          <ArrowLeft size={16} /> {t('nav.backToHub')}
        </Link>
      </div>

      <div className="hero" style={{ padding: '1rem 0 1.5rem 0' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', fontSize: '2.2rem', fontWeight: 800 }}>
          <Users size={30} style={{ color: 'var(--primary)' }} /> {t('members.title')}
        </h1>
        <p>{t('members.subtitle')}</p>
        {!loading && members.length > 0 && (
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            {t('members.count', { count: members.length })}
          </p>
        )}
      </div>

      <Toast message={errorMsg} type="error" onClose={() => setErrorMsg('')} />

      {loading ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>{t('members.loading')}</p>
      ) : members.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>{t('members.empty')}</p>
      ) : (
        <div className="members-grid">
          {members.map((m) => (
            <button
              key={m.id}
              type="button"
              className="card member-card member-card-button"
              onClick={() => setSelectedId(m.id)}
            >
              {m.photoUrl ? (
                <img src={m.photoUrl} alt={m.name} className="member-photo" />
              ) : (
                <div className="member-photo member-photo-placeholder">
                  {m.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="member-name">{m.name}</span>
            </button>
          ))}
        </div>
      )}

      <MemberStatsModal memberId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}

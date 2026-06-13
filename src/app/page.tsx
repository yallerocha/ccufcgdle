'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Gamepad2, Lock, Type, Ban, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/client/context/AuthContext';
import { getLocalDateString } from '@/shared/utils';

type GameId = 'lsdle' | 'termo' | 'forca';

// Reads this account's saved board for each game (written by the game pages)
// and reports which ones are already finished today.
function readPlayedToday(userId: string | undefined): Record<GameId, boolean> {
  const todayStr = getLocalDateString();
  const suffix = `${todayStr}-${userId ?? 'anon'}`;
  const result: Record<GameId, boolean> = { lsdle: false, termo: false, forca: false };
  try {
    const lsdle = localStorage.getItem(`lsdle-game-state-${suffix}`);
    if (lsdle) result.lsdle = !!JSON.parse(lsdle).isWon;
    const termo = localStorage.getItem(`termo-game-state-${suffix}`);
    if (termo) result.termo = JSON.parse(termo).status === 'won' || JSON.parse(termo).status === 'lost';
    const forca = localStorage.getItem(`forca-game-state-${suffix}`);
    if (forca) result.forca = JSON.parse(forca).status === 'won' || JSON.parse(forca).status === 'lost';
  } catch {
    // Corrupted saved state — just show no badges.
  }
  return result;
}

interface GameCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  playedToday: boolean;
  playedLabel: string;
}

function GameCard({ href, icon, title, description, playedToday, playedLabel }: GameCardProps) {
  return (
    <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="card ranking-preview-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2rem' }}>
        {playedToday && (
          <span className="badge badge-active" style={{ position: 'absolute', top: '0.75rem', right: '0.75rem' }}>
            <CheckCircle2 size={13} /> {playedLabel}
          </span>
        )}
        {icon}
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 700 }}>{title}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{description}</p>
      </div>
    </Link>
  );
}

export default function HubPage() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const [played, setPlayed] = useState<Record<GameId, boolean>>({ lsdle: false, termo: false, forca: false });

  // localStorage is only available client-side; read after mount/auth resolve.
  useEffect(() => {
    if (authLoading) return;
    setPlayed(readPlayedToday(user?.id));
  }, [user?.id, authLoading]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 1rem' }} className="fade-in">
      <section className="hero" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '3rem' }}>
        <img
          src="/logo.png"
          alt="LSD Logo"
          style={{ width: '180px', maxWidth: '100%', marginBottom: '1rem' }}
        />
        <h1 className="sr-only">LSD Game Hub</h1>
        <p style={{ textAlign: 'center', maxWidth: '600px', color: 'var(--text-muted)' }}>
          {t('hub.tagline')}
        </p>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', width: '100%', maxWidth: '900px' }}>
        <GameCard
          href="/lsdle"
          icon={<Gamepad2 size={48} style={{ color: 'var(--lsd-magenta)', marginBottom: '1rem' }} />}
          title="LSDLE"
          description={t('hub.lsdleDesc')}
          playedToday={played.lsdle}
          playedLabel={t('hub.playedToday')}
        />

        <GameCard
          href="/termo"
          icon={<Type size={48} style={{ color: 'var(--lsd-teal)', marginBottom: '1rem' }} />}
          title="TERMO"
          description={t('hub.termoDesc')}
          playedToday={played.termo}
          playedLabel={t('hub.playedToday')}
        />

        <GameCard
          href="/forca"
          icon={<Ban size={48} style={{ color: 'var(--lsd-red)', marginBottom: '1rem' }} />}
          title="FORCA"
          description={t('hub.forcaDesc')}
          playedToday={played.forca}
          playedLabel={t('hub.playedToday')}
        />

        {/* Coming soon */}
        <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2rem', opacity: 0.6, cursor: 'not-allowed' }}>
          <Lock size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 700, color: 'var(--text-muted)' }}>{t('hub.comingSoonTitle')}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('hub.comingSoonDesc')}</p>
        </div>
      </div>
    </div>
  );
}

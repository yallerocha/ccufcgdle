'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Gamepad2, Type, Ban, CheckCircle2, GraduationCap, TerminalSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/client/context/AuthContext';
import { getLocalDateString } from '@/shared/utils';
import { Logo } from '@/client/components/Logo';

type GameId = 'lsdle' | 'termo' | 'forca' | 'quiz' | 'code';

const NOT_PLAYED: Record<GameId, boolean> = {
  lsdle: false,
  termo: false,
  forca: false,
  quiz: false,
  code: false,
};

// Reads this account's saved board for each game (written by the game pages)
// and reports which ones are already finished today.
function readPlayedToday(userId: string | undefined): Record<GameId, boolean> {
  const todayStr = getLocalDateString();
  const suffix = `${todayStr}-${userId ?? 'anon'}`;
  const result: Record<GameId, boolean> = { ...NOT_PLAYED };
  try {
    const lsdle = localStorage.getItem(`lsdle-game-state-${suffix}`);
    if (lsdle) result.lsdle = !!JSON.parse(lsdle).isWon;
    const termo = localStorage.getItem(`termo-game-state-${suffix}`);
    if (termo) result.termo = JSON.parse(termo).status === 'won' || JSON.parse(termo).status === 'lost';
    const forca = localStorage.getItem(`forca-game-state-${suffix}`);
    if (forca) result.forca = JSON.parse(forca).status === 'won' || JSON.parse(forca).status === 'lost';
    const quiz = localStorage.getItem(`quiz-game-state-${suffix}`);
    if (quiz) {
      const saved = JSON.parse(quiz);
      result.quiz = Array.isArray(saved.answers) && saved.answers.length >= 5;
    }
    const code = localStorage.getItem(`code-game-state-${suffix}`);
    if (code) result.code = !!JSON.parse(code).solved;
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
    <Link href={href} className="hub-game-card-link">
      <div className="card ranking-preview-card hub-game-card">
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
  const [played, setPlayed] = useState<Record<GameId, boolean>>({ ...NOT_PLAYED });

  // localStorage is only available client-side; read after mount/auth resolve.
  useEffect(() => {
    if (authLoading) return;
    setPlayed(readPlayedToday(user?.id));
  }, [user?.id, authLoading]);

  return (
    <div className="hub-page fade-in">
      <section className="hero hub-hero">
        <Logo
          alt="LSD Logo"
          style={{ width: '180px', maxWidth: '100%', marginBottom: '1rem' }}
        />
        <h1 className="sr-only">LSD Game Hub</h1>
        <p style={{ textAlign: 'center', maxWidth: '600px', color: 'var(--text-muted)' }}>
          {t('hub.tagline')}
        </p>
      </section>

      <div className="hub-grid">
        <GameCard
          href="/quiz"
          icon={<GraduationCap size={48} style={{ color: 'var(--lsd-orange)', marginBottom: '1rem' }} />}
          title="QUIZ"
          description={t('hub.quizDesc')}
          playedToday={played.quiz}
          playedLabel={t('hub.playedToday')}
        />

        <GameCard
          href="/code"
          icon={<TerminalSquare size={48} style={{ color: 'var(--color-correct)', marginBottom: '1rem' }} />}
          title="CODE"
          description={t('hub.codeDesc')}
          playedToday={played.code}
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

        <GameCard
          href="/lsdle"
          icon={<Gamepad2 size={48} style={{ color: 'var(--lsd-magenta)', marginBottom: '1rem' }} />}
          title="LSDLE"
          description={t('hub.lsdleDesc')}
          playedToday={played.lsdle}
          playedLabel={t('hub.playedToday')}
        />
      </div>
    </div>
  );
}

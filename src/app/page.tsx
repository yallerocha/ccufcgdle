'use client';

import React from 'react';
import Link from 'next/link';
import { Gamepad2, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function HubPage() {
  const { t } = useTranslation();

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 1rem' }} className="fade-in">
      <section className="hero" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '3rem' }}>
        <img 
          src="/logo.png" 
          alt="LSD Logo" 
          style={{ width: '180px', maxWidth: '100%', marginBottom: '1rem' }} 
        />
        <h1 className="lsd-gradient-text" style={{ paddingBottom: '0.2rem', display: 'none' }}>LSD HUB</h1>
        <p style={{ textAlign: 'center', maxWidth: '600px', color: 'var(--text-muted)' }}>
          {t('hub.tagline', 'Bem-vindo ao LSD Game Hub. Escolha um dos jogos abaixo para começar a jogar com os membros do laboratório!')}
        </p>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', width: '100%', maxWidth: '900px' }}>
        {/* Jogo: LSDLE */}
        <Link href="/lsdle" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card ranking-preview-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2rem' }}>
            <Gamepad2 size={48} style={{ color: 'var(--lsd-magenta)', marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 700 }}>LSDLE</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {t('hub.lsdleDesc', 'O clássico Wordle, mas com as pessoas do Laboratório de Sistemas Distribuídos.')}
            </p>
          </div>
        </Link>

        {/* Jogo 2 (Em Breve) */}
        <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2rem', opacity: 0.6, cursor: 'not-allowed' }}>
          <Lock size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 700, color: 'var(--text-muted)' }}>Em Breve</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Novos mini-games envolvendo a galera do laboratório serão adicionados aqui!
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/client/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Terminal, User, Users, Trophy, ShieldCheck, LogOut } from 'lucide-react';
import ThemeToggle from '@/client/components/ThemeToggle';
import LanguageToggle from '@/client/components/LanguageToggle';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  return (
    <nav className="navbar" style={{ position: 'relative' }}>
      <div className="navbar-content container">
        <Link href="/" className="nav-logo">
          <img src="/logo_icone.png" alt="LSD Logo Icon" style={{ height: '32px', width: 'auto' }} />
          {/* Single gradient spanning the whole name (L → B); GAME stays solid. */}
          <span className="lsd-gradient-text" style={{ marginLeft: '4px', fontWeight: 800 }}>
            LSD{' '}
            <span style={{ WebkitTextFillColor: 'var(--text-primary)', color: 'var(--text-primary)', fontWeight: 600 }}>GAME</span>
            HUB
          </span>
          <span className="nav-logo-sub">LSD-UFCG</span>
        </Link>

        <div className="nav-links">
          <Link href="/podium" className="nav-link" title={t('podium.nav')}>
            <Trophy size={18} /> <span className="nav-link-label">{t('podium.nav')}</span>
          </Link>

          <Link href="/members" className="nav-link" title={t('nav.members')}>
            <Users size={18} /> <span className="nav-link-label">{t('nav.members')}</span>
          </Link>

          {user ? (
            <>
              <Link href="/profile" className="nav-link" title={t('nav.myCharacter')}>
                <User size={18} /> <span className="nav-link-label">{t('nav.myCharacter')}</span>
              </Link>
              {user.isAdmin && (
                <Link href="/admin" className="nav-link nav-link-admin" title={t('nav.admin')}>
                  <ShieldCheck size={18} /> <span className="nav-link-label">{t('nav.admin')}</span>
                </Link>
              )}
              <button onClick={logout} className="nav-link" title={t('nav.logout')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <LogOut size={18} /> <span className="nav-link-label">{t('nav.logout')}</span>
              </button>
            </>
          ) : (
            <Link href="/profile" className="nav-link" title={t('nav.joinLogin')}>
              <User size={18} /> <span className="nav-link-label">{t('nav.joinLogin')}</span>
            </Link>
          )}

          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
      <div className="navbar-color-bar lsd-gradient-bg"></div>
    </nav>
  );
}

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
          <Link href="/podium" className="nav-link">
            <Trophy size={18} /> {t('podium.nav')}
          </Link>

          <Link href="/members" className="nav-link">
            <Users size={18} /> {t('nav.members')}
          </Link>

          {user ? (
            <>
              <Link href="/profile" className="nav-link">
                <User size={18} /> {t('nav.myCharacter')}
              </Link>
              {user.isAdmin && (
                <Link href="/admin" className="nav-link nav-link-admin">
                  <ShieldCheck size={18} /> {t('nav.admin')}
                </Link>
              )}
              <button onClick={logout} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <LogOut size={18} /> {t('nav.logout')}
              </button>
            </>
          ) : (
            <Link href="/profile" className="nav-link">
              <User size={18} /> {t('nav.joinLogin')}
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

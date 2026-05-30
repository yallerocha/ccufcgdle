'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/client/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Terminal, Gamepad2, Trophy, User, ShieldCheck, LogOut } from 'lucide-react';
import ThemeToggle from '@/client/components/ThemeToggle';
import LanguageToggle from '@/client/components/LanguageToggle';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  return (
    <nav className="navbar">
      <div className="navbar-content container">
        <Link href="/" className="nav-logo">
          <img src="/logo_icone.png" alt="LSD Logo Icon" style={{ height: '32px', width: 'auto' }} />
          <span style={{ marginLeft: '4px', fontWeight: 800 }}>
            <span style={{ color: 'var(--lsd-teal)' }}>L</span>
            <span style={{ color: 'var(--lsd-blue)' }}>S</span>
            <span style={{ color: 'var(--lsd-purple)' }}>D</span>
            <span style={{ color: 'var(--lsd-magenta)' }}>L</span>
            <span style={{ color: 'var(--lsd-red)' }}>E</span>
          </span>
          <span className="nav-logo-sub">LSD-UFCG</span>
        </Link>

        <div className="nav-links">
          <Link href="/" className="nav-link">
            <Gamepad2 size={18} /> {t('nav.play')}
          </Link>

          <Link href="/ranking" className="nav-link">
            <Trophy size={18} /> {t('nav.ranking')}
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

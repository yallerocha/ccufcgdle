'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/client/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { User, Users, Trophy, ShieldCheck, LogOut, Menu, X } from 'lucide-react';
import ThemeToggle from '@/client/components/ThemeToggle';
import LanguageToggle from '@/client/components/LanguageToggle';
import { Logo } from '@/client/components/Logo';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // Marks the section the user is in (subroutes count: /podium/x → /podium).
  const linkClass = (href: string, extra = '') => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return `nav-link${extra ? ` ${extra}` : ''}${active ? ' active' : ''}`;
  };

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [menuOpen, closeMenu]);

  const navLinksMain = (
    <>
      <Link href="/podium" className={linkClass('/podium')} title={t('podium.nav')} onClick={closeMenu}>
        <Trophy size={18} /> <span className="nav-link-label">{t('podium.nav')}</span>
      </Link>

      <Link href="/members" className={linkClass('/members')} title={t('nav.members')} onClick={closeMenu}>
        <Users size={18} /> <span className="nav-link-label">{t('nav.members')}</span>
      </Link>

      {user ? (
        <>
          <Link href="/profile" className={linkClass('/profile')} title={t('nav.myCharacter')} onClick={closeMenu}>
            <User size={18} /> <span className="nav-link-label">{t('nav.myCharacter')}</span>
          </Link>
          {user.isAdmin && (
            <Link href="/admin" className={linkClass('/admin', 'nav-link-admin')} title={t('nav.admin')} onClick={closeMenu}>
              <ShieldCheck size={18} /> <span className="nav-link-label">{t('nav.admin')}</span>
            </Link>
          )}
        </>
      ) : (
        <Link href="/profile" className="nav-link nav-link-cta" title={t('nav.joinLogin')} onClick={closeMenu}>
          <User size={18} /> <span className="nav-link-label">{t('nav.joinLogin')}</span>
        </Link>
      )}
    </>
  );

  const logoutButton = user ? (
    <button
      type="button"
      onClick={() => {
        closeMenu();
        logout();
      }}
      className="nav-link nav-link--logout"
      title={t('nav.logout')}
    >
      <LogOut size={18} /> <span className="nav-link-label">{t('nav.logout')}</span>
    </button>
  ) : null;

  return (
    <nav className="navbar" style={{ position: 'relative' }}>
      <div className="navbar-content container">
        <button
          type="button"
          className="nav-menu-btn"
          aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link href="/" className="nav-logo" onClick={closeMenu} aria-label="O Show da Computação">
          <Logo variant="wide" alt="O Show da Computação" style={{ height: '32px', width: 'auto' }} />
        </Link>

        <div className="nav-toolbar">
          <LanguageToggle />
          <ThemeToggle />
        </div>

        <div className="nav-links nav-links--desktop">
          {navLinksMain}
          {logoutButton}
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>

      {menuOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <>
            <button
              type="button"
              className="nav-menu-overlay"
              aria-label={t('nav.closeMenu')}
              onClick={closeMenu}
            />
            <div
              className="nav-menu-drawer"
              role="dialog"
              aria-modal="true"
              aria-label={t('nav.openMenu')}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="nav-menu-drawer-header">
                <Link href="/" className="nav-menu-drawer-brand" onClick={closeMenu} aria-label="O Show da Computação">
                  <Logo variant="icon" alt="O Show da Computação" style={{ height: '32px', width: 'auto' }} />
                </Link>
                <button
                  type="button"
                  className="nav-menu-close-btn"
                  aria-label={t('nav.closeMenu')}
                  onClick={closeMenu}
                >
                  <X size={22} />
                </button>
              </div>
              <div className="nav-menu-drawer-color-bar brand-gradient-bg" aria-hidden="true" />
              <div className="nav-menu-links">{navLinksMain}</div>
              {logoutButton && (
                <div className="nav-menu-footer">{logoutButton}</div>
              )}
            </div>
          </>,
          document.body,
        )}

      <div className="navbar-color-bar brand-gradient-bg" />
    </nav>
  );
}

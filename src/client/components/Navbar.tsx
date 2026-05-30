'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/client/context/AuthContext';
import { Terminal, Gamepad2, User, ShieldCheck, LogOut } from 'lucide-react';
import ThemeToggle from '@/client/components/ThemeToggle';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-content container">
        <Link href="/" className="nav-logo">
          <Terminal size={24} style={{ color: 'var(--primary)' }} />
          <span>CCDLE</span>
          <span className="nav-logo-sub">Comp-UFCG</span>
        </Link>

        <div className="nav-links">
          <Link href="/" className="nav-link">
            <Gamepad2 size={18} /> Jogar
          </Link>

          {user ? (
            <>
              <Link href="/profile" className="nav-link">
                <User size={18} /> Meu Personagem
              </Link>
              {user.isAdmin && (
                <Link href="/admin" className="nav-link nav-link-admin">
                  <ShieldCheck size={18} /> Admin
                </Link>
              )}
              <button onClick={logout} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <LogOut size={18} /> Sair
              </button>
            </>
          ) : (
            <Link href="/profile" className="nav-link">
              <User size={18} /> Participar / Entrar
            </Link>
          )}

          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}

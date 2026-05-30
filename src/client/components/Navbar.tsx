'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/client/context/AuthContext';
import { Terminal, Gamepad2, User, ShieldCheck, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link href="/" className="navbar-brand">
          <Terminal size={24} style={{ color: 'var(--primary)' }} />
          <span className="navbar-title">UFCGdle</span>
          <span className="navbar-subtitle">Comp-UFCG</span>
        </Link>

        <div className="navbar-links">
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
        </div>
      </div>
    </nav>
  );
}

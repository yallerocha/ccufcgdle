'use client';

import React, { useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';

interface LoginFormProps {
  onLoginSuccess: () => void;
  onSwitchToRegister: () => void;
  loginFn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

export function LoginForm({ onLoginSuccess, onSwitchToRegister, loginFn }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      const res = await loginFn(email, password);
      if (res.success) {
        onLoginSuccess();
      } else {
        setErrorMsg(res.error || 'Erro ao realizar login.');
      }
    } catch (err) {
      setErrorMsg('Erro de conexão.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '450px', margin: '4rem auto 0 auto', width: '100%' }} className="fade-in">
      <div className="card">
        <h2 className="card-title" style={{ justifyContent: 'center' }}>
          <LogIn size={22} style={{ color: 'var(--primary)' }} /> Entrar
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Identifique-se para atualizar os atributos do seu personagem e renovar seu tempo de atividade no jogo.
        </p>

        {errorMsg && <div className="alert alert-error">{errorMsg}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email institucional ou pessoal</label>
            <input 
              type="email" 
              placeholder="seu.email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label>Senha</label>
            <input 
              type="password" 
              placeholder="******"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={submitting} className="btn" style={{ width: '100%' }}>
            {submitting ? 'Processando...' : 'Fazer Login'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Ainda não tem um personagem registrado?
          </p>
          <button 
            onClick={onSwitchToRegister} 
            className="btn btn-secondary" 
            style={{ marginTop: '0.75rem', width: '100%' }}
          >
            <UserPlus size={18} />
            Quero Participar (Cadastrar)
          </button>
        </div>
      </div>
    </div>
  );
}

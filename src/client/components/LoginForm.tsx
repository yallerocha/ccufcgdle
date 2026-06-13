'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { LogIn, UserPlus, Mail } from 'lucide-react';
import { apiFetch } from '@/client/lib/api';
import { PasswordInput } from '@/client/components/PasswordInput';
import { Toast } from '@/client/components/Toast';

interface LoginFormProps {
  onLoginSuccess: () => void;
  onSwitchToRegister: () => void;
  loginFn: (email: string, password: string) => Promise<{ success: boolean; error?: string; code?: string; email?: string }>;
}

export function LoginForm({ onLoginSuccess, onSwitchToRegister, loginFn }: LoginFormProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    const target = pendingEmail || email;
    if (!target || resending) return;
    setResending(true);
    setErrorMsg('');
    setInfoMsg('');
    try {
      const res = await apiFetch('/api/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email: target }),
      });
      const data = await res.json();
      if (res.ok) setInfoMsg(data.message || t('verifyEmail.resendSuccess'));
      else setErrorMsg(data.error || t('verifyEmail.resendError'));
    } catch {
      setErrorMsg(t('verifyEmail.resendError'));
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setPendingEmail('');
    setSubmitting(true);

    try {
      const res = await loginFn(email, password);
      if (res.success) {
        onLoginSuccess();
      } else if (res.code === 'EMAIL_NOT_VERIFIED') {
        setPendingEmail(res.email || email);
        setErrorMsg(res.error || t('login.error'));
      } else {
        setErrorMsg(res.error || t('login.error'));
      }
    } catch {
      setErrorMsg(t('login.errorConn'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '450px', margin: '4rem auto 0 auto', width: '100%' }} className="fade-in">
      <div className="card">
        <h2 className="card-title" style={{ justifyContent: 'center' }}>
          <LogIn size={22} style={{ color: 'var(--primary)' }} /> {t('login.title')}
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          {t('login.subtitle')}
        </p>

        <Toast message={errorMsg} type="error" onClose={() => setErrorMsg('')} />
        <Toast message={infoMsg} type="success" onClose={() => setInfoMsg('')} />

        {pendingEmail && (
          <div className="verify-email-banner">
            <Mail size={16} aria-hidden="true" />
            <div>
              <p>{t('verifyEmail.pendingLogin', { email: pendingEmail })}</p>
              <button type="button" className="btn btn-secondary" style={{ marginTop: '0.65rem', width: '100%' }} onClick={handleResend} disabled={resending}>
                {resending ? t('verifyEmail.resending') : t('verifyEmail.resend')}
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('login.emailLabel')}</label>
            <input
              type="email"
              placeholder={t('login.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label>{t('login.passwordLabel')}</label>
            <PasswordInput
              placeholder={t('login.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={submitting} className="btn" style={{ width: '100%' }}>
            {submitting ? t('login.submitting') : t('login.submit')}
          </button>

          <p style={{ marginTop: '0.85rem', fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center' }}>
            <Link href="/forgot-password" style={{ color: 'var(--primary)' }}>
              {t('login.forgotLink')}
            </Link>
          </p>
        </form>

        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {t('login.noAccount')}
          </p>
          <button 
            onClick={onSwitchToRegister} 
            className="btn btn-secondary" 
            style={{ marginTop: '0.75rem', width: '100%' }}
          >
            <UserPlus size={18} />
            {t('login.toRegister')}
          </button>
        </div>
      </div>
    </div>
  );
}

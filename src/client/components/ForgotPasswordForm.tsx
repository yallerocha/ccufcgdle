'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { KeyRound, Mail, ArrowLeft } from 'lucide-react';
import { apiFetch } from '@/client/lib/api';
import { useAuthConfig } from '@/client/lib/auth-config';
import { Toast } from '@/client/components/Toast';

export function ForgotPasswordForm() {
  const { t } = useTranslation();
  const authConfig = useAuthConfig();
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setSubmitting(true);

    try {
      const res = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setSent(true);
        setInfoMsg(data.message || t('forgotPassword.success'));
      } else {
        setErrorMsg(data.error || t('forgotPassword.error'));
      }
    } catch {
      setErrorMsg(t('forgotPassword.errorConn'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!authConfig) {
    return (
      <div style={{ maxWidth: '450px', margin: '2rem auto 0 auto', width: '100%' }} className="fade-in">
        <div className="card">
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {t('resetPassword.validating')}
          </p>
        </div>
      </div>
    );
  }

  if (!authConfig.passwordResetByEmailEnabled) {
    return (
      <div style={{ maxWidth: '450px', margin: '2rem auto 0 auto', width: '100%' }} className="fade-in">
        <div className="card">
          <h2 className="card-title" style={{ justifyContent: 'center' }}>
            <KeyRound size={22} style={{ color: 'var(--primary)' }} /> {t('forgotPassword.title')}
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            {t('login.forgotHint')}
          </p>
          <Link href="/profile" className="btn btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={16} /> {t('forgotPassword.backToLogin')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '450px', margin: '2rem auto 0 auto', width: '100%' }} className="fade-in">
      <div className="card">
        <h2 className="card-title" style={{ justifyContent: 'center' }}>
          <KeyRound size={22} style={{ color: 'var(--primary)' }} /> {t('forgotPassword.title')}
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          {sent ? t('forgotPassword.successBody', { email }) : t('forgotPassword.subtitle')}
        </p>

        <Toast message={errorMsg} type="error" onClose={() => setErrorMsg('')} />
        <Toast message={infoMsg} type="success" onClose={() => setInfoMsg('')} />

        {!sent ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="profile-field-label">
                <Mail size={15} style={{ color: 'var(--primary)' }} /> {t('forgotPassword.emailLabel')}
              </label>
              <input
                type="email"
                placeholder={t('login.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={submitting} className="btn" style={{ width: '100%' }}>
              {submitting ? t('forgotPassword.submitting') : t('forgotPassword.submit')}
            </button>
          </form>
        ) : (
          <Link href="/profile" className="btn btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={16} /> {t('forgotPassword.backToLogin')}
          </Link>
        )}

        {!sent && (
          <p style={{ marginTop: '1.25rem', textAlign: 'center' }}>
            <Link href="/profile" style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>
              {t('forgotPassword.backToLogin')}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

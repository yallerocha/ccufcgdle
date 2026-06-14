'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { KeyRound, Lock, LockKeyhole, Loader2 } from 'lucide-react';
import { apiFetch, setToken } from '@/client/lib/api';
import { useAuthConfig } from '@/client/lib/auth-config';
import { useAuth } from '@/client/context/AuthContext';
import { isStrongPassword } from '@/shared/validation';
import { PasswordInput } from '@/client/components/PasswordInput';
import { Toast } from '@/client/components/Toast';

export default function ResetPasswordClient() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const authConfig = useAuthConfig();
  const token = searchParams.get('token') ?? '';

  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authConfig) return;

    if (!authConfig.passwordResetByEmailEnabled) {
      setValidating(false);
      setTokenValid(false);
      setErrorMsg(t('login.forgotHint'));
      return;
    }

    if (!token) {
      setValidating(false);
      setTokenValid(false);
      setErrorMsg(t('resetPassword.missingToken'));
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (cancelled) return;
        if (res.ok) {
          setTokenValid(true);
        } else {
          setErrorMsg(data.error || t('resetPassword.invalidToken'));
        }
      } catch {
        if (!cancelled) setErrorMsg(t('resetPassword.errorConn'));
      } finally {
        if (!cancelled) setValidating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authConfig, token, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!isStrongPassword(password)) {
      setErrorMsg(t('resetPassword.weakPassword'));
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg(t('resetPassword.mismatch'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.token) setToken(data.token);
        await refreshUser();
        setSuccessMsg(data.message || t('resetPassword.success'));
        setTimeout(() => router.replace('/profile'), 2500);
      } else {
        setErrorMsg(data.error || t('resetPassword.error'));
      }
    } catch {
      setErrorMsg(t('resetPassword.errorConn'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '450px', margin: '0 auto', width: '100%' }} className="fade-in">
      <div className="card">
        <h2 className="card-title" style={{ justifyContent: 'center' }}>
          {validating ? (
            <Loader2 size={22} style={{ color: 'var(--primary)' }} className="spin" />
          ) : (
            <KeyRound size={22} style={{ color: 'var(--primary)' }} />
          )}
          {t('resetPassword.title')}
        </h2>

        <Toast message={errorMsg} type="error" onClose={() => setErrorMsg('')} />
        <Toast message={successMsg} type="success" onClose={() => setSuccessMsg('')} />

        {validating && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {t('resetPassword.validating')}
          </p>
        )}

        {!validating && !tokenValid && !successMsg && (
          <>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              {t('resetPassword.invalidToken')}
            </p>
            {authConfig?.passwordResetByEmailEnabled ? (
              <Link href="/forgot-password" className="btn btn-secondary" style={{ width: '100%', display: 'block', textAlign: 'center' }}>
                {t('resetPassword.requestNew')}
              </Link>
            ) : (
              <Link href="/profile" className="btn btn-secondary" style={{ width: '100%', display: 'block', textAlign: 'center' }}>
                {t('forgotPassword.backToLogin')}
              </Link>
            )}
          </>
        )}

        {!validating && tokenValid && !successMsg && (
          <>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              {t('resetPassword.subtitle')}
            </p>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="profile-field-label">
                  <Lock size={15} style={{ color: 'var(--primary)' }} /> {t('resetPassword.newPasswordLabel')}
                </label>
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('register.passwordPlaceholder')}
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
              </div>
              <div className="form-group">
                <label className="profile-field-label">
                  <LockKeyhole size={15} style={{ color: 'var(--primary)' }} /> {t('resetPassword.confirmPasswordLabel')}
                </label>
                <PasswordInput
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('register.confirmPasswordPlaceholder')}
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
              </div>
              <button type="submit" disabled={submitting} className="btn" style={{ width: '100%' }}>
                {submitting ? t('resetPassword.submitting') : t('resetPassword.submit')}
              </button>
            </form>
          </>
        )}

        {successMsg && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {t('resetPassword.redirect')}
          </p>
        )}
      </div>
    </div>
  );
}

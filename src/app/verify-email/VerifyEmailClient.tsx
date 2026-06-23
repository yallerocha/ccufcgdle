'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { MailCheck, Loader2 } from 'lucide-react';
import { apiFetch, setToken } from '@/client/lib/api';
import { useAuth } from '@/client/context/AuthContext';
import { BackLink } from '@/client/components/BackLink';
import { Toast } from '@/client/components/Toast';

export default function VerifyEmailClient() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage(t('verifyEmail.missingToken'));
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (cancelled) return;
        if (res.ok) {
          if (data.token) setToken(data.token);
          await refreshUser();
          setStatus('success');
          setMessage(data.message || t('verifyEmail.success'));
          setTimeout(() => router.replace('/'), 2500);
        } else {
          setStatus('error');
          setMessage(data.error || t('verifyEmail.error'));
        }
      } catch {
        if (!cancelled) {
          setStatus('error');
          setMessage(t('verifyEmail.errorConn'));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, t, refreshUser, router]);

  return (
    <div style={{ maxWidth: '520px', margin: '3rem auto', width: '100%' }} className="fade-in">
      <BackLink href="/profile" label={t('nav.backToHub')} style={{ marginBottom: '1rem' }} />
      <div className="card" style={{ textAlign: 'center' }}>
        <h2 className="card-title" style={{ justifyContent: 'center' }}>
          {status === 'loading' ? (
            <Loader2 size={22} style={{ color: 'var(--primary)' }} className="spin" />
          ) : (
            <MailCheck size={22} style={{ color: 'var(--primary)' }} />
          )}
          {t('verifyEmail.title')}
        </h2>
        <p style={{ color: status === 'error' ? '#ef4444' : 'var(--text-muted)', fontSize: '0.95rem' }}>
          {status === 'loading' ? t('verifyEmail.loading') : message}
        </p>
        {status === 'success' && (
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '0.75rem' }}>
            {t('verifyEmail.redirect')}
          </p>
        )}
        {status === 'error' && (
          <button type="button" className="btn btn-secondary" style={{ marginTop: '1.25rem' }} onClick={() => router.push('/profile')}>
            {t('verifyEmail.backToLogin')}
          </button>
        )}
      </div>
      <Toast message={status === 'error' ? message : ''} type="error" onClose={() => setMessage('')} />
    </div>
  );
}

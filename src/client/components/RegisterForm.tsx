'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserPlus, Camera, Trash2, User as UserIcon, Mail, Lock, LockKeyhole, MailCheck } from 'lucide-react';
import { apiFetch, setToken } from '@/client/lib/api';
import { avatarColorForName } from '@/client/lib/avatar';
import { PhotoCropModal } from '@/client/components/PhotoCropModal';
import { isAllowedEmailDomain, isStrongPassword } from '@/shared/validation';
import { PasswordInput } from '@/client/components/PasswordInput';
import { Toast } from '@/client/components/Toast';
import { GoogleSignInButton } from '@/client/components/GoogleSignInButton';
import { useAuth } from '@/client/context/AuthContext';
import { useAuthConfig } from '@/client/lib/auth-config';

interface RegisterFormProps {
  onRegisterSuccess: () => void;
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onRegisterSuccess, onSwitchToLogin }: RegisterFormProps) {
  const { t } = useTranslation();
  const { loginWithGoogle } = useAuth();
  const authConfig = useAuthConfig();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [activeHint, setActiveHint] = useState<'name' | 'email' | 'password' | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert(t('photo.tooLarge'));
      return;
    }
    setCropFile(file);
  };

  const handleCropConfirm = (nextUrl: string) => {
    setCropFile(null);
    setPhotoUrl(nextUrl);
  };

  const handleResend = async () => {
    if (!pendingEmail || resending) return;
    setResending(true);
    setErrorMsg('');
    setInfoMsg('');
    try {
      const res = await apiFetch('/api/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email: pendingEmail }),
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

    if (!isAllowedEmailDomain(email)) {
      setErrorMsg(t('register.errorEmailDomain'));
      return;
    }
    if (!isStrongPassword(password)) {
      setErrorMsg(t('register.errorPasswordWeak'));
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg(t('register.errorPasswordMismatch'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name, photoUrl: photoUrl || undefined }),
      });
      const data = await res.json();
      setSubmitting(false);
      if (res.ok && data.needsEmailVerification) {
        setPendingEmail(data.email || email);
        setInfoMsg(data.message || t('verifyEmail.pendingRegister', { email: data.email || email }));
        return;
      }
      if (res.ok) {
        if (data.token) setToken(data.token);
        onRegisterSuccess();
      } else {
        setErrorMsg(data.error || t('register.error'));
      }
    } catch {
      setSubmitting(false);
      setErrorMsg(t('register.errorConn'));
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    setErrorMsg('');
    setInfoMsg('');
    setGoogleSubmitting(true);
    try {
      const res = await loginWithGoogle(credential);
      if (res.success) {
        onRegisterSuccess();
      } else {
        setErrorMsg(res.error || t('login.googleError'));
      }
    } catch {
      setErrorMsg(t('register.errorConn'));
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const showGoogle = Boolean(authConfig?.googleOAuthEnabled && authConfig?.googleClientId);

  if (pendingEmail) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto 0 auto', width: '100%' }} className="fade-in">
        <div className="card" style={{ textAlign: 'center' }}>
          <h2 className="card-title" style={{ justifyContent: 'center' }}>
            <MailCheck size={22} style={{ color: 'var(--primary)' }} /> {t('verifyEmail.title')}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1rem' }}>
            {t('verifyEmail.pendingRegister', { email: pendingEmail })}
          </p>
          <Toast message={errorMsg} type="error" onClose={() => setErrorMsg('')} />
          <Toast message={infoMsg} type="success" onClose={() => setInfoMsg('')} />
          <button type="button" className="btn btn-secondary" style={{ width: '100%', marginBottom: '0.75rem' }} onClick={handleResend} disabled={resending}>
            {resending ? t('verifyEmail.resending') : t('verifyEmail.resend')}
          </button>
          <button type="button" className="btn btn-secondary" style={{ width: '100%' }} onClick={onSwitchToLogin}>
            {t('register.toLogin')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto 0 auto', width: '100%' }} className="fade-in">
      <div className="card register-card">
        <div className="profile-hero">
          <div className="profile-hero-banner brand-gradient-bg" />
          <div className="profile-hero-body">
            <div className="profile-avatar-wrap">
              {photoUrl ? (
                <img src={photoUrl} alt={name || t('register.title')} className="profile-avatar" />
              ) : (
                <div
                  className="profile-avatar profile-avatar-placeholder"
                  style={{ backgroundColor: avatarColorForName(name.trim() || '?'), color: '#fff' }}
                >
                  {name.trim() ? name.trim().slice(0, 2).toUpperCase() : '?'}
                </div>
              )}
              <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} id="photo-upload-register" />
              <label htmlFor="photo-upload-register" className="profile-avatar-edit" title={t('photo.select')}>
                <Camera size={15} />
              </label>
              {photoUrl && (
                <button
                  type="button"
                  onClick={() => setPhotoUrl('')}
                  className="profile-avatar-edit profile-avatar-remove"
                  title={t('photo.remove')}
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
            <p className="register-photo-hint">{t('photo.hintOptional')}</p>
          </div>
        </div>

        <div className="register-card-body">
        <h2 className="card-title">
          <UserPlus size={22} style={{ color: 'var(--primary)' }} /> {t('register.title')}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          {t('register.subtitle')}
        </p>

        <Toast message={errorMsg} type="error" onClose={() => setErrorMsg('')} />

        {showGoogle && (
          <div style={{ marginBottom: '1.25rem' }}>
            <GoogleSignInButton
              clientId={authConfig!.googleClientId!}
              onSuccess={handleGoogleSuccess}
              onError={() => setErrorMsg(t('login.googleError'))}
              disabled={submitting || googleSubmitting}
            />
            <div className="auth-divider" style={{ marginTop: '1.25rem' }}>
              <span>{t('register.orWithEmail')}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="profile-field-label">
              <UserIcon size={15} style={{ color: 'var(--primary)' }} /> {t('register.nameLabel')}
            </label>
            <input
              type="text"
              placeholder={t('register.namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setActiveHint('name')}
              onBlur={() => setActiveHint((cur) => (cur === 'name' ? null : cur))}
              required
            />
            {activeHint === 'name' && (
              <span className="profile-field-hint">{t('register.nameHint')}</span>
            )}
          </div>

          <div className="form-group">
            <label className="profile-field-label">
              <Mail size={15} style={{ color: 'var(--primary)' }} /> {t('register.emailLabel')}
            </label>
            <input
              type="email"
              placeholder={t('register.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setActiveHint('email')}
              onBlur={() => setActiveHint((cur) => (cur === 'email' ? null : cur))}
              required
            />
            {activeHint === 'email' && (
              <span className="profile-field-hint">{t('register.emailHint')}</span>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="profile-field-label">
                <Lock size={15} style={{ color: 'var(--primary)' }} /> {t('register.passwordLabel')}
              </label>
              <PasswordInput
                placeholder={t('register.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setActiveHint('password')}
                onBlur={() => setActiveHint((cur) => (cur === 'password' ? null : cur))}
                required
                minLength={8}
              />
              {activeHint === 'password' && (
                <span className="profile-field-hint">{t('register.passwordHint')}</span>
              )}
            </div>
            <div className="form-group">
              <label className="profile-field-label">
                <LockKeyhole size={15} style={{ color: 'var(--primary)' }} /> {t('register.confirmPasswordLabel')}
              </label>
              <PasswordInput placeholder={t('register.confirmPasswordPlaceholder')} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} />
            </div>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <button type="submit" disabled={submitting || googleSubmitting} className="btn" style={{ width: '100%' }}>
              {submitting ? t('register.submitting') : t('register.submit')}
            </button>
          </div>
        </form>

        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', textAlign: 'center' }}>
          <button onClick={onSwitchToLogin} className="btn btn-secondary" style={{ width: '100%' }}>{t('register.toLogin')}</button>
        </div>
        </div>
      </div>

      <PhotoCropModal
        file={cropFile}
        onConfirm={handleCropConfirm}
        onClose={() => setCropFile(null)}
      />
    </div>
  );
}

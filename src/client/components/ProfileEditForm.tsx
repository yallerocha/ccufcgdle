'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Camera, Save, AlertTriangle, Settings2, Settings, Trash2, KeyRound, User as UserIcon, Lock, LockKeyhole, ChevronRight, ArrowLeft, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import type { User } from '@/client/context/AuthContext';
import { isStrongPassword } from '@/shared/validation';
import { apiFetch, setToken } from '@/client/lib/api';
import { avatarColorForName } from '@/client/lib/avatar';
import { PhotoCropModal } from '@/client/components/PhotoCropModal';
import { Toast } from '@/client/components/Toast';
import { PasswordInput } from '@/client/components/PasswordInput';

interface ProfileEditFormProps {
  user: User;
  refreshUser: () => void;
}

export function ProfileEditForm({ user, refreshUser }: ProfileEditFormProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(user.name);
  const [photoUrl, setPhotoUrl] = useState(user.photoUrl || '');
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [photoMsg, setPhotoMsg] = useState('');
  const [photoMsgType, setPhotoMsgType] = useState<'success' | 'error'>('error');
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  // Settings modal: null (closed) | 'menu' (option list) | 'password' (change form).
  const [settingsView, setSettingsView] = useState<'menu' | 'password' | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setName(user.name);
    setPhotoUrl(user.photoUrl || '');
  }, [user]);

  // Photo saves immediately, so the only unsaved change is the name.
  const isDirty = name !== user.name;
  const dirtyRef = useRef(isDirty);
  dirtyRef.current = isDirty;

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!dirtyRef.current) return;
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement)?.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || anchor.target === '_blank') return;
      if (href === window.location.pathname) return;
      e.preventDefault();
      setPendingHref(href);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  const confirmLeave = () => {
    const href = pendingHref;
    setPendingHref(null);
    dirtyRef.current = false;
    if (href) router.push(href);
  };

  const notifyPhoto = (msg: string, type: 'success' | 'error' = 'error') => {
    setPhotoMsgType(type);
    setPhotoMsg(msg);
  };

  const savePhotoImmediately = async (nextPhotoUrl: string) => {
    setSavingPhoto(true);
    setPhotoMsg('');
    try {
      const res = await apiFetch('/api/auth/me', {
        method: 'PUT',
        body: JSON.stringify({ photoUrl: nextPhotoUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPhotoUrl(user.photoUrl || '');
        notifyPhoto(data.error || t('photo.saveError'), 'error');
        return;
      }
      refreshUser();
      notifyPhoto(t('photo.saved'), 'success');
    } catch {
      setPhotoUrl(user.photoUrl || '');
      notifyPhoto(t('photo.saveError'), 'error');
    } finally {
      setSavingPhoto(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || savingPhoto) return;
    if (file.size > 2 * 1024 * 1024) {
      notifyPhoto(t('photo.tooLarge'), 'error');
      return;
    }
    setCropFile(file);
  };

  const handleCropConfirm = async (nextUrl: string) => {
    setCropFile(null);
    setPhotoUrl(nextUrl);
    await savePhotoImmediately(nextUrl);
  };

  const handlePhotoRemove = async () => {
    if (savingPhoto) return;
    setPhotoUrl('');
    await savePhotoImmediately('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(''); setSuccessMsg(''); setSubmitting(true);
    try {
      const res = await apiFetch('/api/auth/me', {
        method: 'PUT',
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      setSubmitting(false);
      if (res.ok) {
        if (data.token) setToken(data.token);
        setSuccessMsg(t('profileEdit.success'));
        dirtyRef.current = false;
        refreshUser();
      } else { setErrorMsg(data.error || t('profileEdit.error')); }
    } catch { setSubmitting(false); setErrorMsg(t('profileEdit.errorConn')); }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrorMsg('');
    setPasswordSuccessMsg('');

    if (!isStrongPassword(newPassword)) {
      setPasswordErrorMsg(t('profileEdit.passwordWeak'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg(t('profileEdit.passwordMismatch'));
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordErrorMsg(t('profileEdit.passwordSameAsCurrent'));
      return;
    }

    setChangingPassword(true);
    try {
      const res = await apiFetch('/api/auth/me/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordSuccessMsg(t('profileEdit.passwordSuccess'));
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else if (res.status === 401) {
        setPasswordErrorMsg(data.error || t('profileEdit.passwordWrongCurrent'));
      } else {
        setPasswordErrorMsg(data.error || t('profileEdit.passwordError'));
      }
    } catch {
      setPasswordErrorMsg(t('profileEdit.passwordErrorConn'));
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="profile-page fade-in">
      {/* Hero: avatar + name + settings gear */}
      <div className="card profile-hero">
        <button
          type="button"
          className="profile-gear"
          onClick={() => setSettingsView('menu')}
          title={t('profileEdit.settingsTitle')}
          aria-label={t('profileEdit.settingsTitle')}
        >
          <Settings size={18} />
        </button>
        <div className="profile-hero-body">
          <div className="profile-avatar-wrap">
            {photoUrl ? (
              <img src={photoUrl} alt={name} className="profile-avatar" />
            ) : (
              <div
                className="profile-avatar profile-avatar-placeholder"
                style={{ backgroundColor: avatarColorForName(name.trim() || '?'), color: '#fff' }}
              >
                {name.trim() ? name.trim().slice(0, 2).toUpperCase() : '?'}
              </div>
            )}
            <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} id="photo-upload-edit" disabled={savingPhoto} />
            <label htmlFor="photo-upload-edit" className="profile-avatar-edit" title={t('photo.select')} style={savingPhoto ? { opacity: 0.5, pointerEvents: 'none' } : undefined}>
              <Camera size={15} />
            </label>
            {photoUrl && (
              <button
                type="button"
                onClick={handlePhotoRemove}
                disabled={savingPhoto}
                className="profile-avatar-edit profile-avatar-remove"
                title={t('photo.remove')}
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>

          <Toast message={photoMsg} type={photoMsgType} onClose={() => setPhotoMsg('')} />

          <div className="profile-hero-info">
            <h2 className="profile-hero-name">{name}</h2>
          </div>
        </div>
      </div>

      {/* Name */}
      <div className="card">
        <h2 className="card-title">
          <Settings2 size={22} style={{ color: 'var(--primary)' }} /> {t('profileEdit.attrTitle')}
        </h2>

        <Toast
          message={errorMsg || successMsg}
          type={errorMsg ? 'error' : 'success'}
          onClose={() => { setErrorMsg(''); setSuccessMsg(''); }}
        />

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="profile-field-label" htmlFor="profile-name">
              <UserIcon size={15} style={{ color: 'var(--primary)' }} /> {t('profileEdit.nameLabel')}
            </label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('profileEdit.namePlaceholder')}
              minLength={3}
              maxLength={25}
              required
            />
            <span className="profile-field-hint">{t('profileEdit.nameHint')}</span>
          </div>

          <div className="profile-save-bar">
            {isDirty && (
              <span className="profile-dirty-hint">
                <AlertTriangle size={13} /> {t('profileEdit.unsavedTitle')}
              </span>
            )}
            <button type="submit" disabled={submitting} className="btn profile-save-btn">
              <Save size={18} /> {submitting ? t('profileEdit.saving') : t('profileEdit.save')}
            </button>
          </div>
        </form>
      </div>

      {/* Settings modal: option menu → change-password form */}
      {mounted && settingsView && createPortal(
        <div className="modal-overlay" onClick={() => setSettingsView(null)}>
          <div className="modal-content" style={{ maxWidth: '480px', textAlign: 'left' }} onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-head">
              {settingsView === 'password' ? (
                <button type="button" className="settings-back" onClick={() => setSettingsView('menu')} aria-label={t('common.back')}>
                  <ArrowLeft size={18} />
                </button>
              ) : <span />}
              <h2 className="modal-title" style={{ margin: 0, fontSize: '1.4rem' }}>
                {settingsView === 'password' ? t('profileEdit.passwordTitle') : t('profileEdit.settingsTitle')}
              </h2>
              <button type="button" className="settings-back" onClick={() => setSettingsView(null)} aria-label={t('common.close')}>
                <X size={18} />
              </button>
            </div>

            {settingsView === 'menu' && (
              <div className="settings-options">
                {(user.hasPassword ?? true) && (
                  <button type="button" className="settings-option" onClick={() => setSettingsView('password')}>
                    <KeyRound size={18} style={{ color: 'var(--gold)' }} />
                    <span>{t('profileEdit.passwordTitle')}</span>
                    <ChevronRight size={16} style={{ marginLeft: 'auto', color: 'var(--text-dim)' }} />
                  </button>
                )}
              </div>
            )}

            {settingsView === 'password' && (
              <>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.75rem 0 1.25rem' }}>
                  {t('profileEdit.passwordSubtitle')}
                </p>
                <Toast
                  message={passwordErrorMsg || passwordSuccessMsg}
                  type={passwordErrorMsg ? 'error' : 'success'}
                  onClose={() => { setPasswordErrorMsg(''); setPasswordSuccessMsg(''); }}
                />
                <form onSubmit={handlePasswordSubmit}>
                  <div className="form-group">
                    <label className="profile-field-label" htmlFor="profile-current-password">
                      <Lock size={15} style={{ color: 'var(--primary)' }} /> {t('profileEdit.currentPasswordLabel')}
                    </label>
                    <PasswordInput
                      id="profile-current-password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder={t('profileEdit.currentPasswordPlaceholder')}
                      autoComplete="current-password"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="profile-field-label" htmlFor="profile-new-password">
                      <LockKeyhole size={15} style={{ color: 'var(--primary)' }} /> {t('profileEdit.newPasswordLabel')}
                    </label>
                    <PasswordInput
                      id="profile-new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t('profileEdit.newPasswordPlaceholder')}
                      autoComplete="new-password"
                      required
                      minLength={8}
                    />
                  </div>
                  <div className="form-group">
                    <label className="profile-field-label" htmlFor="profile-confirm-password">
                      <LockKeyhole size={15} style={{ color: 'var(--primary)' }} /> {t('profileEdit.confirmPasswordLabel')}
                    </label>
                    <PasswordInput
                      id="profile-confirm-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t('profileEdit.confirmPasswordPlaceholder')}
                      autoComplete="new-password"
                      required
                      minLength={8}
                    />
                  </div>
                  <button type="submit" disabled={changingPassword} className="btn profile-save-btn" style={{ width: '100%', marginTop: '0.5rem' }}>
                    <KeyRound size={18} /> {changingPassword ? t('profileEdit.changingPassword') : t('profileEdit.changePassword')}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Unsaved-changes confirmation */}
      {mounted && pendingHref && createPortal(
        <div className="modal-overlay" onClick={() => setPendingHref(null)}>
          <div className="modal-content" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <AlertTriangle size={44} style={{ color: 'var(--accent)', margin: '0 auto 1rem auto' }} />
            <h2 className="modal-title">{t('profileEdit.unsavedTitle')}</h2>
            <p className="modal-subtitle">{t('profileEdit.unsavedBody')}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button onClick={confirmLeave} className="btn btn-secondary" style={{ width: '100%' }}>
                {t('profileEdit.unsavedLeave')}
              </button>
              <button onClick={() => setPendingHref(null)} className="btn" style={{ width: '100%' }}>
                {t('profileEdit.unsavedStay')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <PhotoCropModal
        file={cropFile}
        onConfirm={handleCropConfirm}
        onClose={() => setCropFile(null)}
      />
    </div>
  );
}

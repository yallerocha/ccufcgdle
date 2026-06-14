'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Clock, Camera, Save, AlertTriangle, Settings2, Trash2, FolderGit2, Layers, KeyRound, User as UserIcon, Briefcase, CalendarDays, Users, Coffee, Lock, LockKeyhole } from 'lucide-react';
import { createPortal } from 'react-dom';
import type { User } from '@/client/context/AuthContext';
import { INACTIVITY_DAYS } from '@/shared/utils';
import { isStrongPassword } from '@/shared/validation';
import { apiFetch } from '@/client/lib/api';
import { PhotoCropModal } from '@/client/components/PhotoCropModal';
import { Toast } from '@/client/components/Toast';
import { PasswordInput } from '@/client/components/PasswordInput';
import { AreaPicker } from '@/client/components/AreaPicker';
import { ProjectPicker } from '@/client/components/ProjectPicker';

const GENDER_OPTIONS = ['Masculino', 'Feminino', 'Outro'];
const ROLE_OPTIONS = ['Professor', 'Graduando', 'Mestrando', 'Doutorando', 'Pesquisador', 'Funcionário'];
const ENTRY_OPTIONS = [
  'Antes de 2018',
  '2018.1', '2018.2', '2019.1', '2019.2',
  '2020.1', '2020.2', '2021.1', '2021.2',
  '2022.1', '2022.2', '2023.1', '2023.2',
  '2024.1', '2024.2', '2025.1', '2025.2',
  '2026.1'
];
const COLAB_OPTIONS = ['Sim', 'Não'];
const COFFEE_OPTIONS = ['Sim', 'Não'];

interface ProfileEditFormProps {
  user: User;
  refreshUser: () => void;
}

export function ProfileEditForm({ user, refreshUser }: ProfileEditFormProps) {
  const { t } = useTranslation();
  const [gender, setGender] = useState(user.gender);
  const [role, setRole] = useState(user.role);
  const [entrySemester, setEntrySemester] = useState(user.entrySemester);
  const [isColab, setIsColab] = useState(user.isColab);
  const [area, setArea] = useState<string[]>(user.area ?? []);
  const [projects, setProjects] = useState<string[]>(user.projects?.slice(0, 1) ?? []);

  const [likesCoffee, setLikesCoffee] = useState(user.likesCoffee);
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
  // Pending navigation held back by the unsaved-changes guard, surfaced through
  // the confirmation modal. `null` means no prompt is open.
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setGender(user.gender);
    setRole(user.role);
    setEntrySemester(user.entrySemester);
    setIsColab(user.isColab);
    setArea(user.area ?? []);
    setProjects(user.projects?.slice(0, 1) ?? []);
    setLikesCoffee(user.likesCoffee);
    setPhotoUrl(user.photoUrl || '');
  }, [user]);

  // True when the form differs from the saved user (so we know to warn on exit).
  const isDirty =
    gender !== user.gender ||
    role !== user.role ||
    entrySemester !== user.entrySemester ||
    isColab !== user.isColab ||
    area.length !== (user.area?.length ?? 0) ||
    area.some((a) => !(user.area ?? []).includes(a)) ||
    likesCoffee !== user.likesCoffee ||
    projects.length !== (user.projects?.length ?? 0) ||
    projects.some((p) => !(user.projects ?? []).includes(p));

  // Keep the latest dirty flag in a ref so the (once-registered) DOM listeners
  // always read the current value.
  const dirtyRef = useRef(isDirty);
  dirtyRef.current = isDirty;

  // Warn on full-page exits (closing the tab, reload, external navigation).
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  // Intercept in-app navigation (clicks on <a>/<Link>) while there are unsaved
  // changes, so we can show the confirmation modal instead of leaving.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!dirtyRef.current) return;
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement)?.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || anchor.target === '_blank') return;
      // Don't intercept clicks within the profile page itself.
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
    dirtyRef.current = false; // allow the navigation through
    if (href) router.push(href);
  };

  const notifyPhoto = (msg: string, type: 'success' | 'error' = 'error') => {
    setPhotoMsgType(type);
    setPhotoMsg(msg);
  };

  // Photo saves immediately so it never blocks navigation or the attribute form.
  const savePhotoImmediately = async (nextPhotoUrl: string) => {
    setSavingPhoto(true);
    setPhotoMsg('');
    try {
      const res = await apiFetch('/api/auth/me', {
        method: 'PUT',
        body: JSON.stringify({
          gender: user.gender,
          role: user.role,
          entrySemester: user.entrySemester,
          isColab: user.isColab,
          area: user.area ?? [],
          projects: user.projects?.slice(0, 1) ?? [],
          likesCoffee: user.likesCoffee,
          photoUrl: nextPhotoUrl,
        }),
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
        body: JSON.stringify({ gender, role, entrySemester, isColab, area, projects, likesCoffee, photoUrl })
      });
      const data = await res.json();
      setSubmitting(false);
      if (res.ok) { setSuccessMsg(t('profileEdit.success')); dirtyRef.current = false; refreshUser(); }
      else { setErrorMsg(data.error || t('profileEdit.error')); }
    } catch (err) { setSubmitting(false); setErrorMsg(t('profileEdit.errorConn')); }
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
      {/* Hero: banner + avatar + name + status */}
      <div className="card profile-hero">
        <div className="profile-hero-banner lsd-gradient-bg" />
        <div className="profile-hero-body">
          <div className="profile-avatar-wrap">
            {photoUrl ? (
              <img src={photoUrl} alt={user.name} className="profile-avatar" />
            ) : (
              <div className="profile-avatar profile-avatar-placeholder">
                {user.name.slice(0, 2).toUpperCase()}
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

          <Toast
            message={photoMsg}
            type={photoMsgType}
            onClose={() => setPhotoMsg('')}
          />

          <div className="profile-hero-info">
            <h2 className="profile-hero-name">{user.name}</h2>
            <span className="badge badge-active">{t('profileEdit.activeBadge')}</span>
          </div>

          <p className="profile-hero-status">
            {t('profileEdit.statusBody', { name: user.name, days: INACTIVITY_DAYS })}
          </p>

        </div>
      </div>

      {/* Attributes form */}
      <div className="card">
        <h2 className="card-title">
          <Settings2 size={22} style={{ color: 'var(--primary)' }} /> {t('profileEdit.attrTitle')}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{t('profileEdit.attrSubtitle')}</p>
        <p className="profile-change-note">
          <Clock size={14} style={{ flexShrink: 0 }} /> {t('profileEdit.changeNote')}
        </p>

        <Toast
          message={errorMsg || successMsg}
          type={errorMsg ? 'error' : 'success'}
          onClose={() => { setErrorMsg(''); setSuccessMsg(''); }}
        />

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="profile-field-label">
                <UserIcon size={15} style={{ color: 'var(--primary)' }} /> {t('profileEdit.genderLabel')}
              </label>
              <select value={gender} onChange={(e) => setGender(e.target.value)}>{GENDER_OPTIONS.map(o => <option key={o}>{o}</option>)}</select>
            </div>
            <div className="form-group">
              <label className="profile-field-label">
                <Briefcase size={15} style={{ color: 'var(--primary)' }} /> {t('profileEdit.roleLabel')}
              </label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>{ROLE_OPTIONS.map(o => <option key={o}>{o}</option>)}</select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="profile-field-label">
                <CalendarDays size={15} style={{ color: 'var(--primary)' }} /> {t('profileEdit.entryLabel')}
              </label>
              <select value={entrySemester} onChange={(e) => setEntrySemester(e.target.value)}>{ENTRY_OPTIONS.map(o => <option key={o}>{o}</option>)}</select>
            </div>
            <div className="form-group">
              <label className="profile-field-label">
                <Users size={15} style={{ color: 'var(--primary)' }} /> {t('profileEdit.colabsLabel')}
              </label>
              <select value={isColab} onChange={(e) => setIsColab(e.target.value)}>{COLAB_OPTIONS.map(o => <option key={o}>{o}</option>)}</select>
            </div>
          </div>

          <div className="profile-projects-section">
            <label className="profile-field-label">
              <Layers size={15} style={{ color: 'var(--primary)' }} /> {t('profileEdit.areaLabel')}
            </label>
            <AreaPicker selected={area} onChange={setArea} />
          </div>

          <div className="profile-projects-section">
            <label className="profile-field-label">
              <FolderGit2 size={15} style={{ color: 'var(--primary)' }} /> {t('profileEdit.labLabel')}
            </label>
            <p className="profile-field-hint">{t('projects.singleHint')}</p>
            <ProjectPicker selected={projects} onChange={setProjects} savedProjects={user.projects?.slice(0, 1) ?? []} allowCreate />
          </div>

          <div className="form-group">
            <label className="profile-field-label">
              <Coffee size={15} style={{ color: 'var(--primary)' }} /> {t('profileEdit.coffeeLabel')}
            </label>
            <select value={likesCoffee} onChange={(e) => setLikesCoffee(e.target.value)}>{COFFEE_OPTIONS.map(o => <option key={o}>{o}</option>)}</select>
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

      {/* Password change — separate form so it doesn't mix with attribute dirty state */}
      <div className="card">
        <h2 className="card-title">
          <KeyRound size={22} style={{ color: 'var(--primary)' }} /> {t('profileEdit.passwordTitle')}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
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
          <div className="form-row">
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
          </div>
          <div className="profile-save-bar">
            <button type="submit" disabled={changingPassword} className="btn profile-save-btn">
              <KeyRound size={18} /> {changingPassword ? t('profileEdit.changingPassword') : t('profileEdit.changePassword')}
            </button>
          </div>
        </form>
      </div>

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

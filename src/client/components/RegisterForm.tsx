'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserPlus, Camera, Trash2, User as UserIcon, Mail, Lock, LockKeyhole, Briefcase, CalendarDays, Users, Coffee, Layers, FolderGit2 } from 'lucide-react';
import { apiFetch, setToken } from '@/client/lib/api';
import { fileToResizedDataUrl } from '@/client/lib/image';
import { isAllowedEmailDomain, isStrongPassword } from '@/shared/validation';
import { PasswordInput } from '@/client/components/PasswordInput';
import { AreaPicker } from '@/client/components/AreaPicker';
import { ProjectPicker } from '@/client/components/ProjectPicker';
import { Toast } from '@/client/components/Toast';

const GENDER_OPTIONS = ['Masculino', 'Feminino', 'Outro'];
const ROLE_OPTIONS = ['Professor', 'Graduando', 'Mestrando', 'Doutorando', 'Pesquisador', 'Funcionário'];
const ENTRY_OPTIONS = [
  'Antes de 2018',
  '2018.1', '2018.2',
  '2019.1', '2019.2',
  '2020.1', '2020.2',
  '2021.1', '2021.2',
  '2022.1', '2022.2',
  '2023.1', '2023.2',
  '2024.1', '2024.2',
  '2025.1', '2025.2',
  '2026.1'
];
const COLAB_OPTIONS = ['Sim', 'Não'];
const COFFEE_OPTIONS = ['Sim', 'Não'];

interface RegisterFormProps {
  onRegisterSuccess: () => void;
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onRegisterSuccess, onSwitchToLogin }: RegisterFormProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState(GENDER_OPTIONS[0]);
  const [role, setRole] = useState(ROLE_OPTIONS[0]);
  const [entrySemester, setEntrySemester] = useState(ENTRY_OPTIONS[0]);
  const [isColab, setIsColab] = useState(COLAB_OPTIONS[0]);
  const [area, setArea] = useState<string[]>([]);
  const [projects, setProjects] = useState<string[]>([]);

  const [likesCoffee, setLikesCoffee] = useState(COFFEE_OPTIONS[0]);
  const [photoUrl, setPhotoUrl] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      // Downscale at upload time so the stored photo (and every list that
      // includes it) stays small.
      setPhotoUrl(await fileToResizedDataUrl(file));
    } catch {
      // Resizing failed (unsupported format?) — fall back to the raw file,
      // still subject to the original size limit.
      if (file.size > 2 * 1024 * 1024) {
        alert(t('photo.tooLarge'));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setPhotoUrl(reader.result as string);
      reader.readAsDataURL(file);
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
        body: JSON.stringify({ email, password, name, gender, role, entrySemester, isColab, area, projects, likesCoffee, photoUrl })
      });
      const data = await res.json();
      setSubmitting(false);
      if (res.ok) {
        if (data.token) setToken(data.token);
        onRegisterSuccess();
      } else {
        setErrorMsg(data.error || t('register.error'));
      }
    } catch (err) {
      setSubmitting(false);
      setErrorMsg(t('register.errorConn'));
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto 0 auto', width: '100%' }} className="fade-in">
      <div className="card register-card">
        <div className="profile-hero">
          <div className="profile-hero-banner lsd-gradient-bg" />
          <div className="profile-hero-body">
            <div className="profile-avatar-wrap">
              {photoUrl ? (
                <img src={photoUrl} alt={name || t('register.title')} className="profile-avatar" />
              ) : (
                <div className="profile-avatar profile-avatar-placeholder">
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
            <p className="register-photo-hint">{t('photo.hint')}</p>
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

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="profile-field-label">
              <UserIcon size={15} style={{ color: 'var(--primary)' }} /> {t('register.nameLabel')}
            </label>
            <input type="text" placeholder={t('register.namePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} required />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              {t('register.nameHint')}
            </span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="profile-field-label">
                <Mail size={15} style={{ color: 'var(--primary)' }} /> {t('register.emailLabel')}
              </label>
              <input type="email" placeholder={t('register.emailPlaceholder')} value={email} onChange={(e) => setEmail(e.target.value)} required />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{t('register.emailHint')}</span>
            </div>
            <div className="form-group">
              <label className="profile-field-label">
                <Lock size={15} style={{ color: 'var(--primary)' }} /> {t('register.passwordLabel')}
              </label>
              <PasswordInput placeholder={t('register.passwordPlaceholder')} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{t('register.passwordHint')}</span>
            </div>
          </div>

          <div className="form-group">
            <label className="profile-field-label">
              <LockKeyhole size={15} style={{ color: 'var(--primary)' }} /> {t('register.confirmPasswordLabel')}
            </label>
            <PasswordInput placeholder={t('register.confirmPasswordPlaceholder')} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} />
          </div>

          <div className="form-row" style={{ borderTop: '1px solid var(--border-color)', marginTop: '1rem', paddingTop: '1rem' }}>
            <div className="form-group">
              <label className="profile-field-label">
                <UserIcon size={15} style={{ color: 'var(--primary)' }} /> {t('register.genderLabel')}
              </label>
              <select value={gender} onChange={(e) => setGender(e.target.value)}>
                {GENDER_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="profile-field-label">
                <Briefcase size={15} style={{ color: 'var(--primary)' }} /> {t('register.roleLabel')}
              </label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                {ROLE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="profile-field-label">
                <CalendarDays size={15} style={{ color: 'var(--primary)' }} /> {t('register.entryLabel')}
              </label>
              <select value={entrySemester} onChange={(e) => setEntrySemester(e.target.value)}>
                {ENTRY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="profile-field-label">
                <Users size={15} style={{ color: 'var(--primary)' }} /> {t('register.colabsLabel')}
              </label>
              <select value={isColab} onChange={(e) => setIsColab(e.target.value)}>
                {COLAB_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>

          <div className="profile-projects-section">
            <label className="profile-field-label">
              <Layers size={15} style={{ color: 'var(--primary)' }} /> {t('register.areaLabel')}
            </label>
            <AreaPicker selected={area} onChange={setArea} />
          </div>

          <div className="profile-projects-section">
            <label className="profile-field-label">
              <FolderGit2 size={15} style={{ color: 'var(--primary)' }} /> {t('register.labLabel')}
            </label>
            <p className="profile-field-hint">{t('projects.singleHint')}</p>
            <ProjectPicker selected={projects} onChange={setProjects} savedProjects={[]} allowCreate={false} />
          </div>

          <div className="form-group">
            <label className="profile-field-label">
              <Coffee size={15} style={{ color: 'var(--primary)' }} /> {t('register.coffeeLabel')}
            </label>
            <select value={likesCoffee} onChange={(e) => setLikesCoffee(e.target.value)}>
              {COFFEE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <button type="submit" disabled={submitting} className="btn" style={{ width: '100%' }}>
              {submitting ? t('register.submitting') : t('register.submit')}
            </button>
          </div>
        </form>

        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', textAlign: 'center' }}>
          <button onClick={onSwitchToLogin} className="btn btn-secondary" style={{ width: '100%' }}>{t('register.toLogin')}</button>
        </div>
        </div>
      </div>
    </div>
  );
}

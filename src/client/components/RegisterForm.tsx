'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserPlus, Camera } from 'lucide-react';
import { apiFetch, setToken } from '@/client/lib/api';

const GENDER_OPTIONS = ['Masculino', 'Feminino', 'Outro'];
const ROLE_OPTIONS = ['Estudante', 'Professor', 'Ex-aluno', 'Técnico'];
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
const LANGUAGE_OPTIONS = ['C', 'Java', 'Python', 'Haskell', 'JavaScript', 'Rust', 'C++', 'Go', 'Prolog', 'Outra'];
const AREA_OPTIONS = [
  'Engenharia de Software',
  'Sistemas Distribuídos / Redes',
  'Ciência de Dados / IA',
  'Teoria da Computação',
  'Hardware / Embarcados',
  'Segurança da Informação',
  'Outra'
];
// Projetos / linhas de pesquisa dentro do LSD (multivalor)
const PROJECT_OPTIONS = ['Computação em Nuvem', 'Computação na Borda', 'Blockchain', 'Big Data', 'HPC', 'Observabilidade', 'IoT', 'Computação Verde', 'Outro'];
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
  const [gender, setGender] = useState(GENDER_OPTIONS[0]);
  const [role, setRole] = useState(ROLE_OPTIONS[0]);
  const [entrySemester, setEntrySemester] = useState(ENTRY_OPTIONS[0]);
  const [favoriteLanguage, setFavoriteLanguage] = useState(LANGUAGE_OPTIONS[0]);
  const [area, setArea] = useState(AREA_OPTIONS[0]);
  const [projects, setProjects] = useState<string[]>([]);

  const toggleProject = (proj: string) => {
    setProjects((prev) => prev.includes(proj) ? prev.filter((p) => p !== proj) : [...prev, proj]);
  };
  const [likesCoffee, setLikesCoffee] = useState(COFFEE_OPTIONS[0]);
  const [photoUrl, setPhotoUrl] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name, gender, role, entrySemester, favoriteLanguage, area, projects, likesCoffee, photoUrl })
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
      <div className="card">
        <h2 className="card-title">
          <UserPlus size={22} style={{ color: 'var(--primary)' }} /> {t('register.title')}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          {t('register.subtitle')}
        </p>

        {errorMsg && <div className="alert alert-error">{errorMsg}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('register.nameLabel')}</label>
            <input type="text" placeholder={t('register.namePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} required />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              {t('register.nameHint')}
            </span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t('register.emailLabel')}</label>
              <input type="email" placeholder={t('register.emailPlaceholder')} value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>{t('register.passwordLabel')}</label>
              <input type="password" placeholder={t('register.passwordPlaceholder')} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
          </div>

          <div className="form-row" style={{ borderTop: '1px solid var(--border-color)', marginTop: '1rem', paddingTop: '1rem' }}>
            <div className="form-group">
              <label>{t('register.genderLabel')}</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)}>
                {GENDER_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>{t('register.roleLabel')}</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                {ROLE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t('register.entryLabel')}</label>
              <select value={entrySemester} onChange={(e) => setEntrySemester(e.target.value)}>
                {ENTRY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>{t('register.languageLabel')}</label>
              <select value={favoriteLanguage} onChange={(e) => setFavoriteLanguage(e.target.value)}>
                {LANGUAGE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>{t('register.areaLabel')}</label>
            <select value={area} onChange={(e) => setArea(e.target.value)}>
              {AREA_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>{t('register.labLabel')}</label>
            <div className="checkbox-group">
              {PROJECT_OPTIONS.map(opt => (
                <label key={opt} className={`checkbox-chip ${projects.includes(opt) ? 'selected' : ''}`}>
                  <input type="checkbox" checked={projects.includes(opt)} onChange={() => toggleProject(opt)} />
                  {opt}
                </label>
              ))}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{t('register.projectsHint')}</span>
          </div>

          <div className="form-group">
            <label>{t('register.coffeeLabel')}</label>
            <select value={likesCoffee} onChange={(e) => setLikesCoffee(e.target.value)}>
              {COFFEE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>{t('photo.label')}</label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
              <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} id="photo-upload-register" />
              <label htmlFor="photo-upload-register" className="btn btn-secondary" style={{ cursor: 'pointer', margin: 0, padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Camera size={16} /> {t('photo.select')}
              </label>
              {photoUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <img src={photoUrl} alt="Preview" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }} />
                  <button type="button" onClick={() => setPhotoUrl('')} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', height: 'auto', backgroundColor: '#ef4444', color: 'white', border: 'none' }}>{t('photo.remove')}</button>
                </div>
              ) : (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{t('photo.none')}</span>
              )}
            </div>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.35rem' }}>{t('photo.hint')}</span>
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
  );
}

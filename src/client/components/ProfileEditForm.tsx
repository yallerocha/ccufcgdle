'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Camera, Save } from 'lucide-react';
import { User } from '@/client/context/AuthContext';
import { INACTIVITY_DAYS } from '@/shared/utils';
import { apiFetch } from '@/client/lib/api';
import { Toast } from '@/client/components/Toast';

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
const AREA_OPTIONS = ['Engenharia de Software', 'Sistemas Distribuídos / Redes', 'Ciência de Dados / IA', 'Teoria da Computação', 'Hardware / Embarcados', 'Segurança da Informação', 'Outra'];
// Projetos / linhas de pesquisa dentro do LSD (multivalor)
const PROJECT_OPTIONS = ['Computação em Nuvem', 'Computação na Borda', 'Blockchain', 'Big Data', 'HPC', 'Observabilidade', 'IoT', 'Computação Verde', 'Outro'];
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
  const [area, setArea] = useState(user.area);
  const [projects, setProjects] = useState<string[]>(user.projects ?? []);

  const toggleProject = (proj: string) => {
    setProjects((prev) => prev.includes(proj) ? prev.filter((p) => p !== proj) : [...prev, proj]);
  };
  const [likesCoffee, setLikesCoffee] = useState(user.likesCoffee);
  const [photoUrl, setPhotoUrl] = useState(user.photoUrl || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setGender(user.gender);
    setRole(user.role);
    setEntrySemester(user.entrySemester);
    setIsColab(user.isColab);
    setArea(user.area);
    setProjects(user.projects ?? []);
    setLikesCoffee(user.likesCoffee);
    setPhotoUrl(user.photoUrl || '');
  }, [user]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { alert(t('photo.tooLarge')); return; }
      const reader = new FileReader();
      reader.onloadend = () => setPhotoUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
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
      if (res.ok) { setSuccessMsg(t('profileEdit.success')); refreshUser(); }
      else { setErrorMsg(data.error || t('profileEdit.error')); }
    } catch (err) { setSubmitting(false); setErrorMsg(t('profileEdit.errorConn')); }
  };

  return (
    <div style={{ maxWidth: '650px', margin: '2rem auto 0 auto', width: '100%' }} className="fade-in">
      <div className="card" style={{ borderLeft: '4px solid var(--primary)', padding: '1.5rem 2rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', marginBottom: '0.75rem' }}>
          <Clock size={20} style={{ color: 'var(--primary)' }} /> {t('profileEdit.statusTitle')}
        </h3>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          {t('profileEdit.statusBody', { name: user.name, days: INACTIVITY_DAYS })}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <span className="badge badge-active" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>{t('profileEdit.activeBadge')}</span>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">{t('profileEdit.attrTitle')}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{t('profileEdit.attrSubtitle')}</p>

        <Toast
          message={errorMsg || successMsg}
          type={errorMsg ? 'error' : 'success'}
          onClose={() => { setErrorMsg(''); setSuccessMsg(''); }}
        />

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('profileEdit.nameLabel')}</label>
            <input type="text" value={user.name} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
          </div>

          <div className="form-group">
            <label>{t('photo.label')}</label>
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', marginTop: '0.5rem' }}>
              {photoUrl ? (
                <img src={photoUrl} alt="Preview" style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)' }} />
              ) : (
                <div style={{ width: '96px', height: '96px', borderRadius: '50%', border: '2px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', flexShrink: 0 }}>
                  <Camera size={28} />
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
                <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} id="photo-upload-edit" />
                <label htmlFor="photo-upload-edit" className="btn btn-secondary" style={{ cursor: 'pointer', margin: 0, padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Camera size={16} /> {t('photo.select')}</label>
                {photoUrl
                  ? <button type="button" onClick={() => setPhotoUrl('')} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', height: 'auto', backgroundColor: '#ef4444', color: 'white', border: 'none' }}>{t('photo.remove')}</button>
                  : <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{t('photo.none')}</span>}
              </div>
            </div>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.35rem' }}>{t('photo.hint')}</span>
          </div>

          <div className="form-row">
            <div className="form-group"><label>{t('profileEdit.genderLabel')}</label><select value={gender} onChange={(e) => setGender(e.target.value)}>{GENDER_OPTIONS.map(o => <option key={o}>{o}</option>)}</select></div>
            <div className="form-group"><label>{t('profileEdit.roleLabel')}</label><select value={role} onChange={(e) => setRole(e.target.value)}>{ROLE_OPTIONS.map(o => <option key={o}>{o}</option>)}</select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>{t('profileEdit.entryLabel')}</label><select value={entrySemester} onChange={(e) => setEntrySemester(e.target.value)}>{ENTRY_OPTIONS.map(o => <option key={o}>{o}</option>)}</select></div>
            <div className="form-group"><label>{t('profileEdit.colabsLabel')}</label><select value={isColab} onChange={(e) => setIsColab(e.target.value)}>{COLAB_OPTIONS.map(o => <option key={o}>{o}</option>)}</select></div>
          </div>
          <div className="form-group"><label>{t('profileEdit.areaLabel')}</label><select value={area} onChange={(e) => setArea(e.target.value)}>{AREA_OPTIONS.map(o => <option key={o}>{o}</option>)}</select></div>
          <div className="form-group">
            <label>{t('profileEdit.labLabel')}</label>
            <div className="checkbox-group">
              {PROJECT_OPTIONS.map(opt => (
                <label key={opt} className={`checkbox-chip ${projects.includes(opt) ? 'selected' : ''}`}>
                  <input type="checkbox" checked={projects.includes(opt)} onChange={() => toggleProject(opt)} />
                  {opt}
                </label>
              ))}
            </div>
          </div>
          <div className="form-group"><label>{t('profileEdit.coffeeLabel')}</label><select value={likesCoffee} onChange={(e) => setLikesCoffee(e.target.value)}>{COFFEE_OPTIONS.map(o => <option key={o}>{o}</option>)}</select></div>

          <div style={{ marginTop: '2rem' }}>
            <button type="submit" disabled={submitting} className="btn" style={{ width: '100%' }}><Save size={18} /> {submitting ? t('profileEdit.saving') : t('profileEdit.save')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

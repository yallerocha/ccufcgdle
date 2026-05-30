'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Camera, Save } from 'lucide-react';
import { User } from '@/client/context/AuthContext';
import { INACTIVITY_DAYS } from '@/shared/utils';

const GENDER_OPTIONS = ['Masculino', 'Feminino', 'Outro'];
const ROLE_OPTIONS = ['Estudante', 'Professor', 'Ex-aluno', 'Técnico'];
const ENTRY_OPTIONS = [
  'Antes de 2018',
  '2018.1', '2018.2', '2019.1', '2019.2',
  '2020.1', '2020.2', '2021.1', '2021.2',
  '2022.1', '2022.2', '2023.1', '2023.2',
  '2024.1', '2024.2', '2025.1', '2025.2',
  '2026.1'
];
const LANGUAGE_OPTIONS = ['C', 'Java', 'Python', 'Haskell', 'JavaScript', 'Rust', 'C++', 'Go', 'Prolog', 'Outra'];
const AREA_OPTIONS = ['Engenharia de Software', 'Sistemas Distribuídos / Redes', 'Ciência de Dados / IA', 'Teoria da Computação', 'Hardware / Embarcados', 'Segurança da Informação', 'Outra'];
const LAB_OPTIONS = ['LSD', 'SPLab', 'UFCG.AI', 'VIRTUS', 'LCC', 'PET', 'CACo', 'Nenhum', 'Outro'];
const COFFEE_OPTIONS = ['Sim', 'Não', 'Só energético'];

interface ProfileEditFormProps {
  user: User;
  refreshUser: () => void;
}

export function ProfileEditForm({ user, refreshUser }: ProfileEditFormProps) {
  const [gender, setGender] = useState(user.gender);
  const [role, setRole] = useState(user.role);
  const [entrySemester, setEntrySemester] = useState(user.entrySemester);
  const [favoriteLanguage, setFavoriteLanguage] = useState(user.favoriteLanguage);
  const [area, setArea] = useState(user.area);
  const [lab, setLab] = useState(user.lab);
  const [likesCoffee, setLikesCoffee] = useState(user.likesCoffee);
  const [photoUrl, setPhotoUrl] = useState(user.photoUrl || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setGender(user.gender);
    setRole(user.role);
    setEntrySemester(user.entrySemester);
    setFavoriteLanguage(user.favoriteLanguage);
    setArea(user.area);
    setLab(user.lab);
    setLikesCoffee(user.likesCoffee);
    setPhotoUrl(user.photoUrl || '');
  }, [user]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { alert('A imagem é muito grande. Limite de 2MB.'); return; }
      const reader = new FileReader();
      reader.onloadend = () => setPhotoUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(''); setSuccessMsg(''); setSubmitting(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gender, role, entrySemester, favoriteLanguage, area, lab, likesCoffee, photoUrl })
      });
      const data = await res.json();
      setSubmitting(false);
      if (res.ok) { setSuccessMsg('Atributos de personagem atualizados com sucesso!'); refreshUser(); }
      else { setErrorMsg(data.error || 'Erro ao atualizar perfil.'); }
    } catch (err) { setSubmitting(false); setErrorMsg('Erro de conexão.'); }
  };

  const getDaysUntilInactive = () => {
    const lastLoginDate = new Date(user.lastLogin);
    const diffDays = Math.floor((Date.now() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysLeft = INACTIVITY_DAYS - diffDays;
    return daysLeft > 0 ? daysLeft : 0;
  };
  const daysLeft = getDaysUntilInactive();

  return (
    <div style={{ maxWidth: '650px', margin: '2rem auto 0 auto', width: '100%' }} className="fade-in">
      <div className="card" style={{ borderLeft: '4px solid var(--primary)', padding: '1.5rem 2rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', marginBottom: '0.75rem' }}>
          <Clock size={20} style={{ color: 'var(--primary)' }} /> Status do seu Personagem
        </h3>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Olá, <strong>{user.name}</strong>! Seu personagem está registrado no jogo. Para evitar que seja removido por inatividade, você deve logar uma vez a cada {INACTIVITY_DAYS} dias.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <span className="badge badge-active" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>● Personagem Ativo</span>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Última atividade: <strong>{new Date(user.lastLogin).toLocaleDateString('pt-BR')}</strong></span>
          <span style={{ fontSize: '0.9rem', color: daysLeft <= 7 ? '#ef4444' : 'var(--color-correct)', fontWeight: 600 }}>({daysLeft} dias restantes)</span>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Atributos do Personagem</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Atualize as informações utilizadas pelos outros jogadores para adivinhar seu personagem.</p>

        {successMsg && <div className="alert alert-success">{successMsg}</div>}
        {errorMsg && <div className="alert alert-error">{errorMsg}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome / Apelido no Jogo (Não editável)</label>
            <input type="text" value={user.name} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
          </div>
          <div className="form-row">
            <div className="form-group"><label>Gênero</label><select value={gender} onChange={(e) => setGender(e.target.value)}>{GENDER_OPTIONS.map(o => <option key={o}>{o}</option>)}</select></div>
            <div className="form-group"><label>Vínculo</label><select value={role} onChange={(e) => setRole(e.target.value)}>{ROLE_OPTIONS.map(o => <option key={o}>{o}</option>)}</select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Período de Entrada</label><select value={entrySemester} onChange={(e) => setEntrySemester(e.target.value)}>{ENTRY_OPTIONS.map(o => <option key={o}>{o}</option>)}</select></div>
            <div className="form-group"><label>Linguagem Favorita</label><select value={favoriteLanguage} onChange={(e) => setFavoriteLanguage(e.target.value)}>{LANGUAGE_OPTIONS.map(o => <option key={o}>{o}</option>)}</select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Área de Interesse</label><select value={area} onChange={(e) => setArea(e.target.value)}>{AREA_OPTIONS.map(o => <option key={o}>{o}</option>)}</select></div>
            <div className="form-group"><label>Laboratório</label><select value={lab} onChange={(e) => setLab(e.target.value)}>{LAB_OPTIONS.map(o => <option key={o}>{o}</option>)}</select></div>
          </div>
          <div className="form-group"><label>Café?</label><select value={likesCoffee} onChange={(e) => setLikesCoffee(e.target.value)}>{COFFEE_OPTIONS.map(o => <option key={o}>{o}</option>)}</select></div>

          <div className="form-group">
            <label>Foto do Personagem (Mostrada ao acertar)</label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
              <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} id="photo-upload-edit" />
              <label htmlFor="photo-upload-edit" className="btn btn-secondary" style={{ cursor: 'pointer', margin: 0, padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Camera size={16} /> Selecionar Imagem</label>
              {photoUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <img src={photoUrl} alt="Preview" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }} />
                  <button type="button" onClick={() => setPhotoUrl('')} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', height: 'auto', backgroundColor: '#ef4444', color: 'white', border: 'none' }}>Remover</button>
                </div>
              ) : <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Nenhuma foto selecionada</span>}
            </div>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.35rem' }}>Recomendado: foto quadrada (300x300px), limite de 2MB.</span>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <button type="submit" disabled={submitting} className="btn" style={{ width: '100%' }}><Save size={18} /> {submitting ? 'Salvando...' : 'Salvar Alterações'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

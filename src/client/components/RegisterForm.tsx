'use client';

import React, { useState } from 'react';
import { UserPlus, Camera } from 'lucide-react';

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
const LAB_OPTIONS = ['LSD', 'SPLab', 'UFCG.AI', 'VIRTUS', 'LCC', 'PET', 'CACo', 'Nenhum', 'Outro'];
const COFFEE_OPTIONS = ['Sim', 'Não', 'Só energético'];

interface RegisterFormProps {
  onRegisterSuccess: () => void;
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onRegisterSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState(GENDER_OPTIONS[0]);
  const [role, setRole] = useState(ROLE_OPTIONS[0]);
  const [entrySemester, setEntrySemester] = useState(ENTRY_OPTIONS[0]);
  const [favoriteLanguage, setFavoriteLanguage] = useState(LANGUAGE_OPTIONS[0]);
  const [area, setArea] = useState(AREA_OPTIONS[0]);
  const [lab, setLab] = useState(LAB_OPTIONS[0]);
  const [likesCoffee, setLikesCoffee] = useState(COFFEE_OPTIONS[0]);
  const [photoUrl, setPhotoUrl] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('A imagem é muito grande. O limite máximo é de 2MB.');
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
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, gender, role, entrySemester, favoriteLanguage, area, lab, likesCoffee, photoUrl })
      });
      const data = await res.json();
      setSubmitting(false);
      if (res.ok) {
        onRegisterSuccess();
      } else {
        setErrorMsg(data.error || 'Erro ao realizar cadastro.');
      }
    } catch (err) {
      setSubmitting(false);
      setErrorMsg('Erro de conexão com o servidor.');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto 0 auto', width: '100%' }} className="fade-in">
      <div className="card">
        <h2 className="card-title">
          <UserPlus size={22} style={{ color: 'var(--primary)' }} /> Registrar no CCDLE
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Insira suas informações para ser criado como personagem do jogo. Outras pessoas tentarão adivinhar quem você é comparando os atributos abaixo!
        </p>

        {errorMsg && <div className="alert alert-error">{errorMsg}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome / Apelido único no jogo</label>
            <input type="text" placeholder="Ex: Yalle Silva, Prof. Dalton, João.P" value={name} onChange={(e) => setName(e.target.value)} required />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Esse é o nome exato que as pessoas vão pesquisar e digitar na caixa de palpites.
            </span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email de Login</label>
              <input type="email" placeholder="seu.email@ufcg.edu.br" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Senha de Login</label>
              <input type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
          </div>

          <div className="form-row" style={{ borderTop: '1px solid var(--border-color)', marginTop: '1rem', paddingTop: '1rem' }}>
            <div className="form-group">
              <label>Gênero</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)}>
                {GENDER_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Vínculo com o Curso</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                {ROLE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Período de Entrada</label>
              <select value={entrySemester} onChange={(e) => setEntrySemester(e.target.value)}>
                {ENTRY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Linguagem de Prog. Favorita</label>
              <select value={favoriteLanguage} onChange={(e) => setFavoriteLanguage(e.target.value)}>
                {LANGUAGE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Área de Interesse Principal</label>
              <select value={area} onChange={(e) => setArea(e.target.value)}>
                {AREA_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Laboratório / Projeto Principal</label>
              <select value={lab} onChange={(e) => setLab(e.target.value)}>
                {LAB_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Você gosta de Café?</label>
            <select value={likesCoffee} onChange={(e) => setLikesCoffee(e.target.value)}>
              {COFFEE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Foto do Personagem (Mostrada ao acertar)</label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
              <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} id="photo-upload-register" />
              <label htmlFor="photo-upload-register" className="btn btn-secondary" style={{ cursor: 'pointer', margin: 0, padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Camera size={16} /> Selecionar Imagem
              </label>
              {photoUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <img src={photoUrl} alt="Preview" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }} />
                  <button type="button" onClick={() => setPhotoUrl('')} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', height: 'auto', backgroundColor: '#ef4444', color: 'white', border: 'none' }}>Remover</button>
                </div>
              ) : (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Nenhuma foto selecionada</span>
              )}
            </div>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.35rem' }}>Recomendado: foto quadrada (ex: 300x300px), limite de 2MB.</span>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <button type="submit" disabled={submitting} className="btn" style={{ width: '100%' }}>
              {submitting ? 'Cadastrando...' : 'Concluir Cadastro e Participar'}
            </button>
          </div>
        </form>

        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', textAlign: 'center' }}>
          <button onClick={onSwitchToLogin} className="btn btn-secondary" style={{ width: '100%' }}>Voltar para Login</button>
        </div>
      </div>
    </div>
  );
}

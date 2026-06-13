'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/client/context/AuthContext';
import { ShieldAlert, Trash2, Power, Shield, Shuffle, UserCheck, AlertTriangle, Gamepad2, Lock, Type, Ban, KeyRound, Search, Copy, Check } from 'lucide-react';
import { getLocalDateString } from '@/shared/utils';
import { apiFetch } from '@/client/lib/api';
import { Toast } from '@/client/components/Toast';
import { BackLink } from '@/client/components/BackLink';
import { LoadingState } from '@/client/components/LoadingState';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  gender: string;
  role: string;
  entrySemester: string;
  isColab: string;
  area: string[];
  projects: string[];
  likesCoffee: string;
  lastLogin: string;
  isActive: boolean;
  isAdmin: boolean;
  createdAt: string;
}

type UserSort = 'newest' | 'name' | 'lastLogin';

export default function AdminPage() {
  const { t, i18n } = useTranslation();
  const { user: currentUser, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedForceChar, setSelectedForceChar] = useState('');
  const [activeTab, setActiveTab] = useState<'lsdle' | 'termo' | 'forca' | 'users' | 'comingSoon'>('lsdle');
  const [termoWord, setTermoWord] = useState('');
  const [forcaWord, setForcaWord] = useState('');
  // User pending deletion, surfaced through the confirmation modal.
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  // Password-reset flow: pending user → confirm modal; tempPassword → result modal.
  const [userToReset, setUserToReset] = useState<AdminUser | null>(null);
  const [resetting, setResetting] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [copied, setCopied] = useState(false);
  // Users-tab list controls.
  const [userSearch, setUserSearch] = useState('');
  const [userSort, setUserSort] = useState<UserSort>('newest');
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const today = getLocalDateString();
  const dateLocale = i18n.language?.startsWith('pt') ? 'pt-BR' : 'en-US';

  // When `silent` is true we refresh the data in the background without flipping
  // the page-level `loading` flag, which would otherwise replace the whole panel
  // with the loading screen (causing the "reload"/glitch on every toggle).
  const loadAdminData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await apiFetch('/api/admin/users');
      if (res.status === 403) {
        setErrorMsg(t('admin.errorPermission'));
        return;
      }
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Error loading admin data:', err);
      setErrorMsg(t('admin.errorLoadUsers'));
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.isAdmin) {
      loadAdminData();
    }
  }, [currentUser]);

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await apiFetch('/api/admin/users', {
        method: 'PUT',
        body: JSON.stringify({ userId, isActive: !currentActive })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message);
        loadAdminData(true);
      } else {
        setErrorMsg(data.error);
      }
    } catch (err) {
      setErrorMsg(t('admin.errorToggleActive'));
    }
  };

  const handleToggleAdmin = async (userId: string, currentAdmin: boolean) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await apiFetch('/api/admin/users', {
        method: 'PUT',
        body: JSON.stringify({ userId, isAdmin: !currentAdmin })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message);
        loadAdminData(true);
      } else {
        setErrorMsg(data.error);
      }
    } catch (err) {
      setErrorMsg(t('admin.errorToggleAdmin'));
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setErrorMsg('');
    setSuccessMsg('');
    setDeleting(true);
    try {
      const res = await apiFetch(`/api/admin/users?userId=${userToDelete.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message);
        loadAdminData(true);
      } else {
        setErrorMsg(data.error);
      }
    } catch (err) {
      setErrorMsg(t('admin.errorDelete'));
    } finally {
      setDeleting(false);
      setUserToDelete(null);
    }
  };

  const confirmResetPassword = async () => {
    if (!userToReset) return;
    setErrorMsg('');
    setSuccessMsg('');
    setResetting(true);
    try {
      const res = await apiFetch('/api/admin/users/reset-password', {
        method: 'POST',
        body: JSON.stringify({ userId: userToReset.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setTempPassword(data.tempPassword);
      } else {
        setErrorMsg(data.error || t('admin.errorReset'));
        setUserToReset(null);
      }
    } catch (err) {
      setErrorMsg(t('admin.errorReset'));
      setUserToReset(null);
    } finally {
      setResetting(false);
    }
  };

  const closeResetModal = () => {
    setUserToReset(null);
    setTempPassword('');
    setCopied(false);
  };

  const copyTempPassword = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (non-HTTPS context) — the admin can still select
      // and copy the highlighted password manually.
    }
  };

  const handleForceDaily = async (forceRandom: boolean) => {
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);
    
    try {
      const res = await apiFetch('/api/admin/force-daily', {
        method: 'POST',
        body: JSON.stringify({ characterId: forceRandom ? undefined : selectedForceChar })
      });
      
      const data = await res.json();
      setSubmitting(false);

      if (res.ok) {
        setSuccessMsg(t('admin.forceSuccess', { date: today, name: data.character.name }));
        setSelectedForceChar('');
      } else {
        setErrorMsg(data.error || t('admin.errorForce'));
      }
    } catch (err) {
      setSubmitting(false);
      setErrorMsg(t('admin.errorForceConn'));
    }
  };

  const handleForceTermo = async (forceRandom: boolean) => {
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      const res = await apiFetch('/api/admin/termo-force-daily', {
        method: 'POST',
        body: JSON.stringify({ word: forceRandom ? undefined : termoWord })
      });

      const data = await res.json();
      setSubmitting(false);

      if (res.ok) {
        setSuccessMsg(t('admin.termoForceSuccess', { date: today, word: data.word }));
        setTermoWord('');
      } else {
        setErrorMsg(data.error || t('admin.termoErrorForce'));
      }
    } catch (err) {
      setSubmitting(false);
      setErrorMsg(t('admin.errorForceConn'));
    }
  };

  const handleForceForca = async (forceRandom: boolean) => {
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      const res = await apiFetch('/api/admin/forca-force-daily', {
        method: 'POST',
        body: JSON.stringify({ word: forceRandom ? undefined : forcaWord })
      });

      const data = await res.json();
      setSubmitting(false);

      if (res.ok) {
        setSuccessMsg(t('admin.forcaForceSuccess', { date: today, word: data.word }));
        setForcaWord('');
      } else {
        setErrorMsg(data.error || t('admin.forcaErrorForce'));
      }
    } catch (err) {
      setSubmitting(false);
      setErrorMsg(t('admin.errorForceConn'));
    }
  };

  if (authLoading || (currentUser && loading)) {
    return <LoadingState message={t('admin.loading')} minHeight="50vh" />;
  }

  if (!currentUser || !currentUser.isAdmin) {
    return (
      <div style={{ maxWidth: '500px', margin: '4rem auto 0 auto', textAlign: 'center' }} className="fade-in">
        <div className="card" style={{ borderColor: '#ef4444' }}>
          <AlertTriangle size={48} style={{ color: '#ef4444', margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>{t('admin.deniedTitle')}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            {t('admin.deniedBody')}
          </p>
        </div>
      </div>
    );
  }

  // List of active people for the manual force-select dropdown
  const activeUsers = users.filter(u => {
    // Active check (isActive + logged in within 30 days)
    const lastLoginDate = new Date(u.lastLogin);
    const today = new Date();
    const diffTime = today.getTime() - lastLoginDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return u.isActive && diffDays < 30;
  });

  // Users-tab list after the search filter + selected ordering.
  const searchQ = userSearch.trim().toLowerCase();
  const visibleUsers = (
    searchQ
      ? users.filter((u) => u.name.toLowerCase().includes(searchQ) || u.email.toLowerCase().includes(searchQ))
      : [...users]
  ).sort((a, b) => {
    if (userSort === 'name') return a.name.localeCompare(b.name);
    if (userSort === 'lastLogin') return new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime();
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div style={{ margin: '2rem 0' }} className="fade-in">
      <BackLink href="/" label={t('nav.backToHub')} />
      <div className="admin-section-header">
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert style={{ color: 'var(--primary)' }} /> {t('admin.title')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {t('admin.subtitle')}
          </p>
        </div>
      </div>

      <Toast
        message={errorMsg || successMsg}
        type={errorMsg ? 'error' : 'success'}
        onClose={() => { setErrorMsg(''); setSuccessMsg(''); }}
      />

      {/* Per-game / global config tabs */}
      <div className="admin-tabs">
        <button
          type="button"
          className={`admin-tab ${activeTab === 'lsdle' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('lsdle')}
        >
          <Gamepad2 size={18} /> LSDLE
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'termo' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('termo')}
        >
          <Type size={18} /> TERMO
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'forca' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('forca')}
        >
          <Ban size={18} /> FORCA
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'users' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Shield size={18} /> {t('admin.tabUsers')}
        </button>
        <button
          type="button"
          className="admin-tab"
          disabled
          title={t('admin.comingSoonTitle')}
        >
          <Lock size={18} /> {t('admin.tabComingSoon')}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>

        {/* LSDLE: Force Person of the Day card */}
        {activeTab === 'lsdle' && (
        <div className="card">
          <h3 className="card-title">
            <Shuffle size={20} style={{ color: 'var(--primary)' }} /> {t('admin.dailyTitle')}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            {t('admin.dailyDesc')}
          </p>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: '1 1 250px', marginBottom: 0 }}>
              <label>{t('admin.chooseLabel')}</label>
              <select 
                value={selectedForceChar} 
                onChange={(e) => setSelectedForceChar(e.target.value)}
                style={{ height: '42px', padding: '0 1rem' }}
              >
                <option value="">{t('admin.selectPlaceholder')}</option>
                {activeUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role} - {u.entrySemester})</option>
                ))}
              </select>
            </div>
            
            <button 
              onClick={() => handleForceDaily(false)}
              disabled={submitting || !selectedForceChar}
              className="btn"
              style={{ height: '42px' }}
            >
              <UserCheck size={18} />
              {t('admin.setSelected')}
            </button>

            <button 
              onClick={() => handleForceDaily(true)}
              disabled={submitting}
              className="btn btn-secondary"
              style={{ height: '42px' }}
            >
              <Shuffle size={18} />
              {t('admin.drawRandom')}
            </button>
          </div>
          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.75rem' }}>
            {t('admin.dailyNote')}
          </span>
        </div>
        )}

        {/* TERMO: Word of the Day card */}
        {activeTab === 'termo' && (
        <div className="card">
          <h3 className="card-title">
            <Type size={20} style={{ color: 'var(--primary)' }} /> {t('admin.termoTitle')}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            {t('admin.termoDesc')}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: '1 1 250px', marginBottom: 0 }}>
              <label>{t('admin.termoWordLabel')}</label>
              <input
                type="text"
                value={termoWord}
                onChange={(e) => setTermoWord(e.target.value)}
                placeholder={t('admin.termoWordPlaceholder')}
                maxLength={5}
                style={{ height: '42px', padding: '0 1rem', textTransform: 'uppercase' }}
              />
            </div>

            <button
              onClick={() => handleForceTermo(false)}
              disabled={submitting || termoWord.trim().length < 5}
              className="btn"
              style={{ height: '42px' }}
            >
              <UserCheck size={18} />
              {t('admin.termoSet')}
            </button>

            <button
              onClick={() => handleForceTermo(true)}
              disabled={submitting}
              className="btn btn-secondary"
              style={{ height: '42px' }}
            >
              <Shuffle size={18} />
              {t('admin.termoDraw')}
            </button>
          </div>
          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.75rem' }}>
            {t('admin.termoNote')}
          </span>
        </div>
        )}

        {/* FORCA: Word of the Day card */}
        {activeTab === 'forca' && (
        <div className="card">
          <h3 className="card-title">
            <Ban size={20} style={{ color: 'var(--primary)' }} /> {t('admin.forcaTitle')}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            {t('admin.forcaDesc')}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: '1 1 250px', marginBottom: 0 }}>
              <label>{t('admin.forcaWordLabel')}</label>
              <input
                type="text"
                value={forcaWord}
                onChange={(e) => setForcaWord(e.target.value)}
                placeholder={t('admin.forcaWordPlaceholder')}
                maxLength={20}
                style={{ height: '42px', padding: '0 1rem', textTransform: 'uppercase' }}
              />
            </div>

            <button
              onClick={() => handleForceForca(false)}
              disabled={submitting || forcaWord.trim().length < 4}
              className="btn"
              style={{ height: '42px' }}
            >
              <UserCheck size={18} />
              {t('admin.forcaSet')}
            </button>

            <button
              onClick={() => handleForceForca(true)}
              disabled={submitting}
              className="btn btn-secondary"
              style={{ height: '42px' }}
            >
              <Shuffle size={18} />
              {t('admin.forcaDraw')}
            </button>
          </div>
          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.75rem' }}>
            {t('admin.forcaNote')}
          </span>
        </div>
        )}

        {/* Users Management List */}
        {activeTab === 'users' && (
        <div className="card" style={{ padding: '1.5rem 2rem' }}>
          <h3 className="card-title" style={{ marginBottom: '1rem' }}>
            <Shield size={20} style={{ color: 'var(--primary)' }} /> {t('admin.usersTitle')} ({users.length})
          </h3>

          {users.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ position: 'relative', flex: '1 1 240px' }}>
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder={t('admin.searchPlaceholder')}
                  style={{ paddingLeft: '2.4rem' }}
                />
                <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              </div>
              <select
                value={userSort}
                onChange={(e) => setUserSort(e.target.value as UserSort)}
                style={{ flex: '0 1 180px' }}
              >
                <option value="newest">{t('admin.sortNewest')}</option>
                <option value="name">{t('admin.sortName')}</option>
                <option value="lastLogin">{t('admin.sortLastLogin')}</option>
              </select>
            </div>
          )}

          {users.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>{t('admin.noUsers')}</p>
          ) : visibleUsers.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>{t('admin.noSearchResults')}</p>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t('admin.thCharacter')}</th>
                    <th>{t('admin.thRole')}</th>
                    <th>{t('admin.thEntry')}</th>
                    <th>{t('admin.thLastLogin')}</th>
                    <th>{t('admin.thGameStatus')}</th>
                    <th>{t('admin.thRoleCol')}</th>
                    <th>{t('admin.thActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleUsers.map(u => {
                    // Check activity status (isActive + logged in within 30 days)
                    const lastLoginDate = new Date(u.lastLogin);
                    const todayDate = new Date();
                    const diffTime = todayDate.getTime() - lastLoginDate.getTime();
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    const isSessionActive = diffDays < 30;
                    
                    return (
                      <tr key={u.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{u.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                        </td>
                        <td>{u.role}</td>
                        <td>{u.entrySemester}</td>
                        <td style={{ fontSize: '0.85rem' }}>
                          {lastLoginDate.toLocaleDateString(dateLocale)} {lastLoginDate.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td>
                          {u.isActive && isSessionActive ? (
                            <span className="badge badge-active">{t('admin.statusActive')}</span>
                          ) : !u.isActive ? (
                            <span className="badge badge-inactive" title={t('admin.titleDisabledByAdmin')}>{t('admin.statusDisabled')}</span>
                          ) : (
                            <span className="badge badge-inactive" title={t('admin.titleExpired')}>{t('admin.statusExpired')}</span>
                          )}
                        </td>
                        <td>
                          {u.isAdmin ? (
                            <span className="badge badge-admin">{t('admin.roleAdmin')}</span>
                          ) : (
                            <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>{t('admin.roleUser')}</span>
                          )}
                        </td>
                        <td>
                          <div className="admin-actions">
                            <button
                              onClick={() => handleToggleActive(u.id, u.isActive)}
                              disabled={u.id === currentUser.id}
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                              title={u.isActive ? t('admin.actionDeactivate') : t('admin.actionActivate')}
                            >
                              <Power size={14} style={{ color: u.isActive ? '#ef4444' : 'var(--color-correct)' }} />
                            </button>
                            
                            <button
                              onClick={() => handleToggleAdmin(u.id, u.isAdmin)}
                              disabled={u.id === currentUser.id}
                              className="btn btn-secondary"
                              style={{
                                padding: '0.35rem 0.6rem',
                                fontSize: '0.8rem',
                                ...(u.isAdmin && {
                                  backgroundColor: 'var(--primary)',
                                  borderColor: 'var(--primary)',
                                }),
                              }}
                              title={u.isAdmin ? t('admin.actionRemoveAdmin') : t('admin.actionMakeAdmin')}
                            >
                              <Shield size={14} style={{ color: u.isAdmin ? 'white' : 'var(--text-muted)' }} />
                            </button>

                            <button
                              onClick={() => setUserToReset(u)}
                              disabled={u.id === currentUser.id}
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                              title={t('admin.actionResetPassword')}
                            >
                              <KeyRound size={14} style={{ color: 'var(--color-partial)' }} />
                            </button>

                            <button
                              onClick={() => setUserToDelete(u)}
                              disabled={u.id === currentUser.id}
                              className="btn btn-secondary btn-danger"
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', border: 'none' }}
                              title={t('admin.actionDelete')}
                            >
                              <Trash2 size={14} style={{ color: 'white' }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        )}

      </div>

      {/* Password-reset: confirmation, then one-time display of the temp password */}
      {mounted && userToReset && createPortal(
        <div className="modal-overlay" onClick={() => !resetting && closeResetModal()}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <KeyRound size={44} style={{ color: 'var(--color-partial)', margin: '0 auto 1rem auto' }} />
            <h2 className="modal-title">{t('admin.resetTitle')}</h2>
            {!tempPassword ? (
              <>
                <p className="modal-subtitle" style={{ overflowWrap: 'anywhere' }}>
                  {t('admin.resetConfirmBody', { name: userToReset.name })}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button onClick={confirmResetPassword} disabled={resetting} className="btn" style={{ width: '100%' }}>
                    <KeyRound size={18} /> {resetting ? t('admin.resetting') : t('admin.resetGenerate')}
                  </button>
                  <button onClick={closeResetModal} disabled={resetting} className="btn btn-secondary" style={{ width: '100%' }}>
                    {t('admin.deleteCancel')}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="modal-subtitle" style={{ overflowWrap: 'anywhere' }}>
                  {t('admin.resetDoneBody', { name: userToReset.name })}
                </p>
                <code
                  style={{
                    display: 'block',
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    margin: '0 0 1rem 0',
                    userSelect: 'all',
                  }}
                >
                  {tempPassword}
                </code>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button onClick={copyTempPassword} className="btn" style={{ width: '100%' }}>
                    {copied ? <Check size={18} /> : <Copy size={18} />} {copied ? t('admin.resetCopied') : t('admin.resetCopy')}
                  </button>
                  <button onClick={closeResetModal} className="btn btn-secondary" style={{ width: '100%' }}>
                    {t('admin.resetClose')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Delete-user confirmation */}
      {mounted && userToDelete && createPortal(
        <div className="modal-overlay" onClick={() => !deleting && setUserToDelete(null)}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <AlertTriangle size={44} style={{ color: '#ef4444', margin: '0 auto 1rem auto' }} />
            <h2 className="modal-title">{t('admin.deleteTitle')}</h2>
            <p className="modal-subtitle" style={{ overflowWrap: 'anywhere' }}>
              {t('admin.confirmDelete', { name: userToDelete.name })}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={confirmDeleteUser}
                disabled={deleting}
                className="btn btn-danger"
                style={{ width: '100%', backgroundColor: '#ef4444', borderColor: '#ef4444', color: 'white' }}
              >
                <Trash2 size={18} /> {deleting ? t('admin.deleting') : t('admin.deleteConfirm')}
              </button>
              <button onClick={() => setUserToDelete(null)} disabled={deleting} className="btn btn-secondary" style={{ width: '100%' }}>
                {t('admin.deleteCancel')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

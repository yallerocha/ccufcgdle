'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/client/context/AuthContext';
import { ShieldAlert, Trash2, Power, Shield, AlertTriangle, KeyRound, Search, Copy, Check, FolderGit2, Plus, Clock } from 'lucide-react';
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

interface AdminProject {
  id: string;
  name: string;
  memberCount: number;
}

export default function AdminPage() {
  const { t, i18n } = useTranslation();
  const { user: currentUser, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'projects'>('users');
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [projectToDelete, setProjectToDelete] = useState<AdminProject | null>(null);
  const [deletingProject, setDeletingProject] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [userToReset, setUserToReset] = useState<AdminUser | null>(null);
  const [resetting, setResetting] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userSort, setUserSort] = useState<UserSort>('newest');
  // Admin settings: 30-day inactivity exclusion toggle (null until loaded).
  const [inactivityExclusion, setInactivityExclusion] = useState<boolean | null>(null);
  const [savingSetting, setSavingSetting] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const dateLocale = i18n.language?.startsWith('pt') ? 'pt-BR' : 'en-US';

  const loadAdminData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await apiFetch('/api/admin/users');
      if (res.status === 403) {
        setErrorMsg(t('admin.errorPermission'));
        return;
      }
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch (err) {
      console.error('Error loading admin data:', err);
      setErrorMsg(t('admin.errorLoadUsers'));
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadProjects = async (attempt = 0) => {
    try {
      const res = await apiFetch('/api/admin/projects');
      if (!res.ok) {
        if (attempt < 4) {
          await new Promise((r) => setTimeout(r, 1000));
          return loadProjects(attempt + 1);
        }
        setErrorMsg(t('admin.projectsLoadError'));
        return;
      }
      const data = await res.json();
      if (data.projects) setProjects(data.projects);
    } catch (err) {
      console.error('Error loading projects:', err);
      if (attempt < 4) {
        await new Promise((r) => setTimeout(r, 1000));
        return loadProjects(attempt + 1);
      }
      setErrorMsg(t('admin.projectsLoadError'));
    }
  };

  const loadSettings = async () => {
    try {
      const res = await apiFetch('/api/admin/settings');
      if (!res.ok) return;
      const data = await res.json();
      if (typeof data.inactivityExclusionEnabled === 'boolean') {
        setInactivityExclusion(data.inactivityExclusionEnabled);
      }
    } catch (err) {
      console.error('Error loading admin settings:', err);
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.isAdmin) {
      loadAdminData();
      loadProjects();
      loadSettings();
    }
  }, [currentUser]);

  const handleToggleInactivityExclusion = async () => {
    if (inactivityExclusion === null || savingSetting) return;
    const next = !inactivityExclusion;
    setSavingSetting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await apiFetch('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({ inactivityExclusionEnabled: next }),
      });
      const data = await res.json();
      if (res.ok) {
        setInactivityExclusion(data.inactivityExclusionEnabled);
        setSuccessMsg(
          data.inactivityExclusionEnabled ? t('admin.inactivityEnabledMsg') : t('admin.inactivityDisabledMsg')
        );
      } else {
        setErrorMsg(data.error || t('admin.inactivityError'));
      }
    } catch (err) {
      console.error('Error updating inactivity setting:', err);
      setErrorMsg(t('admin.inactivityError'));
    } finally {
      setSavingSetting(false);
    }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await apiFetch('/api/admin/users', {
        method: 'PUT',
        body: JSON.stringify({ userId, isActive: !currentActive }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message);
        loadAdminData(true);
      } else {
        setErrorMsg(data.error);
      }
    } catch {
      setErrorMsg(t('admin.errorToggleActive'));
    }
  };

  const handleToggleAdmin = async (userId: string, currentAdmin: boolean) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await apiFetch('/api/admin/users', {
        method: 'PUT',
        body: JSON.stringify({ userId, isAdmin: !currentAdmin }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message);
        loadAdminData(true);
      } else {
        setErrorMsg(data.error);
      }
    } catch {
      setErrorMsg(t('admin.errorToggleAdmin'));
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setErrorMsg('');
    setSuccessMsg('');
    setDeleting(true);
    try {
      const res = await apiFetch(`/api/admin/users?userId=${userToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message);
        loadAdminData(true);
      } else {
        setErrorMsg(data.error);
      }
    } catch {
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
    } catch {
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
      // Clipboard unavailable (non-HTTPS) — admin can still select the text.
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newProjectName.trim();
    if (!name || submitting) return;
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/admin/projects', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || t('admin.projectsCreateSuccess'));
        setNewProjectName('');
        if (data.projects) setProjects(data.projects);
        else loadProjects();
      } else {
        setErrorMsg(data.error || t('admin.projectsCreateError'));
      }
    } catch {
      setErrorMsg(t('admin.projectsCreateError'));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete || deletingProject) return;
    setDeletingProject(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await apiFetch(`/api/admin/projects/${projectToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || t('admin.projectsDeleteSuccess'));
        if (data.projects) setProjects(data.projects);
        else loadProjects();
        setProjectToDelete(null);
      } else {
        setErrorMsg(data.error || t('admin.projectsDeleteError'));
      }
    } catch {
      setErrorMsg(t('admin.projectsDeleteError'));
    } finally {
      setDeletingProject(false);
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
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{t('admin.deniedBody')}</p>
        </div>
      </div>
    );
  }

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
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('admin.subtitle')}</p>
        </div>
      </div>

      <Toast
        message={errorMsg || successMsg}
        type={errorMsg ? 'error' : 'success'}
        onClose={() => { setErrorMsg(''); setSuccessMsg(''); }}
      />

      <div className="admin-tabs">
        <button type="button" className={`admin-tab ${activeTab === 'users' ? 'is-active' : ''}`} onClick={() => setActiveTab('users')}>
          <Shield size={18} /> {t('admin.tabUsers')}
        </button>
        <button type="button" className={`admin-tab ${activeTab === 'projects' ? 'is-active' : ''}`} onClick={() => setActiveTab('projects')}>
          <FolderGit2 size={18} /> {t('admin.tabProjects')}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        {activeTab === 'projects' && (
          <div className="card" style={{ padding: '1.5rem 2rem' }}>
            <h3 className="card-title" style={{ marginBottom: '1rem' }}>
              <FolderGit2 size={20} style={{ color: 'var(--primary)' }} /> {t('admin.projectsTitle')}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{t('admin.projectsDesc')}</p>

            <form onSubmit={handleCreateProject} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: '1 1 280px', marginBottom: 0 }}>
                <label>{t('admin.projectsNewLabel')}</label>
                <input type="text" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} placeholder={t('admin.projectsNewPlaceholder')} maxLength={60} style={{ height: '42px', padding: '0 1rem' }} />
              </div>
              <button type="submit" className="btn" style={{ height: '42px' }} disabled={submitting || newProjectName.trim().length < 2}>
                <Plus size={18} /> {submitting ? t('admin.projectsCreating') : t('admin.projectsCreate')}
              </button>
            </form>

            {projects.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>{t('admin.projectsEmpty')}</p>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>{t('admin.projectsColName')}</th>
                      <th>{t('admin.projectsColMembers')}</th>
                      <th>{t('admin.thActions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td>{t('projects.members', { count: p.memberCount })}</td>
                        <td>
                          <button type="button" onClick={() => setProjectToDelete(p)} disabled={p.name === 'Outro'} className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }} title={p.name === 'Outro' ? t('admin.projectsOutroLocked') : t('admin.projectsDelete')}>
                            <Trash2 size={14} style={{ color: p.name === 'Outro' ? 'var(--text-dim)' : '#ef4444' }} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <>
            {/* Inactivity rule: non-destructive toggle (hides 30-day-inactive members
                from the ranking; never deletes accounts). */}
            <div className="card" style={{ padding: '1.5rem 2rem', marginBottom: '1.5rem' }}>
              <h3 className="card-title" style={{ marginBottom: '0.75rem' }}>
                <Clock size={20} style={{ color: 'var(--primary)' }} /> {t('admin.inactivityTitle')}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>{t('admin.inactivityDesc')}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <span className={`badge ${inactivityExclusion ? 'badge-active' : ''}`} style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem' }}>
                  {inactivityExclusion === null ? '…' : inactivityExclusion ? t('admin.inactivityOn') : t('admin.inactivityOff')}
                </span>
                <button onClick={handleToggleInactivityExclusion} disabled={inactivityExclusion === null || savingSetting} className="btn" style={{ minWidth: '190px' }}>
                  <Power size={16} />
                  {savingSetting ? t('admin.inactivitySaving') : inactivityExclusion ? t('admin.inactivityDisableBtn') : t('admin.inactivityEnableBtn')}
                </button>
              </div>
            </div>

            <div className="card" style={{ padding: '1.5rem 2rem' }}>
              <h3 className="card-title" style={{ marginBottom: '1rem' }}>
                <Shield size={20} style={{ color: 'var(--primary)' }} /> {t('admin.usersTitle')} ({users.length})
              </h3>

              {users.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ position: 'relative', flex: '1 1 240px' }}>
                    <input type="text" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder={t('admin.searchPlaceholder')} style={{ paddingLeft: '2.4rem' }} />
                    <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  </div>
                  <select value={userSort} onChange={(e) => setUserSort(e.target.value as UserSort)} style={{ flex: '0 1 180px' }}>
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
                      {visibleUsers.map((u) => {
                        const lastLoginDate = new Date(u.lastLogin);
                        const todayDate = new Date();
                        const diffDays = Math.floor((todayDate.getTime() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24));
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
                                <button onClick={() => handleToggleActive(u.id, u.isActive)} disabled={u.id === currentUser.id} className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }} title={u.isActive ? t('admin.actionDeactivate') : t('admin.actionActivate')}>
                                  <Power size={14} style={{ color: u.isActive ? '#ef4444' : 'var(--color-correct)' }} />
                                </button>
                                <button onClick={() => handleToggleAdmin(u.id, u.isAdmin)} disabled={u.id === currentUser.id} className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', ...(u.isAdmin && { backgroundColor: 'var(--primary)', borderColor: 'var(--primary)' }) }} title={u.isAdmin ? t('admin.actionRemoveAdmin') : t('admin.actionMakeAdmin')}>
                                  <Shield size={14} style={{ color: u.isAdmin ? 'white' : 'var(--text-muted)' }} />
                                </button>
                                <button onClick={() => setUserToReset(u)} disabled={u.id === currentUser.id} className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }} title={t('admin.actionResetPassword')}>
                                  <KeyRound size={14} style={{ color: 'var(--color-partial)' }} />
                                </button>
                                <button onClick={() => setUserToDelete(u)} disabled={u.id === currentUser.id} className="btn btn-secondary btn-danger" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', border: 'none' }} title={t('admin.actionDelete')}>
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
          </>
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
                <p className="modal-subtitle" style={{ overflowWrap: 'anywhere' }}>{t('admin.resetConfirmBody', { name: userToReset.name })}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button onClick={confirmResetPassword} disabled={resetting} className="btn" style={{ width: '100%' }}>
                    <KeyRound size={18} /> {resetting ? t('admin.resetting') : t('admin.resetGenerate')}
                  </button>
                  <button onClick={closeResetModal} disabled={resetting} className="btn btn-secondary" style={{ width: '100%' }}>{t('admin.deleteCancel')}</button>
                </div>
              </>
            ) : (
              <>
                <p className="modal-subtitle" style={{ overflowWrap: 'anywhere' }}>{t('admin.resetDoneBody', { name: userToReset.name })}</p>
                <code style={{ display: 'block', fontSize: '1.15rem', fontWeight: 700, letterSpacing: '0.05em', padding: '0.75rem 1rem', borderRadius: '8px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', margin: '0 0 1rem 0', userSelect: 'all' }}>{tempPassword}</code>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button onClick={copyTempPassword} className="btn" style={{ width: '100%' }}>
                    {copied ? <Check size={18} /> : <Copy size={18} />} {copied ? t('admin.resetCopied') : t('admin.resetCopy')}
                  </button>
                  <button onClick={closeResetModal} className="btn btn-secondary" style={{ width: '100%' }}>{t('admin.resetClose')}</button>
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
            <p className="modal-subtitle" style={{ overflowWrap: 'anywhere' }}>{t('admin.confirmDelete', { name: userToDelete.name })}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button onClick={confirmDeleteUser} disabled={deleting} className="btn btn-danger" style={{ width: '100%', backgroundColor: '#ef4444', borderColor: '#ef4444', color: 'white' }}>
                <Trash2 size={18} /> {deleting ? t('admin.deleting') : t('admin.deleteConfirm')}
              </button>
              <button onClick={() => setUserToDelete(null)} disabled={deleting} className="btn btn-secondary" style={{ width: '100%' }}>{t('admin.deleteCancel')}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {mounted && projectToDelete && createPortal(
        <div className="modal-overlay" onClick={() => !deletingProject && setProjectToDelete(null)}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <AlertTriangle size={44} style={{ color: '#ef4444', margin: '0 auto 1rem auto' }} />
            <h2 className="modal-title">{t('admin.projectsDeleteTitle')}</h2>
            <p className="modal-subtitle" style={{ overflowWrap: 'anywhere' }}>{t('admin.projectsDeleteConfirm', { name: projectToDelete.name, count: projectToDelete.memberCount })}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button onClick={confirmDeleteProject} disabled={deletingProject} className="btn btn-danger" style={{ width: '100%', backgroundColor: '#ef4444', borderColor: '#ef4444', color: 'white' }}>
                <Trash2 size={18} /> {deletingProject ? t('admin.deleting') : t('admin.projectsDeleteConfirmBtn')}
              </button>
              <button onClick={() => setProjectToDelete(null)} disabled={deletingProject} className="btn btn-secondary" style={{ width: '100%' }}>{t('admin.deleteCancel')}</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

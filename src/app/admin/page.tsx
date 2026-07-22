'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/client/context/AuthContext';
import { ShieldAlert, Trash2, Power, Shield, AlertTriangle, KeyRound, Search, Copy, Check } from 'lucide-react';
import { apiFetch } from '@/client/lib/api';
import { Toast } from '@/client/components/Toast';
import { BackLink } from '@/client/components/BackLink';
import { LoadingState } from '@/client/components/LoadingState';

interface AdminUser {
  id: string;
  email: string;
  name: string;
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
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [userToReset, setUserToReset] = useState<AdminUser | null>(null);
  const [resetting, setResetting] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userSort, setUserSort] = useState<UserSort>('newest');
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
    </div>
  );
}

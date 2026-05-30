'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/client/context/AuthContext';
import { ShieldAlert, Trash2, Power, Shield, Shuffle, UserCheck, AlertTriangle } from 'lucide-react';
import { getLocalDateString } from '@/shared/utils';
import { apiFetch } from '@/client/lib/api';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  gender: string;
  role: string;
  entrySemester: string;
  favoriteLanguage: string;
  area: string;
  lab: string;
  likesCoffee: string;
  lastLogin: string;
  isActive: boolean;
  isAdmin: boolean;
  createdAt: string;
}

export default function AdminPage() {
  const { t } = useTranslation();
  const { user: currentUser, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedForceChar, setSelectedForceChar] = useState('');

  const today = getLocalDateString();

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/admin/users');
      if (res.status === 403) {
        setErrorMsg(t('admin.errorPermission'));
        setLoading(false);
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
      setLoading(false);
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
        loadAdminData();
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
        loadAdminData();
      } else {
        setErrorMsg(data.error);
      }
    } catch (err) {
      setErrorMsg(t('admin.errorToggleAdmin'));
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!window.confirm(t('admin.confirmDelete', { name: username }))) {
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await apiFetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message);
        loadAdminData();
      } else {
        setErrorMsg(data.error);
      }
    } catch (err) {
      setErrorMsg(t('admin.errorDelete'));
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

  if (authLoading || (currentUser && loading)) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>{t('admin.loading')}</p>
      </div>
    );
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

  // List of active characters for the manual force select dropdown
  const activeUsers = users.filter(u => {
    // Active check (isActive + logged in within 30 days)
    const lastLoginDate = new Date(u.lastLogin);
    const today = new Date();
    const diffTime = today.getTime() - lastLoginDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return u.isActive && diffDays < 30;
  });

  return (
    <div style={{ margin: '2rem 0' }} className="fade-in">
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

      {successMsg && <div className="alert alert-success">{successMsg}</div>}
      {errorMsg && <div className="alert alert-error">{errorMsg}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        
        {/* Force Character of the Day Card */}
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

        {/* Users Management List */}
        <div className="card" style={{ padding: '1.5rem 2rem' }}>
          <h3 className="card-title" style={{ marginBottom: '1rem' }}>
            <Shield size={20} style={{ color: 'var(--primary)' }} /> {t('admin.usersTitle')} ({users.length})
          </h3>

          {users.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>{t('admin.noUsers')}</p>
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
                  {users.map(u => {
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
                          {lastLoginDate.toLocaleDateString()} {lastLoginDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                              title={u.isAdmin ? t('admin.actionRemoveAdmin') : t('admin.actionMakeAdmin')}
                            >
                              <Shield size={14} style={{ color: u.isAdmin ? '#f59e0b' : 'var(--accent)' }} />
                            </button>

                            <button
                              onClick={() => handleDeleteUser(u.id, u.name)}
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
      </div>
    </div>
  );
}

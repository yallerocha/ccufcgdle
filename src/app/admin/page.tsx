'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/client/context/AuthContext';
import {
  ShieldAlert, Trash2, Power, Shield, AlertTriangle, KeyRound, Search, Copy, Check,
  BookOpen, Eye, EyeOff, Users, Activity, ListChecks, Tags,
} from 'lucide-react';
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

interface AdminQuestion {
  id: string;
  area: string;
  topic: string;
  difficulty: number;
  question: string;
  source: { year: number; number: number } | null;
  disabled: boolean;
}

type QuestionStatusFilter = 'all' | 'active' | 'disabled';
type AdminTab = 'users' | 'questions';

// A KPI tile of the top strip: one number, one label, one gold glyph.
function Kpi({ icon, value, label }: { icon: React.ReactNode; value: number | string; label: string }) {
  return (
    <div className="admin-kpi">
      <div className="admin-kpi-icon">{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div className="admin-kpi-val">{value}</div>
        <div className="admin-kpi-lbl">{label}</div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { t, i18n } = useTranslation();
  const { user: currentUser, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [tab, setTab] = useState<AdminTab>('users');
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [userToReset, setUserToReset] = useState<AdminUser | null>(null);
  const [resetting, setResetting] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userSort, setUserSort] = useState<UserSort>('newest');
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [questionSearch, setQuestionSearch] = useState('');
  const [questionTopic, setQuestionTopic] = useState('');
  const [questionStatus, setQuestionStatus] = useState<QuestionStatusFilter>('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const dateLocale = i18n.language?.startsWith('pt') ? 'pt-BR' : 'en-US';

  const loadAdminData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [res, qRes] = await Promise.all([apiFetch('/api/admin/users'), apiFetch('/api/admin/questions')]);
      if (res.status === 403) {
        setErrorMsg(t('admin.errorPermission'));
        return;
      }
      const data = await res.json();
      if (data.users) setUsers(data.users);
      const qData = await qRes.json();
      if (qData.questions) setQuestions(qData.questions);
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

  const toggleQuestion = async (q: AdminQuestion) => {
    setErrorMsg('');
    setSuccessMsg('');
    setTogglingId(q.id);
    try {
      const res = await apiFetch('/api/admin/questions', {
        method: 'PUT',
        body: JSON.stringify({ questionId: q.id, disabled: !q.disabled }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message);
        setQuestions((prev) => prev.map((x) => (x.id === q.id ? { ...x, disabled: data.disabled } : x)));
      } else {
        setErrorMsg(data.error);
      }
    } catch {
      setErrorMsg(t('admin.qToggleError'));
    } finally {
      setTogglingId(null);
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

  const daysSince = (iso: string) => Math.floor((new Date().getTime() - new Date(iso).getTime()) / 86_400_000);

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

  const adminCount = users.filter((u) => u.isAdmin).length;
  const activeCount = users.filter((u) => u.isActive && daysSince(u.lastLogin) < 30).length;

  // Question-bank breakdowns: active/disabled counts per difficulty and per topic.
  const groupCounts = (key: (q: AdminQuestion) => string | number) => {
    const acc = new Map<string, { key: string; active: number; disabled: number }>();
    for (const q of questions) {
      const k = String(key(q));
      const row = acc.get(k) ?? { key: k, active: 0, disabled: 0 };
      if (q.disabled) row.disabled++;
      else row.active++;
      acc.set(k, row);
    }
    return [...acc.values()];
  };
  const disabledCount = questions.filter((q) => q.disabled).length;
  const diffRows = groupCounts((q) => q.difficulty).sort((a, b) => Number(a.key) - Number(b.key));
  const topicRows = groupCounts((q) => q.topic).sort((a, b) => b.active + b.disabled - (a.active + a.disabled));
  const maxCount = Math.max(1, ...diffRows.map((r) => r.active));

  const questionQ = questionSearch.trim().toLowerCase();
  const visibleQuestions = questions.filter((q) => {
    if (questionTopic && q.topic !== questionTopic) return false;
    if (questionStatus === 'active' && q.disabled) return false;
    if (questionStatus === 'disabled' && !q.disabled) return false;
    return !questionQ || q.question.toLowerCase().includes(questionQ) || q.id.toLowerCase().includes(questionQ);
  });

  const offCount = (n: number) => (n > 0 ? <span className="admin-off-count"> (-{n})</span> : null);

  return (
    <div style={{ margin: '2rem 0' }} className="fade-in">
      <BackLink href="/" label={t('nav.backToHub')} />

      <div className="hero" style={{ padding: '1rem 0 1.5rem 0' }}>
        <h1 className="page-heading">
          <ShieldAlert size={30} /> {t('admin.title')}
        </h1>
        <p>{t('admin.subtitle')}</p>
      </div>

      <Toast
        message={errorMsg || successMsg}
        type={errorMsg ? 'error' : 'success'}
        onClose={() => { setErrorMsg(''); setSuccessMsg(''); }}
      />

      {/* Panel overview: the numbers an admin wants before drilling into a tab. */}
      <div className="admin-kpis">
        <Kpi icon={<Users size={18} />} value={users.length} label={t('admin.kpiUsers')} />
        <Kpi icon={<Shield size={18} />} value={adminCount} label={t('admin.kpiAdmins')} />
        <Kpi icon={<Activity size={18} />} value={activeCount} label={t('admin.kpiActive')} />
        <Kpi icon={<BookOpen size={18} />} value={questions.length - disabledCount} label={t('admin.kpiQuestions')} />
      </div>

      <div className="admin-tabs">
        <button className={`admin-tab${tab === 'users' ? ' is-active' : ''}`} onClick={() => setTab('users')}>
          <Users size={16} /> {t('admin.tabUsers')} ({users.length})
        </button>
        <button className={`admin-tab${tab === 'questions' ? ' is-active' : ''}`} onClick={() => setTab('questions')}>
          <BookOpen size={16} /> {t('admin.tabQuestions')} ({questions.length})
        </button>
      </div>

      {tab === 'users' ? (
        <div className="card" style={{ padding: '1.5rem 2rem' }}>
          <h3 className="card-title" style={{ marginBottom: '0.35rem' }}>
            <Shield size={20} style={{ color: 'var(--gold)' }} /> {t('admin.usersTitle')}
          </h3>
          <p className="admin-card-desc">{t('admin.usersDesc')}</p>

          {users.length > 0 && (
            <div className="admin-toolbar">
              <div className="admin-search">
                <input type="text" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder={t('admin.searchPlaceholder')} />
                <Search size={16} />
              </div>
              <select value={userSort} onChange={(e) => setUserSort(e.target.value as UserSort)}>
                <option value="newest">{t('admin.sortNewest')}</option>
                <option value="name">{t('admin.sortName')}</option>
                <option value="lastLogin">{t('admin.sortLastLogin')}</option>
              </select>
            </div>
          )}

          {users.length === 0 ? (
            <p className="admin-empty">{t('admin.noUsers')}</p>
          ) : visibleUsers.length === 0 ? (
            <p className="admin-empty">{t('admin.noSearchResults')}</p>
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
                    const isSessionActive = daysSince(u.lastLogin) < 30;
                    const isSelf = u.id === currentUser.id;
                    return (
                      <tr key={u.id}>
                        <td data-label={t('admin.thCharacter')}>
                          <div className="admin-cell-value" style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
                            <div style={{ fontWeight: 600 }}>{u.name}</div>
                            <div className="admin-q-meta">{u.email}</div>
                          </div>
                        </td>
                        <td data-label={t('admin.thLastLogin')} style={{ fontSize: '0.85rem' }}>
                          {lastLoginDate.toLocaleDateString(dateLocale)} {lastLoginDate.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td data-label={t('admin.thGameStatus')}>
                          {u.isActive && isSessionActive ? (
                            <span className="badge badge-active">{t('admin.statusActive')}</span>
                          ) : !u.isActive ? (
                            <span className="badge badge-inactive" title={t('admin.titleDisabledByAdmin')}>{t('admin.statusDisabled')}</span>
                          ) : (
                            <span className="badge badge-inactive" title={t('admin.titleExpired')}>{t('admin.statusExpired')}</span>
                          )}
                        </td>
                        <td data-label={t('admin.thRoleCol')}>
                          {u.isAdmin ? (
                            <span className="badge badge-admin">{t('admin.roleAdmin')}</span>
                          ) : (
                            <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>{t('admin.roleUser')}</span>
                          )}
                        </td>
                        <td data-label={t('admin.thActions')}>
                          <div className="admin-actions">
                            <button onClick={() => handleToggleActive(u.id, u.isActive)} disabled={isSelf} className="btn btn-secondary admin-icon-btn" title={u.isActive ? t('admin.actionDeactivate') : t('admin.actionActivate')}>
                              <Power size={14} style={{ color: u.isActive ? '#ef4444' : 'var(--color-correct)' }} />
                            </button>
                            <button onClick={() => handleToggleAdmin(u.id, u.isAdmin)} disabled={isSelf} className={`btn btn-secondary admin-icon-btn${u.isAdmin ? ' is-on' : ''}`} title={u.isAdmin ? t('admin.actionRemoveAdmin') : t('admin.actionMakeAdmin')}>
                              <Shield size={14} style={{ color: u.isAdmin ? '#fff' : 'var(--text-muted)' }} />
                            </button>
                            <button onClick={() => setUserToReset(u)} disabled={isSelf} className="btn btn-secondary admin-icon-btn" title={t('admin.actionResetPassword')}>
                              <KeyRound size={14} style={{ color: 'var(--color-partial)' }} />
                            </button>
                            <button onClick={() => setUserToDelete(u)} disabled={isSelf} className="btn btn-danger admin-icon-btn" title={t('admin.actionDelete')}>
                              <Trash2 size={14} style={{ color: '#fff' }} />
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
      ) : (
        <div className="card" style={{ padding: '1.5rem 2rem' }}>
          <h3 className="card-title" style={{ marginBottom: '0.35rem' }}>
            <BookOpen size={20} style={{ color: 'var(--gold)' }} /> {t('admin.questionsTitle')}
          </h3>
          <p className="admin-card-desc">{t('admin.questionsDesc')}</p>

          <div className="admin-kpis">
            <Kpi icon={<ListChecks size={18} />} value={questions.length} label={t('admin.qStatTotal')} />
            <Kpi icon={<Eye size={18} />} value={questions.length - disabledCount} label={t('admin.qStatActive')} />
            <Kpi icon={<EyeOff size={18} />} value={disabledCount} label={t('admin.qStatDisabled')} />
            <Kpi icon={<Tags size={18} />} value={topicRows.length} label={t('admin.qStatTopics')} />
          </div>

          <div className="admin-split">
            <div>
              <h4 className="admin-sub-title">{t('admin.qByDifficulty')}</h4>
              {diffRows.map((r) => (
                <div key={r.key} className="admin-bar-row">
                  <span className="admin-bar-lbl">{t('admin.qDiffLevel', { n: r.key })}</span>
                  <div className="admin-bar-track">
                    <div className="admin-bar-fill" style={{ width: `${(r.active / maxCount) * 100}%` }} />
                  </div>
                  <span className="admin-bar-num">{r.active}{offCount(r.disabled)}</span>
                </div>
              ))}
            </div>
            <div>
              <h4 className="admin-sub-title">{t('admin.qByTopic')}</h4>
              <div className="admin-chips">
                {topicRows.map((r) => (
                  <button key={r.key} type="button" className="admin-chip" onClick={() => setQuestionTopic(questionTopic === r.key ? '' : r.key)} title={t('admin.qFilterByTopic')}>
                    {r.key} <strong>{r.active}</strong>{offCount(r.disabled)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="admin-toolbar">
            <div className="admin-search">
              <input type="text" value={questionSearch} onChange={(e) => setQuestionSearch(e.target.value)} placeholder={t('admin.qSearchPlaceholder')} />
              <Search size={16} />
            </div>
            <select value={questionTopic} onChange={(e) => setQuestionTopic(e.target.value)}>
              <option value="">{t('admin.qAllTopics')}</option>
              {topicRows.map((r) => <option key={r.key} value={r.key}>{r.key}</option>)}
            </select>
            <select value={questionStatus} onChange={(e) => setQuestionStatus(e.target.value as QuestionStatusFilter)}>
              <option value="all">{t('admin.qAllStatus')}</option>
              <option value="active">{t('admin.qStatusActive')}</option>
              <option value="disabled">{t('admin.qStatusDisabled')}</option>
            </select>
          </div>

          {visibleQuestions.length === 0 ? (
            <p className="admin-empty">{t('admin.qNoResults')}</p>
          ) : (
            <div className="admin-table-container admin-scroll-table">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t('admin.qThQuestion')}</th>
                    <th>{t('admin.qThTopic')}</th>
                    <th>{t('admin.qThDifficulty')}</th>
                    <th>{t('admin.qThStatus')}</th>
                    <th>{t('admin.thActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleQuestions.map((q) => (
                    <tr key={q.id} className={q.disabled ? 'is-off' : undefined}>
                      <td data-label={t('admin.qThQuestion')}>
                        <div className="admin-cell-value" style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
                          <div className="admin-q-text">{q.question}</div>
                          <div className="admin-q-meta">
                            {q.id}{q.source && ` · POSCOMP ${q.source.year} #${q.source.number}`}
                          </div>
                        </div>
                      </td>
                      <td data-label={t('admin.qThTopic')} style={{ fontSize: '0.85rem' }}>{q.topic}</td>
                      <td data-label={t('admin.qThDifficulty')} style={{ fontSize: '0.85rem' }}>{t('admin.qDiffLevel', { n: q.difficulty })}</td>
                      <td data-label={t('admin.qThStatus')}>
                        {q.disabled ? (
                          <span className="badge badge-inactive">{t('admin.qStatusDisabled')}</span>
                        ) : (
                          <span className="badge badge-active">{t('admin.qStatusActive')}</span>
                        )}
                      </td>
                      <td data-label={t('admin.thActions')}>
                        <button onClick={() => toggleQuestion(q)} disabled={togglingId === q.id} className="btn btn-secondary admin-icon-btn" title={q.disabled ? t('admin.qEnable') : t('admin.qDisable')}>
                          {q.disabled ? <Eye size={14} style={{ color: 'var(--color-correct)' }} /> : <EyeOff size={14} style={{ color: '#ef4444' }} />}
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

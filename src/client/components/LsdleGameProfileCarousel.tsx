'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  User as UserIcon,
  Briefcase,
  CalendarDays,
  Users,
  Layers,
  FolderGit2,
  Coffee,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  CheckCircle2,
} from 'lucide-react';
import { apiFetch } from '@/client/lib/api';
import type { User } from '@/client/context/AuthContext';
import { AreaPicker } from '@/client/components/AreaPicker';
import { ProjectPicker } from '@/client/components/ProjectPicker';
import { ModalColorBar } from '@/client/components/ModalColorBar';
import { InfoTooltip } from '@/client/components/InfoTooltip';
import { Toast } from '@/client/components/Toast';
import {
  COLAB_OPTIONS,
  COFFEE_OPTIONS,
  ENTRY_OPTIONS,
  GENDER_OPTIONS,
  ROLE_OPTIONS,
} from '@/shared/validation';

const STEP_COUNT = 6;

function ProfileFieldLabel({
  icon,
  label,
  tip,
}: {
  icon: React.ReactNode;
  label: string;
  tip: string;
}) {
  return (
    <div className="profile-field-label-row">
      <span className="profile-field-label">
        {icon} {label}
      </span>
      <InfoTooltip text={tip} label={label} />
    </div>
  );
}

interface LsdleGameProfileCarouselProps {
  user: User;
  onComplete: () => void;
  onSkip: () => void;
}

export function LsdleGameProfileCarousel({ user, onComplete, onSkip }: LsdleGameProfileCarouselProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(0);
  const [gender, setGender] = useState(user.gender || GENDER_OPTIONS[0]);
  const [role, setRole] = useState(user.role || ROLE_OPTIONS[0]);
  const [entrySemester, setEntrySemester] = useState(user.entrySemester || ENTRY_OPTIONS[0]);
  const [isColab, setIsColab] = useState(user.isColab || COLAB_OPTIONS[0]);
  const [area, setArea] = useState<string[]>(user.area ?? []);
  const [projects, setProjects] = useState<string[]>(user.projects?.slice(0, 1) ?? []);
  const [likesCoffee, setLikesCoffee] = useState(user.likesCoffee || COFFEE_OPTIONS[0]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => setMounted(true), []);

  const payload = useMemo(
    () => ({ gender, role, entrySemester, isColab, area, projects, likesCoffee }),
    [gender, role, entrySemester, isColab, area, projects, likesCoffee],
  );

  const validateStep = (): string | null => {
    switch (step) {
      case 1:
        if (!GENDER_OPTIONS.includes(gender as (typeof GENDER_OPTIONS)[number])) return t('lsdleProfile.errorGender');
        if (!ROLE_OPTIONS.includes(role as (typeof ROLE_OPTIONS)[number])) return t('lsdleProfile.errorRole');
        return null;
      case 2:
        if (!ENTRY_OPTIONS.includes(entrySemester as (typeof ENTRY_OPTIONS)[number])) return t('lsdleProfile.errorEntry');
        if (!COLAB_OPTIONS.includes(isColab as (typeof COLAB_OPTIONS)[number])) return t('lsdleProfile.errorColab');
        return null;
      case 3:
        if (area.length === 0) return t('lsdleProfile.errorArea');
        return null;
      case 4:
        if (projects.length !== 1) return t('lsdleProfile.errorProject');
        return null;
      case 5:
        if (!COFFEE_OPTIONS.includes(likesCoffee as (typeof COFFEE_OPTIONS)[number])) return t('lsdleProfile.errorCoffee');
        return null;
      default:
        return null;
    }
  };

  const saveProfile = async (complete: boolean) => {
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await apiFetch('/api/auth/me', {
        method: 'PUT',
        body: JSON.stringify({ ...payload, complete }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || t('lsdleProfile.errorSave'));
        return false;
      }
      return true;
    } catch {
      setErrorMsg(t('lsdleProfile.errorSave'));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    if (step === 0) {
      setStep(1);
      return;
    }

    const stepError = validateStep();
    if (stepError) {
      setErrorMsg(stepError);
      return;
    }

    if (step < 5) {
      const ok = await saveProfile(false);
      if (!ok) return;
      setStep((s) => s + 1);
      return;
    }

    if (step === 5) {
      const ok = await saveProfile(true);
      if (!ok) return;
      setDone(true);
      setStep(6);
    }
  };

  const handleBack = () => {
    setErrorMsg('');
    if (step > 0) setStep((s) => s - 1);
  };

  const handleFinish = () => {
    onComplete();
  };

  if (!mounted) return null;

  const progressSteps = STEP_COUNT;
  const progressIndex = Math.min(step, progressSteps - 1);

  return createPortal(
    <div className="modal-overlay lsdle-profile-overlay">
      <div className="modal-content modal-has-bottom-bar lsdle-profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-body">
          <div className="lsdle-profile-progress" aria-hidden="true">
            {Array.from({ length: progressSteps }, (_, i) => (
              <span key={i} className={`lsdle-profile-dot${i <= progressIndex ? ' lsdle-profile-dot--active' : ''}`} />
            ))}
          </div>

          <div className="lsdle-profile-step">
          {step === 0 && (
            <>
              <Gamepad2 size={44} style={{ color: 'var(--primary)', margin: '0 auto 1rem auto' }} />
              <h2 className="modal-title">{t('lsdleProfile.introTitle')}</h2>
              <p className="modal-subtitle">{t('lsdleProfile.introBody')}</p>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="modal-title">{t('lsdleProfile.stepIdentity')}</h2>
              <p className="modal-subtitle">{t('lsdleProfile.stepIdentityHint')}</p>
              <div className="form-row">
                <div className="form-group">
                  <ProfileFieldLabel
                    icon={<UserIcon size={15} style={{ color: 'var(--primary)' }} />}
                    label={t('register.genderLabel')}
                    tip={t('lsdleProfile.fieldTips.gender')}
                  />
                  <select value={gender} onChange={(e) => setGender(e.target.value)}>
                    {GENDER_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <ProfileFieldLabel
                    icon={<Briefcase size={15} style={{ color: 'var(--primary)' }} />}
                    label={t('register.roleLabel')}
                    tip={t('lsdleProfile.fieldTips.role')}
                  />
                  <select value={role} onChange={(e) => setRole(e.target.value)}>
                    {ROLE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="modal-title">{t('lsdleProfile.stepEntry')}</h2>
              <p className="modal-subtitle">{t('lsdleProfile.stepEntryHint')}</p>
              <div className="form-row">
                <div className="form-group">
                  <ProfileFieldLabel
                    icon={<CalendarDays size={15} style={{ color: 'var(--primary)' }} />}
                    label={t('register.entryLabel')}
                    tip={t('lsdleProfile.fieldTips.entry')}
                  />
                  <select value={entrySemester} onChange={(e) => setEntrySemester(e.target.value)}>
                    {ENTRY_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <ProfileFieldLabel
                    icon={<Users size={15} style={{ color: 'var(--primary)' }} />}
                    label={t('register.colabsLabel')}
                    tip={t('lsdleProfile.fieldTips.colabs')}
                  />
                  <select value={isColab} onChange={(e) => setIsColab(e.target.value)}>
                    {COLAB_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="modal-title">{t('lsdleProfile.stepArea')}</h2>
              <p className="modal-subtitle">{t('lsdleProfile.stepAreaHint')}</p>
              <ProfileFieldLabel
                icon={<Layers size={15} style={{ color: 'var(--primary)' }} />}
                label={t('register.areaLabel')}
                tip={t('lsdleProfile.fieldTips.area')}
              />
              <AreaPicker selected={area} onChange={setArea} />
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="modal-title">{t('lsdleProfile.stepProject')}</h2>
              <p className="modal-subtitle">{t('lsdleProfile.stepProjectHint')}</p>
              <ProfileFieldLabel
                icon={<FolderGit2 size={15} style={{ color: 'var(--primary)' }} />}
                label={t('register.labLabel')}
                tip={t('lsdleProfile.fieldTips.project')}
              />
              <p className="profile-field-hint">{t('projects.singleHint')}</p>
              <ProjectPicker selected={projects} onChange={setProjects} savedProjects={user.projects?.slice(0, 1) ?? []} allowCreate />
            </>
          )}

          {step === 5 && (
            <>
              <h2 className="modal-title">{t('lsdleProfile.stepCoffee')}</h2>
              <p className="modal-subtitle">{t('lsdleProfile.stepCoffeeHint')}</p>
              <div className="form-group">
                <ProfileFieldLabel
                  icon={<Coffee size={15} style={{ color: 'var(--primary)' }} />}
                  label={t('register.coffeeLabel')}
                  tip={t('lsdleProfile.fieldTips.coffee')}
                />
                <select value={likesCoffee} onChange={(e) => setLikesCoffee(e.target.value)}>
                  {COFFEE_OPTIONS.filter((o) => o !== 'Só energético').map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {step === 6 && done && (
            <>
              <CheckCircle2 size={48} style={{ color: 'var(--color-correct)', margin: '0 auto 1rem auto' }} />
              <h2 className="modal-title">{t('lsdleProfile.doneTitle')}</h2>
              <p className="modal-subtitle">{t('lsdleProfile.doneBody')}</p>
            </>
          )}

          </div>

          <Toast message={errorMsg} type="error" onClose={() => setErrorMsg('')} />

          <div className="lsdle-profile-actions">
            {step === 0 ? (
              <>
                <button type="button" className="btn" style={{ width: '100%' }} onClick={handleNext}>
                  {t('lsdleProfile.start')}
                </button>
                <button type="button" className="btn btn-secondary" style={{ width: '100%' }} onClick={onSkip}>
                  {t('lsdleProfile.skip')}
                </button>
              </>
            ) : step === 6 ? (
              <button type="button" className="btn" style={{ width: '100%' }} onClick={handleFinish}>
                {t('lsdleProfile.play')}
              </button>
            ) : (
              <>
                <div className="lsdle-profile-nav">
                  <button type="button" className="btn btn-secondary lsdle-profile-nav-btn" onClick={handleBack} disabled={saving}>
                    <ChevronLeft size={18} /> {t('lsdleProfile.back')}
                  </button>
                  <button type="button" className="btn lsdle-profile-nav-btn" onClick={handleNext} disabled={saving}>
                    {saving
                      ? t('lsdleProfile.saving')
                      : step === 5
                        ? t('lsdleProfile.finish')
                        : t('lsdleProfile.next')}
                    {!saving && step < 5 && <ChevronRight size={18} />}
                  </button>
                </div>
                <button type="button" className="btn btn-secondary" style={{ width: '100%' }} onClick={onSkip} disabled={saving}>
                  {t('lsdleProfile.skip')}
                </button>
              </>
            )}
          </div>
        </div>
        <ModalColorBar />
      </div>
    </div>,
    document.body,
  );
}

export function lsdleProfileDismissKey(userId: string): string {
  return `lsdle-profile-dismissed-${userId}`;
}

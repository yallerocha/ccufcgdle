'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Flame } from 'lucide-react';
import { apiFetch } from '@/client/lib/api';
import { useAuth } from '@/client/context/AuthContext';
import type { StreakInfo } from '@/client/components/StreakBadge';

interface StreakWeekDay {
  date: string;
  weekday: number;
  completed: boolean;
  isToday: boolean;
}

interface StreakWeekResponse {
  streak: StreakInfo;
  week: StreakWeekDay[];
}

interface GameStreakButtonProps {
  streakEndpoint: string;
  /** Refetch when this value changes (e.g. after winning). */
  refreshKey?: string | number | boolean;
}

export function GameStreakButton({ streakEndpoint, refreshKey }: GameStreakButtonProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<StreakWeekResponse | null>(null);

  const weekdayLabels = t('streak.weekdays', { returnObjects: true }) as string[];

  const loadStreak = useCallback(async () => {
    if (!user) {
      setData(null);
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch(streakEndpoint);
      const json = await res.json();
      if (res.ok) setData(json);
    } catch (err) {
      console.error('Error loading streak week:', err);
    } finally {
      setLoading(false);
    }
  }, [streakEndpoint, user]);

  useEffect(() => {
    if (user) void loadStreak();
    else setData(null);
  }, [user, loadStreak, refreshKey]);

  useEffect(() => {
    if (!open) return;
    void loadStreak();
  }, [open, loadStreak]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const current = data?.streak.current ?? 0;
  const best = data?.streak.best ?? 0;
  const flameActive = user && current > 0;

  return (
    <div className="streak-btn-wrap" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn btn-secondary streak-trigger"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Flame size={16} style={{ color: flameActive ? 'var(--lsd-orange)' : 'var(--text-dim)' }} />
        {user ? current : '—'}
        <span className="streak-trigger-label">{t('streak.openButton')}</span>
      </button>

      {open && (
        <div className="streak-week-popover" role="dialog" aria-label={t('streak.weekTitle')}>
          {!user ? (
            <p className="streak-week-login">
              {t('streak.loginHint')}{' '}
              <Link href="/profile" onClick={() => setOpen(false)}>
                {t('streak.loginLink')}
              </Link>
            </p>
          ) : loading && !data ? (
            <p className="streak-week-loading">{t('streak.loading')}</p>
          ) : (
            <>
              <div className="streak-week-summary">
                <div className="streak-week-current">
                  <Flame size={18} style={{ color: current > 0 ? 'var(--lsd-orange)' : 'var(--text-dim)' }} />
                  <span className="streak-week-current-val">{current}</span>
                  <span>{t('streak.label')}</span>
                </div>
                <div className="streak-week-best">
                  <span>{t('streak.best')}</span>
                  <strong>{best}</strong>
                </div>
              </div>

              <p className="streak-week-title">{t('streak.weekTitle')}</p>
              <div className="streak-week-grid">
                {(data?.week ?? []).map((day) => (
                  <div
                    key={day.date}
                    className={[
                      'streak-week-day',
                      day.completed ? 'streak-week-day--done' : '',
                      day.isToday ? 'streak-week-day--today' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    title={day.date}
                  >
                    <span className="streak-week-day-label">{weekdayLabels[day.weekday] ?? ''}</span>
                    <span className="streak-week-day-icon" aria-hidden="true">
                      {day.completed ? (
                        <Flame size={16} style={{ color: 'var(--lsd-orange)' }} />
                      ) : (
                        <span className="streak-week-day-empty" />
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

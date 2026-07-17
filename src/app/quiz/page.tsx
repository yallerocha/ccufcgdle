'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/client/context/AuthContext';
import { getLocalDateString } from '@/shared/utils';
import { HelpCircle, Info, Trophy, CheckCircle2, XCircle, ArrowRight, BookOpen, Check, X } from 'lucide-react';
import { BackLink } from '@/client/components/BackLink';
import { LoadingState } from '@/client/components/LoadingState';
import { Toast } from '@/client/components/Toast';
import { QuizResultModal } from '@/client/components/QuizResultModal';
import type { StreakInfo } from '@/client/components/StreakBadge';
import { apiFetch } from '@/client/lib/api';
import { Logo } from '@/client/components/Logo';
import { GameStreakButton } from '@/client/components/GameStreakButton';

interface Question {
  area: string;
  question: string;
  options: string[];
  // Exam edition + original question number (traceable to the official caderno).
  source?: { year: number; number: number } | null;
}

// One answered question, as confirmed by the server (which is the only place
// that knows the right alternative).
interface Answered {
  i: number;
  choice: number;
  correct: boolean;
  answerIndex: number;
  explanation: string;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E'];

// Accent color per POSCOMP area, so each question's subject is recognizable at
// a glance (chip + dot in the question header).
const AREA_COLORS: Record<string, string> = {
  'Matemática': 'var(--lsd-teal)',
  'Fundamentos da Computação': 'var(--lsd-magenta)',
  'Tecnologia da Computação': 'var(--lsd-orange)',
};

export default function QuizPage() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [dailyKey, setDailyKey] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Answered[]>([]);
  // Index of the question currently on screen. After answering, the correction
  // stays visible until the player advances with "next".
  const [current, setCurrent] = useState(0);
  const [streak, setStreak] = useState<StreakInfo | null>(null);
  const [showResult, setShowResult] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showRules, setShowRules] = useState(false);

  const submittingRef = useRef(false);
  const todayStr = getLocalDateString();
  const storageKey = `quiz-game-state-${todayStr}-${user?.id ?? 'anon'}`;

  const finished = questions.length > 0 && answers.length >= questions.length;
  const correctCount = answers.filter((a) => a.correct).length;

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const res = await apiFetch('/api/quiz/daily');
        const data = await res.json();
        if (cancelled) return;

        const currentDailyKey: number | null = data.dailyKey ?? null;
        const qs: Question[] = data.questions ?? [];
        setQuestions(qs);
        setDailyKey(currentDailyKey);

        // The server's answer sheet (logged-in) wins over localStorage, so a
        // round continues correctly on another device.
        let restoredAnswers: Answered[] = Array.isArray(data.answered) ? data.answered : [];
        let restoredStreak: StreakInfo | null = null;

        const savedStr = localStorage.getItem(storageKey);
        if (savedStr) {
          const saved = JSON.parse(savedStr);
          const roundWasReset =
            saved.dailyKey != null && currentDailyKey != null && saved.dailyKey !== currentDailyKey;
          if (roundWasReset) {
            localStorage.removeItem(storageKey);
          } else {
            if (restoredAnswers.length === 0 && Array.isArray(saved.answers)) {
              restoredAnswers = saved.answers;
            }
            restoredStreak = saved.streak ?? null;
          }
        }

        restoredAnswers = [...restoredAnswers].sort((a, b) => a.i - b.i);
        setAnswers(restoredAnswers);
        setStreak(restoredStreak);
        const done = qs.length > 0 && restoredAnswers.length >= qs.length;
        setCurrent(done ? qs.length - 1 : restoredAnswers.length);
        setShowResult(done);
      } catch (err) {
        console.error('Error loading quiz:', err);
        if (!cancelled) setErrorMsg(t('quiz.error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayStr, user?.id, authLoading]);

  const persist = (next: { answers: Answered[]; streak: StreakInfo | null }) => {
    localStorage.setItem(storageKey, JSON.stringify({ ...next, dailyKey }));
  };

  const answeredCurrent = answers.find((a) => a.i === current) ?? null;

  async function choose(choice: number) {
    if (submittingRef.current || answeredCurrent || finished) return;
    submittingRef.current = true;
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await apiFetch('/api/quiz/answer', {
        method: 'POST',
        body: JSON.stringify({ questionIndex: current, choice }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || t('quiz.error'));
        return;
      }

      const answered: Answered = {
        i: current,
        choice,
        correct: data.correct,
        answerIndex: data.answerIndex,
        explanation: data.explanation ?? '',
      };
      const newAnswers = [...answers, answered].sort((a, b) => a.i - b.i);
      const newStreak: StreakInfo | null = data.streak ?? streak;
      setAnswers(newAnswers);
      setStreak(newStreak);
      persist({ answers: newAnswers, streak: newStreak });

      if (newAnswers.length >= questions.length) {
        setTimeout(() => setShowResult(true), 1200);
      }
    } catch (err) {
      console.error('Error answering quiz:', err);
      setErrorMsg(t('quiz.error'));
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  }

  function next() {
    if (current < questions.length - 1) setCurrent(current + 1);
  }

  if (loading) {
    return <LoadingState message={t('quiz.loading')} minHeight="60vh" />;
  }

  const question = questions[current];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <BackLink href="/" label={t('nav.backToHub')} style={{ margin: '2rem 0 0.5rem 0' }} />

      <section className="hero" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Logo alt="LSD Logo" style={{ width: '160px', maxWidth: '100%', marginBottom: '0.75rem' }} />
        <h1 className="lsd-gradient-text">QUIZ</h1>
        <p>{t('quiz.tagline')}</p>
        <div className="hero-actions">
          <button
            onClick={() => setShowRules(!showRules)}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
          >
            <HelpCircle size={16} />
            {showRules ? t('quiz.hideRules') : t('quiz.showRules')}
          </button>

          <GameStreakButton streakEndpoint="/api/quiz/streak" refreshKey={finished ? 'done' : 'playing'} />

          <Link
            href="/quiz/ranking"
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', textDecoration: 'none' }}
          >
            <Trophy size={16} style={{ color: 'var(--color-partial)' }} />
            {t('quiz.viewRanking')}
          </Link>
        </div>
      </section>

      {showRules && (
        <div className="quick-rules fade-in">
          <h3><Info size={18} style={{ color: 'var(--primary)' }} /> {t('quiz.rulesTitle')}</h3>
          <ul>
            <li>{t('quiz.rules.l1')}</li>
            <li>{t('quiz.rules.sourceInfo')}</li>
            <li>{t('quiz.rules.l2')}</li>
            <li>{t('quiz.rules.l3')}</li>
            <li>{t('quiz.rules.l4')}</li>
            <li>{t('quiz.rules.saved')}</li>
          </ul>
        </div>
      )}

      {question && (
        <div className="card quiz-card fade-in" style={{ maxWidth: '700px', margin: '0 auto', width: '100%' }}>
          {/* Progress header: counter over a slim segmented bar. Answered
              segments show the outcome color and can be revisited (click);
              future ones stay locked. */}
          <div className="quiz-progress-head">
            <span className="quiz-progress-label">
              {t('quiz.progress', { current: current + 1, total: questions.length })}
            </span>
          </div>
          <div
            className="quiz-segments"
            aria-label={t('quiz.progress', { current: current + 1, total: questions.length })}
          >
            {questions.map((_, i) => {
              const a = answers.find((x) => x.i === i);
              const reachable = i <= answers.length;
              const cls = a ? (a.correct ? 'correct' : 'wrong') : i === current ? 'current' : '';
              return (
                <button
                  key={i}
                  type="button"
                  className={`quiz-seg ${cls}`}
                  onClick={() => reachable && setCurrent(i)}
                  disabled={!reachable}
                  aria-label={t('quiz.progress', { current: i + 1, total: questions.length })}
                  aria-current={i === current ? 'step' : undefined}
                />
              );
            })}
          </div>

          {/* Question box: subject chip (colored per area) + exam provenance,
              with the statement inside; the left accent follows the area color. */}
          <div
            className="quiz-question-box"
            style={{ '--chip-color': AREA_COLORS[question.area] ?? 'var(--primary)' } as React.CSSProperties}
          >
            <div className="quiz-question-head">
              <span className="quiz-area-chip">{question.area}</span>
              {question.source && (
                <span className="quiz-source-chip">
                  <BookOpen size={12} aria-hidden />
                  {t('quiz.source', { year: question.source.year, number: question.source.number })}
                </span>
              )}
            </div>
            <h2 className="quiz-question-text">{question.question}</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {question.options.map((opt, idx) => {
              let cls = 'quiz-option';
              if (answeredCurrent) {
                if (idx === answeredCurrent.answerIndex) cls += ' correct';
                else if (idx === answeredCurrent.choice) cls += ' wrong';
                else cls += ' disabled';
              }
              return (
                <button
                  key={idx}
                  className={cls}
                  onClick={() => choose(idx)}
                  disabled={Boolean(answeredCurrent) || submitting}
                >
                  <span className="quiz-option-letter">{OPTION_LETTERS[idx] ?? idx + 1}</span>
                  <span>{opt}</span>
                  {answeredCurrent && idx === answeredCurrent.answerIndex && (
                    <CheckCircle2 size={18} style={{ marginLeft: 'auto', flexShrink: 0 }} />
                  )}
                  {answeredCurrent && !answeredCurrent.correct && idx === answeredCurrent.choice && (
                    <XCircle size={18} style={{ marginLeft: 'auto', flexShrink: 0 }} />
                  )}
                </button>
              );
            })}
          </div>

          {answeredCurrent && (
            <div className={`quiz-explanation ${answeredCurrent.correct ? 'correct' : 'wrong'} fade-in`}>
              <strong>
                {answeredCurrent.correct ? t('quiz.right') : t('quiz.wrong')}
              </strong>{' '}
              {answeredCurrent.explanation}
            </div>
          )}

          {answeredCurrent && current < questions.length - 1 && (
            <button onClick={next} className="btn" style={{ marginTop: '1rem', width: '100%' }}>
              {t('quiz.next')} <ArrowRight size={16} />
            </button>
          )}

          {finished && (
            <button onClick={() => setShowResult(true)} className="btn" style={{ marginTop: '1rem', width: '100%' }}>
              <Trophy size={16} style={{ color: 'var(--color-partial)' }} /> {t('quiz.viewResult')}
            </button>
          )}
        </div>
      )}

      <QuizResultModal
        show={showResult && finished}
        correct={correctCount}
        total={questions.length}
        streak={streak}
        todayStr={todayStr}
        onClose={() => setShowResult(false)}
      />

      <Toast message={errorMsg} type="error" onClose={() => setErrorMsg('')} />
    </div>
  );
}

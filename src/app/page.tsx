'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Trophy, Play, HandCoins, Scissors, SkipForward, Users, GraduationCap, Volume2, VolumeX, Check, SlidersHorizontal, Flag } from 'lucide-react';
import { useAuth } from '@/client/context/AuthContext';
import { apiFetch } from '@/client/lib/api';
import { formatPrize } from '@/client/lib/format';
import { LoadingState } from '@/client/components/LoadingState';
import { Toast } from '@/client/components/Toast';
import { ShowResultModal } from '@/client/components/ShowResultModal';
import {
  unlockAudio, isMuted, toggleMuted,
  sfxSelect, sfxCorrect, sfxWrong, sfxLifeline, sfxStart, sfxWin, sfxStop,
  startMusic, stopMusic,
} from '@/client/lib/sound';

type LifelineType = 'fifty' | 'skip' | 'audience' | 'students';
type ShowStatus = 'playing' | 'won' | 'stopped' | 'lost';

interface ShowQuestion {
  step: number;
  totalSteps: number;
  area: string;
  topic: string;
  question: string;
  options: string[];
  difficulty: number;
  source: { year: number; number: number } | null;
}

interface ShowRun {
  runId: string;
  status: ShowStatus;
  currentStep: number;
  securedPrize: number;
  ladder: number[];
  usedLifelines: LifelineType[];
  question: ShowQuestion | null;
}

interface AnswerResult {
  correct: boolean;
  correctIndex: number;
  explanation: string;
  run: ShowRun;
}

interface LifelineResult {
  type: LifelineType;
  usedLifelines: LifelineType[];
  removedIndices?: number[];
  distribution?: number[];
  hint?: string;
  question?: ShowQuestion;
}

interface Reveal {
  correct: boolean;
  correctIndex: number;
  chosenIndex: number;
  explanation: string;
  nextRun: ShowRun;
  timedOut?: boolean;
}

const RUN_KEY = 'show-run-id';
const QUESTION_SECONDS = 200;
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

const LIFELINES: { type: LifelineType; icon: React.ElementType }[] = [
  { type: 'fifty', icon: Scissors },
  { type: 'skip', icon: SkipForward },
  { type: 'audience', icon: Users },
  { type: 'students', icon: GraduationCap },
];

export default function ShowPage() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();

  const [run, setRun] = useState<ShowRun | null>(null);
  const [starting, setStarting] = useState(false);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState<ShowRun | null>(null);
  const [muted, setMuted] = useState(false);
  // Between-questions "host" transition card (phrase + next prize).
  const [transition, setTransition] = useState<{ prize: number; phrase: string } | null>(null);
  // Portal target readiness (fixed overlays render on document.body so no
  // ancestor transform/filter can clip them to the container).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => setMuted(isMuted()), []);
  useEffect(() => () => stopMusic(), []);

  // While a run is live, lock the navbar (no wandering off mid-question — the
  // stage is immersive, like the real show). The class drives CSS in globals.
  const playing = !!run && run.status === 'playing';
  useEffect(() => {
    document.body.classList.toggle('show-live', playing);
    return () => document.body.classList.remove('show-live');
  }, [playing]);

  // Question-theme picker (intro): all topics start selected; a strict subset
  // is sent to /start, everything else means "all".
  const [topics, setTopics] = useState<{ id: string; count: number }[]>([]);
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [topicsOpen, setTopicsOpen] = useState(false);
  const [noLifelines, setNoLifelines] = useState(false);
  useEffect(() => {
    apiFetch('/api/show/topics')
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: { topics: { id: string; count: number }[] }) => {
        setTopics(data.topics);
        setChosen(new Set(data.topics.map((tp) => tp.id)));
      })
      .catch(() => {});
  }, []);

  const toggleTopic = (id: string) => {
    setChosen((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const topicsFiltered = chosen.size > 0 && chosen.size < topics.length;
  const settingsChanged = topicsFiltered || noLifelines;

  // Per-question lifeline UI state (reset when the question changes).
  const [hidden, setHidden] = useState<number[]>([]);
  const [audience, setAudience] = useState<number[] | null>(null);
  const [studentsHint, setStudentsHint] = useState<string | null>(null);
  const [lifelineBusy, setLifelineBusy] = useState<LifelineType | null>(null);
  // Two-step answering, like the show: pick an option, then lock it in.
  const [selected, setSelected] = useState<number | null>(null);
  // Quit needs a second click to confirm (it ends the run for good).
  const [quitArmed, setQuitArmed] = useState(false);
  // Per-question countdown (server enforces the actual timeout end).
  const [timeLeft, setTimeLeft] = useState(QUESTION_SECONDS);

  const resetQuestionAids = () => {
    setHidden([]);
    setAudience(null);
    setStudentsHint(null);
    setSelected(null);
    setQuitArmed(false);
  };

  // Resume an in-progress run after a reload.
  useEffect(() => {
    if (authLoading || !user) return;
    const savedId = typeof window !== 'undefined' ? localStorage.getItem(RUN_KEY) : null;
    if (!savedId) return;
    apiFetch(`/api/show/run/${savedId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: ShowRun) => {
        if (data.status === 'playing') setRun(data);
        else localStorage.removeItem(RUN_KEY);
      })
      .catch(() => localStorage.removeItem(RUN_KEY));
  }, [authLoading, user]);

  const start = useCallback(async () => {
    unlockAudio();
    setStarting(true);
    setErrorMsg('');
    setResult(null);
    setReveal(null);
    setTransition(null);
    resetQuestionAids();
    try {
      // Send topics only when a strict, non-empty subset is picked (= filter on).
      const body: { topics?: string[]; noLifelines?: boolean } = {};
      if (chosen.size > 0 && chosen.size < topics.length) body.topics = [...chosen];
      if (noLifelines) body.noLifelines = true;
      const res = await apiFetch('/api/show/start', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setRun(data);
        localStorage.setItem(RUN_KEY, data.runId);
        sfxStart();
        startMusic();
      } else {
        setErrorMsg(data.error || t('show.errorGeneric'));
      }
    } catch {
      setErrorMsg(t('show.errorGeneric'));
    } finally {
      setStarting(false);
    }
  }, [t, chosen, topics.length, noLifelines]);

  // Step 1: pick an option (reversible). Step 2 (confirmAnswer) locks it in.
  const pick = (index: number) => {
    if (reveal || submitting) return;
    sfxSelect();
    setSelected((cur) => (cur === index ? null : index));
  };

  const confirmAnswer = async () => {
    const index = selected;
    if (index == null || !run?.question || reveal || submitting) return;
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await apiFetch('/api/show/answer', {
        method: 'POST',
        body: JSON.stringify({ runId: run.runId, optionIndex: index }),
      });
      const data: AnswerResult = await res.json();
      if (res.ok) {
        stopMusic();
        if (data.correct) sfxCorrect(); else sfxWrong();
        setSelected(null);
        setReveal({
          correct: data.correct,
          correctIndex: data.correctIndex,
          chosenIndex: index,
          explanation: data.explanation,
          nextRun: data.run,
        });
      } else {
        setErrorMsg((data as unknown as { error?: string }).error || t('show.errorGeneric'));
      }
    } catch {
      setErrorMsg(t('show.errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  const proceed = () => {
    if (!reveal) return;
    const next = reveal.nextRun;
    setReveal(null);
    if (next.status !== 'playing') {
      localStorage.removeItem(RUN_KEY);
      resetQuestionAids();
      setRun(next);
      if (next.status === 'won') sfxWin();
      setResult(next);
      return;
    }
    // Between-questions transition: a host phrase + the next prize, then advance.
    const phrases = t('show.transitionPhrases', { returnObjects: true });
    const list = Array.isArray(phrases) ? (phrases as string[]) : [];
    const phrase = list.length ? list[Math.floor(Math.random() * list.length)] : '';
    setTransition({ prize: next.ladder[next.currentStep - 1], phrase });
    window.setTimeout(() => {
      resetQuestionAids();
      setRun(next);
      setTransition(null);
      startMusic();
    }, 1600);
  };

  const handleTimeout = useCallback(async () => {
    if (!run || reveal || submitting) return;
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/show/timeout', {
        method: 'POST',
        body: JSON.stringify({ runId: run.runId }),
      });
      const data: AnswerResult = await res.json();
      if (res.ok) {
        stopMusic();
        sfxWrong();
        setSelected(null);
        setReveal({
          correct: false,
          correctIndex: data.correctIndex,
          chosenIndex: -1,
          explanation: data.explanation,
          nextRun: data.run,
          timedOut: true,
        });
      }
    } catch {
      /* leave the question up; the server is the source of truth */
    } finally {
      setSubmitting(false);
    }
  }, [run, reveal, submitting]);

  // Per-question countdown: (re)starts on each fresh question, pauses on reveal /
  // transition, and fires the server timeout when it hits zero.
  const timerActive = playing && !reveal && !transition;
  useEffect(() => {
    if (!timerActive) return;
    setTimeLeft(QUESTION_SECONDS);
    const id = window.setInterval(() => setTimeLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [timerActive, run?.runId, run?.currentStep]);
  useEffect(() => {
    if (timerActive && timeLeft === 0) handleTimeout();
  }, [timeLeft, timerActive, handleTimeout]);

  const stop = async () => {
    if (!run || reveal || submitting) return;
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/show/stop', {
        method: 'POST',
        body: JSON.stringify({ runId: run.runId }),
      });
      const data: ShowRun = await res.json();
      if (res.ok) {
        stopMusic();
        sfxStop();
        setRun(data);
        localStorage.removeItem(RUN_KEY);
        setResult(data);
      } else {
        setErrorMsg((data as unknown as { error?: string }).error || t('show.errorGeneric'));
      }
    } catch {
      setErrorMsg(t('show.errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  // Give up: ends the run (banking whatever is secured, like stop) but goes
  // straight back to the intro — no celebration modal.
  const quit = async () => {
    if (!run || reveal || submitting) return;
    if (!quitArmed) {
      setQuitArmed(true);
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/show/stop', {
        method: 'POST',
        body: JSON.stringify({ runId: run.runId }),
      });
      if (res.ok) {
        stopMusic();
        localStorage.removeItem(RUN_KEY);
        resetQuestionAids();
        setRun(null);
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg((data as { error?: string }).error || t('show.errorGeneric'));
      }
    } catch {
      setErrorMsg(t('show.errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  const spendLifeline = async (type: LifelineType) => {
    if (!run || reveal || lifelineBusy || run.usedLifelines.includes(type)) return;
    setLifelineBusy(type);
    setErrorMsg('');
    try {
      const res = await apiFetch('/api/show/lifeline', {
        method: 'POST',
        body: JSON.stringify({ runId: run.runId, type }),
      });
      const data: LifelineResult = await res.json();
      if (!res.ok) {
        setErrorMsg((data as unknown as { error?: string }).error || t('show.errorGeneric'));
        return;
      }
      sfxLifeline();
      setRun((r) => (r ? { ...r, usedLifelines: data.usedLifelines } : r));
      if (type === 'fifty' && data.removedIndices) {
        setHidden(data.removedIndices);
      } else if (type === 'audience' && data.distribution) {
        setAudience(data.distribution);
      } else if (type === 'students') {
        if (data.distribution) setAudience(data.distribution);
        setStudentsHint(data.hint ?? null);
      } else if (type === 'skip' && data.question) {
        resetQuestionAids();
        setRun((r) => (r ? { ...r, question: data.question!, usedLifelines: data.usedLifelines } : r));
      }
    } catch {
      setErrorMsg(t('show.errorGeneric'));
    } finally {
      setLifelineBusy(null);
    }
  };

  const toggleSound = () => {
    const m = toggleMuted();
    setMuted(m);
    if (!m && run?.status === 'playing' && !reveal && !transition) startMusic();
  };

  if (authLoading) return <LoadingState message={t('show.loading')} minHeight="50vh" />;

  // ── Intro / not playing ────────────────────────────────────────────────────
  if (!run || run.status !== 'playing') {
    return (
      <div className="show-page show-intro fade-in">
        <Toast message={errorMsg} type="error" onClose={() => setErrorMsg('')} />
        {result && (
          <ShowResultModal run={result} onClose={() => setResult(null)} onPlayAgain={start} />
        )}

        <section className="show-stage">
          <div className="show-stage-rings" aria-hidden />
          <h1 className="sr-only">{t('show.title')}</h1>
          <img className="show-hero-logo" src="/osdc-hero.svg" alt={t('show.title')} />
          <p className="show-tagline">{t('show.tagline')}</p>
          <div className="show-prize-target">
            <span>{t('show.topPrizeLabel')}</span>
            <strong>R$ 1.000.000</strong>
          </div>

          <div className="show-start-row">
            {user ? (
              <button onClick={start} disabled={starting} className="btn show-start-btn">
                <Play size={22} /> {starting ? t('show.starting') : t('show.start')}
              </button>
            ) : (
              <Link href="/profile" className="btn show-start-btn">
                <Play size={22} /> {t('show.loginToPlay')}
              </Link>
            )}
            {topics.length > 0 && (
              <button
                type="button"
                className="show-edit-btn"
                onClick={() => setTopicsOpen(true)}
                title={t('show.settingsTitle')}
                aria-label={t('show.settingsTitle')}
              >
                <SlidersHorizontal size={20} />
                {settingsChanged && <span className="show-edit-dot" />}
              </button>
            )}
          </div>
          {settingsChanged && (
            <p className="show-topics-summary">
              {[
                topicsFiltered ? t('show.topicsActive', { count: chosen.size, total: topics.length }) : null,
                noLifelines ? t('show.lifelinesOffShort') : null,
              ].filter(Boolean).join(' · ')}
            </p>
          )}
        </section>

        <div className="card show-intro-card">
          <h2 className="card-title"><Trophy size={20} /> {t('show.howToTitle')}</h2>
          <ul className="show-rules">
            <li>{t('show.rule1')}</li>
            <li>{t('show.rule2')}</li>
            <li>{t('show.rule3')}</li>
            <li>{t('show.rule4')}</li>
          </ul>
        </div>

        {/* Game settings modal: lifelines toggle + question themes */}
        {mounted && topicsOpen && createPortal(
          <div className="modal-overlay" onClick={() => setTopicsOpen(false)}>
            <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <SlidersHorizontal size={20} style={{ color: 'var(--gold)' }} /> {t('show.settingsTitle')}
              </h2>

              <button
                type="button"
                className={`show-setting-toggle${noLifelines ? ' is-off' : ''}`}
                role="switch"
                aria-checked={!noLifelines}
                onClick={() => setNoLifelines((v) => !v)}
              >
                <span className="show-setting-text">
                  <strong>{t('show.lifelinesLabel')}</strong>
                  <small>{noLifelines ? t('show.lifelinesOff') : t('show.lifelinesOn')}</small>
                </span>
                <span className="show-switch" aria-hidden><span className="show-switch-knob" /></span>
              </button>

              <h3 className="show-setting-heading">{t('show.topicsTitle')}</h3>
              <p className="show-setting-sub">{t('show.topicsHint')}</p>
              <div className="show-topic-chips">
                {topics.map((tp) => (
                  <button
                    key={tp.id}
                    type="button"
                    className={`show-topic-chip${chosen.has(tp.id) ? ' is-on' : ''}`}
                    aria-pressed={chosen.has(tp.id)}
                    onClick={() => toggleTopic(tp.id)}
                  >
                    {tp.id}
                  </button>
                ))}
              </div>
              <button onClick={() => setTopicsOpen(false)} className="btn show-final-btn" style={{ marginTop: '1.25rem' }}>
                <Check size={18} /> {t('show.topicsDone')}
              </button>
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }

  // ── Playing ─────────────────────────────────────────────────────────────────
  const q = run.question!;
  const highestPrize = run.ladder[run.ladder.length - 1];

  return (
    <div className="show-page show-playing fade-in">
      <Toast message={errorMsg} type="error" onClose={() => setErrorMsg('')} />

      {mounted && createPortal(
        <button type="button" className="show-mute" onClick={toggleSound} title={muted ? t('show.soundOn') : t('show.soundOff')} aria-label={muted ? t('show.soundOn') : t('show.soundOff')}>
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>,
        document.body
      )}

      {/* Between-questions host transition (portaled: true full-screen) */}
      {mounted && transition && createPortal(
        <div className="show-transition">
          <div className="show-transition-inner">
            {transition.phrase && <p className="show-transition-phrase">{transition.phrase}</p>}
            <p className="show-transition-prize">
              {t('show.worthLabel')} <strong>{formatPrize(transition.prize)}</strong>
            </p>
          </div>
        </div>,
        document.body
      )}

      <div className="show-layout">
        {/* Question + options */}
        <div className="show-main">
          <div className="show-qmeta">
            <span className="show-step">{t('show.stepOf', { step: q.step, total: q.totalSteps })}</span>
            <span className="show-area">{q.topic}</span>
            {q.source && <span className="show-source">POSCOMP {q.source.year}</span>}
          </div>

          {(() => {
            const pct = (timeLeft / QUESTION_SECONDS) * 100;
            const level = timeLeft <= 15 ? 'danger' : timeLeft <= 45 ? 'warn' : 'ok';
            return (
              <div className={`show-timer show-timer--${level}`} role="timer" aria-label={t('show.timeLeft')}>
                <div className="show-timer-track"><div className="show-timer-fill" style={{ width: `${reveal ? 100 : pct}%` }} /></div>
                <span className="show-timer-count">{reveal ? '—' : `${timeLeft}s`}</span>
              </div>
            );
          })()}

          <div className="card show-question-card">
            <p className="show-question">{q.question}</p>
          </div>

          <div className="show-options">
            {q.options.map((opt, i) => {
              const isHidden = hidden.includes(i);
              let cls = 'show-option';
              if (reveal) {
                if (i === reveal.correctIndex) cls += ' is-correct';
                else if (i === reveal.chosenIndex) cls += ' is-wrong';
                else cls += ' is-dim';
              } else if (i === selected) {
                cls += ' is-selected';
              }
              return (
                <button
                  key={i}
                  className={cls}
                  disabled={isHidden || !!reveal || submitting}
                  style={isHidden ? { visibility: 'hidden' } : undefined}
                  onClick={() => pick(i)}
                  aria-pressed={i === selected}
                >
                  <span className="show-option-letter">{LETTERS[i]}</span>
                  <span className="show-option-text">{opt}</span>
                  {audience && !reveal && (
                    <span className="show-option-pct">{audience[i]}%</span>
                  )}
                </button>
              );
            })}
          </div>

          {selected != null && !reveal && (
            <button onClick={confirmAnswer} disabled={submitting} className="btn show-final-btn">
              <Check size={20} /> {t('show.finalAnswer', { letter: LETTERS[selected] })}
            </button>
          )}

          {studentsHint && !reveal && (
            <p className="show-hint"><GraduationCap size={16} /> {studentsHint}</p>
          )}

          {reveal ? (
            <div className={`show-reveal ${reveal.correct ? 'is-correct' : 'is-wrong'}`}>
              <p className="show-reveal-verdict">
                {reveal.timedOut ? t('show.timeUp') : reveal.correct ? t('show.correct') : t('show.wrong')}
              </p>
              <p className="show-explanation">{reveal.explanation}</p>
              <button onClick={proceed} className="btn show-continue-btn">
                {reveal.nextRun.status === 'playing' ? t('show.continue') : t('show.seeResult')}
              </button>
            </div>
          ) : (
            <div className="show-actions">
              {run.usedLifelines.length < LIFELINES.length && (
              <div className="show-lifelines">
                {LIFELINES.map(({ type, icon: Icon }) => {
                  const used = run.usedLifelines.includes(type);
                  return (
                    <button
                      key={type}
                      className={`show-lifeline ${used ? 'is-used' : ''}`}
                      disabled={used || !!lifelineBusy}
                      onClick={() => spendLifeline(type)}
                      title={t(`show.lifeline.${type}`)}
                    >
                      <Icon size={18} />
                      <span>{t(`show.lifeline.${type}`)}</span>
                    </button>
                  );
                })}
              </div>
              )}
              <button onClick={stop} disabled={submitting || run.currentStep === 1} className="btn btn-secondary show-stop-btn">
                <HandCoins size={18} /> {t('show.stopWith', { prize: formatPrize(run.securedPrize) })}
              </button>
              <button
                onClick={quit}
                disabled={submitting}
                className={`show-quit-btn${quitArmed ? ' is-armed' : ''}`}
                onBlur={() => setQuitArmed(false)}
              >
                <Flag size={15} /> {quitArmed ? t('show.quitConfirm') : t('show.quit')}
              </button>
            </div>
          )}
        </div>

        {/* Prize ladder */}
        <aside className="show-ladder card" aria-label={t('show.ladderTitle')}>
          <h3 className="show-ladder-title">{t('show.ladderTitle')}</h3>
          <ol className="show-ladder-list">
            {run.ladder.map((_, i) => {
              const step = run.ladder.length - i; // render top (15) → bottom (1)
              const value = run.ladder[step - 1];
              const isCurrent = step === run.currentStep;
              const isCleared = step < run.currentStep;
              const isCheckpoint = step === 5 || step === 10 || value === highestPrize;
              return (
                <li
                  key={step}
                  className={`show-rung${isCurrent ? ' is-current' : ''}${isCleared ? ' is-cleared' : ''}${isCheckpoint ? ' is-checkpoint' : ''}`}
                >
                  <span className="show-rung-step">{step}</span>
                  <span className="show-rung-prize">{formatPrize(value)}</span>
                </li>
              );
            })}
          </ol>
        </aside>
      </div>
    </div>
  );
}

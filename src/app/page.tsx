'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Trophy, Play, HandCoins, Scissors, SkipForward, Users, GraduationCap, Sparkles, Volume2, VolumeX, Check } from 'lucide-react';
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
}

const RUN_KEY = 'show-run-id';
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
  useEffect(() => setMuted(isMuted()), []);
  useEffect(() => () => stopMusic(), []);

  // Per-question lifeline UI state (reset when the question changes).
  const [hidden, setHidden] = useState<number[]>([]);
  const [audience, setAudience] = useState<number[] | null>(null);
  const [studentsHint, setStudentsHint] = useState<string | null>(null);
  const [lifelineBusy, setLifelineBusy] = useState<LifelineType | null>(null);
  // Two-step answering, like the show: pick an option, then lock it in.
  const [selected, setSelected] = useState<number | null>(null);

  const resetQuestionAids = () => {
    setHidden([]);
    setAudience(null);
    setStudentsHint(null);
    setSelected(null);
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
      const res = await apiFetch('/api/show/start', { method: 'POST' });
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
  }, [t]);

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
            <Sparkles size={16} />
            <span>{t('show.topPrizeLabel')}</span>
            <strong>R$ 1.000.000</strong>
          </div>

          {user ? (
            <button onClick={start} disabled={starting} className="btn show-start-btn">
              <Play size={22} /> {starting ? t('show.starting') : t('show.start')}
            </button>
          ) : (
            <Link href="/profile" className="btn show-start-btn">
              <Play size={22} /> {t('show.loginToPlay')}
            </Link>
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
      </div>
    );
  }

  // ── Playing ─────────────────────────────────────────────────────────────────
  const q = run.question!;
  const highestPrize = run.ladder[run.ladder.length - 1];

  return (
    <div className="show-page show-playing fade-in">
      <Toast message={errorMsg} type="error" onClose={() => setErrorMsg('')} />

      <button type="button" className="show-mute" onClick={toggleSound} title={muted ? t('show.soundOn') : t('show.soundOff')} aria-label={muted ? t('show.soundOn') : t('show.soundOff')}>
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>

      {/* Between-questions host transition */}
      {transition && (
        <div className="show-transition">
          <div className="show-transition-inner">
            {transition.phrase && <p className="show-transition-phrase">{transition.phrase}</p>}
            <p className="show-transition-prize">
              {t('show.worthLabel')} <strong>{formatPrize(transition.prize)}</strong>
            </p>
          </div>
        </div>
      )}

      <div className="show-layout">
        {/* Question + options */}
        <div className="show-main">
          <div className="show-qmeta">
            <span className="show-step">{t('show.stepOf', { step: q.step, total: q.totalSteps })}</span>
            <span className="show-area">{q.area}</span>
            {q.source && <span className="show-source">POSCOMP {q.source.year}</span>}
            <span className="show-worth">
              {t('show.worthLabel')} <strong>{formatPrize(run.ladder[run.currentStep - 1])}</strong>
            </span>
          </div>

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
                {reveal.correct ? t('show.correct') : t('show.wrong')}
              </p>
              <p className="show-explanation">{reveal.explanation}</p>
              <button onClick={proceed} className="btn show-continue-btn">
                {reveal.nextRun.status === 'playing' ? t('show.continue') : t('show.seeResult')}
              </button>
            </div>
          ) : (
            <div className="show-actions">
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
              <button onClick={stop} disabled={submitting || run.currentStep === 1} className="btn btn-secondary show-stop-btn">
                <HandCoins size={18} /> {t('show.stopWith', { prize: formatPrize(run.securedPrize) })}
              </button>
            </div>
          )}
        </div>

        {/* Prize ladder */}
        <aside className="show-ladder card" aria-label={t('show.ladderTitle')}>
          <h3 className="show-ladder-title"><Trophy size={16} /> {t('show.ladderTitle')}</h3>
          <ol className="show-ladder-list">
            {run.ladder.map((prize, i) => {
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

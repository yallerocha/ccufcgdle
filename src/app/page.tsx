'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Trophy, Play, HandCoins, Layers, SkipForward, Users, GraduationCap, Volume2, VolumeX, Check, SlidersHorizontal, Flag, Scissors, ArrowLeft, ChevronRight, BookOpen, X, ListChecks, CalendarDays } from 'lucide-react';
import { useAuth } from '@/client/context/AuthContext';
import { apiFetch } from '@/client/lib/api';
import { formatPrize } from '@/client/lib/format';
import { LoadingState } from '@/client/components/LoadingState';
import { Toast } from '@/client/components/Toast';
import { ShowResultModal } from '@/client/components/ShowResultModal';
import { ShowHost } from '@/client/components/ShowHost';
import { ShowLifelineScene } from '@/client/components/ShowLifelineScene';
import { useModalDismiss } from '@/client/hooks/useModalDismiss';
import {
  unlockAudio, isMuted, toggleMuted,
  sfxSelect, sfxCorrect, sfxWrong, sfxLifeline, sfxStart, sfxWin, sfxStop,
  startMusic, stopMusic, setGameActive,
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
  secondsLeft: number;
}

interface ShowRun {
  runId: string;
  status: ShowStatus;
  currentStep: number;
  securedPrize: number;
  ladder: number[];
  usedLifelines: LifelineType[];
  answerAidUsed: boolean;
  question: ShowQuestion | null;
  // Effect of single-use aids already spent on the current step (for reload restore).
  aids?: { removedIndices?: number[]; distribution?: number[]; pick?: number };
}

interface AnswerResult {
  correct: boolean;
  correctIndex: number;
  explanation: string;
  explanationLong: string;
  run: ShowRun;
}

interface LifelineResult {
  type: LifelineType;
  usedLifelines: LifelineType[];
  removedIndices?: number[];
  distribution?: number[];
  pick?: number;
  question?: ShowQuestion;
}

interface Reveal {
  correct: boolean;
  correctIndex: number;
  chosenIndex: number;
  explanation: string;
  // Longer walk-through of the question; '' when the bank has none for it.
  explanationLong: string;
  nextRun: ShowRun;
  timedOut?: boolean;
}

const RUN_KEY = 'show-run-id';
const QUESTION_SECONDS = 200;
// Seconds at which the timer turns yellow / red. The host's mood follows the
// same thresholds, so the two can never drift apart.
const TIMER_WARN = 45;
const TIMER_DANGER = 15;
// Quanto o overlay do apresentador fica na tela. A abertura da partida é mais
// longa porque a frase é maior.
const START_TRANSITION_MS = 2600;
const STEP_TRANSITION_MS = 1600;
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const CARD_SUITS = ['♠', '♥', '♦', '♣'];

const LIFELINES: { type: LifelineType; icon: React.ElementType }[] = [
  { type: 'fifty', icon: Layers },
  { type: 'skip', icon: SkipForward },
  { type: 'audience', icon: Users },
  { type: 'students', icon: GraduationCap },
];
// How many times each lifeline can be spent (mirrors LIFELINE_USES on the server).
const LIFELINE_USES: Record<LifelineType, number> = { fifty: 1, skip: 3, audience: 1, students: 1 };
const usesLeft = (used: LifelineType[], type: LifelineType) =>
  LIFELINE_USES[type] - used.filter((t) => t === type).length;

/** One random line out of an i18n array key. '' when the key is missing. */
const randomPhrase = (t: TFunction, key: string) => {
  const value = t(key, { returnObjects: true });
  const list = Array.isArray(value) ? (value as string[]) : [];
  return list.length ? list[Math.floor(Math.random() * list.length)] : '';
};

export default function ShowPage() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();

  const [run, setRun] = useState<ShowRun | null>(null);
  const [starting, setStarting] = useState(false);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  // Whether the long-explanation modal is open. Every new reveal starts closed,
  // so the short explanation stays the default.
  const [detailOpen, setDetailOpen] = useState(false);
  // The aid cutscene on screen, if any. `hint` is the students' advice, shown
  // inside the card; a scene carrying text holds longer so it can be read.
  const [scene, setScene] = useState<LifelineType | null>(null);
  // What the host is saying under his window. Stays until the next event
  // replaces it, so there is always something to read.
  const [speech, setSpeech] = useState<string | null>(null);
  // What an aid actually does waits here while its cutscene plays: the board is
  // covered, so anything applied now happens where nobody can see it.
  const pendingEffect = useRef<(() => void) | null>(null);
  // Consume before running: an effect is allowed to queue the next one, which is
  // how the cards aid holds its line back until the picker is done.
  const flushPending = useCallback(() => {
    const next = pendingEffect.current;
    pendingEffect.current = null;
    next?.();
  }, []);
  const closeScene = useCallback(() => {
    setScene(null);
    flushPending();
  }, [flushPending]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState<ShowRun | null>(null);
  const [muted, setMuted] = useState(false);
  // Between-questions "host" transition card (phrase + next prize). `ms` é quanto
  // tempo o overlay fica montado e vira a duração da animação: se a animação
  // acabar antes, ele fica invisível mas continua cobrindo a tela e engolindo os
  // cliques nas alternativas.
  const [transition, setTransition] = useState<{ prize: number; phrase: string; ms: number } | null>(null);
  // Portal target readiness (fixed overlays render on document.body so no
  // ancestor transform/filter can clip them to the container).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => setMuted(isMuted()), []);
  useEffect(() => () => stopMusic(), []);

  // Pause the global lobby theme while a run is actually being played (the intro
  // screen still counts as lobby). Resume it when the run ends or we leave.
  const inGame = !!run && run.status === 'playing';
  useEffect(() => {
    setGameActive(inGame);
    return () => setGameActive(false);
  }, [inGame]);

  // While a run is live, lock the navbar (no wandering off mid-question — the
  // stage is immersive, like the real show). The class drives CSS in globals.
  // Escape closes the long-explanation modal and the board behind it stops scrolling.
  useModalDismiss(detailOpen, () => setDetailOpen(false));
  useModalDismiss(!!scene, closeScene);
  // Lines clear themselves, so the host is not left holding a stale comment.
  // Long ones stay up longer: the bubble types at ~26ms a character.
  useEffect(() => {
    if (!speech) return;
    const id = setTimeout(() => setSpeech(null), Math.min(3000 + speech.length * 60, 8000));
    return () => clearTimeout(id);
  }, [speech]);

  // The cutscene is dismissed by its own animationend. If animations are off
  // (extension, OS setting) that event never fires and the blocking overlay
  // would trap the run, so time it out a little past the animation's length.
  useEffect(() => {
    if (!scene) return;
    const id = setTimeout(closeScene, 5500);
    return () => clearTimeout(id);
  }, [scene, closeScene]);

  const playing = !!run && run.status === 'playing';
  useEffect(() => {
    document.body.classList.toggle('show-live', playing);
    return () => document.body.classList.remove('show-live');
  }, [playing]);

  // Question-theme picker (intro): all topics start selected; a strict subset
  // is sent to /start, everything else means "all".
  const [topics, setTopics] = useState<{ id: string; count: number }[]>([]);
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [years, setYears] = useState<{ id: number; count: number }[]>([]);
  const [chosenYears, setChosenYears] = useState<Set<number>>(new Set());
  const [topicsOpen, setTopicsOpen] = useState(false);
  // Settings modal: 'menu' (options list) | 'topics' (theme picker), like the profile.
  const [settingsView, setSettingsView] = useState<'menu' | 'topics' | 'years'>('menu');
  const [noLifelines, setNoLifelines] = useState(false);
  // Snapshot of the settings when the modal opened, to detect unsaved edits and
  // offer to discard them on close (X / overlay).
  const settingsSnapshot = useRef<{ topics: Set<string>; years: Set<number> } | null>(null);
  // Which exit is pending confirmation: leaving the modal, or just stepping back
  // to the options list. Both throw away the same edits, so both must ask.
  const [confirmExitSettings, setConfirmExitSettings] = useState<'close' | 'back' | null>(null);
  useEffect(() => {
    apiFetch('/api/show/topics')
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: { topics: { id: string; count: number }[]; years: { id: number; count: number }[] }) => {
        setTopics(data.topics);
        setChosen(new Set(data.topics.map((tp) => tp.id)));
        setYears(data.years);
        setChosenYears(new Set(data.years.map((y) => y.id)));
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
  const toggleYear = (id: number) => {
    setChosenYears((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const yearsFiltered = chosenYears.size > 0 && chosenYears.size < years.length;
  const topicsFiltered = chosen.size > 0 && chosen.size < topics.length;
  const settingsChanged = topicsFiltered || yearsFiltered || noLifelines;

  const openSettings = () => {
    settingsSnapshot.current = { topics: new Set(chosen), years: new Set(chosenYears) };
    setSettingsView('menu');
    setTopicsOpen(true);
  };
  // Only topic edits count as "unsaved" — the lifelines switch is applied live.
  const settingsDirty = () => {
    const s = settingsSnapshot.current;
    if (!s) return false;
    if (s.topics.size !== chosen.size) return true;
    for (const id of chosen) if (!s.topics.has(id)) return true;
    if (s.years.size !== chosenYears.size) return true;
    for (const y of chosenYears) if (!s.years.has(y)) return true;
    return false;
  };
  // X / overlay: confirm before closing if the topics were edited.
  const requestCloseSettings = () => {
    if (settingsDirty()) setConfirmExitSettings('close');
    else setTopicsOpen(false);
  };
  // Back arrow: same edits at stake, so it asks too — it just returns to the menu.
  const requestBackSettings = () => {
    if (settingsDirty()) setConfirmExitSettings('back');
    else setSettingsView('menu');
  };
  const discardSettings = () => {
    const s = settingsSnapshot.current;
    if (s) {
      setChosen(new Set(s.topics)); // lifelines switch is left as-is
      setChosenYears(new Set(s.years));
    }
    if (confirmExitSettings === 'back') setSettingsView('menu');
    else setTopicsOpen(false);
    setConfirmExitSettings(null);
  };

  // Per-question lifeline UI state (reset when the question changes).
  const [hidden, setHidden] = useState<number[]>([]);
  const [audience, setAudience] = useState<number[] | null>(null);
  // Option index the students backed, marked with a cap on the board.
  const [studentsPick, setStudentsPick] = useState<number | null>(null);
  // One answer aid per question ("skip" is exempt). Restored from the run on reload.
  const [answerAidUsed, setAnswerAidUsed] = useState(false);
  const [lifelineBusy, setLifelineBusy] = useState<LifelineType | null>(null);
  // Card lifeline (former 50:50): 4 cards, the player flips ONE. The server sends
  // the actual cut (removedIndices, 1–4 wrong options); flipping reveals & applies it.
  const [cardCut, setCardCut] = useState<number[] | null>(null); // displayed indices to remove
  const [picked, setPicked] = useState<number | null>(null); // index of the flipped card
  // Two-step answering, like the show: pick an option, then lock it in.
  const [selected, setSelected] = useState<number | null>(null);
  // Quit opens a confirmation modal (it ends the run for good).
  const [quitOpen, setQuitOpen] = useState(false);
  // Per-question countdown (server enforces the actual timeout end). The timer
  // ticks against a wall-clock deadline so it starts moving immediately instead
  // of holding the first second, and so Q1 accounts for the opening message.
  const [timeLeft, setTimeLeft] = useState(QUESTION_SECONDS);
  const questionDeadline = useRef<number | null>(null);
  // Muda a cada relógio novo (início / avanço / pular / reload). Serve de key na
  // barra: remontar faz ela nascer cheia em vez de deslizar de volta ao topo pela
  // transição de width, que só deve valer na contagem regressiva.
  const [clockRun, setClockRun] = useState(0);
  const setQuestionDeadline = (secondsLeft?: number) => {
    const seconds = secondsLeft ?? QUESTION_SECONDS;
    questionDeadline.current = Date.now() + seconds * 1000;
    // timeLeft precisa ser atualizado no mesmo update: sem isso a barra remonta
    // com o valor da pergunta anterior (baixo) e só sobe quando o tick do
    // cronômetro chega — que é justamente o deslize de encher aos poucos.
    setTimeLeft(seconds);
    setClockRun((n) => n + 1);
  };

  const resetQuestionAids = () => {
    setHidden([]);
    setAudience(null);
    setStudentsPick(null);
    setAnswerAidUsed(false);
    setSelected(null);
    setQuitOpen(false);
    setCardCut(null);
    setPicked(null);
  };

  // Resume an in-progress run after a reload.
  useEffect(() => {
    if (authLoading || !user) return;
    const savedId = typeof window !== 'undefined' ? localStorage.getItem(RUN_KEY) : null;
    if (!savedId) return;
    apiFetch(`/api/show/run/${savedId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: ShowRun) => {
        if (data.status === 'playing') {
          setQuestionDeadline(data.question?.secondsLeft);
          setRun(data);
          // Restore aids already spent on this step (eliminated options / audience
          // / students), so a reload doesn't waste a used lifeline.
          if (data.aids?.removedIndices) setHidden(data.aids.removedIndices);
          if (data.aids?.distribution) setAudience(data.aids.distribution);
          if (data.aids?.pick !== undefined) setStudentsPick(data.aids.pick);
          setAnswerAidUsed(data.answerAidUsed);
        } else localStorage.removeItem(RUN_KEY);
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
      const body: { topics?: string[]; years?: number[]; noLifelines?: boolean } = {};
      if (chosen.size > 0 && chosen.size < topics.length) body.topics = [...chosen];
      if (chosenYears.size > 0 && chosenYears.size < years.length) body.years = [...chosenYears];
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
        // Opening host message before the first question (same overlay as the
        // between-questions transition). Suspense music starts when it clears.
        const phrase = randomPhrase(t, 'show.startPhrases');
        setTransition({ prize: data.ladder[data.currentStep - 1], phrase, ms: START_TRANSITION_MS });
        window.setTimeout(() => {
          // O relógio só arranca quando a mensagem sai, senão a primeira pergunta
          // já nasce com alguns segundos gastos atrás do overlay.
          setQuestionDeadline(data.question?.secondsLeft);
          setTransition(null);
          setSpeech(randomPhrase(t, 'show.host.newQuestion'));
          startMusic();
        }, START_TRANSITION_MS);
      } else {
        setErrorMsg(data.error || t('show.errorGeneric'));
      }
    } catch {
      setErrorMsg(t('show.errorGeneric'));
    } finally {
      setStarting(false);
    }
  }, [t, chosen, topics.length, chosenYears, years.length, noLifelines]);

  // Step 1: pick an option (reversible). Step 2 (confirmAnswer) locks it in.
  const pick = (index: number) => {
    if (reveal || submitting) return;
    sfxSelect();
    setSelected((cur) => {
      const next = cur === index ? null : index;
      if (next !== null) setSpeech(randomPhrase(t, 'show.host.ask'));
      return next;
    });
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
        setSpeech(randomPhrase(t, data.correct ? 'show.host.correct' : 'show.host.wrong'));
        setSelected(null);
        setDetailOpen(false);
        setReveal({
          correct: data.correct,
          correctIndex: data.correctIndex,
          chosenIndex: index,
          explanation: data.explanation,
          explanationLong: data.explanationLong,
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

  // Game over: leave the game screen up (with the reveal) and show the result
  // modal over it. Teardown to the lobby happens only when the modal is closed.
  const finishToLobby = () => {
    setResult(null);
    setReveal(null);
    localStorage.removeItem(RUN_KEY);
    resetQuestionAids();
    setRun(null);
  };

  const proceed = () => {
    if (!reveal) return;
    setDetailOpen(false);   // otherwise the modal would pop open on the next reveal
    const next = reveal.nextRun;
    if (next.status !== 'playing') {
      if (next.status === 'won') sfxWin();
      setResult(next);
      return;
    }
    setReveal(null);
    // Between-questions transition: a host phrase + the next prize, then advance.
    const phrase = randomPhrase(t, 'show.transitionPhrases');
    setTransition({ prize: next.ladder[next.currentStep - 1], phrase, ms: STEP_TRANSITION_MS });
    window.setTimeout(() => {
      resetQuestionAids();
      setQuestionDeadline(next.question?.secondsLeft);
      setRun(next);
      setTransition(null);
      setSpeech(randomPhrase(t, 'show.host.newQuestion'));
      startMusic();
    }, STEP_TRANSITION_MS);
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
        setSpeech(randomPhrase(t, 'show.host.timeout'));
        setSelected(null);
        setDetailOpen(false);
        setReveal({
          correct: false,
          correctIndex: data.correctIndex,
          chosenIndex: -1,
          explanation: data.explanation,
          explanationLong: data.explanationLong,
          nextRun: data.run,
          timedOut: true,
        });
      }
    } catch {
      /* leave the question up; the server is the source of truth */
    } finally {
      setSubmitting(false);
    }
  }, [run, reveal, submitting, t]);

  // Per-question countdown: (re)starts on each fresh question, pauses on reveal /
  // transition, and fires the server timeout when it hits zero.
  const timerActive = playing && !reveal && !transition;
  useEffect(() => {
    if (!timerActive) return;
    // Deadline is set when the question's clock starts (start / advance / skip /
    // reload); tick against it so the count starts moving right away.
    const dl = questionDeadline.current ?? Date.now() + (run?.question?.secondsLeft ?? QUESTION_SECONDS) * 1000;
    const tick = () => setTimeLeft(Math.max(0, Math.round((dl - Date.now()) / 1000)));
    tick();
    let urged = false;
    const id = window.setInterval(() => {
      tick();
      if (!urged && dl - Date.now() <= TIMER_DANGER * 1000) {
        urged = true;
        setSpeech(randomPhrase(t, 'show.host.hurry'));
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [timerActive, run?.runId, run?.currentStep, run?.question?.secondsLeft, t]);
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
        setResult(data); // over the game screen; finishToLobby tears down on close
      } else {
        setErrorMsg((data as unknown as { error?: string }).error || t('show.errorGeneric'));
      }
    } catch {
      setErrorMsg(t('show.errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  // Give up: abandons the run entirely — nothing banked, excluded from the
  // ranking — and goes straight back to the intro.
  const quit = async () => {
    if (!run || reveal || submitting) return;
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/show/quit', {
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
    if (!run || reveal || lifelineBusy || usesLeft(run.usedLifelines, type) <= 0) return;
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
      if (type !== 'skip') setAnswerAidUsed(true);
      setScene(type);
      setRun((r) => (r ? { ...r, usedLifelines: data.usedLifelines } : r));
      // The aid lands when the cutscene lifts. For "skip" that also matters to
      // the clock: starting the new question's countdown now would burn those
      // seconds behind the overlay. The server's own timer has a 15s grace, so
      // the few seconds of drift this introduces are well inside it.
      if (type === 'fifty' && data.removedIndices) {
        const cut = data.removedIndices;
        pendingEffect.current = () => {
          setCardCut(cut);
          setPicked(null);
          // Announcing the count here would give away the flip before the player
          // makes it, so the line queues for when the picker closes.
          pendingEffect.current = () => setSpeech(t('show.host.fifty', { count: cut.length }));
        };
      } else if (type === 'audience' && data.distribution) {
        const dist = data.distribution;
        pendingEffect.current = () => {
          setAudience(dist);
          setSpeech(randomPhrase(t, 'show.host.audience'));
        };
      } else if (type === 'students' && data.pick !== undefined) {
        const pick = data.pick;
        pendingEffect.current = () => {
          setStudentsPick(pick);
          setSpeech(t('show.host.students', { letter: LETTERS[pick] }));
        };
      } else if (type === 'skip' && data.question) {
        const next = data.question;
        pendingEffect.current = () => {
          resetQuestionAids();
          setQuestionDeadline(next.secondsLeft);
          setRun((r) => (r ? { ...r, question: next, usedLifelines: data.usedLifelines } : r));
          setSpeech(randomPhrase(t, 'show.host.skip'));
        };
      }
    } catch {
      setErrorMsg(t('show.errorGeneric'));
    } finally {
      setLifelineBusy(null);
    }
  };

  const flipCard = (i: number) => {
    if (!cardCut || picked !== null) return; // only one card may be flipped
    sfxSelect();
    setPicked(i);
    setHidden(cardCut);
  };
  const closeCards = useCallback(() => {
    setCardCut(null);
    setPicked(null);
    flushPending();
  }, [flushPending]);

  // Once a card is flipped there is nothing left to decide, so the cut is held
  // on screen long enough to read and then the modal dismisses itself.
  useEffect(() => {
    if (!cardCut || picked === null) return;
    const id = setTimeout(closeCards, 3000);
    return () => clearTimeout(id);
  }, [cardCut, picked, closeCards]);

  // Escape closes it early, once a card has been flipped.
  useEffect(() => {
    if (!cardCut) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && picked !== null) closeCards();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [cardCut, picked, closeCards]);

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
        {/* Sweeping auditorium spotlights — span the whole page so the light
            reaches up under the top bar while the content stays centered. */}
        <div className="show-spotlights" aria-hidden>
          <span className="show-beam show-beam--a" />
          <span className="show-beam show-beam--b" />
          <span className="show-beam show-beam--c" />
          <span className="show-spotlight-source" />
        </div>
        <Toast message={errorMsg} type="error" onClose={() => setErrorMsg('')} />

        {mounted && createPortal(
          <button type="button" className="show-mute" onClick={toggleSound} title={muted ? t('show.soundOn') : t('show.soundOff')} aria-label={muted ? t('show.soundOn') : t('show.soundOff')}>
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>,
          document.body
        )}

        {result && (
          <ShowResultModal run={result} onClose={finishToLobby} onPlayAgain={start} />
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
                onClick={openSettings}
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
          <div className="modal-overlay" onClick={requestCloseSettings}>
            <div className="modal-content show-settings-modal" onClick={(e) => e.stopPropagation()}>
              <div className="settings-modal-head">
                {settingsView === 'topics' ? (
                  <button type="button" className="settings-back" onClick={requestBackSettings} aria-label={t('common.back')}>
                    <ArrowLeft size={18} />
                  </button>
                ) : <span />}
                <h2 className="modal-title" style={{ margin: 0, fontSize: '1.4rem' }}>
                  {settingsView === 'topics' ? t('show.topicsTitle') : t('show.settingsTitle')}
                </h2>
                <button type="button" className="settings-back" onClick={requestCloseSettings} aria-label={t('common.close')}>
                  <X size={18} />
                </button>
              </div>

              {settingsView === 'menu' && (
                <div className="settings-options">
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

                  <button type="button" className="settings-option" onClick={() => setSettingsView('topics')}>
                    <ListChecks size={18} style={{ color: 'var(--gold)' }} />
                    <span>{t('show.topicsTitle')}</span>
                    <span className="show-setting-count" style={{ marginLeft: 'auto' }}>{chosen.size}/{topics.length}</span>
                    <ChevronRight size={16} style={{ color: 'var(--text-dim)' }} />
                  </button>

                  <button type="button" className="settings-option" onClick={() => setSettingsView('years')}>
                    <CalendarDays size={18} style={{ color: 'var(--gold)' }} />
                    <span>{t('show.yearsTitle')}</span>
                    <span className="show-setting-count" style={{ marginLeft: 'auto' }}>{chosenYears.size}/{years.length}</span>
                    <ChevronRight size={16} style={{ color: 'var(--text-dim)' }} />
                  </button>
                </div>
              )}

              {settingsView === 'topics' && (
                <>
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
                  {chosen.size < topics.length && (
                    <button
                      type="button"
                      className="show-setting-selectall"
                      onClick={() => setChosen(new Set(topics.map((tp) => tp.id)))}
                    >
                      {t('show.topicsSelectAll')}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      // Done commits the current selection, so closing won't prompt.
                      settingsSnapshot.current = { topics: new Set(chosen), years: new Set(chosenYears) };
                      setSettingsView('menu');
                    }}
                    className="btn show-final-btn show-settings-done"
                  >
                    <Check size={18} /> {t('show.topicsDone')}
                  </button>
                </>
              )}

              {settingsView === 'years' && (
                <>
                  <p className="show-setting-sub">{t('show.yearsHint')}</p>
                  <div className="show-topic-chips">
                    {years.map((y) => (
                      <button
                        key={y.id}
                        type="button"
                        className={`show-topic-chip${chosenYears.has(y.id) ? ' is-on' : ''}`}
                        aria-pressed={chosenYears.has(y.id)}
                        onClick={() => toggleYear(y.id)}
                      >
                        {y.id} <small>{y.count}</small>
                      </button>
                    ))}
                  </div>
                  {chosenYears.size < years.length && (
                    <button
                      type="button"
                      className="show-setting-selectall"
                      onClick={() => setChosenYears(new Set(years.map((y) => y.id)))}
                    >
                      {t('show.yearsSelectAll')}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      settingsSnapshot.current = { topics: new Set(chosen), years: new Set(chosenYears) };
                      setSettingsView('menu');
                    }}
                    className="btn show-final-btn show-settings-done"
                  >
                    <Check size={18} /> {t('show.topicsDone')}
                  </button>
                </>
              )}
            </div>
          </div>,
          document.body
        )}

        {mounted && confirmExitSettings && createPortal(
          <div className="modal-overlay" onClick={() => setConfirmExitSettings(null)}>
            <div className="modal-content show-quit-modal" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
              <h2 className="modal-title">{t('show.discardTitle')}</h2>
              <p className="show-quit-body">{t('show.discardBody')}</p>
              <div className="show-quit-actions">
                <button onClick={() => setConfirmExitSettings(null)} className="btn btn-secondary">
                  {t('show.discardCancel')}
                </button>
                <button onClick={discardSettings} className="btn show-quit-confirm">
                  {t('show.discardConfirm')}
                </button>
              </div>
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

      {result && (
        <ShowResultModal run={result} onClose={finishToLobby} onPlayAgain={start} />
      )}

      {/* Between-questions host transition (portaled: true full-screen) */}
      {mounted && transition && createPortal(
        <div className="show-transition" style={{ '--trans-dur': `${transition.ms}ms` } as React.CSSProperties}>
          <div className="show-transition-inner">
            {transition.phrase && <p className="show-transition-phrase">{transition.phrase}</p>}
            <p className="show-transition-prize">
              {t('show.worthLabel')} <strong>{formatPrize(transition.prize)}</strong>
            </p>
          </div>
        </div>,
        document.body
      )}

      {mounted && cardCut && createPortal(
        <div className="show-cards-overlay" role="dialog" aria-modal="true" aria-label={t('show.cards.title')}>
          <div className="show-cards-box">
            <h3 className="show-cards-title">{t('show.cards.title')}</h3>
            <p className="show-cards-hint" aria-live="polite">
              {picked !== null ? t('show.cards.done', { count: cardCut.length }) : t('show.cards.flip')}
            </p>
            <div className="show-cards-row">
              {[0, 1, 2, 3].map((i) => {
                const isPicked = picked === i;
                const suit = CARD_SUITS[i % CARD_SUITS.length];
                const red = suit === '♥' || suit === '♦';
                // Reveal only the chosen card; the rest stay face-down (one flip only).
                return (
                  <button
                    key={i}
                    type="button"
                    className={`show-card${isPicked ? ' is-flipped' : ''}${red ? ' is-red' : ''}${picked !== null && !isPicked ? ' is-dimmed' : ''}`}
                    onClick={() => flipCard(i)}
                    disabled={picked !== null}
                    aria-label={t('show.cards.flipOne')}
                    autoFocus={i === 0}
                  >
                    <span className="show-card-inner">
                      <span className="show-card-face show-card-back" aria-hidden="true" />
                      <span className="show-card-face show-card-front">
                        <span className="show-card-corner show-card-corner--tl">
                          <b>{cardCut.length}</b><span className="show-card-suit">{suit}</span>
                        </span>
                        <span className="show-card-center">
                          <Scissors size={20} aria-hidden="true" />
                          <em>−{cardCut.length}</em>
                        </span>
                        <span className="show-card-corner show-card-corner--br">
                          <b>{cardCut.length}</b><span className="show-card-suit">{suit}</span>
                        </span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}

      <div className="show-layout">
        <ShowHost
          speech={speech}
          mood={
            reveal ? (reveal.correct ? 'correct' : 'wrong')
              : timeLeft <= TIMER_DANGER ? 'scared'
              : timeLeft <= TIMER_WARN ? 'tense'
              : 'idle'
          }
        />

        {/* Question + options */}
        <div className="show-main">
          <div className="show-qmeta">
            <span className="show-step">{t('show.stepOf', { step: q.step, total: q.totalSteps })}</span>
            <span className="show-area">{q.topic}</span>
            {q.source && <span className="show-source">POSCOMP {q.source.year}</span>}
          </div>

          {(() => {
            const pct = (timeLeft / QUESTION_SECONDS) * 100;
            const level = timeLeft <= TIMER_DANGER ? 'danger' : timeLeft <= TIMER_WARN ? 'warn' : 'ok';
            return (
              <div className={`show-timer show-timer--${level}`} role="timer" aria-label={t('show.timeLeft')}>
                <div className="show-timer-track">
                  <div
                    key={`${clockRun}-${reveal ? 'reveal' : 'run'}`}
                    className="show-timer-fill"
                    style={{ width: `${reveal ? 100 : pct}%` }}
                  />
                </div>
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
                  {studentsPick === i && !reveal && (
                    <span className="show-option-students" title={t('show.lifeline.students')}>
                      <GraduationCap size={18} />
                    </span>
                  )}
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

          {reveal ? (
            <div className={`show-reveal ${reveal.correct ? 'is-correct' : 'is-wrong'}`}>
              <p className="show-reveal-verdict">
                {reveal.timedOut ? t('show.timeUp') : reveal.correct ? t('show.correct') : t('show.wrong')}
              </p>
              <p className="show-explanation">{reveal.explanation}</p>
              {reveal.explanationLong && (
                <div className="show-detail">
                  <button
                    type="button"
                    className="show-detail-toggle"
                    onClick={() => setDetailOpen(true)}
                  >
                    <BookOpen size={16} />
                    <span>{t('show.seeDetail')}</span>
                  </button>
                </div>
              )}
              <button onClick={proceed} className="btn show-continue-btn">
                {reveal.nextRun.status === 'playing' ? t('show.continue') : t('show.seeResult')}
              </button>
            </div>
          ) : (
            <div className="show-actions">
              {LIFELINES.some(({ type }) => usesLeft(run.usedLifelines, type) > 0) && (
              <div className="show-lifelines">
                {LIFELINES.map(({ type, icon: Icon }) => {
                  const left = usesLeft(run.usedLifelines, type);
                  // Struck through when the run is out of them; merely disabled
                  // when this question's answer aid is spent — skipping is still
                  // allowed, it moves on rather than helping with this question.
                  const used = left <= 0;
                  const blocked = answerAidUsed && type !== 'skip';
                  return (
                    <button
                      key={type}
                      className={`show-lifeline show-lifeline--${type} ${used ? 'is-used' : ''}`}
                      disabled={used || blocked || !!lifelineBusy}
                      onClick={() => spendLifeline(type)}
                      title={t(`show.lifeline.${type}`)}
                    >
                      <Icon size={18} />
                      <span>{t(`show.lifeline.${type}`)}</span>
                      {LIFELINE_USES[type] > 1 && <span className="show-lifeline-count">{left}</span>}
                    </button>
                  );
                })}
              </div>
              )}
              {/* Stopping lives under the ladder — the prize it names is the
                  one the ladder is showing. Quitting stays here, quiet. */}
              <button
                onClick={() => setQuitOpen(true)}
                disabled={submitting}
                className="show-quit-btn"
              >
                <Flag size={15} /> {t('show.quit')}
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
          {!reveal && (
            <button onClick={stop} disabled={submitting || run.currentStep === 1} className="btn btn-secondary show-stop-btn">
              <HandCoins size={16} />
              <span>{t('show.stopLabel')}</span>
              <strong>{formatPrize(run.securedPrize)}</strong>
            </button>
          )}
        </aside>
      </div>

      {/* Aid cutscene: the art sweeps in from the right, holds, and carries on
          out to the left. Nothing to click — clearing the state when the
          animation ends is what lets the aid's own flow continue. */}
      {mounted && scene && createPortal(
        <div className="show-scene-overlay" aria-hidden="true">
          <div className={`show-scene-card is-${scene}`} onAnimationEnd={closeScene}>
            <ShowLifelineScene type={scene} />
          </div>
        </div>,
        document.body,
      )}

      {mounted && detailOpen && reveal?.explanationLong && createPortal(
        <div className="modal-overlay" onClick={() => setDetailOpen(false)}>
          <div
            className="modal-content show-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="show-detail-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal-title" id="show-detail-title">
              <BookOpen size={20} /> {t('show.detailTitle')}
            </h2>
            <div className="show-detail-text">{reveal.explanationLong}</div>
            <button onClick={() => setDetailOpen(false)} className="btn btn-secondary show-detail-close" autoFocus>
              {t('common.close')}
            </button>
          </div>
        </div>,
        document.body,
      )}

      {mounted && quitOpen && createPortal(
        <div className="modal-overlay" onClick={() => setQuitOpen(false)}>
          <div className="modal-content show-quit-modal" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title"><Flag size={20} /> {t('show.quitTitle')}</h2>
            <p className="show-quit-body">{t('show.quitBody')}</p>
            <div className="show-quit-actions">
              <button onClick={() => setQuitOpen(false)} disabled={submitting} className="btn btn-secondary">
                {t('show.quitCancel')}
              </button>
              <button onClick={quit} disabled={submitting} className="btn show-quit-confirm">
                <Flag size={15} /> {t('show.quitConfirm')}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

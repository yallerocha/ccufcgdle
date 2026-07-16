'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/client/context/AuthContext';
import { getLocalDateString } from '@/shared/utils';
import { HelpCircle, Info, Trophy, Delete, CornerDownLeft } from 'lucide-react';
import { BackLink } from '@/client/components/BackLink';
import { LoadingState } from '@/client/components/LoadingState';
import { Toast } from '@/client/components/Toast';
import { TermoResultModal } from '@/client/components/TermoResultModal';
import type { StreakInfo } from '@/client/components/StreakBadge';
import { apiFetch } from '@/client/lib/api';
import { Logo } from '@/client/components/Logo';
import { GameStreakButton } from '@/client/components/GameStreakButton';

type LetterResult = 'correct' | 'present' | 'absent';
type Status = 'playing' | 'won' | 'lost';

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'],
];

// Priority used to color a key by the best result seen for that letter so far.
const RESULT_RANK: Record<LetterResult, number> = { absent: 0, present: 1, correct: 2 };

export default function TermoPage() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();

  const [wordLength, setWordLength] = useState(5);
  const [maxAttempts, setMaxAttempts] = useState(6);
  const [dailyKey, setDailyKey] = useState<number | null>(null);

  const [guesses, setGuesses] = useState<string[]>([]);
  // Accented form of each submitted guess (accents are auto-filled, Termo-style).
  const [displays, setDisplays] = useState<string[]>([]);
  const [results, setResults] = useState<LetterResult[][]>([]);
  // The active row, one slot per cell, so the player can type into any position
  // they click. `cursor` is the cell the next typed letter goes into.
  const [cells, setCells] = useState<string[]>([]);
  const [cursor, setCursor] = useState(0);
  const [status, setStatus] = useState<Status>('playing');
  const [revealed, setRevealed] = useState('');
  const [streak, setStreak] = useState<StreakInfo | null>(null);
  const [showResult, setShowResult] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invalidRow, setInvalidRow] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showRules, setShowRules] = useState(false);

  const todayStr = getLocalDateString();
  const storageKey = `termo-game-state-${todayStr}-${user?.id ?? 'anon'}`;

  // Synchronous guard against double submits, plus the last word we auto-tried so
  // an invalid word (which stays on the row) is not re-submitted in a loop.
  const submittingRef = useRef(false);
  const lastTriedRef = useRef('');

  const blankRow = useCallback(() => Array.from({ length: wordLength }, () => ''), [wordLength]);
  const currentWord = cells.join('');
  const rowComplete = cells.length === wordLength && cells.every((c) => c !== '');

  // Load settings + restore this account's board (discarding it if an admin reset
  // the round, detected via a changed daily key).
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const res = await apiFetch('/api/termo/daily');
        const data = await res.json();
        if (cancelled) return;

        const currentDailyKey: number | null = data.dailyKey ?? null;
        setWordLength(data.wordLength ?? 5);
        setMaxAttempts(data.maxAttempts ?? 6);
        setDailyKey(currentDailyKey);

        const savedStr = localStorage.getItem(storageKey);
        let restored = false;
        if (savedStr) {
          const saved = JSON.parse(savedStr);
          const roundWasReset =
            saved.dailyKey != null && currentDailyKey != null && saved.dailyKey !== currentDailyKey;
          if (roundWasReset) {
            localStorage.removeItem(storageKey);
          } else {
            const savedStatus: Status = saved.status || 'playing';
            setGuesses(saved.guesses || []);
            setDisplays(saved.displays || saved.guesses || []);
            setResults(saved.results || []);
            setStatus(savedStatus);
            setRevealed(saved.revealed || '');
            setStreak(saved.streak ?? null);
            setShowResult(savedStatus !== 'playing'); // reopen result if finished
            restored = true;
          }
        }
        if (!restored) {
          setGuesses([]);
          setDisplays([]);
          setResults([]);
          setStatus('playing');
          setRevealed('');
          setStreak(null);
          setShowResult(false);
        }
        setCells(Array.from({ length: data.wordLength ?? 5 }, () => ''));
        setCursor(0);
      } catch (err) {
        console.error('Error loading termo:', err);
        if (!cancelled) setErrorMsg(t('termo.error'));
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

  const persist = useCallback(
    (next: { guesses: string[]; displays: string[]; results: LetterResult[][]; status: Status; revealed: string; streak: StreakInfo | null }) => {
      localStorage.setItem(storageKey, JSON.stringify({ ...next, dailyKey }));
    },
    [storageKey, dailyKey]
  );

  const submitGuess = useCallback(async () => {
    if (status !== 'playing' || submittingRef.current) return;
    // The row auto-submits once all cells are filled, so an incomplete row is
    // simply not ready yet — no error, just wait for more letters.
    const word = cells.join('');
    if (cells.length !== wordLength || cells.some((c) => c === '')) return;

    // Remember this exact attempt so a rejected (invalid) word, which stays on the
    // row, is not auto-resubmitted until the player edits it.
    lastTriedRef.current = word;
    submittingRef.current = true;
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await apiFetch('/api/termo/guess', {
        method: 'POST',
        body: JSON.stringify({ guess: word, attemptNumber: guesses.length + 1 }),
      });
      const data = await res.json();

      if (!res.ok) {
        // Word not in list — flag the row, keep the letters so the player edits.
        setInvalidRow(true);
        setErrorMsg(data.error || t('termo.notInList'));
        setTimeout(() => setInvalidRow(false), 450);
        setSubmitting(false);
        submittingRef.current = false;
        return;
      }

      const newGuesses = [...guesses, word];
      // Auto-filled accented form of the guess (falls back to typed letters).
      const newDisplays = [...displays, (data.display as string) || word];
      const newResults = [...results, data.results as LetterResult[]];
      let newStatus: Status = 'playing';
      if (data.solved) newStatus = 'won';
      else if (newGuesses.length >= maxAttempts) newStatus = 'lost';

      const newRevealed = data.revealed || (newStatus !== 'playing' ? revealed : '');
      const newStreak: StreakInfo | null = data.streak ?? streak;

      setGuesses(newGuesses);
      setDisplays(newDisplays);
      setResults(newResults);
      setStatus(newStatus);
      setRevealed(newRevealed);
      setStreak(newStreak);
      setCells(blankRow());
      setCursor(0);
      if (newStatus !== 'playing') {
        // Let the final row's colors register before the modal covers the board.
        setTimeout(() => setShowResult(true), 900);
      }
      persist({ guesses: newGuesses, displays: newDisplays, results: newResults, status: newStatus, revealed: newRevealed, streak: newStreak });
    } catch (err) {
      console.error('Error submitting termo guess:', err);
      setErrorMsg(t('termo.error'));
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  }, [status, cells, wordLength, guesses, displays, results, maxAttempts, revealed, streak, persist, blankRow, t]);

  // Auto-validate a completed row: once every cell is filled, submit it and
  // advance to the next line — no Enter needed. The lastTriedRef guard keeps an
  // invalid word (which stays on the row) from being resubmitted in a loop.
  useEffect(() => {
    if (status !== 'playing') return;
    if (rowComplete && currentWord !== lastTriedRef.current) {
      submitGuess();
    }
  }, [rowComplete, currentWord, status, submitGuess]);

  const handleKey = useCallback(
    (key: string) => {
      if (status !== 'playing' || submitting) return;
      if (key === 'ENTER') {
        submitGuess();
      } else if (key === 'BACKSPACE') {
        const next = [...cells];
        // If the cursor cell has a letter, clear it; otherwise step left and
        // clear the previous cell.
        if (next[cursor]) {
          next[cursor] = '';
          setCells(next);
        } else if (cursor > 0) {
          next[cursor - 1] = '';
          setCells(next);
          setCursor(cursor - 1);
        }
      } else if (/^[A-Z]$/.test(key)) {
        if (cursor >= wordLength) return;
        const next = [...cells];
        next[cursor] = key;
        setCells(next);
        // Advance to the next empty cell to the right (so clicked gaps fill in
        // order); if none, step one to the right.
        let nextPos = next.findIndex((c, i) => i > cursor && c === '');
        if (nextPos === -1) nextPos = Math.min(cursor + 1, wordLength);
        setCursor(nextPos);
      }
    },
    [status, submitting, submitGuess, wordLength, cursor, cells]
  );

  // Physical keyboard support.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Enter') handleKey('ENTER');
      else if (e.key === 'Backspace') handleKey('BACKSPACE');
      else {
        const k = e.key.toUpperCase();
        if (/^[A-Z]$/.test(k)) handleKey(k);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleKey]);

  // Best result seen per letter, for keyboard coloring.
  const keyStates: Record<string, LetterResult> = {};
  guesses.forEach((g, r) => {
    const rowResult = results[r];
    if (!rowResult) return;
    for (let c = 0; c < g.length; c++) {
      const letter = g[c];
      const result = rowResult[c];
      if (!keyStates[letter] || RESULT_RANK[result] > RESULT_RANK[keyStates[letter]]) {
        keyStates[letter] = result;
      }
    }
  });

  if (loading) {
    return <LoadingState message={t('termo.loading')} minHeight="60vh" />;
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <BackLink href="/" label={t('nav.backToHub')} style={{ margin: '2rem 0 0.5rem 0' }} />

      <section className="hero" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Logo alt="LSD Logo" style={{ width: '160px', maxWidth: '100%', marginBottom: '0.75rem' }} />
        <h1 className="lsd-gradient-text">TERMO</h1>
        <p>{t('termo.tagline')}</p>
        <div className="hero-actions">
          <button
            onClick={() => setShowRules(!showRules)}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
          >
            <HelpCircle size={16} />
            {showRules ? t('termo.hideRules') : t('termo.showRules')}
          </button>

          <GameStreakButton streakEndpoint="/api/termo/streak" refreshKey={status} />

          <Link
            href="/termo/ranking"
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', textDecoration: 'none' }}
          >
            <Trophy size={16} style={{ color: 'var(--color-partial)' }} />
            {t('termo.viewRanking')}
          </Link>
        </div>
      </section>

      {showRules && (
        <div className="quick-rules fade-in">
          <h3><Info size={18} style={{ color: 'var(--primary)' }} /> {t('termo.rulesTitle')}</h3>
          <ul>
            <li>{t('termo.rules.l1')}</li>
            <li>{t('termo.rules.l2')}</li>
            <li>
              <span className="badge" style={{ backgroundColor: 'var(--color-correct)', color: 'white', border: 'none' }}>{t('termo.rules.greenBadge')}</span> : {t('termo.rules.green')}
            </li>
            <li>
              <span className="badge" style={{ backgroundColor: 'var(--color-partial)', color: 'white', border: 'none' }}>{t('termo.rules.yellowBadge')}</span> : {t('termo.rules.yellow')}
            </li>
            <li>
              <span className="badge" style={{ backgroundColor: 'var(--color-incorrect)', color: 'var(--text-muted)', border: 'none' }}>{t('termo.rules.grayBadge')}</span> : {t('termo.rules.gray')}
            </li>
            <li>{t('termo.rules.accents')}</li>
            <li>{t('termo.rules.saved')}</li>
          </ul>
        </div>
      )}

      {/* Board — --termo-cols lets the CSS shrink cells for longer words */}
      <div className="termo-board fade-in" style={{ '--termo-cols': wordLength } as React.CSSProperties}>
        {Array.from({ length: maxAttempts }).map((_, r) => {
          const isCurrentRow = r === guesses.length && status === 'playing';
          const submitted = r < guesses.length;
          return (
            <div className="termo-row" key={r}>
              {Array.from({ length: wordLength }).map((__, c) => {
                let letter = '';
                let stateClass = '';
                if (submitted) {
                  letter = (displays[r] ?? guesses[r])[c] ?? '';
                  stateClass = results[r]?.[c] ?? '';
                } else if (isCurrentRow) {
                  letter = cells[c] ?? '';
                  if (letter) stateClass = 'filled';
                }
                const invalidClass = isCurrentRow && invalidRow ? 'invalid' : '';
                const cursorClass = isCurrentRow && c === cursor ? 'cursor' : '';
                return (
                  <div
                    className={`termo-cell ${stateClass} ${invalidClass} ${cursorClass}`}
                    key={c}
                    onClick={isCurrentRow ? () => setCursor(c) : undefined}
                    style={isCurrentRow ? { cursor: 'pointer' } : undefined}
                  >
                    {letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Accent reminder, visible without opening the rules */}
      {status === 'playing' && (
        <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-dim)', margin: '0 auto 1rem auto', maxWidth: '420px' }}>
          {t('termo.rules.accents')}
        </p>
      )}

      {/* Reopen the result modal once the game is over */}
      {status !== 'playing' && (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
          <button
            onClick={() => setShowResult(true)}
            className="btn"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
          >
            <Trophy size={16} style={{ color: 'var(--color-partial)' }} />
            {t('termo.viewResult')}
          </button>
        </div>
      )}

      {/* On-screen keyboard */}
      <div className="termo-keyboard">
        {KEYBOARD_ROWS.map((row, i) => (
          <div className="termo-keyboard-row" key={i}>
            {row.map((key) => {
              const isAction = key === 'ENTER' || key === 'BACKSPACE';
              const state = !isAction ? keyStates[key] ?? '' : '';
              return (
                <button
                  key={key}
                  className={`termo-key ${isAction ? 'termo-key-wide' : ''} ${state}`}
                  onClick={() => handleKey(key)}
                  disabled={status !== 'playing' || submitting}
                  aria-label={key === 'BACKSPACE' ? t('termo.backspace') : key === 'ENTER' ? t('termo.enter') : key}
                >
                  {key === 'ENTER' ? <CornerDownLeft size={18} /> : key === 'BACKSPACE' ? <Delete size={18} /> : key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <TermoResultModal
        show={showResult && status !== 'playing'}
        won={status === 'won'}
        word={revealed}
        attempts={guesses.length}
        maxAttempts={maxAttempts}
        streak={streak}
        todayStr={todayStr}
        onClose={() => setShowResult(false)}
      />

      <Toast message={errorMsg} type="error" onClose={() => setErrorMsg('')} />
    </div>
  );
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/client/context/AuthContext';
import { getLocalDateString } from '@/shared/utils';
import { HelpCircle, Info, Trophy, Delete, CornerDownLeft, ArrowLeft } from 'lucide-react';
import { Toast } from '@/client/components/Toast';
import { apiFetch } from '@/client/lib/api';

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
  const [results, setResults] = useState<LetterResult[][]>([]);
  const [current, setCurrent] = useState('');
  const [status, setStatus] = useState<Status>('playing');
  const [revealed, setRevealed] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invalidRow, setInvalidRow] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showRules, setShowRules] = useState(false);

  const todayStr = getLocalDateString();
  const storageKey = `termo-game-state-${todayStr}-${user?.id ?? 'anon'}`;

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
            setGuesses(saved.guesses || []);
            setResults(saved.results || []);
            setStatus(saved.status || 'playing');
            setRevealed(saved.revealed || '');
            restored = true;
          }
        }
        if (!restored) {
          setGuesses([]);
          setResults([]);
          setStatus('playing');
          setRevealed('');
        }
        setCurrent('');
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
    (next: { guesses: string[]; results: LetterResult[][]; status: Status; revealed: string }) => {
      localStorage.setItem(storageKey, JSON.stringify({ ...next, dailyKey }));
    },
    [storageKey, dailyKey]
  );

  const submitGuess = useCallback(async () => {
    if (status !== 'playing' || submitting) return;
    if (current.length !== wordLength) {
      setInvalidRow(true);
      setErrorMsg(t('termo.tooShort'));
      setTimeout(() => setInvalidRow(false), 450);
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await apiFetch('/api/termo/guess', {
        method: 'POST',
        body: JSON.stringify({ guess: current, attemptNumber: guesses.length + 1 }),
      });
      const data = await res.json();

      if (!res.ok) {
        // Word not in list / too short — flag the row, keep the letters.
        setInvalidRow(true);
        setErrorMsg(data.error || t('termo.notInList'));
        setTimeout(() => setInvalidRow(false), 450);
        setSubmitting(false);
        return;
      }

      const newGuesses = [...guesses, current];
      const newResults = [...results, data.results as LetterResult[]];
      let newStatus: Status = 'playing';
      if (data.solved) newStatus = 'won';
      else if (newGuesses.length >= maxAttempts) newStatus = 'lost';

      const newRevealed = data.revealed || (newStatus !== 'playing' ? revealed : '');

      setGuesses(newGuesses);
      setResults(newResults);
      setStatus(newStatus);
      setRevealed(newRevealed);
      setCurrent('');
      persist({ guesses: newGuesses, results: newResults, status: newStatus, revealed: newRevealed });
    } catch (err) {
      console.error('Error submitting termo guess:', err);
      setErrorMsg(t('termo.error'));
    } finally {
      setSubmitting(false);
    }
  }, [status, submitting, current, wordLength, guesses, results, maxAttempts, revealed, persist, t]);

  const handleKey = useCallback(
    (key: string) => {
      if (status !== 'playing' || submitting) return;
      if (key === 'ENTER') {
        submitGuess();
      } else if (key === 'BACKSPACE') {
        setCurrent((c) => c.slice(0, -1));
      } else if (/^[A-Z]$/.test(key)) {
        setCurrent((c) => (c.length < wordLength ? c + key : c));
      }
    },
    [status, submitting, submitGuess, wordLength]
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
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ width: '50px', height: '50px', border: '5px solid var(--border-color)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '1.5rem', color: 'var(--text-muted)' }}>{t('termo.loading')}</p>
        <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ margin: '2rem 0 0.5rem 0' }}>
        <Link
          href="/"
          className="btn btn-secondary"
          style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', textDecoration: 'none' }}
        >
          <ArrowLeft size={16} /> {t('nav.backToHub')}
        </Link>
      </div>

      <section className="hero" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img src="/logo.png" alt="LSD Logo" style={{ width: '160px', maxWidth: '100%', marginBottom: '1rem' }} />
        <h1 className="lsd-gradient-text" style={{ paddingBottom: '0.2rem' }}>TERMO</h1>
        <p>{t('termo.tagline')}</p>
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <button
            onClick={() => setShowRules(!showRules)}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
          >
            <HelpCircle size={16} />
            {showRules ? t('termo.hideRules') : t('termo.showRules')}
          </button>

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

      {/* Board */}
      <div className="termo-board fade-in">
        {Array.from({ length: maxAttempts }).map((_, r) => {
          const isCurrentRow = r === guesses.length && status === 'playing';
          const submitted = r < guesses.length;
          return (
            <div className={`termo-row ${isCurrentRow && invalidRow ? '' : ''}`} key={r}>
              {Array.from({ length: wordLength }).map((__, c) => {
                let letter = '';
                let stateClass = '';
                if (submitted) {
                  letter = guesses[r][c] ?? '';
                  stateClass = results[r]?.[c] ?? '';
                } else if (isCurrentRow) {
                  letter = current[c] ?? '';
                  if (letter) stateClass = 'filled';
                }
                const invalidClass = isCurrentRow && invalidRow ? 'invalid' : '';
                return (
                  <div className={`termo-cell ${stateClass} ${invalidClass}`} key={c}>
                    {letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* End-of-game message */}
      {status === 'won' && (
        <p style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-correct)' }}>
          {t('termo.won')}
        </p>
      )}
      {status === 'lost' && (
        <p style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.1rem' }}>
          {t('termo.lostPre')} <span className="lsd-gradient-text">{revealed}</span>
        </p>
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

      <Toast message={errorMsg} type="error" onClose={() => setErrorMsg('')} />
    </div>
  );
}

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/client/context/AuthContext';
import { getLocalDateString } from '@/shared/utils';
import { HelpCircle, Info, Trophy } from 'lucide-react';
import { BackLink } from '@/client/components/BackLink';
import { LoadingState } from '@/client/components/LoadingState';
import { Toast } from '@/client/components/Toast';
import { ForcaResultModal } from '@/client/components/ForcaResultModal';
import type { StreakInfo } from '@/client/components/StreakBadge';
import { apiFetch } from '@/client/lib/api';

type Status = 'playing' | 'won' | 'lost';

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

// Progressive hangman drawing: each part appears as wrong guesses accumulate.
// When there is a daily person, their photo fills the head once it is drawn.
function Gallows({ wrong, photo }: { wrong: number; photo: string | null }) {
  const stroke = 'var(--text-primary)';
  const part = (show: boolean) => (show ? stroke : 'transparent');
  const headDrawn = wrong >= 1;
  return (
    <svg viewBox="0 0 120 140" width="160" height="186" style={{ maxWidth: '100%' }} aria-hidden>
      <defs>
        <clipPath id="forca-head-clip">
          <circle cx="85" cy="37" r="12" />
        </clipPath>
      </defs>
      {/* gallows */}
      <line x1="10" y1="135" x2="80" y2="135" stroke={stroke} strokeWidth="3" />
      <line x1="30" y1="135" x2="30" y2="10" stroke={stroke} strokeWidth="3" />
      <line x1="30" y1="10" x2="85" y2="10" stroke={stroke} strokeWidth="3" />
      <line x1="85" y1="10" x2="85" y2="25" stroke={stroke} strokeWidth="3" />
      {/* head — photo of the daily person once drawn, else a plain circle */}
      {headDrawn && photo && (
        <image
          href={photo}
          x="73"
          y="25"
          width="24"
          height="24"
          clipPath="url(#forca-head-clip)"
          preserveAspectRatio="xMidYMid slice"
        />
      )}
      <circle cx="85" cy="37" r="12" stroke={part(headDrawn)} strokeWidth="3" fill="none" />
      {/* torso */}
      <line x1="85" y1="49" x2="85" y2="90" stroke={part(wrong >= 2)} strokeWidth="3" />
      {/* arms */}
      <line x1="85" y1="60" x2="70" y2="78" stroke={part(wrong >= 3)} strokeWidth="3" />
      <line x1="85" y1="60" x2="100" y2="78" stroke={part(wrong >= 4)} strokeWidth="3" />
      {/* legs */}
      <line x1="85" y1="90" x2="72" y2="112" stroke={part(wrong >= 5)} strokeWidth="3" />
      <line x1="85" y1="90" x2="98" y2="112" stroke={part(wrong >= 6)} strokeWidth="3" />
    </svg>
  );
}

export default function ForcaPage() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();

  const [wordLength, setWordLength] = useState(0);
  const [maxWrong, setMaxWrong] = useState(6);
  const [dailyKey, setDailyKey] = useState<number | null>(null);
  const [personName, setPersonName] = useState<string | null>(null);
  const [personPhoto, setPersonPhoto] = useState<string | null>(null);

  // Letter shown at each position (null = still blank).
  const [revealedLetters, setRevealedLetters] = useState<(string | null)[]>([]);
  const [guessed, setGuessed] = useState<string[]>([]);
  const [wrong, setWrong] = useState(0);
  const [status, setStatus] = useState<Status>('playing');
  const [revealed, setRevealed] = useState('');
  const [streak, setStreak] = useState<StreakInfo | null>(null);
  const [showResult, setShowResult] = useState(false);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [showRules, setShowRules] = useState(false);

  const submittingRef = useRef(false);
  const todayStr = getLocalDateString();
  const storageKey = `forca-game-state-${todayStr}-${user?.id ?? 'anon'}`;

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const res = await apiFetch('/api/forca/daily');
        const data = await res.json();
        if (cancelled) return;

        const currentDailyKey: number | null = data.dailyKey ?? null;
        const wl: number = data.wordLength ?? 0;
        setWordLength(wl);
        setMaxWrong(data.maxWrong ?? 6);
        setDailyKey(currentDailyKey);
        setPersonName(data.personName ?? null);
        setPersonPhoto(data.personPhoto ?? null);

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
            setRevealedLetters(saved.revealedLetters || Array.from({ length: wl }, () => null));
            setGuessed(saved.guessed || []);
            setWrong(saved.wrong || 0);
            setStatus(savedStatus);
            setRevealed(saved.revealed || '');
            setStreak(saved.streak ?? null);
            setShowResult(savedStatus !== 'playing');
            restored = true;
          }
        }
        if (!restored) {
          setRevealedLetters(Array.from({ length: wl }, () => null));
          setGuessed([]);
          setWrong(0);
          setStatus('playing');
          setRevealed('');
          setStreak(null);
          setShowResult(false);
        }
      } catch (err) {
        console.error('Error loading forca:', err);
        if (!cancelled) setErrorMsg(t('forca.error'));
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

  const guessLetter = useCallback(
    async (letter: string) => {
      if (status !== 'playing' || submittingRef.current) return;
      if (guessed.includes(letter)) return;
      submittingRef.current = true;
      setErrorMsg('');
      try {
        const res = await apiFetch('/api/forca/guess', {
          method: 'POST',
          body: JSON.stringify({ letter, guessed: guessed.join('') }),
        });
        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || t('forca.error'));
          submittingRef.current = false;
          return;
        }

        const newRevealed = [...revealedLetters];
        (data.positions as number[]).forEach((i) => {
          newRevealed[i] = letter;
        });
        const newGuessed = data.guessed
          ? (data.guessed as string).split('')
          : [...new Set([...guessed, letter])];
        const newWrong: number = data.wrong ?? wrong;
        let newStatus: Status = 'playing';
        if (data.solved) newStatus = 'won';
        else if (data.lost) newStatus = 'lost';
        const newRevealedWord = data.revealed || (newStatus !== 'playing' ? revealed : '');
        const newStreak: StreakInfo | null = data.streak ?? streak;

        setRevealedLetters(newRevealed);
        setGuessed(newGuessed);
        setWrong(newWrong);
        setStatus(newStatus);
        setRevealed(newRevealedWord);
        setStreak(newStreak);
        if (newStatus !== 'playing') {
          setTimeout(() => setShowResult(true), 700);
        }
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            revealedLetters: newRevealed,
            guessed: newGuessed,
            wrong: newWrong,
            status: newStatus,
            revealed: newRevealedWord,
            streak: newStreak,
            dailyKey,
          })
        );
      } catch (err) {
        console.error('Error guessing forca letter:', err);
        setErrorMsg(t('forca.error'));
      } finally {
        submittingRef.current = false;
      }
    },
    [status, guessed, revealedLetters, wrong, revealed, streak, storageKey, dailyKey, t]
  );

  // Physical keyboard support.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toUpperCase();
      if (/^[A-Z]$/.test(k)) guessLetter(k);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [guessLetter]);

  if (loading) {
    return <LoadingState message={t('forca.loading')} minHeight="60vh" />;
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <BackLink href="/" label={t('nav.backToHub')} style={{ margin: '2rem 0 0.5rem 0' }} />

      <section className="hero" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img src="/logo.png" alt="LSD Logo" style={{ width: '160px', maxWidth: '100%', marginBottom: '1rem' }} />
        <p>{t('forca.tagline')}</p>
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <button onClick={() => setShowRules(!showRules)} className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
            <HelpCircle size={16} />
            {showRules ? t('forca.hideRules') : t('forca.showRules')}
          </button>
          <Link href="/forca/ranking" className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', textDecoration: 'none' }}>
            <Trophy size={16} style={{ color: 'var(--color-partial)' }} />
            {t('forca.viewRanking')}
          </Link>
        </div>
      </section>

      {showRules && (
        <div className="quick-rules fade-in">
          <h3><Info size={18} style={{ color: 'var(--primary)' }} /> {t('forca.rulesTitle')}</h3>
          <ul>
            <li>{t('forca.rules.l1')}</li>
            <li>{t('forca.rules.l2')}</li>
            <li>{t('forca.rules.l3')}</li>
            <li>{t('forca.rules.accents')}</li>
            <li>{t('forca.rules.saved')}</li>
          </ul>
        </div>
      )}

      {personName && (
        <p className="forca-save">
          {t('forca.savePersonPre')} <strong style={{ color: 'var(--primary)' }}>{personName}</strong>{t('forca.savePersonPost')}
        </p>
      )}

      <div className="forca-stage fade-in">
        <Gallows wrong={wrong} photo={personPhoto} />
        <p className="forca-wrong">
          {t('forca.wrongCount', { wrong, max: maxWrong })}
        </p>
      </div>

      {/* The word as blanks / revealed letters */}
      <div className="forca-word">
        {Array.from({ length: wordLength }).map((_, i) => {
          const playerLetter = revealedLetters[i];
          // When the game is over, reveal the full (accented) word; mark letters
          // the player never guessed in red on a loss.
          const finalChar = status !== 'playing' && revealed ? revealed[i] : playerLetter;
          const missed = status === 'lost' && !playerLetter;
          return (
            <span key={i} className={`forca-letter ${missed ? 'missed' : ''}`}>
              {finalChar ?? ''}
            </span>
          );
        })}
      </div>

      {status !== 'playing' && (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '1.5rem auto 0 auto' }}>
          <button onClick={() => setShowResult(true)} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
            <Trophy size={16} style={{ color: 'var(--color-partial)' }} />
            {t('forca.viewResult')}
          </button>
        </div>
      )}

      {/* On-screen keyboard */}
      <div className="termo-keyboard" style={{ marginTop: '1.5rem' }}>
        {KEYBOARD_ROWS.map((row, i) => (
          <div className="termo-keyboard-row" key={i}>
            {row.map((key) => {
              const isGuessed = guessed.includes(key);
              const inWord = isGuessed && (revealed.includes(key) || revealedLetters.includes(key));
              const state = isGuessed ? (inWord ? 'correct' : 'absent') : '';
              return (
                <button
                  key={key}
                  className={`termo-key ${state}`}
                  onClick={() => guessLetter(key)}
                  disabled={status !== 'playing' || isGuessed}
                  aria-label={key}
                >
                  {key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <ForcaResultModal
        show={showResult && status !== 'playing'}
        won={status === 'won'}
        word={revealed}
        wrong={wrong}
        maxWrong={maxWrong}
        personName={personName}
        streak={streak}
        todayStr={todayStr}
        onClose={() => setShowResult(false)}
      />

      <Toast message={errorMsg} type="error" onClose={() => setErrorMsg('')} />
    </div>
  );
}

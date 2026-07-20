'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/client/context/AuthContext';
import { getLocalDateString } from '@/shared/utils';
import type { GuessFeedback } from '@/server/game';
import { HelpCircle, Search, Trophy, Info } from 'lucide-react';
import { VictoryModal } from '@/client/components/VictoryModal';
import { LsdleGameProfileCarousel, lsdleProfileDismissKey } from '@/client/components/LsdleGameProfileCarousel';
import { InfoTooltip } from '@/client/components/InfoTooltip';
import { BackLink } from '@/client/components/BackLink';
import { RulesModal } from '@/client/components/RulesModal';
import { LoadingState } from '@/client/components/LoadingState';
import type { StreakInfo } from '@/client/components/StreakBadge';
import { Toast } from '@/client/components/Toast';
import { apiFetch } from '@/client/lib/api';
import { avatarColorForName } from '@/client/lib/avatar';
import { Logo } from '@/client/components/Logo';
import { GameStreakButton } from '@/client/components/GameStreakButton';
import { isProfileComplete } from '@/shared/validation';

interface CharacterOption {
  id: string;
  name: string;
  photoUrl?: string | null;
}

function photoForName(name: string, characters: CharacterOption[]): string | null | undefined {
  const match = characters.find((c) => c.name.toLowerCase() === name.toLowerCase());
  return match?.photoUrl;
}

function refreshGuessPhotos(guesses: GuessFeedback[], characters: CharacterOption[]): GuessFeedback[] {
  if (characters.length === 0) return guesses;
  return guesses.map((guess) => {
    const fresh = photoForName(guess.fields.name.value, characters);
    return fresh !== undefined ? { ...guess, photoUrl: fresh } : guess;
  });
}

export default function GamePage() {
  const { t } = useTranslation();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [characters, setCharacters] = useState<CharacterOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownIndex, setDropdownIndex] = useState(-1);
  const [guesses, setGuesses] = useState<GuessFeedback[]>([]);
  const [isWon, setIsWon] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [targetName, setTargetName] = useState('');
  const [targetPhoto, setTargetPhoto] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [streak, setStreak] = useState<StreakInfo | null>(null);
  const [isPersonOfDay, setIsPersonOfDay] = useState(false);
  const [dailyKey, setDailyKey] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [showProfileCarousel, setShowProfileCarousel] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const todayStr = getLocalDateString();

  // The saved board is scoped per account (and per day), so switching accounts
  // in the same browser never inherits the previous user's progress/win.
  const storageKey = `lsdle-game-state-${todayStr}-${user?.id ?? 'anon'}`;

  // Clears the in-memory board to its initial (unplayed) state.
  const resetBoard = () => {
    setGuesses([]);
    setIsWon(false);
    setShowWinModal(false);
    setTargetName('');
    setTargetPhoto('');
    setStartTime(null);
    setStreak(null);
    setIsPersonOfDay(false);
  };

  // Load characters list and restore this account's saved guesses. Re-runs when
  // the account changes (login/logout/switch) so the board follows the user.
  useEffect(() => {
    if (authLoading) return; // wait until we know who (if anyone) is logged in
    let cancelled = false;

    async function loadGameData() {
      try {
        setLoading(true);
        // 1. Fetch autocomplete characters list + today's daily key
        const res = await apiFetch('/api/game/active-characters');
        const data = await res.json();
        if (cancelled) return;
        setCharacters(data.characters || []);
        const currentDailyKey: number | null = data.dailyKey ?? null;
        setDailyKey(currentDailyKey);

        // 2. Restore this account's board from localStorage — unless an admin
        // reset the round today (daily key changed), in which case discard it.
        const savedStateStr = localStorage.getItem(storageKey);
        let restored = false;
        if (savedStateStr) {
          const savedState = JSON.parse(savedStateStr);
          const roundWasReset =
            savedState.dailyKey != null &&
            currentDailyKey != null &&
            savedState.dailyKey !== currentDailyKey;

          if (roundWasReset) {
            localStorage.removeItem(storageKey);
          } else {
            const chars: CharacterOption[] = data.characters || [];
            const restoredGuesses = refreshGuessPhotos(savedState.guesses || [], chars);
            const restoredTargetPhoto = savedState.targetName
              ? (photoForName(savedState.targetName, chars) ?? savedState.targetPhoto ?? '')
              : (savedState.targetPhoto ?? '');

            setGuesses(restoredGuesses);
            setIsWon(savedState.isWon || false);
            setTargetName(savedState.targetName || '');
            setTargetPhoto(restoredTargetPhoto);
            setStartTime(savedState.startTime ?? null);
            setStreak(savedState.streak ?? null);
            setIsPersonOfDay(!!savedState.isPersonOfDay);
            setShowWinModal(!!savedState.isWon);
            restored = true;

            if (
              restoredGuesses.some((g, i) => g.photoUrl !== savedState.guesses?.[i]?.photoUrl) ||
              restoredTargetPhoto !== (savedState.targetPhoto ?? '')
            ) {
              localStorage.setItem(
                storageKey,
                JSON.stringify({
                  ...savedState,
                  guesses: restoredGuesses,
                  targetPhoto: restoredTargetPhoto,
                })
              );
            }
          }
        }
        // No saved board for this account → make sure nothing from a previous
        // account/session is left on screen.
        if (!restored) resetBoard();
      } catch (err) {
        console.error('Error loading game data:', err);
        if (!cancelled) setErrorMsg(t('home.errors.loadGame'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadGameData();
    return () => {
      cancelled = true;
    };
    // Intentionally excludes `t`: game state must not reload (and reopen the
    // victory modal) just because the language changed. Re-runs per day and per
    // account.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayStr, user?.id, authLoading]);

  useEffect(() => {
    if (authLoading || loading || !user) {
      setShowProfileCarousel(false);
      return;
    }
    if (isProfileComplete(user)) {
      setShowProfileCarousel(false);
      return;
    }
    const dismissed = localStorage.getItem(lsdleProfileDismissKey(user.id));
    setShowProfileCarousel(!dismissed);
  }, [user, authLoading, loading]);

  // Click outside listener for dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered dropdown options
  const filteredOptions = characters.filter(c => {
    // Cannot guess characters already guessed
    const alreadyGuessed = guesses.some(g => g.fields.name.value.toLowerCase() === c.name.toLowerCase());
    return !alreadyGuessed && c.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleGuess = async (characterId: string) => {
    if (isWon || submitting) return;
    setSubmitting(true);
    setErrorMsg('');

    // Start the clock on the first guess (persisted so reloads keep the timer).
    const effectiveStart = startTime ?? Date.now();
    if (startTime === null) setStartTime(effectiveStart);

    try {
      const res = await apiFetch('/api/game/guess', {
        method: 'POST',
        body: JSON.stringify({ guessId: characterId })
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || t('home.errors.guess'));
        setSubmitting(false);
        return;
      }

      const newFeedback: GuessFeedback = data.feedback;
      const guessedChar = characters.find((c) => c.id === characterId);
      const feedbackWithPhoto: GuessFeedback = {
        ...newFeedback,
        photoUrl: guessedChar?.photoUrl ?? data.photoUrl ?? newFeedback.photoUrl,
      };
      const updatedGuesses = [...guesses, feedbackWithPhoto];
      
      const won = feedbackWithPhoto.correct;
      const target = data.targetName || '';
      const photo = data.photoUrl ?? guessedChar?.photoUrl ?? feedbackWithPhoto.photoUrl ?? '';

      const newStreak: StreakInfo | null = data.streak ?? streak;

      setGuesses(updatedGuesses);
      setIsWon(won);
      if (won) {
        setTargetName(target);
        setTargetPhoto(photo);
        setStreak(newStreak);
        setIsPersonOfDay(!!data.isPersonOfDay);
        setShowWinModal(true);
        // The daily ranking result is recorded server-side by /api/game/guess
        // (using the server's own attempt count and timing).
      }

      // Save state to local storage, scoped to this account (storageKey) and
      // tagged with the daily key so a later admin reset can be detected.
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          guesses: updatedGuesses,
          isWon: won,
          targetName: target,
          targetPhoto: photo,
          startTime: effectiveStart,
          streak: newStreak,
          isPersonOfDay: !!data.isPersonOfDay,
          dailyKey,
        })
      );

      // Reset search inputs
      setSearchQuery('');
      setShowDropdown(false);
      setDropdownIndex(-1);

    } catch (err) {
      console.error('Error submitting guess:', err);
      setErrorMsg(t('home.errors.guessConn'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || filteredOptions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setDropdownIndex(prev => (prev + 1) % filteredOptions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setDropdownIndex(prev => (prev - 1 + filteredOptions.length) % filteredOptions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (dropdownIndex >= 0 && dropdownIndex < filteredOptions.length) {
        handleGuess(filteredOptions[dropdownIndex].id);
      } else if (filteredOptions.length > 0) {
        handleGuess(filteredOptions[0].id);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  if (loading) {
    return <LoadingState message={t('home.loading')} minHeight="60vh" />;
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

      <BackLink href="/" label={t('nav.backToHub')} style={{ margin: '2rem 0 0.5rem 0' }} />

      {/* Hero Section */}
      <section className="hero" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Logo
          alt="LSD Logo"
          style={{ width: '180px', maxWidth: '100%', marginBottom: '0.75rem' }}
        />
        <h1 className="lsd-gradient-text" style={{ paddingBottom: '0.2rem' }}>LSDLE</h1>
        <p>{t('home.tagline')}</p>
        <div className="hero-actions">
          <button
            onClick={() => setShowRules(true)}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
          >
            <HelpCircle size={16} />
            {t('home.showRules')}
          </button>

          <GameStreakButton streakEndpoint="/api/game/streak" refreshKey={isWon} />

          <Link
            href="/lsdle/ranking"
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', textDecoration: 'none' }}
          >
            <Trophy size={16} style={{ color: 'var(--color-partial)' }} />
            {t('nav.ranking')}
          </Link>
        </div>
      </section>

      {/* Rules modal */}
      <RulesModal show={showRules} title={t('home.rulesTitle')} onClose={() => setShowRules(false)}>
          <ul>
            <li>{t('home.rules.l1')}</li>
            <li>{t('home.rules.l2')}</li>
            <li>
              <span className="badge badge-active" style={{ backgroundColor: 'var(--color-correct)', color: 'white', border: 'none' }}>{t('home.rules.greenBadge')}</span> : {t('home.rules.green')}
            </li>
            <li>
              <span className="badge" style={{ backgroundColor: 'var(--color-partial)', color: 'white', border: 'none' }}>{t('home.rules.orangeBadge')}</span> : {t('home.rules.orangePre')}<strong>{t('home.rules.entryField')}</strong>{t('home.rules.orangePost')}
            </li>
            <li>
              <span className="badge" style={{ backgroundColor: 'var(--color-incorrect)', color: 'var(--text-muted)', border: 'none' }}>{t('home.rules.darkBadge')}</span> : {t('home.rules.dark')}
            </li>
            <li>{t('home.rules.saved')}</li>
            <li><strong>{t('home.rules.importantLabel')}</strong> {t('home.rules.important')}</li>
          </ul>
      </RulesModal>

      {/* Main Game Interface */}
      {characters.length === 0 ? (
        <div className="alert alert-info card game-empty-card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center', flexDirection: 'column', gap: '1rem' }}>
          <Info size={48} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{t('home.empty.title')}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            {t('home.empty.body', { page: t('nav.myCharacter') })}
          </p>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Autocomplete Input Container */}
          <div className="search-container" ref={dropdownRef}>
            <div className="search-input-wrapper">
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="text"
                  placeholder={isWon ? t('home.search.won') : t('home.search.placeholder')}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                    setDropdownIndex(-1);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onKeyDown={handleKeyDown}
                  disabled={isWon || submitting}
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              </div>
            </div>

            {/* Dropdown Options */}
            {showDropdown && searchQuery && (
              <div className="autocomplete-dropdown">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((c, i) => (
                    <div
                      key={c.id}
                      className={`autocomplete-item ${i === dropdownIndex ? 'selected' : ''}`}
                      onClick={() => handleGuess(c.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                    >
                      {c.photoUrl ? (
                        <img 
                          src={c.photoUrl} 
                          alt={c.name} 
                          style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255, 255, 255, 0.2)', flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: avatarColorForName(c.name), color: '#fff', fontSize: '0.65rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span>{c.name}</span>
                    </div>
                  ))
                ) : (
                  <div className="autocomplete-empty">{t('home.search.noResults')}</div>
                )}
              </div>
            )}
          </div>

          {isWon && (
            <div style={{ display: 'flex', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
              <button 
                onClick={() => setShowWinModal(true)} 
                className="btn"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
              >
                <Trophy size={16} style={{ color: 'var(--color-partial)' }} />
                {t('home.viewStats')}
              </button>
            </div>
          )}

          {/* Guesses Board */}
          {guesses.length > 0 && (
            <div className="game-board fade-in">
              <p className="game-board-scroll-hint">{t('home.scrollHint')}</p>
              <div className="game-board-scroll">
                <div className="game-board-inner">
                  {/* Header Row */}
                  <div className="grid-row grid-header">
                <div className="grid-header-cell">
                  <span>{t('home.headers.name')}</span>
                  <InfoTooltip text={t('home.headerTips.name')} />
                </div>
                <div className="grid-header-cell">
                  <span>{t('home.headers.gender')}</span>
                  <InfoTooltip text={t('home.headerTips.gender')} />
                </div>
                <div className="grid-header-cell">
                  <span>{t('home.headers.role')}</span>
                  <InfoTooltip text={t('home.headerTips.role')} />
                </div>
                <div className="grid-header-cell">
                  <span>{t('home.headers.period')}</span>
                  <InfoTooltip text={t('home.headerTips.period')} />
                </div>
                <div className="grid-header-cell">
                  <span>{t('home.headers.area')}</span>
                  <InfoTooltip text={t('home.headerTips.area')} />
                </div>
                <div className="grid-header-cell">
                  <span>{t('home.headers.labProj')}</span>
                  <InfoTooltip text={t('home.headerTips.labProj')} />
                </div>
                <div className="grid-header-cell">
                  <span>{t('home.headers.colabs')}</span>
                  <InfoTooltip text={t('home.headerTips.colabs')} />
                </div>
                <div className="grid-header-cell">
                  <span>{t('home.headers.coffee')}</span>
                  <InfoTooltip text={t('home.headerTips.coffee')} />
                </div>
              </div>

              {/* Guess Rows (Reversed so latest is at top) */}
              {[...guesses].reverse().map((guess, index) => (
                <div key={guesses.length - 1 - index} className="grid-row">
                  {/* Name (displays feedback) */}
                  <div className={`tile tile-photo ${guess.fields?.name?.result === 'correct' ? 'correct' : 'incorrect'}`}>
                    <span className="tile-label">{t('home.tiles.name')}</span>
                    <div className="tile-photo-container">
                      {guess.photoUrl ? (
                        <img 
                          src={guess.photoUrl} 
                          alt={guess.fields?.name?.value} 
                          className="guess-photo"
                        />
                      ) : (
                        <div
                          className="guess-photo-placeholder"
                          style={{ backgroundColor: avatarColorForName(guess.fields?.name?.value || '?'), color: '#fff' }}
                        >
                          {guess.fields?.name?.value?.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="tile-value guess-name-hover">{guess.fields?.name?.value}</span>
                  </div>

                  {/* Gender */}
                  <div className={`tile ${guess.fields?.gender?.result === 'correct' ? 'correct' : 'incorrect'}`}>
                    <span className="tile-label">{t('home.tiles.gender')}</span>
                    <span className="tile-value">{guess.fields?.gender?.value}</span>
                  </div>

                  {/* Role */}
                  <div className={`tile ${guess.fields?.role?.result === 'correct' ? 'correct' : 'incorrect'}`}>
                    <span className="tile-label">{t('home.tiles.role')}</span>
                    <span className="tile-value">{guess.fields?.role?.value}</span>
                  </div>

                  {/* Entry Semester (higher / lower arrow feedback) */}
                  <div className={`tile ${
                    guess.fields?.entrySemester?.result === 'correct' 
                      ? 'correct' 
                      : guess.fields?.entrySemester?.result === 'higher' || guess.fields?.entrySemester?.result === 'lower'
                      ? 'higher' 
                      : 'incorrect'
                  }`}>
                    <span className="tile-label">{t('home.tiles.entry')}</span>
                    <span className="tile-value">{guess.fields?.entrySemester?.value}</span>
                    {guess.fields?.entrySemester?.result === 'higher' && <span className="tile-arrow">↑</span>}
                    {guess.fields?.entrySemester?.result === 'lower' && <span className="tile-arrow">↓</span>}
                  </div>

                  {/* Area (multivalor: parcial = laranja quando há área em comum) */}
                  <div className={`tile ${
                    guess.fields?.area?.result === 'correct'
                      ? 'correct'
                      : guess.fields?.area?.result === 'partial'
                      ? 'partial'
                      : 'incorrect'
                  }`}>
                    <span className="tile-label">{t('home.tiles.area')}</span>
                    <span className="tile-value tile-value-projects" title={guess.fields?.area?.value}>{guess.fields?.area?.value}</span>
                  </div>

                  {/* Projeto (valor único) */}
                  <div className={`tile ${guess.fields?.projects?.result === 'correct' ? 'correct' : 'incorrect'}`}>
                    <span className="tile-label">{t('home.tiles.lab')}</span>
                    <span className="tile-value">{guess.fields?.projects?.value}</span>
                  </div>

                  {/* Colabs */}
                  <div className={`tile ${guess.fields?.isColab?.result === 'correct' ? 'correct' : 'incorrect'}`}>
                    <span className="tile-label">{t('home.tiles.colabs')}</span>
                    <span className="tile-value">{guess.fields?.isColab?.value}</span>
                  </div>

                  {/* Likes Coffee */}
                  <div className={`tile ${guess.fields?.likesCoffee?.result === 'correct' ? 'correct' : 'incorrect'}`}>
                    <span className="tile-label">{t('home.tiles.coffee')}</span>
                    <span className="tile-value">{guess.fields?.likesCoffee?.value}</span>
                  </div>
                </div>
              ))}
                </div>
              </div>
            </div>
          )}

          {/* Win Modal overlay */}
          <VictoryModal
            show={showWinModal}
            targetName={targetName}
            targetPhoto={targetPhoto}
            attempts={guesses.length}
            streak={streak}
            isPersonOfDay={isPersonOfDay}
            onClose={() => setShowWinModal(false)}
            todayStr={todayStr}
          />

          {/* Top-of-screen notification (guess error) */}
          <Toast
            message={errorMsg}
            type="error"
            onClose={() => setErrorMsg('')}
          />
        </div>
      )}

      {showProfileCarousel && user && (
        <LsdleGameProfileCarousel
          user={user}
          onComplete={async () => {
            localStorage.removeItem(lsdleProfileDismissKey(user.id));
            setShowProfileCarousel(false);
            await refreshUser();
          }}
          onSkip={async () => {
            localStorage.setItem(lsdleProfileDismissKey(user.id), '1');
            setShowProfileCarousel(false);
            await refreshUser();
          }}
        />
      )}
    </div>
  );
}

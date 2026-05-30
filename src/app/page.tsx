'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/client/context/AuthContext';
import { getLocalDateString } from '@/shared/utils';
import type { GuessFeedback } from '@/server/game';
import { HelpCircle, Search, Trophy, Share2, CheckCircle, Info } from 'lucide-react';
import { VictoryModal } from '@/client/components/VictoryModal';
import { apiFetch } from '@/client/lib/api';

interface CharacterOption {
  id: string;
  name: string;
  photoUrl?: string | null;
}

export default function GamePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const todayStr = getLocalDateString();

  // Load characters list and restored saved guesses from local storage
  useEffect(() => {
    async function loadGameData() {
      try {
        setLoading(true);
        // 1. Fetch autocomplete characters list
        const res = await apiFetch('/api/game/active-characters');
        const data = await res.json();
        if (data.characters) {
          setCharacters(data.characters);
        } else {
          setCharacters([]);
        }

        // 2. Restore game state from localStorage
        const savedStateStr = localStorage.getItem(`lsdle-game-state-${todayStr}`);
        if (savedStateStr) {
          const savedState = JSON.parse(savedStateStr);
          setGuesses(savedState.guesses || []);
          setIsWon(savedState.isWon || false);
          setTargetName(savedState.targetName || '');
          setTargetPhoto(savedState.targetPhoto || '');
          setStartTime(savedState.startTime ?? null);
          if (savedState.isWon) {
            setShowWinModal(true);
          }
        }
      } catch (err) {
        console.error('Error loading game data:', err);
        setErrorMsg(t('home.errors.loadGame'));
      } finally {
        setLoading(false);
      }
    }

    loadGameData();
    // Intentionally excludes `t`: game state must not reload (and reopen the
    // victory modal) just because the language changed. Only reload per day.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayStr]);

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

  // Handle guess submission
  const submitResult = async (attempts: number, durationMs: number) => {
    // Only logged-in players are ranked; ignore failures silently.
    if (!user) return;
    try {
      await apiFetch('/api/game/result', {
        method: 'POST',
        body: JSON.stringify({ attempts, durationMs }),
      });
    } catch (err) {
      console.error('Error submitting result:', err);
    }
  };

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
      const updatedGuesses = [...guesses, newFeedback];
      
      let won = newFeedback.correct;
      let target = data.targetName || '';
      let photo = data.photoUrl || '';

      setGuesses(updatedGuesses);
      setIsWon(won);
      if (won) {
        setTargetName(target);
        setTargetPhoto(photo);
        setShowWinModal(true);
        // Record the result for the daily ranking.
        submitResult(updatedGuesses.length, Date.now() - effectiveStart);
      }

      // Save state to local storage
      localStorage.setItem(
        `lsdle-game-state-${todayStr}`,
        JSON.stringify({ guesses: updatedGuesses, isWon: won, targetName: target, targetPhoto: photo, startTime: effectiveStart })
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

  const copyToClipboard = () => {
    // Generate emoji grid: Green (🟩), Orange (🟧), Slate (⬛)
    const emojiRows = guesses.map(guess => {
      return Object.entries(guess.fields)
        .filter(([key]) => key !== 'name') // Don't show emoji for name field, but show for remaining 7
        .map(([_, field]) => {
          if (field.result === 'correct') return '🟩';
          if (field.result === 'higher' || field.result === 'lower' || field.result === 'partial') return '🟧';
          return '⬛';
        })
        .join('');
    }).join('\n');

    const textToShare = t('home.shareText', {
      date: todayStr,
      count: guesses.length,
      grid: emojiRows,
      url: window.location.origin,
    });

    navigator.clipboard.writeText(textToShare).then(() => {
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '5px solid var(--border-color)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'pulseGlow 1s infinite alternate, spin 1s linear infinite'
        }}></div>
        <p style={{ marginTop: '1.5rem', color: 'var(--text-muted)' }}>{t('home.loading')}</p>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin { to { transform: rotate(360deg); } }
        `}} />
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      
      {/* Hero Section */}
      <section className="hero">
        <h1>LSDLE</h1>
        <p>{t('home.tagline')}</p>
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <button 
            onClick={() => setShowRules(!showRules)} 
            className="btn btn-secondary" 
            style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
          >
            <HelpCircle size={16} />
            {showRules ? t('home.hideRules') : t('home.showRules')}
          </button>
        </div>
      </section>

      {/* Rules Box */}
      {showRules && (
        <div className="quick-rules fade-in">
          <h3><Info size={18} style={{ color: 'var(--primary)' }} /> {t('home.rulesTitle')}</h3>
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
        </div>
      )}

      {/* Main Game Interface */}
      {characters.length === 0 ? (
        <div className="alert alert-info card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center', flexDirection: 'column', gap: '1rem', padding: '3rem' }}>
          <Info size={48} style={{ color: 'var(--accent)', marginBottom: '0.5rem' }} />
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

            {errorMsg && (
              <div className="alert alert-error" style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                {errorMsg}
              </div>
            )}

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
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-primary)', fontSize: '0.65rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255, 255, 255, 0.15)', flexShrink: 0 }}>
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
              {/* Header Row */}
              <div className="grid-row grid-header">
                <div>{t('home.headers.name')}</div>
                <div>{t('home.headers.gender')}</div>
                <div>{t('home.headers.role')}</div>
                <div>{t('home.headers.period')}</div>
                <div>{t('home.headers.language')}</div>
                <div>{t('home.headers.area')}</div>
                <div>{t('home.headers.labProj')}</div>
                <div>{t('home.headers.coffee')}</div>
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
                        <div className="guess-photo-placeholder">
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

                  {/* Favorite Language */}
                  <div className={`tile ${guess.fields?.favoriteLanguage?.result === 'correct' ? 'correct' : 'incorrect'}`}>
                    <span className="tile-label">{t('home.tiles.language')}</span>
                    <span className="tile-value">{guess.fields?.favoriteLanguage?.value}</span>
                  </div>

                  {/* Area */}
                  <div className={`tile ${guess.fields?.area?.result === 'correct' ? 'correct' : 'incorrect'}`}>
                    <span className="tile-label">{t('home.tiles.area')}</span>
                    <span className="tile-value">{guess.fields?.area?.value}</span>
                  </div>

                  {/* Projetos (multivalor: parcial = laranja quando há projeto em comum) */}
                  <div className={`tile ${
                    guess.fields?.projects?.result === 'correct'
                      ? 'correct'
                      : guess.fields?.projects?.result === 'partial'
                      ? 'partial'
                      : 'incorrect'
                  }`}>
                    <span className="tile-label">{t('home.tiles.lab')}</span>
                    <span className="tile-value">{guess.fields?.projects?.value}</span>
                  </div>

                  {/* Likes Coffee */}
                  <div className={`tile ${guess.fields?.likesCoffee?.result === 'correct' ? 'correct' : 'incorrect'}`}>
                    <span className="tile-label">{t('home.tiles.coffee')}</span>
                    <span className="tile-value">{guess.fields?.likesCoffee?.value}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Win Modal overlay */}
          <VictoryModal
            show={showWinModal}
            targetName={targetName}
            targetPhoto={targetPhoto}
            attempts={guesses.length}
            guesses={guesses}
            shareSuccess={shareSuccess}
            onShare={copyToClipboard}
            onClose={() => setShowWinModal(false)}
            todayStr={todayStr}
          />
        </div>
      )}
    </div>
  );
}

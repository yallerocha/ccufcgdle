'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/client/context/AuthContext';
import { getLocalDateString } from '@/shared/utils';
import { HelpCircle, Trophy, Play, CheckCircle2, XCircle } from 'lucide-react';
import { BackLink } from '@/client/components/BackLink';
import { RulesModal } from '@/client/components/RulesModal';
import { LoadingState } from '@/client/components/LoadingState';
import { Toast } from '@/client/components/Toast';
import { CodeResultModal } from '@/client/components/CodeResultModal';
import type { StreakInfo } from '@/client/components/StreakBadge';
import { apiFetch } from '@/client/lib/api';
import { Logo } from '@/client/components/Logo';
import { GameStreakButton } from '@/client/components/GameStreakButton';

type CodeLang = 'js' | 'py' | 'java';
const LANG_LABELS: Record<CodeLang, string> = { js: 'JavaScript', py: 'Python', java: 'Java' };
const CODE_LANGS = Object.keys(LANG_LABELS) as CodeLang[];

interface Challenge {
  id: string;
  title: string;
  titleEn: string;
  difficulty: string;
  functionName: string;
  description: string;
  descriptionEn: string;
  starters: Record<CodeLang, string>;
  // Worked examples (input → output). The real test cases are secret and
  // intentionally different, so answers can't be hardcoded.
  examples: { args: unknown[]; expected: unknown }[];
}

// Per-test verdict as returned by the server: pass/fail plus the error message
// when the player's function threw — never the test inputs or expected outputs.
interface TestOutcome {
  pass: boolean;
  threw?: string;
}

function fmt(value: unknown): string {
  return JSON.stringify(value) ?? 'undefined';
}

export default function CodePage() {
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const isEnglish = (i18n.language || '').toLowerCase().startsWith('en');

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [dailyKey, setDailyKey] = useState<number | null>(null);
  const [language, setLanguage] = useState<CodeLang>('js');
  const [codeByLang, setCodeByLang] = useState<Record<CodeLang, string>>({ js: '', py: '', java: '' });
  const code = codeByLang[language];
  const [results, setResults] = useState<TestOutcome[] | null>(null);
  const [runError, setRunError] = useState('');
  const [solved, setSolved] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [streak, setStreak] = useState<StreakInfo | null>(null);
  const [showResult, setShowResult] = useState(false);

  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showRules, setShowRules] = useState(false);

  const runningRef = useRef(false);
  const todayStr = getLocalDateString();
  const storageKey = `code-game-state-${todayStr}-${user?.id ?? 'anon'}`;

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const res = await apiFetch('/api/code/daily');
        const data = await res.json();
        if (cancelled) return;

        const currentDailyKey: number | null = data.dailyKey ?? null;
        const ch: Challenge = data.challenge;
        setChallenge(ch);
        setDailyKey(currentDailyKey);

        let restored = false;
        const savedStr = localStorage.getItem(storageKey);
        if (savedStr) {
          const saved = JSON.parse(savedStr);
          const roundWasReset =
            saved.dailyKey != null && currentDailyKey != null && saved.dailyKey !== currentDailyKey;
          if (roundWasReset) {
            localStorage.removeItem(storageKey);
          } else {
            const savedLang: CodeLang = CODE_LANGS.includes(saved.language) ? saved.language : 'js';
            // Older saves kept a single `code` string (JS-only era).
            const savedDrafts = saved.codeByLang ?? { js: saved.code };
            setLanguage(savedLang);
            setCodeByLang({
              js: typeof savedDrafts.js === 'string' && savedDrafts.js !== '' ? savedDrafts.js : ch.starters.js,
              py: typeof savedDrafts.py === 'string' && savedDrafts.py !== '' ? savedDrafts.py : ch.starters.py,
              java: typeof savedDrafts.java === 'string' && savedDrafts.java !== '' ? savedDrafts.java : ch.starters.java,
            });
            setResults(saved.results ?? null);
            setRunError(saved.runError ?? '');
            setSolved(Boolean(saved.solved));
            setAttempts(saved.attempts ?? 0);
            setStreak(saved.streak ?? null);
            setShowResult(Boolean(saved.solved));
            restored = true;
          }
        }
        if (!restored) {
          setLanguage('js');
          setCodeByLang({ ...ch.starters });
          setResults(null);
          setRunError('');
          setSolved(false);
          setAttempts(0);
          setStreak(null);
          setShowResult(false);
        }
      } catch (err) {
        console.error('Error loading code challenge:', err);
        if (!cancelled) setErrorMsg(t('code.error'));
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

  const persist = (next: {
    language: CodeLang;
    codeByLang: Record<CodeLang, string>;
    results: TestOutcome[] | null;
    runError: string;
    solved: boolean;
    attempts: number;
    streak: StreakInfo | null;
  }) => {
    localStorage.setItem(storageKey, JSON.stringify({ ...next, dailyKey }));
  };

  const switchLanguage = (lang: CodeLang) => {
    if (lang === language || running) return;
    setLanguage(lang);
    persist({ language: lang, codeByLang, results, runError, solved, attempts, streak });
  };

  async function run() {
    if (runningRef.current || !challenge) return;
    runningRef.current = true;
    setRunning(true);
    setErrorMsg('');
    try {
      const res = await apiFetch('/api/code/submit', {
        method: 'POST',
        body: JSON.stringify({ code, language }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || t('code.error'));
        return;
      }

      const newResults: TestOutcome[] = data.results ?? [];
      const newSolved: boolean = Boolean(data.solved) || solved;
      const newAttempts: number = data.attemptsUsed || attempts + 1;
      const newStreak: StreakInfo | null = data.streak ?? streak;
      const newRunError: string = data.error ?? '';

      setResults(newResults);
      setRunError(newRunError);
      setSolved(newSolved);
      setAttempts(newAttempts);
      setStreak(newStreak);
      if (data.solved && !solved) {
        setTimeout(() => setShowResult(true), 800);
      }
      persist({
        language,
        codeByLang,
        results: newResults,
        runError: newRunError,
        solved: newSolved,
        attempts: newAttempts,
        streak: newStreak,
      });
    } catch (err) {
      console.error('Error submitting code:', err);
      setErrorMsg(t('code.error'));
    } finally {
      setRunning(false);
      runningRef.current = false;
    }
  }

  if (loading) {
    return <LoadingState message={t('code.loading')} minHeight="60vh" />;
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <BackLink href="/" label={t('nav.backToHub')} style={{ margin: '2rem 0 0.5rem 0' }} />

      <section className="hero" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Logo alt="LSD Logo" style={{ width: '160px', maxWidth: '100%', marginBottom: '0.75rem' }} />
        <h1 className="lsd-gradient-text">CODE</h1>
        <p>{t('code.tagline')}</p>
        <div className="hero-actions">
          <button
            onClick={() => setShowRules(true)}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
          >
            <HelpCircle size={16} />
            {t('code.showRules')}
          </button>

          <GameStreakButton streakEndpoint="/api/code/streak" refreshKey={solved ? 'done' : 'playing'} />

          <Link
            href="/code/ranking"
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', textDecoration: 'none' }}
          >
            <Trophy size={16} style={{ color: 'var(--color-partial)' }} />
            {t('code.viewRanking')}
          </Link>
        </div>
      </section>

      <RulesModal show={showRules} title={t('code.rulesTitle')} onClose={() => setShowRules(false)}>
          <ul>
            <li>{t('code.rules.l1')}</li>
            <li>{t('code.rules.l2')}</li>
            <li>{t('code.rules.l3')}</li>
            <li>{t('code.rules.l4')}</li>
            <li>{t('code.rules.saved')}</li>
          </ul>
      </RulesModal>

      {challenge && (
        <div className="code-layout fade-in">
          {/* Statement */}
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                {isEnglish && challenge.titleEn ? challenge.titleEn : challenge.title}
              </h2>
              <span className="badge">
                {t(`code.difficultyNames.${challenge.difficulty}`, { defaultValue: challenge.difficulty })}
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>
              {isEnglish && challenge.descriptionEn ? challenge.descriptionEn : challenge.description}
            </p>

            {/* Worked examples — different from the (secret) real tests */}
            {challenge.examples?.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  {t('code.examplesTitle')}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {challenge.examples.map((ex, i) => (
                    <div key={i} className="code-test">
                      <code style={{ fontSize: '0.82rem' }}>
                        {challenge.functionName}({ex.args.map(fmt).join(', ')}) → {fmt(ex.expected)}
                      </code>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
                  {t('code.examplesHint')}
                </p>
              </div>
            )}
          </div>

          {/* Editor */}
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              <label htmlFor="code-editor" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                {t('code.editorLabel', { name: challenge.functionName })}
              </label>
              <select
                value={language}
                onChange={(e) => switchLanguage(e.target.value as CodeLang)}
                disabled={running}
                aria-label={t('code.languageLabel')}
                style={{ width: 'auto', fontSize: '0.85rem', padding: '0.35rem 2.5rem 0.35rem 0.75rem' }}
              >
                {CODE_LANGS.map((lang) => (
                  <option key={lang} value={lang}>
                    {LANG_LABELS[lang]}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              id="code-editor"
              className="code-editor"
              value={code}
              onChange={(e) => {
                const value = e.target.value;
                setCodeByLang((prev) => ({ ...prev, [language]: value }));
              }}
              spellCheck={false}
              rows={Math.max(10, code.split('\n').length + 2)}
              disabled={running}
            />
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.75rem' }}>
              <button onClick={run} className="btn" disabled={running}>
                <Play size={16} /> {running ? t('code.running') : t('code.run')}
              </button>
              {attempts > 0 && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {t('code.attemptsUsed', { count: attempts })}
                </span>
              )}
              {solved && (
                <button onClick={() => setShowResult(true)} className="btn btn-secondary" style={{ marginLeft: 'auto' }}>
                  <Trophy size={16} style={{ color: 'var(--color-partial)' }} /> {t('code.viewResult')}
                </button>
              )}
            </div>

            {/* Run feedback: compile/runtime error banner, or the score against
                the secret test suite (never the tests themselves). */}
            {runError && (
              <div className="quiz-explanation wrong" style={{ marginTop: '0.75rem' }}>
                {runError}
              </div>
            )}
            {results && !runError && (() => {
              const passed = results.filter((r) => r.pass).length;
              const firstThrew = results.find((r) => r.threw)?.threw;
              const allPass = passed === results.length;
              return (
                <div className={`code-run-summary ${allPass ? 'pass' : 'fail'}`}>
                  {allPass ? (
                    <CheckCircle2 size={18} style={{ color: 'var(--color-correct)', flexShrink: 0 }} />
                  ) : (
                    <XCircle size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  )}
                  <div>
                    <strong>{t('code.resultSummary', { passed, total: results.length })}</strong>
                    {firstThrew && !allPass && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {t('code.testThrew', { error: firstThrew })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      <CodeResultModal
        show={showResult && solved}
        attempts={attempts}
        streak={streak}
        todayStr={todayStr}
        onClose={() => setShowResult(false)}
      />

      <Toast message={errorMsg} type="error" onClose={() => setErrorMsg('')} />
    </div>
  );
}

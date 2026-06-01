'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Trophy, Clock, Image as ImageIcon, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { apiFetch } from '@/client/lib/api';
import { Toast } from '@/client/components/Toast';
import { MAX_DAILY_MESSAGE_LENGTH } from '@/shared/validation';

interface RankingEntry {
  rank: number;
  name: string;
  photoUrl?: string | null;
  attempts: number;
  durationMs: number;
}

function formatDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return m > 0 ? `${m}m ${s.toString().padStart(2, '0')}s` : `${s}s`;
}

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

interface VictoryModalProps {
  show: boolean;
  targetName: string;
  targetPhoto: string;
  attempts: number;
  onClose: () => void;
  todayStr: string;
}

export function VictoryModal({
  show,
  targetName,
  targetPhoto,
  attempts,
  onClose,
  todayStr,
}: VictoryModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [rankingPreview, setRankingPreview] = useState<RankingEntry[]>([]);
  const [loadingRanking, setLoadingRanking] = useState(true);

  // Daily message: the person of the day can leave a note + image for the
  // players who guess them. `canEdit` means the logged-in user IS today's person.
  const [canEditMessage, setCanEditMessage] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [savedMedia, setSavedMedia] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState('');
  const [draftMedia, setDraftMedia] = useState<string | null>(null);
  const [savingMessage, setSavingMessage] = useState(false);
  const [messageNote, setMessageNote] = useState('');
  const [messageNoteType, setMessageNoteType] = useState<'success' | 'error'>('error');

  // Shows a top-of-screen toast for the daily-note editor feedback.
  const notify = (msg: string, type: 'success' | 'error' = 'error') => {
    setMessageNoteType(type);
    setMessageNote(msg);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (show && todayStr) {
      setLoadingRanking(true);
      apiFetch(`/api/game/ranking?date=${todayStr}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.ranking) {
            setRankingPreview(data.ranking.slice(0, 3));
          }
          setLoadingRanking(false);
        })
        .catch((err) => {
          console.error('Error loading ranking preview:', err);
          setLoadingRanking(false);
        });
    }
  }, [show, todayStr]);

  // Load today's note (the player has already solved, so the server reveals it).
  useEffect(() => {
    if (!show) return;
    apiFetch('/api/game/daily-message')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setCanEditMessage(!!data.canEdit);
        setSavedMessage(data.message ?? null);
        setSavedMedia(data.mediaUrl ?? null);
        setDraftMessage(data.message ?? '');
        setDraftMedia(data.mediaUrl ?? null);
      })
      .catch((err) => console.error('Error loading daily message:', err));
  }, [show]);

  const handleMessageImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      notify(t('photo.tooLarge'), 'error');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setDraftMedia(reader.result as string);
    reader.readAsDataURL(file);
  };

  // There is something to save only when the text or the image is filled in.
  const hasDraftContent = draftMessage.trim() !== '' || !!draftMedia;

  const saveMessage = async () => {
    if (savingMessage || !hasDraftContent) return;
    setSavingMessage(true);
    setMessageNote('');
    try {
      const res = await apiFetch('/api/game/daily-message', {
        method: 'POST',
        body: JSON.stringify({ message: draftMessage, mediaUrl: draftMedia }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || t('victory.dailyMsg.error'), 'error');
        return;
      }
      setSavedMessage(data.message ?? null);
      setSavedMedia(data.mediaUrl ?? null);
      notify(t('victory.dailyMsg.saved'), 'success');
    } catch (err) {
      console.error('Error saving daily message:', err);
      notify(t('victory.dailyMsg.error'), 'error');
    } finally {
      setSavingMessage(false);
    }
  };

  if (!show || !mounted) return null;

  // When the person of the day left a note (or the viewer is that person and can
  // write one), the modal switches to a wider two-column layout so it isn't too
  // tall: left = photo + stats + grid, right = note + ranking.
  const hasNote = canEditMessage || !!savedMessage || !!savedMedia;
  // The person of the day may leave their note only once: once something is
  // saved, the editor is replaced by the read-only card.
  const canWriteNote = canEditMessage && !savedMessage && !savedMedia;

  const photoBlock = targetPhoto ? (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <img
        src={targetPhoto}
        alt={targetName}
        style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          objectFit: 'cover',
          border: '3px solid var(--primary)',
          boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)',
        }}
      />
    </div>
  ) : null;

  const statsBlock = (
    <div className="stat-grid" style={{ marginBottom: 0, width: '100%' }}>
      <div className="stat-card">
        <div className="stat-val">{attempts}</div>
        <div className="stat-lbl">{t('victory.attempts')}</div>
      </div>
      <div className="stat-card">
        <div className="stat-val">{todayStr.split('-').reverse().slice(0, 2).join('/')}</div>
        <div className="stat-lbl">{t('victory.gameDate')}</div>
      </div>
    </div>
  );

  // Daily note: editor for the person of the day, read-only card for the players
  // who just guessed them. Null when there is nothing to show/edit.
  const noteBlock = canWriteNote ? (
    <div style={{
      padding: '0.85rem',
      borderRadius: 'var(--border-radius)',
      backgroundColor: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid var(--border-color)',
      textAlign: 'left',
    }}>
      <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <MessageSquare size={15} style={{ color: 'var(--primary)' }} />
        {t('victory.dailyMsg.editTitle')}
      </p>
      <textarea
        value={draftMessage}
        onChange={(e) => setDraftMessage(e.target.value)}
        maxLength={MAX_DAILY_MESSAGE_LENGTH}
        placeholder={t('victory.dailyMsg.placeholder')}
        rows={2}
        style={{ width: '100%', resize: 'vertical' }}
      />
      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textAlign: 'right', marginTop: '0.15rem' }}>
        {draftMessage.length}/{MAX_DAILY_MESSAGE_LENGTH}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
        <input type="file" accept="image/*" onChange={handleMessageImage} style={{ display: 'none' }} id="daily-msg-image" />
        <label
          htmlFor="daily-msg-image"
          className="btn btn-secondary"
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            whiteSpace: 'nowrap',
            ...(draftMedia ? { backgroundColor: '#dc2626', borderColor: '#dc2626', color: '#fff' } : {}),
          }}
        >
          <ImageIcon size={16} />
          {draftMedia ? t('victory.dailyMsg.changeImage') : t('victory.dailyMsg.addImage')}
        </label>
        {draftMedia && (
          <button
            type="button"
            onClick={() => setDraftMedia(null)}
            style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {t('victory.dailyMsg.removeImage')}
          </button>
        )}
        <button onClick={saveMessage} disabled={savingMessage || !hasDraftContent} className="btn" style={{ whiteSpace: 'nowrap' }}>
          {savingMessage ? t('victory.dailyMsg.saving') : t('victory.dailyMsg.save')}
        </button>
      </div>
    </div>
  ) : (savedMessage || savedMedia) ? (
    <div style={{
      padding: '0.85rem',
      borderRadius: 'var(--border-radius)',
      backgroundColor: 'rgba(99, 102, 241, 0.08)',
      border: '1px solid var(--primary)',
      textAlign: 'center',
    }}>
      <p style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: 'var(--primary)' }}>
        <MessageSquare size={15} />
        {t('victory.dailyMsg.fromTitle', { name: targetName })}
      </p>
      {savedMessage && (
        <p style={{ fontSize: '0.95rem', fontStyle: 'italic', marginBottom: savedMedia ? '0.6rem' : 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
          “{savedMessage}”
        </p>
      )}
      {savedMedia && (
        <img src={savedMedia} alt="" style={{ maxWidth: '100%', maxHeight: '220px', borderRadius: '8px' }} />
      )}
    </div>
  ) : null;

  const rankingCard = (
    <Link href="/lsdle/ranking" className="ranking-preview-card" style={{
      width: '100%',
      padding: '0.75rem',
      borderRadius: 'var(--border-radius)',
      backgroundColor: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid var(--border-color)',
      textDecoration: 'none',
      color: 'inherit',
      display: 'block',
      textAlign: 'left',
    }}>
      <h3 style={{
        fontSize: '0.9rem',
        fontWeight: 700,
        marginBottom: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        color: 'var(--text-primary)'
      }}>
        <Trophy size={14} style={{ color: 'var(--color-partial)' }} />
        {t('victory.rankingPreviewTitle') || 'Ranking de Hoje'}
      </h3>
      {rankingPreview.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {rankingPreview.map((entry) => (
            <div key={entry.rank} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.85rem',
              padding: '0.25rem 0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontWeight: 700, minWidth: '1.25rem', textAlign: 'center' }}>
                  {MEDALS[entry.rank] || `${entry.rank}.`}
                </span>
                {entry.photoUrl ? (
                  <img src={entry.photoUrl} alt={entry.name} style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 700 }}>
                    {entry.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span style={{
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '90px'
                }}>
                  {entry.name}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                <span>{entry.attempts}x</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.1rem' }}>
                  <Clock size={10} /> {formatDuration(entry.durationMs)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          fontSize: '0.78rem',
          color: 'var(--text-dim)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '80px',
          textAlign: 'center',
          border: '1px dashed var(--border-color)',
          borderRadius: '6px',
          padding: '0.5rem'
        }}>
          Ninguém no ranking hoje ainda. Seja o primeiro!
        </div>
      )}
    </Link>
  );

  const buttonsBlock = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <button onClick={onClose} className="btn btn-secondary">
        {t('victory.back')}
      </button>
    </div>
  );

  const columnStyle: React.CSSProperties = {
    flex: '1 1 240px',
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  };

  // Render through a portal on <body> so the fixed overlay isn't trapped by the
  // transformed `main.fade-in` ancestor and can span the full viewport.
  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content${hasNote ? ' modal-wide' : ''}`} onClick={(e) => e.stopPropagation()}>
        {/* LSD color bar at the top, matching the footer's */}
        <div className="modal-color-bar">
          <div style={{ backgroundColor: 'var(--lsd-teal)' }} />
          <div style={{ backgroundColor: 'var(--lsd-blue)' }} />
          <div style={{ backgroundColor: 'var(--lsd-purple)' }} />
          <div style={{ backgroundColor: 'var(--lsd-magenta)' }} />
          <div style={{ backgroundColor: 'var(--lsd-red)' }} />
          <div style={{ backgroundColor: 'var(--lsd-orange)' }} />
        </div>
        <Trophy size={48} style={{ color: 'var(--color-partial)', margin: '0 auto 1rem auto' }} />
        <h2 className="modal-title">{t('victory.title')} <span className="modal-emoji">🎉</span></h2>
        <p className="modal-subtitle">
          {t('victory.subtitlePre')}<strong>{targetName}</strong>!
        </p>

        {hasNote ? (
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div style={columnStyle}>
              {photoBlock}
              {statsBlock}
            </div>
            <div style={columnStyle}>
              {noteBlock}
              {rankingCard}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {photoBlock}
            {statsBlock}
            {rankingCard}
          </div>
        )}

        {buttonsBlock}
      </div>

      <Toast
        message={messageNote}
        type={messageNoteType}
        onClose={() => setMessageNote('')}
      />
    </div>,
    document.body
  );
}

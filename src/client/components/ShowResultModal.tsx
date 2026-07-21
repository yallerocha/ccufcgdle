'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Trophy, RotateCcw, PartyPopper, HandCoins, XCircle } from 'lucide-react';
import { formatPrize } from '@/client/lib/format';
import { ModalColorBar } from '@/client/components/ModalColorBar';
import { useModalDismiss } from '@/client/hooks/useModalDismiss';

type ShowStatus = 'playing' | 'won' | 'stopped' | 'lost';

interface ResultRun {
  status: ShowStatus;
  securedPrize: number;
}

interface ShowResultModalProps {
  run: ResultRun;
  onClose: () => void;
  onPlayAgain: () => void;
}

export function ShowResultModal({ run, onClose, onPlayAgain }: ShowResultModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useModalDismiss(true, onClose);

  if (!mounted) return null;

  const won = run.status === 'won';
  const lost = run.status === 'lost';

  const Icon = won ? PartyPopper : lost ? XCircle : HandCoins;
  const iconColor = won ? 'var(--color-partial)' : lost ? 'var(--brand-red)' : 'var(--color-correct)';
  const title = won ? t('show.resultWonTitle') : lost ? t('show.resultLostTitle') : t('show.resultStoppedTitle');
  const subtitle = lost && run.securedPrize === 0 ? t('show.resultZero') : t('show.resultBanked');

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-has-bottom-bar" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-body" style={{ textAlign: 'center' }}>
          <Icon size={48} style={{ color: iconColor, margin: '0 auto 0.75rem' }} />
          <h2 className="modal-title">{title}</h2>
          <p className="modal-subtitle">{subtitle}</p>

          <div className="show-result-prize">
            <Trophy size={22} style={{ color: 'var(--color-partial)' }} />
            {formatPrize(run.securedPrize)}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button onClick={onPlayAgain} className="btn" style={{ width: '100%' }}>
              <RotateCcw size={18} /> {t('show.playAgain')}
            </button>
            <Link href="/podium" className="btn btn-secondary" style={{ width: '100%' }} onClick={onClose}>
              <Trophy size={18} /> {t('show.seeRanking')}
            </Link>
          </div>
        </div>
        <ModalColorBar />
      </div>
    </div>,
    document.body
  );
}

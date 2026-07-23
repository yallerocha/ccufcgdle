'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Trophy, RotateCcw, PartyPopper, HandCoins, XCircle, Home } from 'lucide-react';
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
  const zero = lost && run.securedPrize === 0;
  const outcome = won ? 'won' : lost ? 'lost' : 'stopped';

  const Icon = won ? PartyPopper : lost ? XCircle : HandCoins;
  const title = won ? t('show.resultWonTitle') : lost ? t('show.resultLostTitle') : t('show.resultStoppedTitle');

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-content modal-has-bottom-bar show-result-modal is-${outcome}`}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-body">
          <div className="show-result-hero">
            <span className="show-result-badge"><Icon size={40} /></span>
            <h2 className="show-result-title">{title}</h2>
          </div>

          {zero ? (
            <p className="show-result-zero">{t('show.resultZero')}</p>
          ) : (
            <div className="show-result-plate">
              <span className="show-result-label">{t('show.resultBanked')}</span>
              <div className="show-result-prize">
                <Trophy size={22} /> {formatPrize(run.securedPrize)}
              </div>
            </div>
          )}

          <div className="show-result-actions">
            <button onClick={onPlayAgain} className="btn show-result-again">
              <RotateCcw size={18} /> {t('show.playAgain')}
            </button>
            <div className="show-result-actions-row">
              <Link href="/podium" className="btn btn-secondary" onClick={onClose}>
                <Trophy size={18} /> {t('show.seeRanking')}
              </Link>
              <button onClick={onClose} className="btn btn-secondary">
                <Home size={18} /> {t('show.backHome')}
              </button>
            </div>
          </div>
        </div>
        <ModalColorBar />
      </div>
    </div>,
    document.body
  );
}

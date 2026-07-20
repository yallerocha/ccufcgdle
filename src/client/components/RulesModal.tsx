'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Info } from 'lucide-react';
import { ModalColorBar } from '@/client/components/ModalColorBar';
import { useModalDismiss } from '@/client/hooks/useModalDismiss';

interface RulesModalProps {
  show: boolean;
  /** Modal heading, e.g. t('termo.rulesTitle'). */
  title: string;
  onClose: () => void;
  /** The game's rules list (an <ul> styled by .quick-rules). */
  children: React.ReactNode;
}

/** Shared "how to play" modal used by every game page. */
export function RulesModal({ show, title, onClose, children }: RulesModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useModalDismiss(show, onClose);

  if (!show || !mounted) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content modal-has-bottom-bar"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-body">
          <h2
            className="modal-title"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <Info size={22} style={{ color: 'var(--primary)' }} /> {title}
          </h2>

          <div className="quick-rules quick-rules--modal">{children}</div>

          <button onClick={onClose} className="btn btn-secondary" style={{ width: '100%', marginTop: '1.25rem' }}>
            {t('common.close')}
          </button>
        </div>
        <ModalColorBar />
      </div>
    </div>,
    document.body
  );
}

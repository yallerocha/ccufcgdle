'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer
      className="site-footer"
      style={{
        textAlign: 'center',
        color: 'var(--footer-text)',
        backgroundColor: 'var(--footer-bg)',
        marginTop: 'auto',
        position: 'relative'
      }}
    >
      {/* Faixa dourada do estúdio */}
      <div className="brand-gradient-bg" style={{ height: '4px', width: '100%' }} />

      <div className="site-footer-content">
        <p>
          {t('footer.line1')}
          <br />
          {t('footer.line2')}
        </p>
      </div>
    </footer>
  );
}

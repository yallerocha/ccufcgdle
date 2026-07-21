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
      {/* Faixa colorida sólida baseada na logo */}
      <div style={{ display: 'flex', height: '8px', width: '100%' }}>
        <div style={{ flex: 1, backgroundColor: 'var(--brand-teal)' }}></div>
        <div style={{ flex: 1, backgroundColor: 'var(--brand-blue)' }}></div>
        <div style={{ flex: 1, backgroundColor: 'var(--brand-purple)' }}></div>
        <div style={{ flex: 1, backgroundColor: 'var(--brand-magenta)' }}></div>
        <div style={{ flex: 1, backgroundColor: 'var(--brand-red)' }}></div>
        <div style={{ flex: 1, backgroundColor: 'var(--brand-orange)' }}></div>
      </div>
      
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

'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer
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
        <div style={{ flex: 1, backgroundColor: 'var(--lsd-teal)' }}></div>
        <div style={{ flex: 1, backgroundColor: 'var(--lsd-blue)' }}></div>
        <div style={{ flex: 1, backgroundColor: 'var(--lsd-purple)' }}></div>
        <div style={{ flex: 1, backgroundColor: 'var(--lsd-magenta)' }}></div>
        <div style={{ flex: 1, backgroundColor: 'var(--lsd-red)' }}></div>
        <div style={{ flex: 1, backgroundColor: 'var(--lsd-orange)' }}></div>
      </div>
      
      <div style={{ padding: '2rem 0', fontSize: '0.9rem' }}>
        <p>
          {t('footer.line1')}
          <br />
          {t('footer.line2')}
        </p>
      </div>
    </footer>
  );
}

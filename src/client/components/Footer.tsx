'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer
      style={{
        textAlign: 'center',
        padding: '2rem 0',
        color: 'var(--text-dim)',
        borderTop: '1px solid var(--border-color)',
        fontSize: '0.9rem',
        backgroundColor: 'var(--bg-translucent)',
        marginTop: 'auto',
      }}
    >
      <p>{t('footer.text')}</p>
    </footer>
  );
}

'use client';

import React, { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { BackLink } from '@/client/components/BackLink';
import ResetPasswordClient from './ResetPasswordClient';

export default function ResetPasswordPage() {
  const { t } = useTranslation();

  return (
    <>
      <BackLink href="/profile" label={t('forgotPassword.backToLogin')} style={{ maxWidth: '450px', margin: '2rem auto 0.5rem auto' }} />
      <Suspense fallback={null}>
        <ResetPasswordClient />
      </Suspense>
    </>
  );
}

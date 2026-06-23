'use client';

import React, { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { BackLink } from '@/client/components/BackLink';
import ResetPasswordClient from './ResetPasswordClient';

export default function ResetPasswordPage() {
  const { t } = useTranslation();

  return (
    <>
      <BackLink href="/profile" label={t('forgotPassword.backToLogin')} style={{ margin: '2rem 0 0.5rem 0' }} />
      <Suspense fallback={null}>
        <ResetPasswordClient />
      </Suspense>
    </>
  );
}

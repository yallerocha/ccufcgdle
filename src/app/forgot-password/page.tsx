'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { BackLink } from '@/client/components/BackLink';
import { ForgotPasswordForm } from '@/client/components/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();

  return (
    <>
      <BackLink href="/profile" label={t('forgotPassword.backToLogin')} style={{ margin: '2rem 0 0.5rem 0' }} />
      <ForgotPasswordForm />
    </>
  );
}

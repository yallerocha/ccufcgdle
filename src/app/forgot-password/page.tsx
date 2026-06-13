'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { BackLink } from '@/client/components/BackLink';
import { ForgotPasswordForm } from '@/client/components/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();

  return (
    <>
      <BackLink href="/profile" label={t('forgotPassword.backToLogin')} style={{ maxWidth: '450px', margin: '2rem auto 0.5rem auto' }} />
      <ForgotPasswordForm />
    </>
  );
}

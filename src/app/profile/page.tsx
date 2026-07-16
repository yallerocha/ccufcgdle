'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/client/context/AuthContext';
import { BackLink } from '@/client/components/BackLink';
import { LoadingState } from '@/client/components/LoadingState';
import { LoginForm } from '@/client/components/LoginForm';
import { RegisterForm } from '@/client/components/RegisterForm';
import { ProfileEditForm } from '@/client/components/ProfileEditForm';

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, loading, login, refreshUser } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);

  if (loading) {
    return <LoadingState message={t('profileEdit.loadingSession')} minHeight="50vh" />;
  }

  let content;
  if (user) {
    content = <ProfileEditForm user={user} refreshUser={refreshUser} />;
  } else if (!isRegistering) {
    content = (
      <LoginForm
        loginFn={login}
        onLoginSuccess={async () => {
          await refreshUser();
          router.replace('/');
        }}
        onSwitchToRegister={() => setIsRegistering(true)}
      />
    );
  } else {
    content = (
      <RegisterForm
        onRegisterSuccess={async () => {
          await refreshUser();
          router.replace('/');
        }}
        onSwitchToLogin={() => setIsRegistering(false)}
      />
    );
  }

  return (
    <>
      <BackLink href="/" label={t('nav.backToHub')} style={{ margin: '2rem 0 0.5rem 0' }} />
      {content}
    </>
  );
}

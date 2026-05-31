'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/client/context/AuthContext';
import { LoginForm } from '@/client/components/LoginForm';
import { RegisterForm } from '@/client/components/RegisterForm';
import { ProfileEditForm } from '@/client/components/ProfileEditForm';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, loading, login, refreshUser } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>{t('profileEdit.loadingSession')}</p>
      </div>
    );
  }

  let content;
  if (user) {
    content = <ProfileEditForm user={user} refreshUser={refreshUser} />;
  } else if (!isRegistering) {
    content = (
      <LoginForm
        loginFn={login}
        onLoginSuccess={() => refreshUser()}
        onSwitchToRegister={() => setIsRegistering(true)}
      />
    );
  } else {
    content = (
      <RegisterForm
        onRegisterSuccess={() => refreshUser()}
        onSwitchToLogin={() => setIsRegistering(false)}
      />
    );
  }

  return (
    <>
      <div style={{ margin: '2rem 0 0.5rem 0' }}>
        <Link
          href="/"
          className="btn btn-secondary"
          style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', textDecoration: 'none' }}
        >
          <ArrowLeft size={16} /> {t('nav.backToHub')}
        </Link>
      </div>
      {content}
    </>
  );
}

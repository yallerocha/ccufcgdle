'use client';

import React, { useState } from 'react';
import { useAuth } from '@/client/context/AuthContext';
import { LoginForm } from '@/client/components/LoginForm';
import { RegisterForm } from '@/client/components/RegisterForm';
import { ProfileEditForm } from '@/client/components/ProfileEditForm';

export default function ProfilePage() {
  const { user, loading, login, refreshUser } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Carregando dados da sessão...</p>
      </div>
    );
  }

  if (user) {
    return <ProfileEditForm user={user} refreshUser={refreshUser} />;
  }

  if (!isRegistering) {
    return (
      <LoginForm 
        loginFn={login}
        onLoginSuccess={() => refreshUser()}
        onSwitchToRegister={() => setIsRegistering(true)}
      />
    );
  }

  return (
    <RegisterForm 
      onRegisterSuccess={() => refreshUser()}
      onSwitchToLogin={() => setIsRegistering(false)}
    />
  );
}

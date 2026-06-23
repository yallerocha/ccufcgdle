'use client';

import React from 'react';
import { GoogleLogin } from '@react-oauth/google';

interface GoogleSignInButtonProps {
  onSuccess: (credential: string) => void;
  onError?: () => void;
  disabled?: boolean;
}

export function GoogleSignInButton({ onSuccess, onError, disabled }: GoogleSignInButtonProps) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();

  if (!clientId) return null;

  return (
    <div className="google-signin-wrap" style={{ opacity: disabled ? 0.6 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      <GoogleLogin
        onSuccess={(response) => {
          if (response.credential) onSuccess(response.credential);
          else onError?.();
        }}
        onError={() => onError?.()}
        useOneTap={false}
        theme="outline"
        size="large"
        width={400}
        text="continue_with"
      />
    </div>
  );
}

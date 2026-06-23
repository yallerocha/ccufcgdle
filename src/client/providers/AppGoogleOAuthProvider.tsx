'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';
import { useEffect, useState } from 'react';
import { fetchAuthConfig } from '@/client/lib/auth-config';

export function AppGoogleOAuthProvider({ children }: { children: React.ReactNode }) {
  const envClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || '';
  const [clientId, setClientId] = useState(envClientId);

  useEffect(() => {
    fetchAuthConfig().then((cfg) => {
      if (cfg.googleClientId) setClientId(cfg.googleClientId);
    });
  }, []);

  if (!clientId) return <>{children}</>;
  return <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>;
}

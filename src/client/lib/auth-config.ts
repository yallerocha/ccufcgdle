'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/client/lib/api';

export interface AuthConfig {
  emailVerificationRequired: boolean;
  passwordResetByEmailEnabled: boolean;
  googleOAuthEnabled: boolean;
}

let cached: AuthConfig | null = null;
let pending: Promise<AuthConfig> | null = null;

export function fetchAuthConfig(): Promise<AuthConfig> {
  if (cached) return Promise.resolve(cached);
  if (!pending) {
    pending = apiFetch('/api/auth/config')
      .then((res) => res.json())
      .then((data) => {
        cached = {
          emailVerificationRequired: Boolean(data.emailVerificationRequired),
          passwordResetByEmailEnabled: Boolean(
            data.passwordResetByEmailEnabled ?? data.emailVerificationRequired,
          ),
          googleOAuthEnabled: Boolean(data.googleOAuthEnabled),
        };
        return cached;
      })
      .finally(() => {
        pending = null;
      });
  }
  return pending;
}

export function useAuthConfig() {
  const [config, setConfig] = useState<AuthConfig | null>(cached);

  useEffect(() => {
    let cancelled = false;
    fetchAuthConfig().then((cfg) => {
      if (!cancelled) setConfig(cfg);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return config;
}

'use client';

// Base URL of the standalone backend. Inlined at build time by Next, so it must
// be the URL reachable from the browser (e.g. http://localhost:3001).
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

const TOKEN_KEY = 'lsdle_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
}

// Drop-in replacement for fetch('/api/...') that targets the backend and
// attaches the bearer token. `path` should start with "/api/...".
export function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(`${API_BASE}${path}`, { ...options, headers });
}

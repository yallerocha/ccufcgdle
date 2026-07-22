'use client';

// Base URL of the standalone backend. NEXT_PUBLIC_API_URL is inlined at build
// time and takes precedence when set (Vercel, custom domains). Otherwise, if
// NEXT_PUBLIC_API_PORT is set (Docker/LAN local dev), the API host is derived
// from whatever hostname/IP the browser used to load the page, so the app
// works from any machine on the local network without hardcoding an IP.
function resolveApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  const apiPort = process.env.NEXT_PUBLIC_API_PORT;
  if (apiPort && typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:${apiPort}`;
  }
  return '';
}

const API_BASE = resolveApiBase();

const TOKEN_KEY = 'show_token';

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

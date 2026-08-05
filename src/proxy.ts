import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// O plano free do ngrok responde uma página HTML de aviso para qualquer
// requisição com User-Agent de browser. Como a Vercel repassa os headers
// originais ao reescrever /api/*, o JSON da API vira HTML e todo fetch quebra
// com "Unexpected token '<'". Este header desliga o aviso; backends que não
// são ngrok simplesmente o ignoram.
// O rewrite precisa acontecer aqui, e não no next.config.ts: headers definidos
// com NextResponse.next({ request }) não chegam a um destino externo.
const apiUrl = process.env.API_URL?.replace(/\/$/, '');

export function proxy(request: NextRequest) {
  if (!apiUrl) return NextResponse.next();
  const headers = new Headers(request.headers);
  headers.set('ngrok-skip-browser-warning', 'true');
  const { pathname, search } = request.nextUrl;
  return NextResponse.rewrite(`${apiUrl}${pathname}${search}`, { request: { headers } });
}

export const config = { matcher: '/api/:path*' };

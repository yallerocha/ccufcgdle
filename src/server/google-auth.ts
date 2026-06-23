import { OAuth2Client } from 'google-auth-library';
import { prisma } from './db';
import { MAX_PHOTO_BYTES } from '../shared/validation';

let oauthClient: OAuth2Client | null = null;

export function isGoogleOAuthEnabled(): boolean {
  const id = process.env.GOOGLE_CLIENT_ID?.trim();
  return Boolean(id && !id.startsWith('GOCSPX-'));
}

function assertValidGoogleClientId(clientId: string): void {
  if (clientId.startsWith('GOCSPX-')) {
    throw new Error(
      'GOOGLE_CLIENT_ID deve ser o ID do cliente OAuth (termina em .apps.googleusercontent.com), não o client secret (GOCSPX-...).',
    );
  }
}

function getOAuthClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID is not configured.');
  }
  assertValidGoogleClientId(clientId);
  if (!oauthClient) {
    oauthClient = new OAuth2Client(clientId);
  }
  return oauthClient;
}

export interface GoogleProfile {
  googleId: string;
  email: string;
  name?: string;
  picture?: string;
  emailVerified: boolean;
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) return null;

  try {
    const ticket = await getOAuthClient().verifyIdToken({
      idToken,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) return null;

    return {
      googleId: payload.sub,
      email: payload.email.toLowerCase(),
      name: payload.name,
      picture: payload.picture,
      emailVerified: payload.email_verified === true,
    };
  } catch (err) {
    console.error('[google-auth] Token verification failed:', err);
    return null;
  }
}

/** Downloads a Google profile picture and stores it as a base64 data URL. */
export async function fetchGooglePhotoAsDataUrl(pictureUrl: string): Promise<string | null> {
  try {
    const res = await fetch(pictureUrl, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length > MAX_PHOTO_BYTES) return null;

    const contentType = res.headers.get('content-type')?.split(';')[0]?.trim() || 'image/jpeg';
    if (!contentType.startsWith('image/')) return null;

    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch (err) {
    console.error('[google-auth] Failed to fetch profile photo:', err);
    return null;
  }
}

/** Picks a unique nickname (3–25 chars) from an email local part. */
export async function generateUniqueNickname(email: string, displayName?: string): Promise<string> {
  const fromName = displayName
    ?.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 20);

  const localPart = email.split('@')[0] ?? 'user';
  let base = (fromName && fromName.length >= 3 ? fromName : localPart)
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 20);

  if (base.length < 3) {
    base = `user${base}`.slice(0, 20);
  }

  for (let i = 0; i < 100; i++) {
    const suffix = i === 0 ? '' : String(i + 1);
    const candidate = `${base}${suffix}`.slice(0, 25);
    const taken = await prisma.user.findFirst({
      where: { name: { equals: candidate, mode: 'insensitive' } },
      select: { id: true },
    });
    if (!taken) return candidate;
  }

  return `${base}${Date.now().toString(36)}`.slice(0, 25);
}

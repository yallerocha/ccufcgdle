import crypto from 'crypto';

// The signing secret must come from the environment. A hardcoded fallback would
// let anyone who can read this repository forge tokens (including admin ones).
function resolveSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 16) return secret;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'JWT_SECRET is not defined (or is too short). Set a strong JWT_SECRET before starting in production.'
    );
  }
  // Dev only: deterministic-per-process secret so tokens stay valid while the
  // server runs, but never a value committed to source control.
  console.warn(
    '[auth] JWT_SECRET not set — using an ephemeral development secret. Tokens will be invalidated on restart.'
  );
  return crypto.randomBytes(32).toString('hex');
}

const JWT_SECRET = resolveSecret();

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  isAdmin: boolean;
  exp: number;
}

export function signToken(payload: Omit<JWTPayload, 'exp'>, expiresInDays = 30): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + expiresInDays * 24 * 60 * 60;
  const fullPayload: JWTPayload = { ...payload, exp };
  const payloadStr = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  
  const hmac = crypto.createHmac('sha256', JWT_SECRET);
  hmac.update(`${header}.${payloadStr}`);
  const signature = hmac.digest().toString('base64url');
  
  return `${header}.${payloadStr}.${signature}`;
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [header, payload, signature] = parts;
    const hmac = crypto.createHmac('sha256', JWT_SECRET);
    hmac.update(`${header}.${payload}`);
    const expectedSignature = hmac.digest().toString('base64url');

    // Constant-time comparison to avoid leaking the signature via timing.
    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }
    
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as JWTPayload;
    
    // Check expiration
    if (decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return decodedPayload;
  } catch (e) {
    return null;
  }
}

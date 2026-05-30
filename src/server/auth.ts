import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'ufcg-computacao-secret-key-1234567890-ccufcgdle';

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
    
    if (signature !== expectedSignature) return null;
    
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

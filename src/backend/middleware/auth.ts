import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../../server/auth';
import { prisma } from '../../server/db';

// Augment Express's Request so handlers can read the decoded token.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: JWTPayload;
    }
  }
}

// Reads "Authorization: Bearer <jwt>" and returns the decoded payload, or null.
function extractAuth(req: Request): JWTPayload | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  if (!token) return null;
  return verifyToken(token);
}

// Optional auth: populates req.auth when a valid token is present, never blocks.
export function withAuth(req: Request, _res: Response, next: NextFunction) {
  const decoded = extractAuth(req);
  if (decoded) req.auth = decoded;
  next();
}

// Requires a valid token; otherwise 401.
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const decoded = extractAuth(req);
  if (!decoded) {
    return res.status(401).json({ error: 'Não autorizado.' });
  }
  req.auth = decoded;
  next();
}

// Requires a valid token belonging to an admin user (checked against the DB);
// otherwise 403.
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const decoded = extractAuth(req);
  if (!decoded || !decoded.isAdmin) {
    return res.status(403).json({ error: 'Não autorizado.' });
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  if (!user || !user.isAdmin) {
    return res.status(403).json({ error: 'Não autorizado.' });
  }

  req.auth = decoded;
  next();
}

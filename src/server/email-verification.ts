import crypto from 'crypto';
import { prisma } from './db';

const TOKEN_BYTES = 32;
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export function isEmailVerified(user: { emailVerifiedAt: Date | null }): boolean {
  return user.emailVerifiedAt != null;
}

/** Creates a fresh verification token for the user and returns the raw secret (for the email link). */
export async function issueVerificationToken(userId: string): Promise<string> {
  const raw = crypto.randomBytes(TOKEN_BYTES).toString('base64url');
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.$transaction([
    prisma.emailVerificationToken.deleteMany({ where: { userId } }),
    prisma.emailVerificationToken.create({
      data: { userId, tokenHash, expiresAt },
    }),
  ]);

  return raw;
}

/** Validates the token, marks the email verified, and removes all tokens for that user. */
export async function consumeVerificationToken(rawToken: string): Promise<{ userId: string } | null> {
  if (!rawToken || typeof rawToken !== 'string') return null;

  const tokenHash = hashToken(rawToken);
  const row = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    select: { userId: true, expiresAt: true },
  });

  if (!row || row.expiresAt < new Date()) {
    if (row) {
      await prisma.emailVerificationToken.deleteMany({ where: { tokenHash } });
    }
    return null;
  }

  const existing = await prisma.user.findUnique({
    where: { id: row.userId },
    select: { emailVerifiedAt: true },
  });
  if (existing?.emailVerifiedAt) {
    return { userId: row.userId };
  }

  await prisma.user.update({
    where: { id: row.userId },
    data: { emailVerifiedAt: new Date(), isActive: true, lastLogin: new Date() },
  });

  return { userId: row.userId };
}

export async function findUnverifiedUserByEmail(email: string) {
  return prisma.user.findFirst({
    where: {
      email: email.toLowerCase(),
      emailVerifiedAt: null,
    },
    select: { id: true, email: true, name: true },
  });
}

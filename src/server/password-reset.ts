import crypto from 'crypto';
import { prisma } from './db';

const TOKEN_BYTES = 32;
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

async function findTokenRow(rawToken: string) {
  if (!rawToken || typeof rawToken !== 'string') return null;
  const tokenHash = hashToken(rawToken);
  return prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { userId: true, expiresAt: true, tokenHash: true },
  });
}

export async function findVerifiedUserForPasswordReset(email: string) {
  return prisma.user.findFirst({
    where: {
      email: email.toLowerCase(),
      emailVerifiedAt: { not: null },
    },
    select: { id: true, email: true, name: true },
  });
}

/** Creates a fresh reset token and returns the raw secret for the email link. */
export async function issuePasswordResetToken(userId: string): Promise<string> {
  const raw = crypto.randomBytes(TOKEN_BYTES).toString('base64url');
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId } }),
    prisma.passwordResetToken.create({
      data: { userId, tokenHash, expiresAt },
    }),
  ]);

  return raw;
}

/** Checks whether a reset token is valid without consuming it. */
export async function validatePasswordResetToken(rawToken: string): Promise<{ userId: string } | null> {
  const row = await findTokenRow(rawToken);
  if (!row || row.expiresAt < new Date()) {
    if (row) await prisma.passwordResetToken.deleteMany({ where: { tokenHash: row.tokenHash } });
    return null;
  }
  return { userId: row.userId };
}

/** Validates the token, updates the password hash, and removes all reset tokens for the user. */
export async function consumePasswordResetToken(
  rawToken: string,
  passwordHash: string
): Promise<{ userId: string } | null> {
  const row = await findTokenRow(rawToken);
  if (!row || row.expiresAt < new Date()) {
    if (row) await prisma.passwordResetToken.deleteMany({ where: { tokenHash: row.tokenHash } });
    return null;
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.deleteMany({ where: { userId: row.userId } }),
  ]);

  return { userId: row.userId };
}

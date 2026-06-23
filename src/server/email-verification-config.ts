import { isSmtpConfigured } from './mail-transport';

/**
 * When SKIP_EMAIL_VERIFICATION=true, new registrations are marked verified
 * immediately (no SMTP email). Login also auto-verifies legacy pending accounts.
 * Default: real email verification is required (Nodemailer + SMTP in production).
 */
export function isEmailVerificationRequired(): boolean {
  const raw = process.env.SKIP_EMAIL_VERIFICATION?.trim().toLowerCase();
  if (raw === 'true' || raw === '1' || raw === 'yes') return false;
  return true;
}

/** Password reset emails use the same SMTP setup as verification emails. */
export function isPasswordResetByEmailEnabled(): boolean {
  if (!isEmailVerificationRequired()) return false;
  return isSmtpConfigured();
}

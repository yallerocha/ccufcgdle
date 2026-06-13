/**
 * When SKIP_EMAIL_VERIFICATION=true, new @ufcg registrations are marked verified
 * immediately (no Resend email). Login also auto-verifies legacy pending accounts.
 * Default: real email verification is required (Resend + verified domain in production).
 */
export function isEmailVerificationRequired(): boolean {
  const raw = process.env.SKIP_EMAIL_VERIFICATION?.trim().toLowerCase();
  if (raw === 'true' || raw === '1' || raw === 'yes') return false;
  return true;
}

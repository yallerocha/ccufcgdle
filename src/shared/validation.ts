// Shared validation for account fields (email, password, display name, photo),
// enforced on the server so the database can't be filled with malformed values.

// Only members of the Computing programs at UFCG may register.
export const ALLOWED_EMAIL_DOMAINS = [
  'ccc.ufcg.edu.br',
  'computacao.ufcg.edu.br',
  'copin.ufcg.edu.br',
] as const;

export function formatAllowedEmailDomains(): string {
  return ALLOWED_EMAIL_DOMAINS.map((d) => `@${d}`).join(', ');
}

export function isAllowedEmailDomain(email: string): boolean {
  if (typeof email !== 'string') return false;
  const at = email.lastIndexOf('@');
  if (at < 0) return false;
  const domain = email.slice(at + 1).toLowerCase();
  return (ALLOWED_EMAIL_DOMAINS as readonly string[]).includes(domain);
}

// Password policy: at least 8 chars with an uppercase letter, a lowercase
// letter and a digit.
export const PASSWORD_MIN_LENGTH = 8;

export function isStrongPassword(password: string): boolean {
  return (
    typeof password === 'string' &&
    password.length >= PASSWORD_MIN_LENGTH &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

/** Display name / nickname shown in the game (3–25 characters). */
export function validateDisplayName(name: unknown): string | null {
  if (typeof name !== 'string' || name.length < 3 || name.length > 25) {
    return 'O nome/apelido deve ter entre 3 e 25 caracteres.';
  }
  return null;
}

// Max size of an accepted profile photo, in bytes of decoded image data (~2MB,
// matching the client-side limit). Photos are stored inline as base64 data URLs.
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

// Validates an optional profile photo: must be empty/absent or a base64-encoded
// image data URL within the size limit. Any image/* mime is accepted — uploads
// come from <input accept="image/*">, so restricting to a fixed mime list would
// reject valid photos (e.g. AVIF) including ones already stored before this
// validation existed.
export function validatePhoto(photoUrl?: string | null): string | null {
  if (photoUrl === undefined || photoUrl === null || photoUrl === '') return null;
  if (typeof photoUrl !== 'string') return 'Foto inválida.';

  const match = /^data:image\/[a-z0-9.+-]+;base64,([A-Za-z0-9+/=]+)$/i.exec(photoUrl);
  if (!match) return 'Formato de foto inválido.';

  const base64 = match[1];
  // Decoded byte length of base64 without constructing the buffer.
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  const bytes = Math.floor((base64.length * 3) / 4) - padding;
  if (bytes > MAX_PHOTO_BYTES) return 'A foto é muito grande (máx. 2MB).';

  return null;
}

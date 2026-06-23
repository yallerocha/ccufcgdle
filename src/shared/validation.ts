// Canonical allowed values for the game's "enum-like" fields. These mirror the
// options offered by the registration/profile forms and are enforced on the
// server so the database can't be filled with arbitrary or malformed values
// (which would also break the guess-comparison logic).

export const GENDER_OPTIONS = ['Masculino', 'Feminino', 'Outro'] as const;

export const ROLE_OPTIONS = [
  'Professor',
  'Graduando',
  'Mestrando',
  'Doutorando',
  'Pesquisador',
  'Funcionário',
] as const;

export const ENTRY_OPTIONS = [
  'Antes de 2018',
  '2018.1', '2018.2',
  '2019.1', '2019.2',
  '2020.1', '2020.2',
  '2021.1', '2021.2',
  '2022.1', '2022.2',
  '2023.1', '2023.2',
  '2024.1', '2024.2',
  '2025.1', '2025.2',
  '2026.1',
] as const;

export const COLAB_OPTIONS = ['Sim', 'Não'] as const;

export const AREA_OPTIONS = [
  'Engenharia de Software',
  'Sistemas Distribuídos / Redes',
  'Ciência de Dados / IA',
  'Engenharia de Dados',
  'Aprendizado de Máquina',
  'Teoria da Computação',
  'Compiladores / Linguagens',
  'Sistemas Operacionais',
  'Banco de Dados',
  'Hardware / Embarcados',
  'Internet das Coisas (IoT)',
  'Computação em Nuvem',
  'Segurança da Informação',
  'Interação Humano-Computador',
  'Computação Gráfica / Visualização',
  'Arquitetura de Computadores',
  'Outra',
] as const;

export const PROJECT_OTHER_NAME = 'Outro' as const;

export const DEFAULT_PROJECT_NAMES = [PROJECT_OTHER_NAME] as const;

/** @deprecated Use DEFAULT_PROJECT_NAMES — kept for imports that expect PROJECT_OPTIONS */
export const PROJECT_OPTIONS = DEFAULT_PROJECT_NAMES;

export const MAX_PROJECT_NAME_LENGTH = 60;
export const MAX_PROJECTS_PER_USER = 1;
export const MAX_AREAS_PER_USER = 8;

export function normalizeProjectName(name: unknown): string | null {
  if (typeof name !== 'string') return null;
  const normalized = name.trim().replace(/\s+/g, ' ');
  if (normalized.length < 2 || normalized.length > MAX_PROJECT_NAME_LENGTH) return null;
  return normalized;
}

export const COFFEE_OPTIONS = ['Sim', 'Não', 'Só energético'] as const;

// Only members of the Computing programs at UFCG may register.
export const ALLOWED_EMAIL_DOMAINS = ['ccc.ufcg.edu.br', 'computacao.ufcg.edu.br', 'lsd.ufcg.edu.br'] as const;

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

// Max size of an accepted profile photo, in bytes of decoded image data (~2MB,
// matching the client-side limit). Photos are stored inline as base64 data URLs.
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

export interface CharacterFields {
  gender: string;
  role: string;
  entrySemester: string;
  isColab: string;
  area: string[];
  projects: string[];
  likesCoffee: string;
  photoUrl?: string | null;
}

// Validates the shared character attributes. Returns an error message (in
// Portuguese, to surface directly to the user) or null when everything is valid.
// `allowedProjects` must be the current Project catalog from the database.
export function validateCharacterFields(
  input: CharacterFields,
  options?: { allowedProjects?: ReadonlySet<string> }
): string | null {
  const inList = (value: unknown, list: readonly string[]) =>
    typeof value === 'string' && list.includes(value);

  if (!inList(input.gender, GENDER_OPTIONS)) return 'Gênero inválido.';
  if (!inList(input.role, ROLE_OPTIONS)) return 'Função inválida.';
  if (!inList(input.entrySemester, ENTRY_OPTIONS)) return 'Semestre de entrada inválido.';
  if (!inList(input.isColab, COLAB_OPTIONS)) return 'Valor inválido para Colabs.';
  if (!inList(input.likesCoffee, COFFEE_OPTIONS)) return 'Valor inválido para café.';

  if (!Array.isArray(input.area) || input.area.length === 0) {
    return 'Selecione ao menos uma área de interesse.';
  }
  if (input.area.length > MAX_AREAS_PER_USER) {
    return `Selecione no máximo ${MAX_AREAS_PER_USER} áreas.`;
  }
  if (input.area.some((a) => !inList(a, AREA_OPTIONS))) return 'Área inválida.';

  if (!Array.isArray(input.projects) || input.projects.length !== 1) {
    return 'Selecione exatamente um projeto.';
  }
  const allowed = options?.allowedProjects;
  if (!allowed) {
    if (input.projects.some((p) => typeof p !== 'string' || !(DEFAULT_PROJECT_NAMES as readonly string[]).includes(p))) {
      return 'Projeto inválido.';
    }
  } else if (input.projects.some((p) => typeof p !== 'string' || !allowed.has(p))) {
    return 'Projeto inválido.';
  }

  const photoError = validatePhoto(input.photoUrl);
  if (photoError) return photoError;

  return null;
}

export type ProfileCharacterFields = Pick<
  CharacterFields,
  'gender' | 'role' | 'entrySemester' | 'isColab' | 'area' | 'projects' | 'likesCoffee'
>;

/** True when all character fields required to appear in LSDLE are filled. */
export function isProfileComplete(input: ProfileCharacterFields): boolean {
  const inList = (value: string, list: readonly string[]) => list.includes(value);

  if (!inList(input.gender, GENDER_OPTIONS)) return false;
  if (!inList(input.role, ROLE_OPTIONS)) return false;
  if (!inList(input.entrySemester, ENTRY_OPTIONS)) return false;
  if (!inList(input.isColab, COLAB_OPTIONS)) return false;
  if (!inList(input.likesCoffee, COFFEE_OPTIONS)) return false;
  if (!Array.isArray(input.area) || input.area.length === 0 || input.area.length > MAX_AREAS_PER_USER) {
    return false;
  }
  if (input.area.some((a) => !inList(a, AREA_OPTIONS))) return false;
  if (!Array.isArray(input.projects) || input.projects.length !== MAX_PROJECTS_PER_USER) return false;
  if (typeof input.projects[0] !== 'string' || normalizeProjectName(input.projects[0]) === null) return false;
  return true;
}

/** Validates field formats without requiring every attribute to be filled (partial saves). */
export function validateCharacterFieldValues(
  input: CharacterFields,
  options?: { allowedProjects?: ReadonlySet<string> }
): string | null {
  const inList = (value: unknown, list: readonly string[]) =>
    typeof value === 'string' && value !== '' && list.includes(value);

  if (input.gender && !inList(input.gender, GENDER_OPTIONS)) return 'Gênero inválido.';
  if (input.role && !inList(input.role, ROLE_OPTIONS)) return 'Função inválida.';
  if (input.entrySemester && !inList(input.entrySemester, ENTRY_OPTIONS)) return 'Semestre de entrada inválido.';
  if (input.isColab && !inList(input.isColab, COLAB_OPTIONS)) return 'Valor inválido para Colabs.';
  if (input.likesCoffee && !inList(input.likesCoffee, COFFEE_OPTIONS)) return 'Valor inválido para café.';

  if (Array.isArray(input.area) && input.area.length > 0) {
    if (input.area.length > MAX_AREAS_PER_USER) {
      return `Selecione no máximo ${MAX_AREAS_PER_USER} áreas.`;
    }
    if (input.area.some((a) => !inList(a, AREA_OPTIONS))) return 'Área inválida.';
  }

  if (Array.isArray(input.projects) && input.projects.length > 0) {
    if (input.projects.length > MAX_PROJECTS_PER_USER) {
      return 'Selecione no máximo um projeto.';
    }
    const allowed = options?.allowedProjects;
    if (!allowed) {
      if (input.projects.some((p) => typeof p !== 'string' || !(DEFAULT_PROJECT_NAMES as readonly string[]).includes(p))) {
        return 'Projeto inválido.';
      }
    } else if (input.projects.some((p) => typeof p !== 'string' || !allowed.has(p))) {
      return 'Projeto inválido.';
    }
  }

  const photoError = validatePhoto(input.photoUrl);
  if (photoError) return photoError;

  return null;
}

// Max length of the message the person of the day may leave for the players who
// guess them.
export const MAX_DAILY_MESSAGE_LENGTH = 120;

// Validates the optional message + image the person of the day leaves behind.
// `message` must fit the length limit; `mediaUrl` reuses the photo rules (a
// base64 image data URL within the size limit). Both may be empty — that simply
// clears the message.
export function validateDailyMessage(message?: string | null, mediaUrl?: string | null): string | null {
  if (message !== undefined && message !== null) {
    if (typeof message !== 'string') return 'Mensagem inválida.';
    if (message.length > MAX_DAILY_MESSAGE_LENGTH) {
      return `A mensagem é muito longa (máx. ${MAX_DAILY_MESSAGE_LENGTH} caracteres).`;
    }
  }
  return validatePhoto(mediaUrl);
}

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

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
  'Teoria da Computação',
  'Hardware / Embarcados',
  'Segurança da Informação',
  'Outra',
] as const;

export const PROJECT_OPTIONS = [
  'Computação em Nuvem',
  'Computação na Borda',
  'Blockchain',
  'Big Data',
  'HPC',
  'Observabilidade',
  'IoT',
  'Computação Verde',
  'Outro',
] as const;

export const COFFEE_OPTIONS = ['Sim', 'Não', 'Só energético'] as const;

// Max size of an accepted profile photo, in bytes of decoded image data (~2MB,
// matching the client-side limit). Photos are stored inline as base64 data URLs.
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

export interface CharacterFields {
  gender: string;
  role: string;
  entrySemester: string;
  isColab: string;
  area: string;
  projects: string[];
  likesCoffee: string;
  photoUrl?: string | null;
}

// Validates the shared character attributes. Returns an error message (in
// Portuguese, to surface directly to the user) or null when everything is valid.
export function validateCharacterFields(input: CharacterFields): string | null {
  const inList = (value: unknown, list: readonly string[]) =>
    typeof value === 'string' && list.includes(value);

  if (!inList(input.gender, GENDER_OPTIONS)) return 'Gênero inválido.';
  if (!inList(input.role, ROLE_OPTIONS)) return 'Função inválida.';
  if (!inList(input.entrySemester, ENTRY_OPTIONS)) return 'Semestre de entrada inválido.';
  if (!inList(input.isColab, COLAB_OPTIONS)) return 'Valor inválido para Colabs.';
  if (!inList(input.area, AREA_OPTIONS)) return 'Área inválida.';
  if (!inList(input.likesCoffee, COFFEE_OPTIONS)) return 'Valor inválido para café.';

  if (!Array.isArray(input.projects) || input.projects.length === 0) {
    return 'Selecione ao menos um projeto.';
  }
  if (input.projects.some((p) => !inList(p, PROJECT_OPTIONS))) {
    return 'Projeto inválido.';
  }

  const photoError = validatePhoto(input.photoUrl);
  if (photoError) return photoError;

  return null;
}

// Validates an optional profile photo: must be empty/absent or a base64-encoded
// image data URL within the size limit.
export function validatePhoto(photoUrl?: string | null): string | null {
  if (photoUrl === undefined || photoUrl === null || photoUrl === '') return null;
  if (typeof photoUrl !== 'string') return 'Foto inválida.';

  const match = /^data:image\/(png|jpe?g|webp|gif);base64,([A-Za-z0-9+/=]+)$/.exec(photoUrl);
  if (!match) return 'Formato de foto inválido.';

  const base64 = match[2];
  // Decoded byte length of base64 without constructing the buffer.
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  const bytes = Math.floor((base64.length * 3) / 4) - padding;
  if (bytes > MAX_PHOTO_BYTES) return 'A foto é muito grande (máx. 2MB).';

  return null;
}

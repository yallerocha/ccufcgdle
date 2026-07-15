import { prisma } from './db';
import { getLocalDateString } from '@/shared/utils';

// The daily word length follows the day's solution (4–8 letters), so rounds vary
// in difficulty. MAX_ATTEMPTS stays fixed regardless of length.
export const MIN_WORD_LENGTH = 4;
export const MAX_WORD_LENGTH = 8;
export const MAX_ATTEMPTS = 6;

// Per-letter feedback, Wordle-style:
//  - 'correct' : right letter, right position (green)
//  - 'present' : letter is in the word, wrong position (yellow)
//  - 'absent'  : letter is not in the word (gray)
export type LetterResult = 'correct' | 'present' | 'absent';

// Curated pool of computing terms (pt-BR plus consolidated tech loanwords) used
// as daily answers, in varied lengths so each day can have a different board.
// Stored with their accented display form; matching always happens on the
// normalized (accent-free, uppercase) form. Since the theme is computing, any
// well-formed word of the right length is accepted as a guess (there is no
// general dictionary of tech terms to validate against).
const WORDS: string[] = [
  // 4 letters
  'BYTE', 'REDE', 'CHIP', 'DADO', 'JAVA', 'LOOP', 'WIFI', 'CABO', 'BIOS', 'RUST',
  'PING', 'SITE', 'FILA', 'ROBÔ',
  // 5 letters
  'MOUSE', 'CACHE', 'ARRAY', 'LINUX', 'PIXEL', 'MODEM', 'PLACA', 'DISCO', 'PORTA',
  'SENHA', 'TECLA', 'MICRO', 'BANCO', 'GRAFO', 'PILHA', 'LISTA', 'VETOR', 'TOKEN',
  'PROXY', 'LOGIN', 'DEBUG', 'FIBRA', 'NUVEM', 'DADOS', 'VÍRUS',
  // 6 letters
  'KERNEL', 'PYTHON', 'CÓDIGO', 'SCRIPT', 'CLASSE', 'OBJETO', 'MÉTODO', 'THREAD',
  'BUFFER', 'DRIVER', 'CURSOR', 'TABELA', 'ÍNDICE', 'PACOTE', 'SOCKET', 'COOKIE',
  'BACKUP', 'LAPTOP', 'SWITCH', 'MATRIZ', 'FUNÇÃO', 'HACKER',
  // 7 letters
  'MEMÓRIA', 'BINÁRIO', 'SISTEMA', 'ARQUIVO', 'MONITOR', 'TECLADO', 'CONSOLE',
  'DOMÍNIO', 'USUÁRIO', 'HASKELL', 'ANDROID', 'CLUSTER',
  // 8 letters
  'INTERNET', 'PROGRAMA', 'PROCESSO', 'CIRCUITO', 'PONTEIRO', 'DEADLOCK',
  'FIREWALL', 'TERMINAL', 'SOFTWARE', 'HARDWARE', 'NOTEBOOK', 'ITERAÇÃO',
  'RECURSÃO',
].filter((w) => {
  const len = normalize(w).length;
  return len >= MIN_WORD_LENGTH && len <= MAX_WORD_LENGTH;
});

// Uppercase, strip diacritics, keep only A–Z. "ção" → "CAO", "saúde" → "SAUDE".
export function normalize(word: string): string {
  return word
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
}

// normalized form -> accented display form. Built from the curated answers so
// daily reveals (and matching guesses) show their exact accents.
const DISPLAY_BY_NORM = new Map<string, string>();
for (const w of WORDS) {
  DISPLAY_BY_NORM.set(normalize(w), w);
}

// A guess is any A–Z word of the round's length — the computing theme has no
// exhaustive dictionary, so unlike classic Termo there is no word-list check.
export function isValidGuess(normalized: string, length: number): boolean {
  return normalized.length === length && /^[A-Z]+$/.test(normalized);
}

export function displayFor(normalized: string): string {
  return DISPLAY_BY_NORM.get(normalized) ?? normalized;
}

// Deterministic daily index so everyone gets the same word for a given date.
// FNV-1a + a final xorshift mix: gives a well-spread value even for sequential
// dates (a plain `h*31+c` left near-sequential indices, e.g. 185,186,187…).
export function hashString(str: string): number {
  let h = 2166136261; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619); // FNV prime
  }
  // Final avalanche so adjacent inputs land far apart.
  h ^= h >>> 15;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  return h >>> 0; // unsigned
}

export interface DailyWord {
  word: string; // normalized solution
  display: string; // accented form for the reveal
}

// A truly random answer word from the pool (used by the admin "draw new", which
// must differ from the deterministic daily pick).
export function randomWord(): DailyWord {
  const display = WORDS[Math.floor(Math.random() * WORDS.length)];
  return { word: normalize(display), display };
}

// Returns today's (or the given date's) solution, creating + persisting it on
// first access so admin resets and ranking stay consistent for the round.
export async function getOrCreateDailyWord(dateStr?: string): Promise<DailyWord> {
  const date = dateStr || getLocalDateString();

  const existing = await prisma.termoDaily.findUnique({ where: { date } });
  if (existing) {
    return { word: existing.word, display: existing.display };
  }

  const display = WORDS[hashString(date) % WORDS.length];
  const word = normalize(display);

  try {
    const created = await prisma.termoDaily.create({ data: { date, word, display } });
    return { word: created.word, display: created.display };
  } catch {
    // Parallel create: re-read whatever landed.
    const again = await prisma.termoDaily.findUnique({ where: { date } });
    return again ? { word: again.word, display: again.display } : { word, display };
  }
}

// Two-pass evaluation so repeated letters are colored correctly (a 'present'
// letter is only awarded if an unmatched copy of it remains in the solution).
export function evaluateGuess(guessNorm: string, solutionNorm: string): LetterResult[] {
  const length = solutionNorm.length;
  const result: LetterResult[] = new Array(length).fill('absent');
  const remaining: Record<string, number> = {};

  // Pass 1: exact matches.
  for (let i = 0; i < length; i++) {
    if (guessNorm[i] === solutionNorm[i]) {
      result[i] = 'correct';
    } else {
      remaining[solutionNorm[i]] = (remaining[solutionNorm[i]] ?? 0) + 1;
    }
  }

  // Pass 2: present-but-misplaced, limited by leftover counts.
  for (let i = 0; i < length; i++) {
    if (result[i] === 'correct') continue;
    const letter = guessNorm[i];
    if (remaining[letter] > 0) {
      result[i] = 'present';
      remaining[letter] -= 1;
    }
  }

  return result;
}

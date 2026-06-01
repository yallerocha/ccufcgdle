import { prisma } from './db';
import { getLocalDateString } from '@/shared/utils';
import { normalize, hashString } from './termo';
import { getActiveUsers } from './game';

// Classic hangman: 6 wrong guesses complete the drawing (head, torso, 2 arms,
// 2 legs) and the round is lost.
export const MAX_WRONG = 6;

// Curated pool of well-known Portuguese words (varied length), stored in their
// accented display form. Matching always uses the normalized (accent-free,
// uppercase) form, so the player guesses plain A–Z letters.
const WORDS: string[] = [
  'ABACAXI', 'ABACATE', 'ABELHA', 'AMARELO', 'AMIZADE', 'ANIMAL', 'BALEIA', 'BANANA',
  'BANDEIRA', 'BIBLIOTECA', 'BICICLETA', 'BOLACHA', 'BORBOLETA', 'BRASIL', 'CABELO',
  'CACHORRO', 'CADERNO', 'CAMINHO', 'CANETA', 'CASTELO', 'CAVALO', 'CEBOLA', 'CENOURA',
  'CHOCOLATE', 'CHUVEIRO', 'CIDADE', 'COELHO', 'COMPUTADOR', 'CORAÇÃO', 'DENTISTA',
  'DINHEIRO', 'ELEFANTE', 'ESCOLA', 'ESTRELA', 'FAMÍLIA', 'FAZENDA', 'FEIJÃO', 'FLORESTA',
  'FOGUETE', 'FUTEBOL', 'GARRAFA', 'GAVETA', 'GELADEIRA', 'GIRAFA', 'GUITARRA', 'HOSPITAL',
  'IGREJA', 'JACARÉ', 'JANELA', 'JANTAR', 'JARDIM', 'LAGARTO', 'LARANJA', 'LIBERDADE',
  'MACACO', 'MARTELO', 'MÉDICO', 'MELANCIA', 'MOCHILA', 'MONTANHA', 'MORANGO', 'MÚSICA',
  'NATUREZA', 'OCEANO', 'ÓCULOS', 'PALHAÇO', 'PANELA', 'PÁSSARO', 'PEIXE', 'PIMENTA',
  'PLANETA', 'PRESENTE', 'RELÓGIO', 'SANDÁLIA', 'SAPATO', 'SOLDADO', 'TARTARUGA',
  'TELEFONE', 'TESOURA', 'TIJOLO', 'TOMATE', 'VENTANIA', 'VIOLÃO', 'JANGADA', 'ABELHUDO',
  'CAMISETA', 'CERVEJA', 'DRAGÃO', 'ESPELHO', 'FANTASMA', 'GUARDIÃO', 'HISTÓRIA',
  'JORNAL', 'LÂMPADA', 'MÁGICO', 'NAVIO', 'PIPOCA', 'QUADRO', 'RAPOSA', 'SORVETE',
  'TECLADO', 'UNIVERSO', 'VINAGRE', 'ZEBRA',
].filter((w) => normalize(w).length >= 4);

// normalized -> accented display form, for revealing the answer.
const DISPLAY_BY_NORM = new Map<string, string>(WORDS.map((w) => [normalize(w), w]));

export function displayFor(normalized: string): string {
  return DISPLAY_BY_NORM.get(normalized) ?? normalized;
}

export interface DailyWord {
  word: string; // normalized solution
  display: string; // accented form for the reveal
  personName: string | null; // the registered person you're "saving"
  personPhoto: string | null;
}

// A truly random word from the pool (used by the admin "draw new").
export function randomWord(): { word: string; display: string } {
  const display = WORDS[Math.floor(Math.random() * WORDS.length)];
  return { word: normalize(display), display };
}

// Pick the active registered person to be "saved" today (flavor only).
// Deterministic by date — same date → same person — but seeded differently from
// the word ('forca-person:'), so the word and person aren't correlated. The
// active-user list can change over time; that only shifts who maps to a date,
// which is fine since the choice is snapshotted into ForcaDaily on creation.
async function pickDailyPerson(date: string): Promise<{ name: string | null; photo: string | null }> {
  try {
    const users = await getActiveUsers();
    if (users.length === 0) return { name: null, photo: null };
    const sorted = [...users].sort((a, b) => a.id.localeCompare(b.id));
    const u = sorted[hashString(`forca-person:${date}`) % sorted.length];
    return { name: u.name, photo: u.photoUrl ?? null };
  } catch {
    return { name: null, photo: null };
  }
}

export async function getOrCreateDailyWord(dateStr?: string): Promise<DailyWord> {
  const date = dateStr || getLocalDateString();

  const existing = await prisma.forcaDaily.findUnique({ where: { date } });
  if (existing) {
    return {
      word: existing.word,
      display: existing.display,
      personName: existing.personName,
      personPhoto: existing.personPhoto,
    };
  }

  const display = WORDS[hashString(date) % WORDS.length];
  const word = normalize(display);
  const person = await pickDailyPerson(date);

  try {
    const created = await prisma.forcaDaily.create({
      data: { date, word, display, personName: person.name, personPhoto: person.photo },
    });
    return {
      word: created.word,
      display: created.display,
      personName: created.personName,
      personPhoto: created.personPhoto,
    };
  } catch {
    const again = await prisma.forcaDaily.findUnique({ where: { date } });
    return again
      ? { word: again.word, display: again.display, personName: again.personName, personPhoto: again.personPhoto }
      : { word, display, personName: person.name, personPhoto: person.photo };
  }
}

// Distinct wrong letters in a guessed set, given the solution.
export function countWrong(guessed: string, solutionNorm: string): number {
  let wrong = 0;
  for (const letter of new Set(guessed.split(''))) {
    if (letter && !solutionNorm.includes(letter)) wrong++;
  }
  return wrong;
}

// True when every distinct letter of the solution has been guessed.
export function isSolved(guessed: string, solutionNorm: string): boolean {
  const set = new Set(guessed.split(''));
  for (const letter of new Set(solutionNorm.split(''))) {
    if (!set.has(letter)) return false;
  }
  return true;
}

// Validate / list a custom admin word against the pool's normalization rules.
export function isPoolWord(normalized: string): boolean {
  return DISPLAY_BY_NORM.has(normalized);
}

import { prisma } from './db';
import { getLocalDateString } from '@/shared/utils';
import { normalize, hashString } from './termo';
import { getActiveUsers, livePhotoByUserName } from './game';

// Classic hangman: 6 wrong guesses complete the drawing (head, torso, 2 arms,
// 2 legs) and the round is lost.
export const MAX_WRONG = 6;

// Curated pool of computing terms, each tagged with the theme/category shown to
// the player as a hint. Stored in their accented display form; matching always
// uses the normalized (accent-free, uppercase) form, so the player guesses plain
// A–Z letters. Theme values are kept in Portuguese (domain language of the site).
interface PoolEntry {
  display: string;
  theme: string;
}

const WORDS: PoolEntry[] = [
  // Linguagens de programação
  { display: 'PYTHON', theme: 'Linguagens de programação' },
  { display: 'JAVASCRIPT', theme: 'Linguagens de programação' },
  { display: 'HASKELL', theme: 'Linguagens de programação' },
  { display: 'FORTRAN', theme: 'Linguagens de programação' },
  { display: 'KOTLIN', theme: 'Linguagens de programação' },
  { display: 'PASCAL', theme: 'Linguagens de programação' },
  { display: 'PROLOG', theme: 'Linguagens de programação' },
  { display: 'ELIXIR', theme: 'Linguagens de programação' },
  { display: 'COBOL', theme: 'Linguagens de programação' },
  // Estruturas de dados
  { display: 'PILHA', theme: 'Estruturas de dados' },
  { display: 'FILA', theme: 'Estruturas de dados' },
  { display: 'GRAFO', theme: 'Estruturas de dados' },
  { display: 'VETOR', theme: 'Estruturas de dados' },
  { display: 'MATRIZ', theme: 'Estruturas de dados' },
  { display: 'DICIONÁRIO', theme: 'Estruturas de dados' },
  { display: 'ÁRVORE', theme: 'Estruturas de dados' },
  { display: 'LISTA', theme: 'Estruturas de dados' },
  // Redes de computadores
  { display: 'ROTEADOR', theme: 'Redes de computadores' },
  { display: 'PROTOCOLO', theme: 'Redes de computadores' },
  { display: 'ETHERNET', theme: 'Redes de computadores' },
  { display: 'SERVIDOR', theme: 'Redes de computadores' },
  { display: 'GATEWAY', theme: 'Redes de computadores' },
  { display: 'LATÊNCIA', theme: 'Redes de computadores' },
  { display: 'PACOTE', theme: 'Redes de computadores' },
  { display: 'DOMÍNIO', theme: 'Redes de computadores' },
  // Sistemas operacionais
  { display: 'KERNEL', theme: 'Sistemas operacionais' },
  { display: 'PROCESSO', theme: 'Sistemas operacionais' },
  { display: 'ESCALONADOR', theme: 'Sistemas operacionais' },
  { display: 'DEADLOCK', theme: 'Sistemas operacionais' },
  { display: 'PAGINAÇÃO', theme: 'Sistemas operacionais' },
  { display: 'INTERRUPÇÃO', theme: 'Sistemas operacionais' },
  { display: 'TERMINAL', theme: 'Sistemas operacionais' },
  // Banco de dados
  { display: 'CONSULTA', theme: 'Banco de dados' },
  { display: 'TABELA', theme: 'Banco de dados' },
  { display: 'ÍNDICE', theme: 'Banco de dados' },
  { display: 'TRANSAÇÃO', theme: 'Banco de dados' },
  { display: 'RELACIONAL', theme: 'Banco de dados' },
  { display: 'NORMALIZAÇÃO', theme: 'Banco de dados' },
  // Engenharia de software
  { display: 'REQUISITO', theme: 'Engenharia de software' },
  { display: 'REFATORAÇÃO', theme: 'Engenharia de software' },
  { display: 'VERSIONAMENTO', theme: 'Engenharia de software' },
  { display: 'PROTÓTIPO', theme: 'Engenharia de software' },
  { display: 'IMPLANTAÇÃO', theme: 'Engenharia de software' },
  { display: 'TESTES', theme: 'Engenharia de software' },
  // Segurança da informação
  { display: 'CRIPTOGRAFIA', theme: 'Segurança da informação' },
  { display: 'PHISHING', theme: 'Segurança da informação' },
  { display: 'ANTIVÍRUS', theme: 'Segurança da informação' },
  { display: 'AUTENTICAÇÃO', theme: 'Segurança da informação' },
  { display: 'MALWARE', theme: 'Segurança da informação' },
  { display: 'CERTIFICADO', theme: 'Segurança da informação' },
  { display: 'FIREWALL', theme: 'Segurança da informação' },
  // Inteligência artificial
  { display: 'NEURÔNIO', theme: 'Inteligência artificial' },
  { display: 'TREINAMENTO', theme: 'Inteligência artificial' },
  { display: 'REGRESSÃO', theme: 'Inteligência artificial' },
  { display: 'PERCEPTRON', theme: 'Inteligência artificial' },
  { display: 'HEURÍSTICA', theme: 'Inteligência artificial' },
  // Hardware
  { display: 'PROCESSADOR', theme: 'Hardware' },
  { display: 'TRANSISTOR', theme: 'Hardware' },
  { display: 'MEMÓRIA', theme: 'Hardware' },
  { display: 'TECLADO', theme: 'Hardware' },
  { display: 'MONITOR', theme: 'Hardware' },
  { display: 'IMPRESSORA', theme: 'Hardware' },
  { display: 'CIRCUITO', theme: 'Hardware' },
  // Teoria da computação
  { display: 'AUTÔMATO', theme: 'Teoria da computação' },
  { display: 'GRAMÁTICA', theme: 'Teoria da computação' },
  { display: 'RECURSÃO', theme: 'Teoria da computação' },
  { display: 'COMPLEXIDADE', theme: 'Teoria da computação' },
  { display: 'LINGUAGEM', theme: 'Teoria da computação' },
  // Algoritmos
  { display: 'ORDENAÇÃO', theme: 'Algoritmos' },
  { display: 'QUICKSORT', theme: 'Algoritmos' },
  { display: 'DIJKSTRA', theme: 'Algoritmos' },
  { display: 'BACKTRACKING', theme: 'Algoritmos' },
  // Programação
  { display: 'COMPILADOR', theme: 'Programação' },
  { display: 'VARIÁVEL', theme: 'Programação' },
  { display: 'PONTEIRO', theme: 'Programação' },
  { display: 'DEPURAÇÃO', theme: 'Programação' },
  { display: 'BIBLIOTECA', theme: 'Programação' },
  { display: 'FRAMEWORK', theme: 'Programação' },
].filter((w) => normalize(w.display).length >= 4);

// normalized -> pool entry, for revealing the answer and looking up the theme.
const ENTRY_BY_NORM = new Map<string, PoolEntry>(WORDS.map((w) => [normalize(w.display), w]));

export function displayFor(normalized: string): string {
  return ENTRY_BY_NORM.get(normalized)?.display ?? normalized;
}

export function themeFor(normalized: string): string {
  return ENTRY_BY_NORM.get(normalized)?.theme ?? '';
}

export interface DailyWord {
  word: string; // normalized solution
  display: string; // accented form for the reveal
  theme: string; // category hint shown to the player
  personName: string | null; // the registered person you're "saving"
  personPhoto: string | null;
}

// A truly random word from the pool (used by the admin "draw new").
export function randomWord(): { word: string; display: string; theme: string } {
  const entry = WORDS[Math.floor(Math.random() * WORDS.length)];
  return { word: normalize(entry.display), display: entry.display, theme: entry.theme };
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

// Rows created before the theme column existed have theme = ''; fall back to the
// pool lookup so old rounds still show a theme when the word is in the pool.
function themeOf(row: { word: string; theme: string }): string {
  return row.theme || themeFor(row.word);
}

export async function getOrCreateDailyWord(dateStr?: string): Promise<DailyWord> {
  const date = dateStr || getLocalDateString();

  const existing = await prisma.forcaDaily.findUnique({ where: { date } });
  if (existing) {
    const personPhoto = (await livePhotoByUserName(existing.personName)) ?? existing.personPhoto;
    return {
      word: existing.word,
      display: existing.display,
      theme: themeOf(existing),
      personName: existing.personName,
      personPhoto,
    };
  }

  const entry = WORDS[hashString(date) % WORDS.length];
  const word = normalize(entry.display);
  const person = await pickDailyPerson(date);

  try {
    const created = await prisma.forcaDaily.create({
      data: {
        date,
        word,
        display: entry.display,
        theme: entry.theme,
        personName: person.name,
        personPhoto: person.photo,
      },
    });
    const personPhoto = (await livePhotoByUserName(created.personName)) ?? created.personPhoto;
    return {
      word: created.word,
      display: created.display,
      theme: themeOf(created),
      personName: created.personName,
      personPhoto,
    };
  } catch {
    const again = await prisma.forcaDaily.findUnique({ where: { date } });
    if (again) {
      const personPhoto = (await livePhotoByUserName(again.personName)) ?? again.personPhoto;
      return {
        word: again.word,
        display: again.display,
        theme: themeOf(again),
        personName: again.personName,
        personPhoto,
      };
    }
    return {
      word,
      display: entry.display,
      theme: entry.theme,
      personName: person.name,
      personPhoto: person.photo,
    };
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
  return ENTRY_BY_NORM.has(normalized);
}

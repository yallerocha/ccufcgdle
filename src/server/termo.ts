import { prisma } from './db';
import { getLocalDateString } from '@/shared/utils';
import { TERMO_GUESS_WORDS } from './termo-words';

export const WORD_LENGTH = 5;
export const MAX_ATTEMPTS = 6;

// Per-letter feedback, Wordle-style:
//  - 'correct' : right letter, right position (green)
//  - 'present' : letter is in the word, wrong position (yellow)
//  - 'absent'  : letter is not in the word (gray)
export type LetterResult = 'correct' | 'present' | 'absent';

// Curated pool of 5-letter Portuguese words used as daily answers. Stored with
// their accented display form; matching always happens on the normalized
// (accent-free, uppercase) form. Accepted guesses come from TERMO_GUESS_WORDS.
const WORDS: string[] = [
  'ABRIR', 'ACENO', 'AGORA', 'ALUNO', 'AMIGO', 'AMORA', 'ANTES', 'AREIA', 'ARROZ', 'ASSIM',
  'ATLAS', 'ATUAL', 'AVISO', 'AZEDO', 'BALDE', 'BALSA', 'BANCO', 'BANHO', 'BARCO', 'BEIJO',
  'BICHO', 'BOLSA', 'BRAÇO', 'BRASA', 'BRAVO', 'BREVE', 'BRIGA', 'BROTO', 'CABRA', 'CALMA',
  'CALOR', 'CAMPO', 'CANAL', 'CANTO', 'CAPAZ', 'CARGA', 'CARTA', 'CARRO', 'CASAL', 'CAUSA',
  'CEDRO', 'CERCA', 'CHAPA', 'CHAVE', 'CHEIO', 'CHUVA', 'CICLO', 'CINCO', 'CINZA', 'CLARO',
  'CLIMA', 'CLUBE', 'COBRA', 'COISA', 'COLAR', 'COMER', 'CONTA', 'CORAL', 'CORPO', 'COURO',
  'CREME', 'CRISE', 'CRUZA', 'CULPA', 'CURSO', 'CUSTO', 'DADOS', 'DENTE', 'DEVER', 'DICAS',
  'DIETA', 'DISCO', 'DOBRO', 'DÓLAR', 'DRAMA', 'DUPLA', 'ÉPOCA', 'ERVAS', 'FACAS', 'FALAR',
  'FALHA', 'FALTA', 'FAROL', 'FAZER', 'FEBRE', 'FELIZ', 'FENDA', 'FERRO', 'FESTA', 'FILHO',
  'FILME', 'FLORA', 'FOLHA', 'FORÇA', 'FORMA', 'FRACO', 'FRADE', 'FRASE', 'FRITO', 'FRUTA',
  'FUGIR', 'FUNDO', 'GAROA', 'GATOS', 'GANHO', 'GARFO', 'GENTE', 'GENRO', 'GESTO', 'GLOBO',
  'GORDO', 'GOSTO', 'GRAÇA', 'GRADE', 'GRAMA', 'GRAVE', 'GREVE', 'GRITO', 'GRUPO', 'GRUTA',
  'HINOS', 'HORDA', 'HUMOR', 'IDEIA', 'IGUAL', 'IRMÃO', 'ISOLA', 'JARRO', 'JEITO', 'JOGAR',
  'JOVEM', 'JULHO', 'JUNTO', 'LABOR', 'LÁPIS', 'LAÇOS', 'LARGO', 'LEGAL', 'LEITE', 'LENHA',
  'LENTO', 'LETRA', 'LIÇÃO', 'LIMPO', 'LINDO', 'LIVRE', 'LIVRO', 'LOJAS', 'LOMBO', 'LONGE',
  'LOUCO', 'LUGAR', 'MACHO', 'MAGRO', 'MALHA', 'MANHÃ', 'MANGA', 'MAPAS', 'MARCO', 'MATAR',
  'MEDIR', 'MEDOS', 'MELÃO', 'MENOR', 'MENOS', 'MESMO', 'METAL', 'METRO', 'MEXER', 'MICRO',
  'MILHO', 'MINHA', 'MISSA', 'MITOS', 'MODAS', 'MOEDA', 'MONTE', 'MORAR', 'MORNO', 'MORRO',
  'MORTE', 'MOTOR', 'MUDAR', 'MUNDO', 'MURAL', 'MUSEU', 'NAÇÃO', 'NADAR', 'NATAL', 'NAVIO',
  'NEGRO', 'NERVO', 'NICHO', 'NOITE', 'NOIVA', 'NORTE', 'NOZES', 'NUVEM', 'OESTE', 'OLHAR',
  'OLIVA', 'OMBRO', 'OPERA', 'ORDEM', 'OSTRA', 'ÓTICA', 'OUVIR', 'OUTRO', 'OVINO', 'PACTO',
  'PADRE', 'PAGAR', 'PALCO', 'PALMA', 'PAPEL', 'PARAR', 'PARTE', 'PASSO', 'PASTA', 'PATAS',
  'PAUSA', 'PAVOR', 'PEDRA', 'PEITO', 'PEIXE', 'PENSA', 'PENSO', 'PERCA', 'PERDE', 'PERNA',
  'PESCA', 'PIANO', 'PILHA', 'PINHO', 'PINTO', 'PISTA', 'PLACA', 'PLANO', 'PLENO', 'PLUMA',
  'POBRE', 'POEMA', 'PODER', 'POLPA', 'POLVO', 'PONTE', 'PONTO', 'PORCA', 'PORCO', 'PORTA',
  'POSTE', 'POUCO', 'PRADO', 'PRAIA', 'PRATO', 'PRAZO', 'PRECE', 'PREÇO', 'PRESO', 'PRIMA',
  'PROSA', 'PROVA', 'PUDOR', 'PULAR', 'QUASE', 'QUEDA', 'QUERO', 'QUOTA', 'RÁDIO', 'RAIVA',
  'RAMPA', 'RAPAZ', 'RATOS', 'REGRA', 'REINO', 'RENDA', 'RESTO', 'RISCO', 'RITMO', 'ROCHA',
  'RODAR', 'ROUPA', 'RUBRO', 'RURAL', 'SABER', 'SABIA', 'SABOR', 'SALMO', 'SALTO', 'SANTO',
  'SAPOS', 'SAÚDE', 'SEIVA', 'SELVA', 'SENHA', 'SÉRIE', 'SERRA', 'SERVO', 'SINAL', 'SOBRA',
  'SÓCIO', 'SOLTO', 'SONDA', 'SONHO', 'SOPRO', 'SORTE', 'SUBIR', 'SUAVE', 'SUÍNO', 'SURDO',
  'TAMPA', 'TARDE', 'TECLA', 'TEMOR', 'TEMPO', 'TENDA', 'TENOR', 'TERMO', 'TERRA', 'TESTE',
  'TIGRE', 'TOCAR', 'TOCHA', 'TOQUE', 'TOMAR', 'TORRE', 'TORTA', 'TRAMA', 'TRAVA', 'TRIBO',
  'TRIGO', 'TREVO', 'TROCA', 'TROCO', 'TURMA', 'ÚNICO', 'USUAL', 'VAGAR', 'VALOR', 'VALSA',
  'VAPOR', 'VAZIO', 'VELHO', 'VENTO', 'VERBO', 'VERDE', 'VESPA', 'VÍDEO', 'VIDRO', 'VIOLA',
  'VINHO', 'VIRAR', 'VISTA', 'VITAL', 'VIVER', 'VOLTA', 'VOTAR', 'VOZES', 'ZEBRA', 'ZINCO',
  'ZOMBA',
].filter((w) => normalize(w).length === WORD_LENGTH);

// Uppercase, strip diacritics, keep only A–Z. "ção" → "CAO", "saúde" → "SAUDE".
export function normalize(word: string): string {
  return word
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
}

// normalized form -> accented display form, used both to validate a guess and to
// auto-fill its accents. Built from the broad accepted-guess dictionary, with the
// curated answer words layered on top so daily reveals use their exact accents.
const DISPLAY_BY_NORM = new Map<string, string>();
for (const w of TERMO_GUESS_WORDS) {
  const n = normalize(w);
  if (n.length === WORD_LENGTH && !DISPLAY_BY_NORM.has(n)) DISPLAY_BY_NORM.set(n, w);
}
for (const w of WORDS) {
  DISPLAY_BY_NORM.set(normalize(w), w); // curated answers win for display
}
const VALID_GUESSES = new Set(DISPLAY_BY_NORM.keys());

export function isValidGuess(normalized: string): boolean {
  return VALID_GUESSES.has(normalized);
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
  const result: LetterResult[] = new Array(WORD_LENGTH).fill('absent');
  const remaining: Record<string, number> = {};

  // Pass 1: exact matches.
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessNorm[i] === solutionNorm[i]) {
      result[i] = 'correct';
    } else {
      remaining[solutionNorm[i]] = (remaining[solutionNorm[i]] ?? 0) + 1;
    }
  }

  // Pass 2: present-but-misplaced, limited by leftover counts.
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === 'correct') continue;
    const letter = guessNorm[i];
    if (remaining[letter] > 0) {
      result[i] = 'present';
      remaining[letter] -= 1;
    }
  }

  return result;
}

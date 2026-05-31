import { prisma } from './db';
import { getLocalDateString } from '@/shared/utils';

export const WORD_LENGTH = 5;
export const MAX_ATTEMPTS = 6;

// Per-letter feedback, Wordle-style:
//  - 'correct' : right letter, right position (green)
//  - 'present' : letter is in the word, wrong position (yellow)
//  - 'absent'  : letter is not in the word (gray)
export type LetterResult = 'correct' | 'present' | 'absent';

// Curated pool of 5-letter Portuguese words. Stored with their accented display
// form; matching always happens on the normalized (accent-free, uppercase) form,
// so players type plain A–Z letters. This same list is the set of accepted
// guesses, so a guess only counts if it is a real word from the pool.
const WORDS: string[] = [
  'ABRIR', 'AGORA', 'AMIGO', 'AMORA', 'ANTES', 'AREIA', 'ARROZ', 'ASSIM', 'ATUAL', 'AVISO',
  'AZEDO', 'BANCO', 'BANHO', 'BARCO', 'BEIJO', 'BICHO', 'BOLSA', 'BRAÇO', 'BRAVO', 'BREVE',
  'CABRA', 'CALMA', 'CAMPO', 'CANAL', 'CANTO', 'CARGA', 'CARRO', 'CASAL', 'CAUSA', 'CEDRO',
  'CHAVE', 'CHEIO', 'CHUVA', 'CICLO', 'CINCO', 'CLARO', 'COBRA', 'COLAR', 'COMER', 'CORPO',
  'COURO', 'CREME', 'CRISE', 'CULPA', 'CURSO', 'CUSTO', 'DENTE', 'DEVER', 'DISCO', 'DOBRO',
  'DRAMA', 'FALAR', 'FALHA', 'FAROL', 'FAZER', 'FEBRE', 'FENDA', 'FESTA', 'FILHO', 'FILME',
  'FLORA', 'FOLHA', 'FORÇA', 'FORMA', 'FRACO', 'FRASE', 'FRITO', 'FRUTA', 'FUGIR', 'FUNDO',
  'GANHO', 'GARFO', 'GESTO', 'GLOBO', 'GOSTO', 'GRADE', 'GRAMA', 'GRAVE', 'GRITO', 'GRUPO',
  'HUMOR', 'IDEIA', 'IGUAL', 'IRMÃO', 'JOGAR', 'JOVEM', 'JUNTO', 'LARGO', 'LEGAL', 'LEITE',
  'LENTO', 'LETRA', 'LIÇÃO', 'LIMPO', 'LINDO', 'LIVRE', 'LIVRO', 'LOUCO', 'LUGAR', 'MAGRO',
  'MANGA', 'MARCO', 'MEDIR', 'MELÃO', 'MENOR', 'METAL', 'METRO', 'MEXER', 'MOEDA', 'MORAR',
  'MORTE', 'MOTOR', 'MUNDO', 'NAÇÃO', 'NADAR', 'NEGRO', 'NERVO', 'NOITE', 'NOIVA', 'NUVEM',
  'OLHAR', 'ORDEM', 'OUTRO', 'OUVIR', 'PACTO', 'PADRE', 'PALCO', 'PAPEL', 'PARAR', 'PARTE',
  'PASTA', 'PEDRA', 'PEIXE', 'PENSO', 'PERNA', 'PESCA', 'PINTO', 'PISTA', 'PLACA', 'PLANO',
  'PLENO', 'POBRE', 'PODER', 'PONTE', 'PONTO', 'PORCO', 'PORTA', 'POSTE', 'POUCO', 'PRAIA',
  'PRATO', 'PRAZO', 'PREÇO', 'PRESO', 'PRIMA', 'PROVA', 'PULAR', 'QUASE', 'QUEDA', 'QUOTA',
  'RAIVA', 'REGRA', 'REINO', 'RENDA', 'RISCO', 'RITMO', 'ROCHA', 'RODAR', 'ROUPA', 'SABER',
  'SABOR', 'SALTO', 'SANTO', 'SAÚDE', 'SELVA', 'SENHA', 'SERRA', 'SINAL', 'SOBRA', 'SÓCIO',
  'SONHO', 'SORTE', 'SURDO', 'TARDE', 'TEMPO', 'TENDA', 'TERMO', 'TERRA', 'TESTE', 'TIGRE',
  'TOCAR', 'TOQUE', 'TORTA', 'TRAVA', 'TRIBO', 'TRIGO', 'TROCA', 'ÚNICO', 'USUAL', 'VAGAR',
  'VALOR', 'VAPOR', 'VAZIO', 'VELHO', 'VENTO', 'VERBO', 'VERDE', 'VÍDEO', 'VIDRO', 'VINHO',
  'VIRAR', 'VISTA', 'VIVER', 'VOLTA', 'VOTAR', 'ZEBRA',
].filter((w) => normalize(w).length === WORD_LENGTH);

// Uppercase, strip diacritics, keep only A–Z. "ção" → "CAO", "saúde" → "SAUDE".
export function normalize(word: string): string {
  return word
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
}

// normalized solution -> accented display form, for revealing the answer.
const DISPLAY_BY_NORM = new Map<string, string>(WORDS.map((w) => [normalize(w), w]));
const VALID_GUESSES = new Set(DISPLAY_BY_NORM.keys());

export function isValidGuess(normalized: string): boolean {
  return VALID_GUESSES.has(normalized);
}

export function displayFor(normalized: string): string {
  return DISPLAY_BY_NORM.get(normalized) ?? normalized;
}

// Deterministic daily index so everyone gets the same word for a given date.
function hashDate(dateStr: string): number {
  let h = 0;
  for (let i = 0; i < dateStr.length; i++) {
    h = (h * 31 + dateStr.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export interface DailyWord {
  word: string; // normalized solution
  display: string; // accented form for the reveal
}

// Returns today's (or the given date's) solution, creating + persisting it on
// first access so admin resets and ranking stay consistent for the round.
export async function getOrCreateDailyWord(dateStr?: string): Promise<DailyWord> {
  const date = dateStr || getLocalDateString();

  const existing = await prisma.termoDaily.findUnique({ where: { date } });
  if (existing) {
    return { word: existing.word, display: existing.display };
  }

  const display = WORDS[hashDate(date) % WORDS.length];
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

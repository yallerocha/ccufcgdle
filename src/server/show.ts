import { prisma } from './db';
import {
  QUIZ_QUESTIONS,
  QUESTION_BY_ID,
  questionSource,
  type QuizQuestion,
  type QuizSource,
} from './quiz-questions';

// ── O Show da Computação — server-authoritative "Show do Milhão" quiz ─────────
// A run is a ladder of questions of increasing prize. Everything that decides a
// score (question order, current step, banked prize, lifelines used) lives in the
// ShowRun row, so the client can never fabricate a result. The ranking reads the
// best banked prize per player.

// Prize ladder (R$), classic shape up to R$ 1.000.000.
export const PRIZE_LADDER = [
  1_000, 2_000, 3_000, 4_000, 5_000,
  10_000, 20_000, 30_000, 40_000, 50_000,
  100_000, 200_000, 300_000, 500_000, 1_000_000,
];
export const LADDER_SIZE = PRIZE_LADDER.length; // 15

// "Portas" de garantia: once a player has cleared one of these many steps, a
// wrong answer can't drop the banked prize below the matching floor. Ordered from
// highest so the first match is the best applicable floor.
const CHECKPOINT_FLOORS: { clearedAtLeast: number; floor: number }[] = [
  { clearedAtLeast: 10, floor: 50_000 },
  { clearedAtLeast: 5, floor: 5_000 },
];

export type LifelineType = 'fifty' | 'skip' | 'audience' | 'students';
export const ALL_LIFELINES: LifelineType[] = ['fifty', 'skip', 'audience', 'students'];

export type ShowStatus = 'playing' | 'won' | 'stopped' | 'lost';

export interface ShowQuestionView {
  step: number; // 1-based ladder position
  totalSteps: number;
  area: string;
  topic: string;
  question: string;
  options: string[];
  difficulty: number;
  source: QuizSource | null;
}

export interface ShowRunView {
  runId: string;
  status: ShowStatus;
  currentStep: number;
  securedPrize: number; // amount banked if the player stops right now
  ladder: number[];
  usedLifelines: LifelineType[];
  question: ShowQuestionView | null; // null once the run has ended
}

// ── helpers ──────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Prize secured after clearing `cleared` steps (0 → 0, 1 → first rung, …).
function prizeForCleared(cleared: number): number {
  if (cleared <= 0) return 0;
  return PRIZE_LADDER[Math.min(cleared, LADDER_SIZE) - 1];
}

// Guaranteed floor after clearing `cleared` steps (used when a wrong answer ends
// the run).
function guaranteedFloor(cleared: number): number {
  for (const c of CHECKPOINT_FLOORS) if (cleared >= c.clearedAtLeast) return c.floor;
  return 0;
}

// Builds a ladder of LADDER_SIZE question ids ramping from easy to hard: each step
// targets a difficulty (1..5) proportional to its position and takes an unused
// question of the nearest available difficulty. Random within a difficulty, so
// runs vary. When `topics` is given, questions from those topics are preferred;
// if they can't fill all 15 steps, the rest of the bank tops the ladder up.
function bucketize(pool: QuizQuestion[]): Map<number, QuizQuestion[]> {
  const byDiff = new Map<number, QuizQuestion[]>();
  for (let d = 1; d <= 5; d++) {
    byDiff.set(d, shuffle(pool.filter((q) => q.difficulty === d)));
  }
  return byDiff;
}

function pickLadder(topics?: string[]): string[] {
  const wanted = topics && topics.length ? new Set(topics) : null;
  const primary = bucketize(wanted ? QUIZ_QUESTIONS.filter((q) => wanted.has(q.topic)) : QUIZ_QUESTIONS);
  const fallback = bucketize(wanted ? QUIZ_QUESTIONS.filter((q) => !wanted.has(q.topic)) : []);

  const used = new Set<string>();
  const takeNearest = (buckets: Map<number, QuizQuestion[]>, target: number): string | null => {
    for (let radius = 0; radius <= 4; radius++) {
      for (const d of [target - radius, target + radius]) {
        const pool = buckets.get(d);
        if (!pool) continue;
        const next = pool.find((q) => !used.has(q.id));
        if (next) return next.id;
      }
    }
    return null;
  };
  const ladder: string[] = [];
  for (let step = 1; step <= LADDER_SIZE; step++) {
    const target = Math.min(5, Math.max(1, Math.ceil((step / LADDER_SIZE) * 5)));
    const id = takeNearest(primary, target) ?? takeNearest(fallback, target);
    if (id) {
      used.add(id);
      ladder.push(id);
    }
  }
  return ladder;
}

function parseIds(csv: string): string[] {
  return csv ? csv.split(',') : [];
}

function parseLifelines(csv: string): LifelineType[] {
  return csv ? (csv.split(',') as LifelineType[]) : [];
}

// Deterministic option permutation for a (run, question) pair: perm[displayed] =
// originalIndex. Stable across reloads (seeded by ids), so the shuffled order and
// the correctness check always agree without storing anything extra.
function optionPerm(runId: string, questionId: string, n: number): number[] {
  let h = 2166136261 >>> 0;
  const seed = `${runId}:${questionId}`;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rand = () => {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function questionView(id: string, step: number, runId: string): ShowQuestionView | null {
  const q = QUESTION_BY_ID.get(id);
  if (!q) return null;
  const perm = optionPerm(runId, id, q.options.length);
  return {
    step,
    totalSteps: LADDER_SIZE,
    area: q.area,
    topic: q.topic,
    question: q.question,
    options: perm.map((k) => q.options[k]),
    difficulty: q.difficulty,
    source: questionSource(q),
  };
}

type RunRow = {
  id: string;
  playerId: string;
  questionIds: string;
  currentStep: number;
  prize: number;
  status: string;
  usedLifelines: string;
  startedAt: Date;
};

function toView(run: RunRow): ShowRunView {
  const ids = parseIds(run.questionIds);
  const playing = run.status === 'playing';
  return {
    runId: run.id,
    status: run.status as ShowStatus,
    currentStep: run.currentStep,
    securedPrize: run.prize,
    ladder: PRIZE_LADDER,
    usedLifelines: parseLifelines(run.usedLifelines),
    question: playing ? questionView(ids[run.currentStep - 1], run.currentStep, run.id) : null,
  };
}

// ── run lifecycle ─────────────────────────────────────────────────────────────

export async function startRun(
  playerId: string,
  opts?: { topics?: string[]; noLifelines?: boolean }
): Promise<ShowRunView> {
  const run = await prisma.showRun.create({
    data: {
      playerId,
      questionIds: pickLadder(opts?.topics).join(','),
      currentStep: 1,
      prize: 0,
      // Disabling lifelines is modelled as "all already spent" — no schema change,
      // and the play endpoint already rejects spending a used one.
      usedLifelines: opts?.noLifelines ? ALL_LIFELINES.join(',') : '',
    },
  });
  return toView(run);
}

async function loadRun(runId: string, playerId: string): Promise<RunRow | null> {
  const run = await prisma.showRun.findUnique({ where: { id: runId } });
  if (!run || run.playerId !== playerId) return null;
  return run;
}

export async function getRunState(runId: string, playerId: string): Promise<ShowRunView | null> {
  const run = await loadRun(runId, playerId);
  return run ? toView(run) : null;
}

export interface AnswerResult {
  correct: boolean;
  correctIndex: number;
  explanation: string;
  run: ShowRunView;
}

export async function answerRun(
  runId: string,
  playerId: string,
  optionIndex: number
): Promise<AnswerResult | { error: string }> {
  const run = await loadRun(runId, playerId);
  if (!run) return { error: 'not-found' };
  if (run.status !== 'playing') return { error: 'finished' };

  const ids = parseIds(run.questionIds);
  const q = QUESTION_BY_ID.get(ids[run.currentStep - 1]);
  if (!q) return { error: 'bad-state' };

  // Map the player's shuffled-option index back to the original to check it.
  const perm = optionPerm(run.id, q.id, q.options.length);
  const chosenOriginal = optionIndex >= 0 && optionIndex < perm.length ? perm[optionIndex] : -1;
  const correct = chosenOriginal === q.answer;
  const correctIndex = perm.indexOf(q.answer); // displayed index of the right option
  const now = new Date();
  const durationMs = now.getTime() - run.startedAt.getTime();

  let data: Record<string, unknown>;
  if (correct) {
    const cleared = run.currentStep; // just cleared this step
    if (run.currentStep >= LADDER_SIZE) {
      data = {
        status: 'won',
        prize: prizeForCleared(LADDER_SIZE),
        endedAt: now,
        durationMs,
      };
    } else {
      data = { currentStep: run.currentStep + 1, prize: prizeForCleared(cleared) };
    }
  } else {
    const cleared = run.currentStep - 1;
    data = { status: 'lost', prize: guaranteedFloor(cleared), endedAt: now, durationMs };
  }

  const updated = await prisma.showRun.update({ where: { id: run.id }, data });
  return { correct, correctIndex, explanation: q.explanation, run: toView(updated) };
}

export async function stopRun(
  runId: string,
  playerId: string
): Promise<ShowRunView | { error: string }> {
  const run = await loadRun(runId, playerId);
  if (!run) return { error: 'not-found' };
  if (run.status !== 'playing') return { error: 'finished' };
  const now = new Date();
  const updated = await prisma.showRun.update({
    where: { id: run.id },
    data: {
      status: 'stopped',
      prize: prizeForCleared(run.currentStep - 1),
      endedAt: now,
      durationMs: now.getTime() - run.startedAt.getTime(),
    },
  });
  return toView(updated);
}

// Running out of time on a question ends the run exactly like a wrong answer:
// banks the guaranteed floor and reveals the correct option.
export async function timeoutRun(
  runId: string,
  playerId: string
): Promise<AnswerResult | { error: string }> {
  const run = await loadRun(runId, playerId);
  if (!run) return { error: 'not-found' };
  if (run.status !== 'playing') return { error: 'finished' };
  const ids = parseIds(run.questionIds);
  const q = QUESTION_BY_ID.get(ids[run.currentStep - 1]);
  if (!q) return { error: 'bad-state' };
  const now = new Date();
  const updated = await prisma.showRun.update({
    where: { id: run.id },
    data: {
      status: 'lost',
      prize: guaranteedFloor(run.currentStep - 1),
      endedAt: now,
      durationMs: now.getTime() - run.startedAt.getTime(),
    },
  });
  const correctIndex = optionPerm(run.id, q.id, q.options.length).indexOf(q.answer);
  return { correct: false, correctIndex, explanation: q.explanation, run: toView(updated) };
}

// ── lifelines ─────────────────────────────────────────────────────────────────

export interface LifelineResult {
  type: LifelineType;
  usedLifelines: LifelineType[];
  removedIndices?: number[]; // fifty
  distribution?: number[]; // audience/students — percentage per option (sums 100)
  hint?: string; // students
  question?: ShowQuestionView; // skip — the replacement question
}

// Distributes 100% over `count` options with `correctIndex` getting the biggest
// share (`correctShare`), so the aid points (softly) at the right answer. The
// remaining percentage is split with a little jitter over the wrong options and
// always sums to exactly 100.
function biasedDistribution(count: number, correctIndex: number, correctShare: number): number[] {
  const dist = new Array<number>(count).fill(0);
  dist[correctIndex] = correctShare;
  const remaining = 100 - correctShare;
  const wrongIdx = dist.map((_, i) => i).filter((i) => i !== correctIndex);
  const weights = wrongIdx.map(() => 1 + Math.random());
  const wsum = weights.reduce((a, b) => a + b, 0);
  let assigned = 0;
  wrongIdx.forEach((idx, k) => {
    const share =
      k === wrongIdx.length - 1 ? remaining - assigned : Math.round((remaining * weights[k]) / wsum);
    dist[idx] = Math.max(0, share);
    assigned += dist[idx];
  });
  return dist;
}

export async function useLifeline(
  runId: string,
  playerId: string,
  type: LifelineType
): Promise<LifelineResult | { error: string }> {
  if (!ALL_LIFELINES.includes(type)) return { error: 'bad-type' };
  const run = await loadRun(runId, playerId);
  if (!run) return { error: 'not-found' };
  if (run.status !== 'playing') return { error: 'finished' };

  const used = parseLifelines(run.usedLifelines);
  if (used.includes(type)) return { error: 'already-used' };

  const ids = parseIds(run.questionIds);
  const q = QUESTION_BY_ID.get(ids[run.currentStep - 1]);
  if (!q) return { error: 'bad-state' };

  const result: LifelineResult = { type, usedLifelines: [...used, type] };
  let questionIds = run.questionIds;

  // Work in DISPLAYED index space (the options the player actually sees).
  const perm = optionPerm(run.id, q.id, q.options.length);
  const correctDisplayed = perm.indexOf(q.answer);

  if (type === 'fifty') {
    // Hide two wrong options (by displayed index).
    const wrong = perm.map((_, disp) => disp).filter((disp) => disp !== correctDisplayed);
    result.removedIndices = shuffle(wrong).slice(0, 2);
  } else if (type === 'audience') {
    const share = 45 + Math.floor(Math.random() * 25); // 45–69% on the correct one
    result.distribution = biasedDistribution(q.options.length, correctDisplayed, share);
  } else if (type === 'students') {
    const share = 60 + Math.floor(Math.random() * 25); // 60–84% confidence
    result.distribution = biasedDistribution(q.options.length, correctDisplayed, share);
    const letter = String.fromCharCode(65 + correctDisplayed);
    result.hint = `A galera dos universitários fechou na alternativa ${letter} — mas confira você mesmo!`;
  } else if (type === 'skip') {
    // Swap the current question for an unused one of similar difficulty.
    const usedSet = new Set(ids);
    const pool = shuffle(
      QUIZ_QUESTIONS.filter((c) => !usedSet.has(c.id))
    ).sort((a, b) => Math.abs(a.difficulty - q.difficulty) - Math.abs(b.difficulty - q.difficulty));
    const replacement = pool[0];
    if (replacement) {
      const newIds = [...ids];
      newIds[run.currentStep - 1] = replacement.id;
      questionIds = newIds.join(',');
      result.question = questionView(replacement.id, run.currentStep, run.id) ?? undefined;
    } else {
      result.question = questionView(q.id, run.currentStep, run.id) ?? undefined; // nothing left to swap to
    }
  }

  await prisma.showRun.update({
    where: { id: run.id },
    data: { usedLifelines: result.usedLifelines.join(','), questionIds },
  });
  return result;
}

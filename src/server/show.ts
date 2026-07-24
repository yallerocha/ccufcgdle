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

// Per-question countdown. Enforced server-side: an answer submitted after the
// deadline (plus a grace margin for latency/animation) ends the run like a
// timeout, so the client clock can't be stalled or reset by reloading.
export const QUESTION_SECONDS = 200;
const TIMER_GRACE_MS = 15_000;

// "Portas" de garantia: once a player has cleared one of these many steps, a
// wrong answer can't drop the banked prize below the matching floor. Ordered from
// highest so the first match is the best applicable floor.
const CHECKPOINT_FLOORS: { clearedAtLeast: number; floor: number }[] = [
  { clearedAtLeast: 10, floor: 50_000 },
  { clearedAtLeast: 5, floor: 5_000 },
];

export type LifelineType = 'fifty' | 'skip' | 'audience' | 'students';
export const ALL_LIFELINES: LifelineType[] = ['fifty', 'skip', 'audience', 'students'];
// How many times each lifeline can be spent in a run. Most are once; "skip" is
// generous (up to 3). Encoded by repeating the type in the usedLifelines CSV.
export const LIFELINE_USES: Record<LifelineType, number> = { fifty: 1, skip: 3, audience: 1, students: 1 };

export type ShowStatus = 'playing' | 'won' | 'stopped' | 'lost' | 'abandoned';

export interface ShowQuestionView {
  step: number; // 1-based ladder position
  totalSteps: number;
  area: string;
  topic: string;
  question: string;
  options: string[];
  difficulty: number;
  source: QuizSource | null;
  secondsLeft: number; // server-authoritative remaining time on this step
}

export interface ShowRunView {
  runId: string;
  status: ShowStatus;
  currentStep: number;
  securedPrize: number; // amount banked if the player stops right now
  ladder: number[];
  usedLifelines: LifelineType[];
  question: ShowQuestionView | null; // null once the run has ended
  // On-screen effect of single-use aids already spent ON THE CURRENT step, so a
  // reload restores them (eliminated options, audience/students results).
  aids?: AidResult;
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
export function prizeForCleared(cleared: number): number {
  if (cleared <= 0) return 0;
  return PRIZE_LADDER[Math.min(cleared, LADDER_SIZE) - 1];
}

// Guaranteed floor after clearing `cleared` steps (used when a wrong answer ends
// the run).
export function guaranteedFloor(cleared: number): number {
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

export function pickLadder(topics?: string[]): string[] {
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

// Tokens are `type` or `type@step` (the step it was spent on, used to restore the
// aid's on-screen effect after a reload). This strips the step for the used-count.
function parseLifelines(csv: string): LifelineType[] {
  return csv ? csv.split(',').map((t) => t.split('@')[0] as LifelineType) : [];
}

// The step a single-use aid was spent on (null if unused or a legacy token).
function lifelineStep(csv: string, type: LifelineType): number | null {
  for (const tok of csv ? csv.split(',') : []) {
    const [t, s] = tok.split('@');
    if (t === type) {
      const n = Number(s);
      return Number.isFinite(n) ? n : null;
    }
  }
  return null;
}

// A small seeded PRNG (FNV-1a hash of the seed → mulberry32). Deterministic, so
// anything derived from it is stable across reloads without persisting extra state.
function makeRng(seed: string): () => number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Deterministic option permutation for a (run, question) pair: perm[displayed] =
// originalIndex. Stable across reloads (seeded by ids), so the shuffled order and
// the correctness check always agree without storing anything extra.
export function optionPerm(runId: string, questionId: string, n: number): number[] {
  return seededShuffle(Array.from({ length: n }, (_, i) => i), makeRng(`${runId}:${questionId}`));
}

function questionView(
  id: string,
  step: number,
  runId: string,
  secondsLeft = QUESTION_SECONDS
): ShowQuestionView | null {
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
    secondsLeft,
  };
}

// Remaining seconds on the current step, from the server clock.
function secondsLeftFor(stepStartedAt: Date): number {
  const elapsed = Math.floor((Date.now() - stepStartedAt.getTime()) / 1000);
  return Math.max(0, QUESTION_SECONDS - elapsed);
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
  stepStartedAt: Date;
};

function toView(run: RunRow): ShowRunView {
  const ids = parseIds(run.questionIds);
  const playing = run.status === 'playing';
  const q = playing ? QUESTION_BY_ID.get(ids[run.currentStep - 1]) : undefined;

  // Restore the visual effect of any single-use aid spent on the current step.
  let aids: AidResult | undefined;
  if (q) {
    const correctDisplayed = optionPerm(run.id, q.id, q.options.length).indexOf(q.answer);
    const merged: AidResult = {};
    for (const type of ['fifty', 'audience', 'students'] as const) {
      if (lifelineStep(run.usedLifelines, type) === run.currentStep) {
        Object.assign(merged, resolveAid(type, run.id, q, correctDisplayed));
      }
    }
    if (Object.keys(merged).length) aids = merged;
  }

  return {
    runId: run.id,
    status: run.status as ShowStatus,
    currentStep: run.currentStep,
    securedPrize: run.prize,
    ladder: PRIZE_LADDER,
    usedLifelines: parseLifelines(run.usedLifelines),
    question: playing
      ? questionView(ids[run.currentStep - 1], run.currentStep, run.id, secondsLeftFor(run.stepStartedAt))
      : null,
    aids,
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
      // and the play endpoint already rejects spending a used one. Each type is
      // repeated up to its max uses so even multi-use aids (skip) start exhausted.
      usedLifelines: opts?.noLifelines
        ? ALL_LIFELINES.flatMap((t) => Array<LifelineType>(LIFELINE_USES[t]).fill(t)).join(',')
        : '',
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

  // Server-side timer: an answer past the deadline (+ grace) loses, like a timeout.
  if (Date.now() - run.stepStartedAt.getTime() > QUESTION_SECONDS * 1000 + TIMER_GRACE_MS) {
    return endAsTimeout(run, q);
  }

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
      // Advancing to the next question restarts its countdown.
      data = { currentStep: run.currentStep + 1, prize: prizeForCleared(cleared), stepStartedAt: now };
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

// Giving up abandons the run entirely: nothing is banked and it's excluded from
// the leaderboard (which only counts won/stopped/lost).
export async function abandonRun(
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
      status: 'abandoned',
      prize: 0,
      endedAt: now,
      durationMs: now.getTime() - run.startedAt.getTime(),
    },
  });
  return toView(updated);
}

// Running out of time on a question ends the run exactly like a wrong answer:
// banks the guaranteed floor and reveals the correct option.
async function endAsTimeout(run: RunRow, q: QuizQuestion): Promise<AnswerResult> {
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

export async function timeoutRun(
  runId: string,
  playerId: string
): Promise<AnswerResult | { error: string }> {
  const run = await loadRun(runId, playerId);
  if (!run) return { error: 'not-found' };
  if (run.status !== 'playing') return { error: 'finished' };
  const q = QUESTION_BY_ID.get(parseIds(run.questionIds)[run.currentStep - 1]);
  if (!q) return { error: 'bad-state' };
  return endAsTimeout(run, q);
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
// always sums to exactly 100. The jitter is drawn from `rng`, so it's reproducible.
function biasedDistribution(count: number, correctIndex: number, correctShare: number, rng: () => number): number[] {
  const dist = new Array<number>(count).fill(0);
  dist[correctIndex] = correctShare;
  const remaining = 100 - correctShare;
  const wrongIdx = dist.map((_, i) => i).filter((i) => i !== correctIndex);
  const weights = wrongIdx.map(() => 1 + rng());
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

// The on-screen effect of a single-use aid, computed deterministically from the
// (run, question) pair so it can be recomputed on resume without persisting it.
export interface AidResult {
  removedIndices?: number[]; // fifty (cards)
  distribution?: number[]; // audience/students
  hint?: string; // students
}

export function resolveAid(type: LifelineType, runId: string, q: QuizQuestion, correctDisplayed: number): AidResult {
  const rng = makeRng(`${runId}:${q.id}:${type}`);
  const n = q.options.length;
  if (type === 'fifty') {
    // 4 cards, one flip: removes a random 1..(n-1) wrong options — seeded, so a
    // reload restores exactly the same cut instead of losing the aid.
    const wrong = Array.from({ length: n }, (_, disp) => disp).filter((disp) => disp !== correctDisplayed);
    const hits = 1 + Math.floor(rng() * wrong.length);
    return { removedIndices: seededShuffle(wrong, rng).slice(0, hits) };
  }
  // The crowd/students can be fooled — more often on harder questions — so the
  // top-percentage option isn't always the right one (like the real show).
  const foolChance = (q.difficulty - 1) * 0.09 + 0.05; // d1≈5% .. d5≈41%
  const pickWrong = () => {
    const wrong = Array.from({ length: n }, (_, i) => i).filter((i) => i !== correctDisplayed);
    return wrong[Math.floor(rng() * wrong.length)];
  };
  if (type === 'audience') {
    const fooled = rng() < foolChance;
    const target = fooled ? pickWrong() : correctDisplayed;
    const share = fooled ? 36 + Math.floor(rng() * 10) // 36–45% weak plurality on a wrong one
                         : 45 + Math.floor(rng() * 25); // 45–69% on the correct one
    return { distribution: biasedDistribution(n, target, share, rng) };
  }
  if (type === 'students') {
    const fooled = rng() < foolChance * 0.6; // students are fooled less often
    const target = fooled ? pickWrong() : correctDisplayed;
    const share = fooled ? 44 + Math.floor(rng() * 12) // 44–55% confident but wrong
                         : 60 + Math.floor(rng() * 25); // 60–84% confidence
    const distribution = biasedDistribution(n, target, share, rng);
    const letter = String.fromCharCode(65 + target);
    return { distribution, hint: `A galera dos universitários fechou na alternativa ${letter} — mas confira você mesmo!` };
  }
  return {};
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
  if (used.filter((t) => t === type).length >= LIFELINE_USES[type]) return { error: 'already-used' };

  const ids = parseIds(run.questionIds);
  const q = QUESTION_BY_ID.get(ids[run.currentStep - 1]);
  if (!q) return { error: 'bad-state' };

  const result: LifelineResult = { type, usedLifelines: [...used, type] };
  let questionIds = run.questionIds;

  // Work in DISPLAYED index space (the options the player actually sees).
  const perm = optionPerm(run.id, q.id, q.options.length);
  const correctDisplayed = perm.indexOf(q.answer);

  if (type === 'fifty' || type === 'audience' || type === 'students') {
    Object.assign(result, resolveAid(type, run.id, q, correctDisplayed));
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

  // Append `type@step` so a reload can tell which step the aid was spent on and
  // restore its on-screen effect (deterministic via resolveAid).
  const newToken = `${type}@${run.currentStep}`;
  const newCsv = run.usedLifelines ? `${run.usedLifelines},${newToken}` : newToken;
  await prisma.showRun.update({
    where: { id: run.id },
    // Skipping swaps in a fresh question, so its countdown restarts.
    data: { usedLifelines: newCsv, questionIds, ...(type === 'skip' ? { stepStartedAt: new Date() } : {}) },
  });
  return result;
}

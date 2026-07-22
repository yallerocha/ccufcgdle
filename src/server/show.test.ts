// Self-contained checks for the pure Show logic (no DB, no framework).
// Run: `npm test` (sets a dummy DATABASE_URL so importing ./db is inert —
// Prisma/Pool are instantiated but never connect since we only touch pure fns).
import assert from 'node:assert';
import {
  optionPerm,
  prizeForCleared,
  guaranteedFloor,
  pickLadder,
  resolveAid,
  PRIZE_LADDER,
  LADDER_SIZE,
  LIFELINE_USES,
  ALL_LIFELINES,
} from './show';
import { QUESTION_BY_ID, QUIZ_QUESTIONS } from './quiz-questions';

let passed = 0;
const test = (name: string, fn: () => void) => {
  try {
    fn();
    passed++;
  } catch (e) {
    console.error(`✗ ${name}`);
    throw e;
  }
};

// ── optionPerm: the property everything else relies on ────────────────────────
test('optionPerm returns a valid permutation of 0..n-1', () => {
  for (const n of [2, 3, 4, 5]) {
    const perm = optionPerm('run-abc', 'q-1', n);
    assert.strictEqual(perm.length, n);
    assert.deepStrictEqual([...perm].sort((a, b) => a - b), Array.from({ length: n }, (_, i) => i));
  }
});

test('optionPerm is deterministic for the same (run, question)', () => {
  const a = optionPerm('run-xyz', 'q-42', 5);
  const b = optionPerm('run-xyz', 'q-42', 5);
  assert.deepStrictEqual(a, b);
});

test('optionPerm round-trips: displayed index of the answer maps back to it', () => {
  // This is exactly the contract answerRun/toView depend on:
  //   correctDisplayed = perm.indexOf(answer);  perm[correctDisplayed] === answer
  for (const runId of ['r1', 'r2', 'another-run-id']) {
    for (const q of QUIZ_QUESTIONS.slice(0, 30)) {
      const perm = optionPerm(runId, q.id, q.options.length);
      const displayed = perm.indexOf(q.answer);
      assert.notStrictEqual(displayed, -1, `answer must appear once for ${q.id}`);
      assert.strictEqual(perm[displayed], q.answer);
    }
  }
});

test('optionPerm actually shuffles (not identity for every run)', () => {
  // At least one run/question should reorder a 5-option question.
  const anyShuffled = QUIZ_QUESTIONS.filter((q) => q.options.length >= 4)
    .slice(0, 20)
    .some((q) => {
      const perm = optionPerm('seed-run', q.id, q.options.length);
      return perm.some((orig, disp) => orig !== disp);
    });
  assert.ok(anyShuffled, 'expected some questions to be reordered');
});

// ── prize ladder & guaranteed floors ─────────────────────────────────────────
test('prizeForCleared matches the ladder and clamps', () => {
  assert.strictEqual(prizeForCleared(0), 0);
  assert.strictEqual(prizeForCleared(1), PRIZE_LADDER[0]);
  assert.strictEqual(prizeForCleared(5), PRIZE_LADDER[4]);
  assert.strictEqual(prizeForCleared(LADDER_SIZE), 1_000_000);
  assert.strictEqual(prizeForCleared(LADDER_SIZE + 3), 1_000_000); // clamp
  assert.strictEqual(prizeForCleared(-2), 0);
});

test('guaranteedFloor applies checkpoints', () => {
  assert.strictEqual(guaranteedFloor(0), 0);
  assert.strictEqual(guaranteedFloor(4), 0);
  assert.strictEqual(guaranteedFloor(5), 5_000);
  assert.strictEqual(guaranteedFloor(9), 5_000);
  assert.strictEqual(guaranteedFloor(10), 50_000);
  assert.strictEqual(guaranteedFloor(LADDER_SIZE), 50_000);
});

// ── pickLadder ────────────────────────────────────────────────────────────────
test('pickLadder builds a full ladder of unique, real questions', () => {
  const ids = pickLadder();
  assert.strictEqual(ids.length, LADDER_SIZE);
  assert.strictEqual(new Set(ids).size, ids.length, 'no duplicate questions');
  for (const id of ids) assert.ok(QUESTION_BY_ID.has(id), `unknown id ${id}`);
});

test('pickLadder ramps difficulty from easy to hard on average', () => {
  const diff = (id: string) => QUESTION_BY_ID.get(id)!.difficulty;
  // Average over runs to smooth the within-difficulty randomness.
  let firstThird = 0;
  let lastThird = 0;
  const runs = 40;
  for (let r = 0; r < runs; r++) {
    const ids = pickLadder();
    firstThird += diff(ids[0]) + diff(ids[1]) + diff(ids[2]);
    lastThird += diff(ids[12]) + diff(ids[13]) + diff(ids[14]);
  }
  assert.ok(lastThird > firstThird, `late steps should be harder (${firstThird} vs ${lastThird})`);
});

test('pickLadder prefers chosen topics but still fills the ladder', () => {
  const ids = pickLadder(['Lógica']);
  assert.strictEqual(ids.length, LADDER_SIZE); // topped up from the rest
  const logicCount = ids.filter((id) => QUESTION_BY_ID.get(id)!.topic === 'Lógica').length;
  const logicTotal = QUIZ_QUESTIONS.filter((q) => q.topic === 'Lógica').length;
  // Every available Lógica question should be used before topping up.
  assert.strictEqual(logicCount, Math.min(logicTotal, LADDER_SIZE));
});

// ── aid results (deterministic, so reload restores them) ──────────────────────
test('resolveAid is deterministic for the same (run, question, type)', () => {
  const q = QUIZ_QUESTIONS[0];
  const correctDisplayed = optionPerm('run-1', q.id, q.options.length).indexOf(q.answer);
  for (const type of ['fifty', 'audience', 'students'] as const) {
    const a = resolveAid(type, 'run-1', q, correctDisplayed);
    const b = resolveAid(type, 'run-1', q, correctDisplayed);
    assert.deepStrictEqual(a, b);
  }
});

test('cards (fifty) removes 1..n-1 wrong options, never the correct one', () => {
  for (const q of QUIZ_QUESTIONS.slice(0, 25)) {
    const correctDisplayed = optionPerm('rX', q.id, q.options.length).indexOf(q.answer);
    const { removedIndices } = resolveAid('fifty', 'rX', q, correctDisplayed);
    assert.ok(removedIndices && removedIndices.length >= 1);
    assert.ok(removedIndices.length <= q.options.length - 1); // must leave the answer + it
    assert.ok(!removedIndices.includes(correctDisplayed), 'must never remove the correct option');
    assert.strictEqual(new Set(removedIndices).size, removedIndices.length, 'no duplicates');
  }
});

test('audience/students distribution sums to 100 and peaks on the correct option', () => {
  const q = QUIZ_QUESTIONS[3];
  const correctDisplayed = optionPerm('rZ', q.id, q.options.length).indexOf(q.answer);
  for (const type of ['audience', 'students'] as const) {
    const { distribution } = resolveAid(type, 'rZ', q, correctDisplayed);
    assert.ok(distribution);
    assert.strictEqual(distribution.reduce((a, b) => a + b, 0), 100);
    assert.strictEqual(Math.max(...distribution), distribution[correctDisplayed]);
  }
});

// ── lifeline uses ────────────────────────────────────────────────────────────
test('LIFELINE_USES: skip is 3, the rest are single-use', () => {
  assert.strictEqual(LIFELINE_USES.skip, 3);
  for (const t of ALL_LIFELINES) {
    assert.ok(LIFELINE_USES[t] >= 1, `${t} must be usable at least once`);
    if (t !== 'skip') assert.strictEqual(LIFELINE_USES[t], 1);
  }
});

console.log(`✓ all ${passed} show-logic checks passed`);

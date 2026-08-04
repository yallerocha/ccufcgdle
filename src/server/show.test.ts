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
  aidsOnQuestion,
  ANSWER_AIDS,
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

test('pickLadder never serves an admin-disabled question', () => {
  const banned = new Set(QUIZ_QUESTIONS.filter((q) => q.topic === 'Lógica').map((q) => q.id));
  const ids = pickLadder(['Lógica'], banned);
  assert.strictEqual(ids.length, LADDER_SIZE); // filled from the rest of the bank
  for (const id of ids) assert.ok(!banned.has(id), `disabled ${id} was served`);
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

test('audience distribution always sums to 100', () => {
  const q = QUIZ_QUESTIONS[3];
  const correctDisplayed = 0;
  for (let i = 0; i < 100; i++) {
    const { distribution } = resolveAid('audience', 'seed-' + i, q, correctDisplayed);
    assert.ok(distribution);
    assert.strictEqual(distribution.reduce((a, b) => a + b, 0), 100);
  }
});

test('students back exactly one option, usually the correct one', () => {
  const q = QUIZ_QUESTIONS[3];
  const correctDisplayed = 0;
  let right = 0;
  let fooled = 0;
  for (let i = 0; i < 300; i++) {
    const { pick, distribution } = resolveAid('students', 'seed-' + i, q, correctDisplayed);
    assert.strictEqual(distribution, undefined, 'no percentages: the board marks a single option');
    assert.ok(pick !== undefined && pick >= 0 && pick < q.options.length);
    if (pick === correctDisplayed) right++;
    else fooled++;
  }
  assert.ok(right > fooled, 'the students are right more often than not');
  assert.ok(fooled > 0, 'but they can still be fooled');
});

test('the crowd can be fooled: the peak is not always the correct option', () => {
  const q = QUIZ_QUESTIONS[3];
  const correctDisplayed = 0;
  let peakedCorrect = 0;
  let peakedWrong = 0;
  for (let i = 0; i < 300; i++) {
    const { distribution } = resolveAid('audience', 'seed-' + i, q, correctDisplayed);
    const argmax = distribution!.indexOf(Math.max(...distribution!));
    if (argmax === correctDisplayed) peakedCorrect++;
    else peakedWrong++;
  }
  assert.ok(peakedCorrect > 0, 'usually still points at the correct option');
  assert.ok(peakedWrong > 0, 'but is sometimes fooled onto a wrong option');
});

// ── one aid per question ─────────────────────────────────────────────────────
test('aidsOnQuestion only counts aids spent on that exact question', () => {
  const csv = 'audience@3:q-alpha,skip@3:q-alpha,fifty@4:q-beta';
  assert.deepStrictEqual(aidsOnQuestion(csv, 'q-alpha'), ['audience', 'skip']);
  assert.deepStrictEqual(aidsOnQuestion(csv, 'q-beta'), ['fifty']);
  // A skip swaps the question on the same rung, so the replacement starts clean.
  assert.deepStrictEqual(aidsOnQuestion(csv, 'q-fresh'), []);
});

test('skip sits outside the one-answer-aid-per-question rule', () => {
  assert.ok(!ANSWER_AIDS.includes('skip'), 'skipping moves on, it does not answer');
  for (const t of ANSWER_AIDS) assert.ok(ALL_LIFELINES.includes(t));
  // An aid plus a skip on the same question is allowed; two aids are not.
  const spent = aidsOnQuestion('audience@3:q-alpha,skip@3:q-alpha', 'q-alpha');
  assert.strictEqual(spent.filter((a) => ANSWER_AIDS.includes(a)).length, 1);
});

test('aidsOnQuestion ignores legacy tokens that carry no question', () => {
  for (const csv of ['audience', 'audience@3', 'audience,skip@2']) {
    assert.deepStrictEqual(aidsOnQuestion(csv, 'q-alpha'), [], csv);
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

// ── question bank: long explanations ─────────────────────────────────────────
test('every question has a long explanation, deeper than the short one', () => {
  for (const q of QUIZ_QUESTIONS) {
    assert.ok(q.explanationLong.trim().length > 0, `${q.id} is missing explanationLong`);
    // The expander only pays off if the long text really adds something.
    assert.ok(
      q.explanationLong.length > q.explanation.length,
      `${q.id}: explanationLong should be longer than explanation`
    );
    assert.notStrictEqual(q.explanationLong, q.explanation, `${q.id}: duplicated explanation`);
  }
});

console.log(`✓ all ${passed} show-logic checks passed`);

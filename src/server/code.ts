import vm from 'node:vm';
import { prisma } from './db';
import { getLocalDateString } from '@/shared/utils';
import { hashString } from './termo';
import { CODE_CHALLENGES, CHALLENGE_BY_ID, type CodeChallenge } from './code-challenges';

export const MAX_CODE_LENGTH = 8000;
const RUN_TIMEOUT_MS = 2000;
const MAX_OUT_LENGTH = 20000;

// A random challenge (admin "draw new" — must differ from the deterministic pick).
export function randomChallenge(): CodeChallenge {
  return CODE_CHALLENGES[Math.floor(Math.random() * CODE_CHALLENGES.length)];
}

export interface DailyChallenge {
  dailyKey: number | null;
  challenge: CodeChallenge;
}

// Returns today's (or the given date's) challenge, creating + persisting it on
// first access so admin resets and ranking stay consistent for the round.
export async function getOrCreateDailyChallenge(dateStr?: string): Promise<DailyChallenge> {
  const date = dateStr || getLocalDateString();

  const existing = await prisma.codeDaily.findUnique({ where: { date } });
  if (existing) {
    const challenge = CHALLENGE_BY_ID.get(existing.challengeId);
    // A challenge removed from the bank falls back to the deterministic pick.
    if (challenge) return { dailyKey: existing.id, challenge };
  }

  const challenge = CODE_CHALLENGES[hashString(`code:${date}`) % CODE_CHALLENGES.length];
  if (existing) return { dailyKey: existing.id, challenge };

  try {
    const created = await prisma.codeDaily.create({ data: { date, challengeId: challenge.id } });
    return { dailyKey: created.id, challenge };
  } catch {
    // Parallel create: re-read whatever landed.
    const again = await prisma.codeDaily.findUnique({ where: { date } });
    const c = again ? CHALLENGE_BY_ID.get(again.challengeId) ?? challenge : challenge;
    return { dailyKey: again?.id ?? null, challenge: c };
  }
}

export interface TestOutcome {
  args: unknown[];
  expected: unknown;
  got?: unknown; // value returned (absent when the test threw)
  threw?: string; // error message when the player's function threw
  pass: boolean;
}

export interface RunOutcome {
  ok: boolean; // whether the code could be evaluated at all
  error?: string; // syntax error / timeout / missing function
  results: TestOutcome[];
  passed: number;
  total: number;
}

// Structural comparison via JSON round-trip: covers numbers, strings, booleans,
// null and (nested) arrays — everything the challenge bank uses as `expected`.
function sameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

// Runs the player's code against every test of the challenge, inside a fresh
// `node:vm` context with a hard timeout. The sandbox only ever exchanges JSON
// strings (primitives) with the host, so no host object is reachable from the
// player's code. NOTE: `vm` is not a hardened security boundary — this is a
// small community game behind auth + rate limiting, and the endpoint also caps
// code size; do not reuse this runner for untrusted public traffic.
export function runUserCode(code: string, challenge: CodeChallenge): RunOutcome {
  const failAll = (error: string): RunOutcome => ({
    ok: false,
    error,
    results: challenge.tests.map((t) => ({ args: t.args, expected: t.expected, pass: false })),
    passed: 0,
    total: challenge.tests.length,
  });

  if (code.length > MAX_CODE_LENGTH) {
    return failAll(`O código excede o limite de ${MAX_CODE_LENGTH} caracteres.`);
  }

  const argsJson = JSON.stringify(challenge.tests.map((t) => t.args));
  const script = `
    'use strict';
    ${code}
    ;__out = (() => {
      if (typeof ${challenge.functionName} !== 'function') {
        return JSON.stringify({ missing: true });
      }
      const argsList = JSON.parse(${JSON.stringify(argsJson)});
      const results = argsList.map((args) => {
        try {
          const got = ${challenge.functionName}(...args);
          return { got: got === undefined ? '__undefined__' : got };
        } catch (e) {
          return { threw: String((e && e.message) || e) };
        }
      });
      try {
        return JSON.stringify({ results });
      } catch {
        return JSON.stringify({ unserializable: true });
      }
    })();
  `;

  const sandbox: { __out: string } = { __out: '' };
  try {
    vm.runInNewContext(script, sandbox, { timeout: RUN_TIMEOUT_MS });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('timed out')) {
      return failAll(`Tempo limite de execução excedido (${RUN_TIMEOUT_MS / 1000}s). Verifique laços infinitos.`);
    }
    return failAll(`Erro ao executar o código: ${msg}`);
  }

  if (typeof sandbox.__out !== 'string' || sandbox.__out.length > MAX_OUT_LENGTH) {
    return failAll('A saída do código não pôde ser interpretada.');
  }

  let out: { missing?: boolean; unserializable?: boolean; results?: { got?: unknown; threw?: string }[] };
  try {
    out = JSON.parse(sandbox.__out);
  } catch {
    return failAll('A saída do código não pôde ser interpretada.');
  }

  if (out.missing) {
    return failAll(`Defina a função ${challenge.functionName} — o desafio chama exatamente esse nome.`);
  }
  if (out.unserializable || !Array.isArray(out.results)) {
    return failAll('O valor retornado pela função não pôde ser serializado.');
  }

  const results: TestOutcome[] = challenge.tests.map((t, i) => {
    const r = out.results![i] ?? {};
    if (typeof r.threw === 'string') {
      return { args: t.args, expected: t.expected, threw: r.threw.slice(0, 300), pass: false };
    }
    const got = r.got === '__undefined__' ? undefined : r.got;
    return { args: t.args, expected: t.expected, got, pass: sameValue(got, t.expected) };
  });

  const passed = results.filter((r) => r.pass).length;
  return { ok: true, results, passed, total: results.length };
}

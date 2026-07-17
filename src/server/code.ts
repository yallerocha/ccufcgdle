import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { prisma } from './db';
import { getLocalDateString } from '@/shared/utils';
import { hashString } from './termo';
import {
  CODE_CHALLENGES,
  CHALLENGE_BY_ID,
  CODE_LANGUAGES,
  type CodeChallenge,
  type CodeLanguage,
} from './code-challenges';

export const MAX_CODE_LENGTH = 8000;
const RUN_TIMEOUT_MS = 2000;
const MAX_OUT_LENGTH = 20000;

export function isCodeLanguage(value: unknown): value is CodeLanguage {
  return typeof value === 'string' && (CODE_LANGUAGES as string[]).includes(value);
}

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

function failAllFor(challenge: CodeChallenge) {
  return (error: string): RunOutcome => ({
    ok: false,
    error,
    results: challenge.tests.map((t) => ({ args: t.args, expected: t.expected, pass: false })),
    passed: 0,
    total: challenge.tests.length,
  });
}

// Turns the raw per-test outputs (already parsed from the sandbox JSON) into
// graded TestOutcomes — shared by both language runners.
function gradeResults(
  challenge: CodeChallenge,
  raw: { got?: unknown; threw?: string }[],
): RunOutcome {
  const results: TestOutcome[] = challenge.tests.map((t, i) => {
    const r = raw[i] ?? {};
    if (typeof r.threw === 'string') {
      return { args: t.args, expected: t.expected, threw: r.threw.slice(0, 300), pass: false };
    }
    const got = r.got === '__undefined__' ? undefined : r.got;
    return { args: t.args, expected: t.expected, got, pass: sameValue(got, t.expected) };
  });
  const passed = results.filter((r) => r.pass).length;
  return { ok: true, results, passed, total: results.length };
}

// Runs the player's code against every test of the challenge, in the language
// they chose. NOTE: neither runner is a hardened security boundary — this is a
// small community game behind auth + rate limiting, and the endpoint also caps
// code size; do not reuse these runners for untrusted public traffic.
export function runUserCode(
  code: string,
  challenge: CodeChallenge,
  language: CodeLanguage = 'js',
): RunOutcome {
  if (code.length > MAX_CODE_LENGTH) {
    return failAllFor(challenge)(`O código excede o limite de ${MAX_CODE_LENGTH} caracteres.`);
  }
  if (language === 'py') return runPythonCode(code, challenge);
  if (language === 'java') return runJavaCode(code, challenge);
  return runJsCode(code, challenge);
}

// JavaScript runner: fresh `node:vm` context with a hard timeout. The sandbox
// only ever exchanges JSON strings (primitives) with the host, so no host
// object is reachable from the player's code.
function runJsCode(code: string, challenge: CodeChallenge): RunOutcome {
  const failAll = failAllFor(challenge);
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

  return gradeResults(challenge, out.results);
}

// Python runner: `python3 -I` subprocess with a hard timeout. The player's code
// runs at module level; a harness then calls the required function for every
// test and prints a single marker-prefixed JSON line, so stray print()s in the
// player's code never break the protocol.
const OUT_MARKER = '__CCDLE_OUT__';

function runPythonCode(code: string, challenge: CodeChallenge): RunOutcome {
  const failAll = failAllFor(challenge);
  const argsJson = JSON.stringify(challenge.tests.map((t) => t.args));

  const harness = `
${code}

import json as __ccdle_json

def __ccdle_main():
    args_list = __ccdle_json.loads(${JSON.stringify(argsJson)})
    fn = globals().get(${JSON.stringify(challenge.functionName)})
    if not callable(fn):
        return __ccdle_json.dumps({"missing": True})
    results = []
    for args in args_list:
        try:
            got = fn(*args)
            try:
                __ccdle_json.dumps(got)
            except Exception:
                results.append({"threw": "valor de retorno não serializável"})
                continue
            results.append({"got": "__undefined__" if got is None else got})
        except BaseException as e:
            results.append({"threw": str(e) or type(e).__name__})
    return __ccdle_json.dumps({"results": results})

print(${JSON.stringify(OUT_MARKER)} + __ccdle_main())
`;

  const proc = spawnSync('python3', ['-I', '-c', harness], {
    timeout: RUN_TIMEOUT_MS,
    killSignal: 'SIGKILL',
    encoding: 'utf8',
    maxBuffer: MAX_OUT_LENGTH * 4,
  });

  if (proc.error) {
    const errno = (proc.error as NodeJS.ErrnoException).code;
    if (errno === 'ETIMEDOUT') {
      return failAll(`Tempo limite de execução excedido (${RUN_TIMEOUT_MS / 1000}s). Verifique laços infinitos.`);
    }
    if (errno === 'ENOENT') {
      return failAll('Python não está disponível no servidor no momento.');
    }
    return failAll(`Erro ao executar o código: ${proc.error.message}`);
  }
  if (proc.signal) {
    return failAll(`Tempo limite de execução excedido (${RUN_TIMEOUT_MS / 1000}s). Verifique laços infinitos.`);
  }

  const stdout = proc.stdout ?? '';
  const markerAt = stdout.lastIndexOf(OUT_MARKER);
  if (proc.status !== 0 || markerAt === -1) {
    // Top-level crash (syntax error, exception fora da função): show the last
    // stderr line, which Python reserves for the error type + message.
    const stderrLines = (proc.stderr ?? '').trim().split('\n');
    const last = stderrLines[stderrLines.length - 1]?.trim();
    return failAll(last ? `Erro ao executar o código: ${last.slice(0, 300)}` : 'Erro ao executar o código.');
  }

  const payload = stdout.slice(markerAt + OUT_MARKER.length).trim();
  if (payload.length > MAX_OUT_LENGTH) {
    return failAll('A saída do código não pôde ser interpretada.');
  }

  let out: { missing?: boolean; results?: { got?: unknown; threw?: string }[] };
  try {
    out = JSON.parse(payload);
  } catch {
    return failAll('A saída do código não pôde ser interpretada.');
  }

  if (out.missing) {
    return failAll(`Defina a função ${challenge.functionName} — o desafio chama exatamente esse nome.`);
  }
  if (!Array.isArray(out.results)) {
    return failAll('A saída do código não pôde ser interpretada.');
  }

  return gradeResults(challenge, out.results);
}

// Java runner: the player's `class Solucao` is compiled together with a
// generated `Main` harness (javac in a temp dir, then `java Main`). The harness
// resolves the required method by reflection, invokes it with the test args
// (embedded as Java literals by javaLiteral below) and prints the same
// marker-prefixed JSON protocol as the Python runner. Compilation is slow, so
// Java gets its own, larger timeouts.
const JAVA_COMPILE_TIMEOUT_MS = 20000;
const JAVA_RUN_TIMEOUT_MS = 5000;

// JSON args → Java source literals. The challenge bank only uses integers,
// strings, booleans and integer arrays, so anything else is rejected upfront.
function javaLiteral(v: unknown): string {
  if (typeof v === 'number' && Number.isInteger(v)) return String(v);
  if (typeof v === 'boolean') return String(v);
  if (typeof v === 'string') return JSON.stringify(v); // JSON escapes are valid in Java
  if (Array.isArray(v) && v.every((x) => typeof x === 'number' && Number.isInteger(x))) {
    return `new int[]{${v.join(', ')}}`;
  }
  throw new Error(`unsupported Java arg: ${JSON.stringify(v)}`);
}

function buildJavaHarness(challenge: CodeChallenge): string {
  const testsLiteral = challenge.tests
    .map((t) => `{ ${t.args.map(javaLiteral).join(', ')} }`)
    .join(',\n            ');

  return `
public class Main {
    static String esc(String s) {
        StringBuilder b = new StringBuilder("\\"");
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '"' || c == '\\\\') b.append('\\\\').append(c);
            else if (c == '\\n') b.append("\\\\n");
            else if (c == '\\r') b.append("\\\\r");
            else if (c == '\\t') b.append("\\\\t");
            else if (c < 0x20) b.append(String.format("\\\\u%04x", (int) c));
            else b.append(c);
        }
        return b.append('"').toString();
    }

    static String j(Object v) {
        if (v == null) return "null";
        if (v instanceof Integer || v instanceof Long || v instanceof Double || v instanceof Boolean) {
            return String.valueOf(v);
        }
        if (v instanceof String) return esc((String) v);
        if (v instanceof int[]) {
            int[] a = (int[]) v;
            StringBuilder b = new StringBuilder("[");
            for (int i = 0; i < a.length; i++) { if (i > 0) b.append(','); b.append(a[i]); }
            return b.append(']').toString();
        }
        if (v instanceof java.util.List) {
            StringBuilder b = new StringBuilder("[");
            java.util.List<?> l = (java.util.List<?>) v;
            for (int i = 0; i < l.size(); i++) { if (i > 0) b.append(','); b.append(j(l.get(i))); }
            return b.append(']').toString();
        }
        return esc(String.valueOf(v));
    }

    public static void main(String[] args) {
        Object[][] tests = {
            ${testsLiteral}
        };
        java.lang.reflect.Method fn = null;
        for (java.lang.reflect.Method m : Solucao.class.getDeclaredMethods()) {
            if (m.getName().equals(${JSON.stringify(challenge.functionName)})) { fn = m; break; }
        }
        if (fn == null) {
            System.out.println(${JSON.stringify(OUT_MARKER)} + "{\\"missing\\":true}");
            return;
        }
        fn.setAccessible(true);
        Object target = null;
        if (!java.lang.reflect.Modifier.isStatic(fn.getModifiers())) {
            try {
                java.lang.reflect.Constructor<?> ctor = Solucao.class.getDeclaredConstructor();
                ctor.setAccessible(true);
                target = ctor.newInstance();
            } catch (Throwable ignored) { /* invoke below reports the failure */ }
        }
        StringBuilder sb = new StringBuilder("{\\"results\\":[");
        for (int i = 0; i < tests.length; i++) {
            if (i > 0) sb.append(',');
            try {
                Object got = fn.invoke(target, tests[i]);
                sb.append("{\\"got\\":").append(j(got)).append('}');
            } catch (Throwable t) {
                Throwable c = (t instanceof java.lang.reflect.InvocationTargetException && t.getCause() != null)
                    ? t.getCause() : t;
                String msg = c.getMessage() == null ? c.getClass().getSimpleName() : c.getMessage();
                sb.append("{\\"threw\\":").append(j(msg)).append('}');
            }
        }
        sb.append("]}");
        System.out.println(${JSON.stringify(OUT_MARKER)} + sb);
    }
}
`;
}

function runJavaCode(code: string, challenge: CodeChallenge): RunOutcome {
  const failAll = failAllFor(challenge);

  let harness: string;
  try {
    harness = buildJavaHarness(challenge);
  } catch {
    return failAll('Este desafio não está disponível em Java no momento.');
  }

  let dir: string;
  try {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccdle-java-'));
  } catch {
    return failAll('Erro ao preparar o ambiente de execução.');
  }

  try {
    fs.writeFileSync(path.join(dir, 'Solucao.java'), code);
    fs.writeFileSync(path.join(dir, 'Main.java'), harness);

    const compile = spawnSync('javac', ['Solucao.java', 'Main.java'], {
      cwd: dir,
      timeout: JAVA_COMPILE_TIMEOUT_MS,
      killSignal: 'SIGKILL',
      encoding: 'utf8',
      maxBuffer: MAX_OUT_LENGTH * 4,
    });
    if (compile.error) {
      const errno = (compile.error as NodeJS.ErrnoException).code;
      if (errno === 'ENOENT') return failAll('Java não está disponível no servidor no momento.');
      if (errno === 'ETIMEDOUT') return failAll('Tempo limite de compilação excedido.');
      return failAll(`Erro ao compilar o código: ${compile.error.message}`);
    }
    if (compile.status !== 0) {
      // Player-facing compile diagnostics: javac already points at Solucao.java
      // with the right line numbers (the harness is a separate file).
      const firstLines = (compile.stderr ?? '').trim().split('\n').slice(0, 6).join('\n');
      return failAll(`Erro de compilação: ${firstLines.slice(0, 400) || 'código Java inválido.'}`);
    }

    const run = spawnSync('java', ['-Xmx128m', '-cp', dir, 'Main'], {
      timeout: JAVA_RUN_TIMEOUT_MS,
      killSignal: 'SIGKILL',
      encoding: 'utf8',
      maxBuffer: MAX_OUT_LENGTH * 4,
    });
    if (run.error) {
      const errno = (run.error as NodeJS.ErrnoException).code;
      if (errno === 'ETIMEDOUT') {
        return failAll(`Tempo limite de execução excedido (${JAVA_RUN_TIMEOUT_MS / 1000}s). Verifique laços infinitos.`);
      }
      if (errno === 'ENOENT') return failAll('Java não está disponível no servidor no momento.');
      return failAll(`Erro ao executar o código: ${run.error.message}`);
    }
    if (run.signal) {
      return failAll(`Tempo limite de execução excedido (${JAVA_RUN_TIMEOUT_MS / 1000}s). Verifique laços infinitos.`);
    }

    const stdout = run.stdout ?? '';
    const markerAt = stdout.lastIndexOf(OUT_MARKER);
    if (run.status !== 0 || markerAt === -1) {
      const stderrLines = (run.stderr ?? '').trim().split('\n');
      const last = stderrLines[stderrLines.length - 1]?.trim();
      return failAll(last ? `Erro ao executar o código: ${last.slice(0, 300)}` : 'Erro ao executar o código.');
    }

    const payload = stdout.slice(markerAt + OUT_MARKER.length).trim();
    if (payload.length > MAX_OUT_LENGTH) {
      return failAll('A saída do código não pôde ser interpretada.');
    }

    let out: { missing?: boolean; results?: { got?: unknown; threw?: string }[] };
    try {
      out = JSON.parse(payload);
    } catch {
      return failAll('A saída do código não pôde ser interpretada.');
    }

    if (out.missing) {
      return failAll(`Defina o método ${challenge.functionName} na classe Solucao — o desafio chama exatamente esse nome.`);
    }
    if (!Array.isArray(out.results)) {
      return failAll('A saída do código não pôde ser interpretada.');
    }

    return gradeResults(challenge, out.results);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

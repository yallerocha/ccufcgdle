import { prisma } from './db';
import { getLocalDateString } from '@/shared/utils';
import { hashString } from './termo';
import { QUIZ_QUESTIONS, QUESTION_BY_ID, type QuizQuestion } from './quiz-questions';

// Daily set: 3 short questions, one from each POSCOMP area, so a round takes only
// a couple of minutes (micro-learning). 1 Matemática + 1 Fundamentos + 1 Tecnologia.
export const QUESTIONS_PER_DAY = 3;
const AREA_COUNTS: [string, number][] = [
  ['Matemática', 1],
  ['Fundamentos da Computação', 1],
  ['Tecnologia da Computação', 1],
];

// Deterministic per-date pick: for each area, rank its questions by a hash mixing
// the date and the question id, then take the first k. Everyone gets the same set
// on a given day and consecutive days rotate through the bank.
function pickDailyIds(date: string): string[] {
  const ids: string[] = [];
  for (const [area, count] of AREA_COUNTS) {
    const ranked = QUIZ_QUESTIONS.filter((q) => q.area === area)
      .map((q) => ({ id: q.id, key: hashString(`quiz:${date}:${q.id}`) }))
      .sort((a, b) => a.key - b.key);
    for (const { id } of ranked.slice(0, count)) ids.push(id);
  }
  return ids;
}

// A random set (admin "draw new" — must differ from the deterministic pick).
export function randomIds(): string[] {
  const ids: string[] = [];
  for (const [area, count] of AREA_COUNTS) {
    const pool = QUIZ_QUESTIONS.filter((q) => q.area === area);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    for (const q of shuffled.slice(0, count)) ids.push(q.id);
  }
  return ids;
}

export interface DailyQuiz {
  dailyKey: number | null;
  questions: QuizQuestion[];
}

// Returns today's (or the given date's) question set, creating + persisting it on
// first access so everyone plays the same round even if the bank changes later.
export async function getOrCreateDailyQuiz(dateStr?: string): Promise<DailyQuiz> {
  const date = dateStr || getLocalDateString();

  const toQuiz = (row: { id: number; questionIds: string }): DailyQuiz => ({
    dailyKey: row.id,
    questions: row.questionIds
      .split(',')
      .map((id) => QUESTION_BY_ID.get(id))
      .filter((q): q is QuizQuestion => Boolean(q)),
  });

  const existing = await prisma.quizDaily.findUnique({ where: { date } });
  if (existing) {
    const quiz = toQuiz(existing);
    const storedCount = existing.questionIds.split(',').filter(Boolean).length;
    // Self-heal: if the stored set references questions no longer in the bank
    // (e.g. right after the bank changed), some/all ids won't resolve. Redraw
    // this date's set so the round is never rendered empty or short.
    if (quiz.questions.length === storedCount) return quiz;
    const refreshed = pickDailyIds(date).join(',');
    const updated = await prisma.quizDaily.update({
      where: { date },
      data: { questionIds: refreshed },
    });
    return toQuiz(updated);
  }

  const questionIds = pickDailyIds(date).join(',');
  try {
    const created = await prisma.quizDaily.create({ data: { date, questionIds } });
    return toQuiz(created);
  } catch {
    // Parallel create: re-read whatever landed.
    const again = await prisma.quizDaily.findUnique({ where: { date } });
    return again ? toQuiz(again) : toQuiz({ id: 0, questionIds });
  }
}

// One recorded answer inside QuizProgress.answers (JSON array).
export interface QuizAnswer {
  i: number; // question index in the daily order
  choice: number; // option the player picked
  correct: boolean;
}

export function parseAnswers(json: string): QuizAnswer[] {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

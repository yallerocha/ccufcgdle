import { prisma } from './db';
import { getLocalDateString, getPreviousDateString } from '@/shared/utils';

export type GameId = 'lsdle' | 'termo' | 'forca';

export interface StreakInfo {
  current: number;
  best: number;
}

// Records a solve for (player, game) on `date` and returns the updated streak.
// Idempotent per day: solving twice on the same date doesn't increase it. A solve
// the day after the last one continues the streak; any larger gap restarts at 1.
export async function recordStreakSolve(
  playerId: string,
  game: GameId,
  date: string,
): Promise<StreakInfo> {
  const existing = await prisma.gameStreak.findUnique({
    where: { playerId_game: { playerId, game } },
  });

  if (!existing) {
    const created = await prisma.gameStreak.create({
      data: { playerId, game, current: 1, best: 1, lastDate: date },
    });
    return { current: created.current, best: created.best };
  }

  // Already counted today — no change.
  if (existing.lastDate === date) {
    return { current: existing.current, best: existing.best };
  }

  const continued = existing.lastDate === getPreviousDateString(date);
  const current = continued ? existing.current + 1 : 1;
  const best = Math.max(existing.best, current);

  const updated = await prisma.gameStreak.update({
    where: { playerId_game: { playerId, game } },
    data: { current, best, lastDate: date },
  });
  return { current: updated.current, best: updated.best };
}

// Returns the streak as it stands today: if the last solved date is neither today
// nor yesterday, the active streak has lapsed and `current` reads 0 (the stored
// value isn't mutated until the next solve). `best` is always the stored max.
export async function getStreak(playerId: string, game: GameId): Promise<StreakInfo> {
  const row = await prisma.gameStreak.findUnique({
    where: { playerId_game: { playerId, game } },
  });
  if (!row) return { current: 0, best: 0 };

  const today = getLocalDateString();
  const stillActive = row.lastDate === today || row.lastDate === getPreviousDateString(today);
  return { current: stillActive ? row.current : 0, best: row.best };
}

export interface StreakWeekDay {
  date: string;
  /** 0 = Monday … 6 = Sunday */
  weekday: number;
  completed: boolean;
  isToday: boolean;
}

export interface StreakWeekInfo {
  streak: StreakInfo;
  week: StreakWeekDay[];
}

/** Monday–Sunday of the current week in America/Recife. */
function getCurrentWeekDateStrings(): string[] {
  const todayStr = getLocalDateString();
  const [y, m, d] = todayStr.split('-').map(Number);
  const anchor = new Date(Date.UTC(y, m - 1, d));
  const dow = anchor.getUTCDay();
  const daysFromMonday = dow === 0 ? 6 : dow - 1;
  const monday = new Date(anchor);
  monday.setUTCDate(anchor.getUTCDate() - daysFromMonday);

  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    const dt = new Date(monday);
    dt.setUTCDate(monday.getUTCDate() + i);
    const yyyy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(dt.getUTCDate()).padStart(2, '0');
    out.push(`${yyyy}-${mm}-${dd}`);
  }
  return out;
}

async function getCompletedDates(
  playerId: string,
  game: GameId,
  dates: string[],
): Promise<Set<string>> {
  const where = { playerId, date: { in: dates } };
  let rows: { date: string }[];
  switch (game) {
    case 'lsdle':
      rows = await prisma.gameResult.findMany({ where, select: { date: true } });
      break;
    case 'termo':
      rows = await prisma.termoResult.findMany({ where, select: { date: true } });
      break;
    case 'forca':
      rows = await prisma.forcaResult.findMany({ where, select: { date: true } });
      break;
  }
  return new Set(rows.map((r) => r.date));
}

export async function getStreakWeek(playerId: string, game: GameId): Promise<StreakWeekInfo> {
  const today = getLocalDateString();
  const weekDates = getCurrentWeekDateStrings();
  const completed = await getCompletedDates(playerId, game, weekDates);
  const streak = await getStreak(playerId, game);

  return {
    streak,
    week: weekDates.map((date, weekday) => ({
      date,
      weekday,
      completed: completed.has(date),
      isToday: date === today,
    })),
  };
}

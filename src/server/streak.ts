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

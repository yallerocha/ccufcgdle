import { prisma } from './db';

// Leaderboard for O Show da Computação. A player's score is the **best prize**
// they have ever banked across all their finished runs (won/stopped/lost). Ties
// are broken by the faster of the runs that reached that prize, then by number
// of runs won, then name — so the order is stable.

export interface PlayerScore {
  id: string;
  name: string;
  photoUrl: string | null;
  points: number; // best banked prize (R$)
  wins: number; // number of runs that reached the top of the ladder
}

interface Agg extends PlayerScore {
  bestDurationMs: number; // duration of the run that set `points` (tiebreak)
}

const FINISHED = ['won', 'stopped', 'lost'];

export async function computeLeaderboard(): Promise<PlayerScore[]> {
  const [users, runs] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true, photoUrl: true } }),
    prisma.showRun.findMany({
      where: { status: { in: FINISHED } },
      select: { playerId: true, prize: true, status: true, durationMs: true },
    }),
  ]);

  const byId = new Map<string, Agg>();
  for (const u of users) {
    byId.set(u.id, {
      id: u.id,
      name: u.name,
      photoUrl: u.photoUrl ?? null,
      points: 0,
      wins: 0,
      bestDurationMs: Number.POSITIVE_INFINITY,
    });
  }

  for (const r of runs) {
    const p = byId.get(r.playerId);
    if (!p) continue; // run from a deleted user
    if (r.status === 'won') p.wins += 1;
    const dur = r.durationMs ?? Number.POSITIVE_INFINITY;
    if (r.prize > p.points || (r.prize === p.points && dur < p.bestDurationMs)) {
      p.points = r.prize;
      p.bestDurationMs = dur;
    }
  }

  return [...byId.values()]
    .filter((p) => p.points > 0)
    .sort(
      (a, b) =>
        b.points - a.points ||
        a.bestDurationMs - b.bestDurationMs ||
        b.wins - a.wins ||
        a.name.localeCompare(b.name),
    )
    .map((p) => ({ id: p.id, name: p.name, photoUrl: p.photoUrl, points: p.points, wins: p.wins }));
}

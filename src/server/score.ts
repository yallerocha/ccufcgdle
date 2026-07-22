import { prisma } from './db';

// Leaderboard for O Show da Computação. A player's score is the **sum of every
// prize** they have ever banked across finished runs (won/stopped/lost). Ties
// are broken by number of million-win runs, then name — so the order is stable.

export interface PlayerScore {
  id: string;
  name: string;
  photoUrl: string | null;
  points: number; // total banked winnings (R$)
  wins: number; // number of runs that reached the top of the ladder
}

const FINISHED = ['won', 'stopped', 'lost'];

export async function computeLeaderboard(): Promise<PlayerScore[]> {
  const [users, runs] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true, photoUrl: true } }),
    prisma.showRun.findMany({
      where: { status: { in: FINISHED } },
      select: { playerId: true, prize: true, status: true },
    }),
  ]);

  const byId = new Map<string, PlayerScore>();
  for (const u of users) {
    byId.set(u.id, { id: u.id, name: u.name, photoUrl: u.photoUrl ?? null, points: 0, wins: 0 });
  }

  for (const r of runs) {
    const p = byId.get(r.playerId);
    if (!p) continue; // run from a deleted user
    p.points += r.prize;
    if (r.status === 'won') p.wins += 1;
  }

  return [...byId.values()]
    .filter((p) => p.points > 0)
    .sort((a, b) => b.points - a.points || b.wins - a.wins || a.name.localeCompare(b.name));
}

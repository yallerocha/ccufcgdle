import { prisma } from './db';

// Unified cross-game scoring. Every solved daily round awards a flat base plus an
// efficiency bonus (better play → more points). The games are normalized so none
// dominates: each contributes roughly the same base, and the bonus is bounded.
const WIN_BASE = 10;

// Efficiency bonus per solve. `attempts` is the count stored in the result row:
// guesses for LSDLE/Termo, wrong letters for Forca, submissions for Code.
function bonus(game: 'lsdle' | 'termo' | 'forca' | 'code', attempts: number): number {
  switch (game) {
    case 'termo':
      // 1..6 guesses → bonus 5..0.
      return Math.max(0, 6 - attempts);
    case 'forca':
      // 0..5 wrong → bonus 5..0.
      return Math.max(0, 5 - attempts);
    case 'code':
      // 1..6 submissions → bonus 5..0.
      return Math.max(0, 6 - attempts);
    case 'lsdle':
    default:
      // Unbounded guesses; reward solving in few tries, capped like the others.
      return Math.max(0, 8 - attempts);
  }
}

// The quiz has no win/lose: completing it scores 2 points per correct answer,
// plus a 5-point bonus for a perfect round — max 15, same ceiling as the others.
function quizPoints(correct: number, total: number): number {
  return 2 * correct + (total > 0 && correct === total ? 5 : 0);
}

export interface PlayerScore {
  id: string;
  name: string;
  photoUrl: string | null;
  points: number;
  wins: number;
}

// Aggregates every player's total points across all games, ranked desc. Ties are
// broken by total wins, then name (so the order is stable).
export async function computeLeaderboard(): Promise<PlayerScore[]> {
  const [users, lsdle, termo, forca, code, quiz] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true, photoUrl: true } }),
    prisma.gameResult.findMany({ select: { playerId: true, attempts: true } }),
    prisma.termoResult.findMany({ select: { playerId: true, attempts: true } }),
    prisma.forcaResult.findMany({ select: { playerId: true, attempts: true } }),
    prisma.codeResult.findMany({ select: { playerId: true, attempts: true } }),
    prisma.quizResult.findMany({ select: { playerId: true, correct: true, total: true } }),
  ]);

  const byId = new Map<string, PlayerScore>();
  for (const u of users) {
    byId.set(u.id, { id: u.id, name: u.name, photoUrl: u.photoUrl ?? null, points: 0, wins: 0 });
  }

  const add = (
    game: 'lsdle' | 'termo' | 'forca' | 'code',
    rows: { playerId: string; attempts: number }[],
  ) => {
    for (const r of rows) {
      const p = byId.get(r.playerId);
      if (!p) continue; // result from a deleted user
      p.points += WIN_BASE + bonus(game, r.attempts);
      p.wins += 1;
    }
  };

  add('lsdle', lsdle);
  add('termo', termo);
  add('forca', forca);
  add('code', code);

  for (const r of quiz) {
    const p = byId.get(r.playerId);
    if (!p) continue;
    p.points += quizPoints(r.correct, r.total);
    p.wins += 1; // a completed quiz counts as a played/won round
  }

  return [...byId.values()]
    .filter((p) => p.wins > 0)
    .sort((a, b) => b.points - a.points || b.wins - a.wins || a.name.localeCompare(b.name));
}

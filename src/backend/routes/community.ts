import { Router } from 'express';
import { prisma } from '../../server/db';
import { computeLeaderboard } from '../../server/score';
import { LADDER_SIZE } from '../../server/show';
import { QUESTION_BY_ID } from '../../server/quiz-questions';

// Community/infra endpoints shared by the members directory, the podium and the
// registration/profile flow. Not part of the game itself, hence its own router.
const router = Router();

// GET /api/community/leaderboard — overall ranking (best Show prize per player).
router.get('/leaderboard', async (_req, res) => {
  try {
    const board = await computeLeaderboard();
    const ranking = board.map((p, i) => ({ rank: i + 1, ...p }));
    return res.json({ ranking });
  } catch (error) {
    console.error('Error in leaderboard API:', error);
    return res.status(500).json({ error: 'Erro ao carregar a classificação.' });
  }
});

// GET /api/community/members — public roster of registered members (name + photo).
router.get('/members', async (_req, res) => {
  try {
    const members = await prisma.user.findMany({
      where: { isActive: true, emailVerifiedAt: { not: null } },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, photoUrl: true },
    });
    return res.json({ members, count: members.length });
  } catch (error) {
    console.error('Error in members API:', error);
    return res.status(500).json({ error: 'Erro ao carregar os membros.' });
  }
});

// GET /api/community/members/:id/stats — a member's aggregated Show stats for the
// member-profile modal.
router.get('/members/:id/stats', async (req, res) => {
  try {
    const id = req.params.id;
    const member = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, photoUrl: true, createdAt: true },
    });
    if (!member) {
      return res.status(404).json({ error: 'Membro não encontrado.' });
    }

    const runs = await prisma.showRun.findMany({
      where: { playerId: id, status: { in: ['won', 'stopped', 'lost'] } },
      select: { status: true, prize: true, currentStep: true, durationMs: true, questionIds: true },
    });

    let totalWinnings = 0;
    let bestPrize = 0;
    let wins = 0;
    let bestCleared = 0;
    let fastestMs: number | null = null;
    const correctByTopic: Record<string, number> = {};
    for (const r of runs) {
      const cleared = r.status === 'won' ? LADDER_SIZE : Math.max(0, r.currentStep - 1);
      totalWinnings += r.prize;
      bestPrize = Math.max(bestPrize, r.prize);
      bestCleared = Math.max(bestCleared, cleared);
      // Every cleared step was answered correctly (a wrong answer ends the run).
      const ids = r.questionIds ? r.questionIds.split(',') : [];
      for (const qid of ids.slice(0, cleared)) {
        const topic = QUESTION_BY_ID.get(qid)?.topic;
        if (topic) correctByTopic[topic] = (correctByTopic[topic] ?? 0) + 1;
      }
      if (r.status === 'won') {
        wins += 1;
        if (r.durationMs != null && (fastestMs == null || r.durationMs < fastestMs)) {
          fastestMs = r.durationMs;
        }
      }
    }

    // Topic with the most correct answers (ties broken by first encountered).
    let topTopic: { topic: string; correct: number } | null = null;
    for (const [topic, correct] of Object.entries(correctByTopic)) {
      if (!topTopic || correct > topTopic.correct) topTopic = { topic, correct };
    }

    return res.json({
      member,
      stats: { runs: runs.length, wins, totalWinnings, bestPrize, bestCleared, totalSteps: LADDER_SIZE, fastestMs, topTopic },
    });
  } catch (error) {
    console.error('Error in member stats API:', error);
    return res.status(500).json({ error: 'Erro ao carregar as estatísticas.' });
  }
});


export default router;

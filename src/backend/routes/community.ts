import { Router } from 'express';
import { prisma } from '../../server/db';
import { computeLeaderboard } from '../../server/score';
import { createProject, listProjectsWithCounts } from '../../server/projects';
import { LADDER_SIZE } from '../../server/show';
import { requireAuth } from '../middleware/auth';

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
      select: { status: true, prize: true, currentStep: true, durationMs: true },
    });

    let bestPrize = 0;
    let wins = 0;
    let bestCleared = 0;
    let fastestMs: number | null = null;
    for (const r of runs) {
      const cleared = r.status === 'won' ? LADDER_SIZE : Math.max(0, r.currentStep - 1);
      bestPrize = Math.max(bestPrize, r.prize);
      bestCleared = Math.max(bestCleared, cleared);
      if (r.status === 'won') {
        wins += 1;
        if (r.durationMs != null && (fastestMs == null || r.durationMs < fastestMs)) {
          fastestMs = r.durationMs;
        }
      }
    }

    return res.json({
      member,
      stats: { runs: runs.length, wins, bestPrize, bestCleared, totalSteps: LADDER_SIZE, fastestMs },
    });
  } catch (error) {
    console.error('Error in member stats API:', error);
    return res.status(500).json({ error: 'Erro ao carregar as estatísticas.' });
  }
});

// GET /api/community/projects — catalog with how many active members chose each.
router.get('/projects', async (_req, res) => {
  try {
    const projects = await listProjectsWithCounts();
    return res.json({ projects });
  } catch (error) {
    console.error('Error loading projects:', error);
    return res.status(500).json({ error: 'Erro ao carregar os projetos.' });
  }
});

// POST /api/community/projects — authenticated users may propose a new project.
router.post('/projects', requireAuth, async (req, res) => {
  try {
    const { name } = req.body ?? {};
    if (typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Informe o nome do projeto.' });
    }
    const result = await createProject(name, req.auth!.userId);
    if ('error' in result) {
      return res.status(400).json({ error: result.error });
    }
    const projects = await listProjectsWithCounts();
    const entry = projects.find((p) => p.id === result.project.id);
    return res.status(result.created ? 201 : 200).json({
      project: entry ?? { ...result.project, memberCount: 0 },
      created: result.created,
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return res.status(500).json({ error: 'Erro ao criar o projeto.' });
  }
});

export default router;

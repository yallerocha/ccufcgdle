import { Router } from 'express';
import { prisma } from '../../server/db';
import { getLocalDateString } from '../../shared/utils';
import { getOrCreateDailyChallenge, runUserCode, isCodeLanguage, MAX_CODE_LENGTH } from '../../server/code';
import { recordStreakSolve, getStreak, getStreakWeek, type StreakInfo } from '../../server/streak';
import { requireAuth, withAuth } from '../middleware/auth';

const router = Router();

// GET /api/code/daily — today's challenge (statement, starter code and the test
// cases, which are all visible) plus a non-identifying daily key the client
// uses to detect an admin reset.
router.get('/daily', async (_req, res) => {
  try {
    const { dailyKey, challenge } = await getOrCreateDailyChallenge();
    return res.json({
      dailyKey,
      challenge: {
        id: challenge.id,
        title: challenge.title,
        titleEn: challenge.titleEn,
        difficulty: challenge.difficulty,
        functionName: challenge.functionName,
        description: challenge.description,
        descriptionEn: challenge.descriptionEn,
        starters: challenge.starters,
        tests: challenge.tests,
      },
    });
  } catch (error) {
    console.error('Error in code/daily API:', error);
    return res.status(500).json({ error: 'Erro ao carregar o desafio.' });
  }
});

// POST /api/code/submit — run the player's code against every test, server-side.
// For logged-in players each submission increments the server-side attempt count,
// and the first fully-green run locks in the ranking result (fewest submissions,
// then time since the first try).
router.post('/submit', withAuth, async (req, res) => {
  try {
    const code = typeof req.body?.code === 'string' ? req.body.code : '';
    if (code.trim() === '') {
      return res.status(400).json({ error: 'Envie o código da sua solução.' });
    }
    if (code.length > MAX_CODE_LENGTH) {
      return res.status(400).json({ error: `O código excede o limite de ${MAX_CODE_LENGTH} caracteres.` });
    }
    const language = isCodeLanguage(req.body?.language) ? req.body.language : 'js';

    const { challenge } = await getOrCreateDailyChallenge();
    const run = runUserCode(code, challenge, language);
    const solved = run.ok && run.passed === run.total;

    let attemptsUsed = 0;
    let streak: StreakInfo | undefined;

    if (req.auth) {
      const date = getLocalDateString();
      const playerId = req.auth.userId;
      const playerExists = await prisma.user.findUnique({
        where: { id: playerId },
        select: { id: true },
      });

      if (playerExists) {
        const progress = await prisma.codeProgress.upsert({
          where: { date_playerId: { date, playerId } },
          create: { date, playerId, attempts: 1, firstTryAt: new Date() },
          update: { attempts: { increment: 1 } },
        });
        attemptsUsed = progress.attempts;

        if (solved && !progress.solved) {
          const solvedAt = new Date();
          const durationMs = Math.max(0, solvedAt.getTime() - progress.firstTryAt.getTime());
          await prisma.$transaction([
            prisma.codeProgress.update({
              where: { date_playerId: { date, playerId } },
              data: { solved: true, solvedAt },
            }),
            prisma.codeResult.upsert({
              where: { date_playerId: { date, playerId } },
              create: { date, playerId, attempts: progress.attempts, durationMs },
              update: {},
            }),
          ]);
          streak = await recordStreakSolve(playerId, 'code', date);
        }
      }
    }

    return res.json({
      ok: run.ok,
      error: run.error,
      results: run.results,
      passed: run.passed,
      total: run.total,
      solved,
      attemptsUsed,
      streak,
    });
  } catch (error) {
    console.error('Error handling code submit:', error);
    return res.status(500).json({ error: 'Erro interno ao executar o código.' });
  }
});

// GET /api/code/streak — current streak + this week's completion calendar.
router.get('/streak', requireAuth, async (req, res) => {
  try {
    const data = await getStreakWeek(req.auth!.userId, 'code');
    return res.json(data);
  } catch (error) {
    console.error('Error loading code streak:', error);
    return res.status(500).json({ error: 'Erro ao carregar a sequência.' });
  }
});

// GET /api/code/result — the logged-in player's recorded result for today.
router.get('/result', requireAuth, async (req, res) => {
  try {
    const date = getLocalDateString();
    const result = await prisma.codeResult.findUnique({
      where: { date_playerId: { date, playerId: req.auth!.userId } },
    });
    const streak = await getStreak(req.auth!.userId, 'code');
    return res.json({ result: result ?? null, streak });
  } catch (error) {
    console.error('Error loading code result:', error);
    return res.status(500).json({ error: 'Erro ao carregar resultado.' });
  }
});

// GET /api/code/ranking — daily ranking (fewest submissions first, then duration).
router.get('/ranking', async (req, res) => {
  try {
    const date = (req.query.date as string) || getLocalDateString();
    const results = await prisma.codeResult.findMany({
      where: { date },
      orderBy: [{ attempts: 'asc' }, { durationMs: 'asc' }, { createdAt: 'asc' }],
      include: { player: { select: { id: true, name: true, photoUrl: true } } },
    });

    const ranking = results.map((r, i) => ({
      rank: i + 1,
      playerId: r.player.id,
      name: r.player.name,
      photoUrl: r.player.photoUrl,
      attempts: r.attempts,
      durationMs: r.durationMs,
    }));

    return res.json({ date, ranking });
  } catch (error) {
    console.error('Error loading code ranking:', error);
    return res.status(500).json({ error: 'Erro ao carregar o ranking.' });
  }
});

export default router;

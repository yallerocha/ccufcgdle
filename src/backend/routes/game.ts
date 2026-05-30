import { Router } from 'express';
import { prisma } from '../../server/db';
import { getActiveUsers, getOrCreateDailyCharacter, compareCharacters } from '../../server/game';
import { getLocalDateString } from '../../shared/utils';
import { requireAuth, withAuth } from '../middleware/auth';

const router = Router();

// GET /api/game/active-characters — autocomplete list for guessing, plus a
// non-identifying "daily key" the client uses to detect when an admin resets the
// round (the key changes, but never reveals who the person of the day is).
router.get('/active-characters', async (_req, res) => {
  try {
    const activeUsers = await getActiveUsers();

    const list = activeUsers.map((u) => ({
      id: u.id,
      name: u.name,
      photoUrl: u.photoUrl,
    }));

    // Ensure today's pick exists, then expose only the DailyCharacter row id.
    await getOrCreateDailyCharacter();
    const daily = await prisma.dailyCharacter.findUnique({
      where: { date: getLocalDateString() },
      select: { id: true },
    });

    return res.json({ characters: list, dailyKey: daily?.id ?? null });
  } catch (error) {
    console.error('Error in active-characters API:', error);
    return res.status(500).json({ error: 'Erro interno ao obter pessoas ativas.' });
  }
});

// POST /api/game/guess — compares a guessed character with today's target.
// For authenticated players, attempts and timing are tracked server-side so the
// daily ranking is recorded from real play, not from client-supplied numbers.
router.post('/guess', withAuth, async (req, res) => {
  try {
    const { guessId } = req.body ?? {};

    if (!guessId) {
      return res.status(400).json({ error: 'ID do palpite é obrigatório.' });
    }

    const target = await getOrCreateDailyCharacter();
    if (!target) {
      return res.status(404).json({
        error: 'Não há pessoas disponíveis no jogo. Cadastre-se para ser a primeira!',
      });
    }

    const guessUser = await prisma.user.findUnique({ where: { id: guessId } });
    if (!guessUser) {
      return res.status(404).json({ error: 'Pessoa não encontrada.' });
    }

    const feedback = compareCharacters(guessUser, target);

    // Track progress only for logged-in players (only they can be ranked).
    if (req.auth) {
      const date = getLocalDateString();
      const playerId = req.auth.userId;

      // Atomically count this guess; create the row on the first guess.
      const progress = await prisma.dailyProgress.upsert({
        where: { date_playerId: { date, playerId } },
        create: { date, playerId, attempts: 1, firstGuessAt: new Date() },
        update: { attempts: { increment: 1 } },
      });

      // On the first correct guess, lock in the ranking result using the
      // server's own attempt count and elapsed time.
      if (feedback.correct && !progress.solved) {
        const solvedAt = new Date();
        const durationMs = Math.max(0, solvedAt.getTime() - progress.firstGuessAt.getTime());

        await prisma.$transaction([
          prisma.dailyProgress.update({
            where: { date_playerId: { date, playerId } },
            data: { solved: true, solvedAt },
          }),
          prisma.gameResult.upsert({
            where: { date_playerId: { date, playerId } },
            create: { date, playerId, attempts: progress.attempts, durationMs },
            update: {},
          }),
        ]);
      }
    }

    return res.json({
      feedback,
      targetName: feedback.correct ? target.name : undefined,
      photoUrl: feedback.correct ? target.photoUrl : undefined,
    });
  } catch (error) {
    console.error('Error handling guess:', error);
    return res.status(500).json({ error: 'Erro interno ao processar o palpite.' });
  }
});

// GET /api/game/result — returns the logged-in player's server-recorded result
// for today (if they have solved it). Results are written by /guess, never from
// client-supplied numbers, so they can't be forged.
router.get('/result', requireAuth, async (req, res) => {
  try {
    const date = getLocalDateString();
    const result = await prisma.gameResult.findUnique({
      where: { date_playerId: { date, playerId: req.auth!.userId } },
    });
    return res.json({ result: result ?? null });
  } catch (error) {
    console.error('Error loading game result:', error);
    return res.status(500).json({ error: 'Erro ao carregar resultado.' });
  }
});

// GET /api/game/ranking — daily ranking (fewer attempts first, then duration).
router.get('/ranking', async (req, res) => {
  try {
    const date = (req.query.date as string) || getLocalDateString();

    const results = await prisma.gameResult.findMany({
      where: { date },
      orderBy: [
        { attempts: 'asc' },
        { durationMs: 'asc' },
        { createdAt: 'asc' },
      ],
      include: {
        player: { select: { name: true, photoUrl: true } },
      },
    });

    const ranking = results.map((r, i) => ({
      rank: i + 1,
      name: r.player.name,
      photoUrl: r.player.photoUrl,
      attempts: r.attempts,
      durationMs: r.durationMs,
    }));

    return res.json({ date, ranking });
  } catch (error) {
    console.error('Error loading ranking:', error);
    return res.status(500).json({ error: 'Erro ao carregar o ranking.' });
  }
});

export default router;

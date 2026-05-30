import { Router } from 'express';
import { prisma } from '../../server/db';
import { getActiveUsers, getOrCreateDailyCharacter, compareCharacters } from '../../server/game';
import { getLocalDateString } from '../../shared/utils';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET /api/game/active-characters — autocomplete list for guessing.
router.get('/active-characters', async (_req, res) => {
  try {
    const activeUsers = await getActiveUsers();

    const list = activeUsers.map((u) => ({
      id: u.id,
      name: u.name,
      photoUrl: u.photoUrl,
    }));

    return res.json({ characters: list });
  } catch (error) {
    console.error('Error in active-characters API:', error);
    return res.status(500).json({ error: 'Erro interno ao obter personagens ativos.' });
  }
});

// POST /api/game/guess — compares a guessed character with today's target.
router.post('/guess', async (req, res) => {
  try {
    const { guessId } = req.body ?? {};

    if (!guessId) {
      return res.status(400).json({ error: 'ID do palpite é obrigatório.' });
    }

    const target = await getOrCreateDailyCharacter();
    if (!target) {
      return res.status(404).json({
        error: 'Não há personagens disponíveis no jogo. Cadastre-se para ser o primeiro!',
      });
    }

    const guessUser = await prisma.user.findUnique({ where: { id: guessId } });
    if (!guessUser) {
      return res.status(404).json({ error: 'Personagem não encontrado.' });
    }

    const feedback = compareCharacters(guessUser, target);

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

// POST /api/game/result — records the logged-in player's result for today.
// Only the first submission per day counts (re-submits are ignored).
router.post('/result', requireAuth, async (req, res) => {
  try {
    const attempts = Number(req.body?.attempts);
    const durationMs = Number(req.body?.durationMs);

    if (!Number.isInteger(attempts) || attempts < 1 || attempts > 1000) {
      return res.status(400).json({ error: 'Número de tentativas inválido.' });
    }
    if (!Number.isFinite(durationMs) || durationMs < 0) {
      return res.status(400).json({ error: 'Duração inválida.' });
    }

    const date = getLocalDateString();

    const result = await prisma.gameResult.upsert({
      where: { date_playerId: { date, playerId: req.auth!.userId } },
      create: {
        date,
        playerId: req.auth!.userId,
        attempts,
        durationMs: Math.round(durationMs),
      },
      update: {},
    });

    return res.json({ result });
  } catch (error) {
    console.error('Error saving game result:', error);
    return res.status(500).json({ error: 'Erro ao salvar resultado.' });
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

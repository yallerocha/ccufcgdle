import { Router } from 'express';
import { prisma } from '../../server/db';
import { getActiveUsers, getOrCreateDailyCharacter, compareCharacters } from '../../server/game';
import { getLocalDateString } from '../../shared/utils';
import { validateDailyMessage } from '../../shared/validation';
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

    // Track progress only for logged-in players whose account still exists
    // (the seed may have recreated users with new IDs while old JWTs persist).
    if (req.auth) {
      const date = getLocalDateString();
      const playerId = req.auth.userId;

      // Guard: ensure the player referenced by the JWT still exists.
      const playerExists = await prisma.user.findUnique({
        where: { id: playerId },
        select: { id: true },
      });

      if (playerExists) {
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

// GET /api/game/daily-message — the message the person of the day left for the
// players who guess them. Only revealed to players who already solved today's
// round (or to the author), so it never leaks a hint about who the target is.
// `canEdit` tells the client whether the caller IS today's person.
router.get('/daily-message', requireAuth, async (req, res) => {
  try {
    const date = getLocalDateString();
    const playerId = req.auth!.userId;

    const target = await getOrCreateDailyCharacter();
    if (!target) {
      return res.json({ canEdit: false, message: null, mediaUrl: null });
    }

    const canEdit = target.id === playerId;

    if (!canEdit) {
      const progress = await prisma.dailyProgress.findUnique({
        where: { date_playerId: { date, playerId } },
        select: { solved: true },
      });
      if (!progress?.solved) {
        return res.status(403).json({ error: 'Resolva o jogo de hoje primeiro.' });
      }
    }

    const daily = await prisma.dailyCharacter.findUnique({
      where: { date },
      select: { message: true, mediaUrl: true },
    });

    return res.json({
      canEdit,
      message: daily?.message ?? null,
      mediaUrl: daily?.mediaUrl ?? null,
    });
  } catch (error) {
    console.error('Error loading daily message:', error);
    return res.status(500).json({ error: 'Erro ao carregar a mensagem do dia.' });
  }
});

// POST /api/game/daily-message — lets the person of the day set (or clear) the
// message + image shown to players who guess them. Only the current target may
// write it; sending empty values clears the message.
router.post('/daily-message', requireAuth, async (req, res) => {
  try {
    const date = getLocalDateString();
    const playerId = req.auth!.userId;

    const target = await getOrCreateDailyCharacter();
    if (!target || target.id !== playerId) {
      return res.status(403).json({ error: 'Apenas a pessoa do dia pode deixar uma mensagem.' });
    }

    // The note can only be left once per round: if anything is already saved,
    // refuse to overwrite it.
    const existing = await prisma.dailyCharacter.findUnique({
      where: { date },
      select: { message: true, mediaUrl: true },
    });
    if (existing?.message || existing?.mediaUrl) {
      return res.status(409).json({ error: 'Você já deixou seu recado de hoje.' });
    }

    const { message, mediaUrl } = req.body ?? {};
    const validationError = validateDailyMessage(message, mediaUrl);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const normMessage =
      typeof message === 'string' && message.trim() !== '' ? message.trim() : null;
    const normMedia = typeof mediaUrl === 'string' && mediaUrl !== '' ? mediaUrl : null;

    // Nothing to save: reject an empty note instead of recording a blank one.
    if (!normMessage && !normMedia) {
      return res.status(400).json({ error: 'Escreva uma frase ou adicione uma imagem.' });
    }

    const updated = await prisma.dailyCharacter.update({
      where: { date },
      data: { message: normMessage, mediaUrl: normMedia },
      select: { message: true, mediaUrl: true },
    });

    return res.json({ message: updated.message, mediaUrl: updated.mediaUrl });
  } catch (error) {
    console.error('Error saving daily message:', error);
    return res.status(500).json({ error: 'Erro ao salvar a mensagem do dia.' });
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

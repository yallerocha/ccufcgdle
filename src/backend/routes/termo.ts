import { Router } from 'express';
import { prisma } from '../../server/db';
import { getLocalDateString } from '../../shared/utils';
import {
  WORD_LENGTH,
  MAX_ATTEMPTS,
  normalize,
  isValidGuess,
  evaluateGuess,
  getOrCreateDailyWord,
} from '../../server/termo';
import { requireAuth, withAuth } from '../middleware/auth';

const router = Router();

// GET /api/termo/daily — game settings + a non-identifying "daily key" the
// client uses to detect an admin reset (changes without revealing the word).
router.get('/daily', async (_req, res) => {
  try {
    await getOrCreateDailyWord();
    const daily = await prisma.termoDaily.findUnique({
      where: { date: getLocalDateString() },
      select: { id: true },
    });
    return res.json({
      wordLength: WORD_LENGTH,
      maxAttempts: MAX_ATTEMPTS,
      dailyKey: daily?.id ?? null,
    });
  } catch (error) {
    console.error('Error in termo/daily API:', error);
    return res.status(500).json({ error: 'Erro ao carregar o jogo.' });
  }
});

// POST /api/termo/guess — validates a 5-letter word, returns per-letter feedback
// and (for logged-in players) tracks attempts/timing so the ranking is recorded
// from real play, never from client-supplied numbers.
router.post('/guess', withAuth, async (req, res) => {
  try {
    const raw = typeof req.body?.guess === 'string' ? req.body.guess : '';
    const guess = normalize(raw);

    if (guess.length !== WORD_LENGTH) {
      return res.status(400).json({ error: `A palavra deve ter ${WORD_LENGTH} letras.` });
    }
    if (!isValidGuess(guess)) {
      return res.status(422).json({ error: 'Palavra não está na lista.' });
    }

    const { word: solution, display } = await getOrCreateDailyWord();
    const results = evaluateGuess(guess, solution);
    const solved = guess === solution;

    // Server-side attempt count for logged-in players (authoritative). Anonymous
    // players have no ranking, so we fall back to the client-reported number just
    // to decide when to reveal the answer to them.
    let attemptsUsed =
      typeof req.body?.attemptNumber === 'number' ? req.body.attemptNumber : 0;

    if (req.auth) {
      const date = getLocalDateString();
      const playerId = req.auth.userId;

      const playerExists = await prisma.user.findUnique({
        where: { id: playerId },
        select: { id: true },
      });

      if (playerExists) {
        const progress = await prisma.termoProgress.upsert({
          where: { date_playerId: { date, playerId } },
          create: { date, playerId, attempts: 1, firstGuessAt: new Date() },
          update: { attempts: { increment: 1 } },
        });
        attemptsUsed = progress.attempts;

        // Lock in the ranking result on the first correct guess, using the
        // server's own attempt count and elapsed time.
        if (solved && !progress.solved) {
          const solvedAt = new Date();
          const durationMs = Math.max(0, solvedAt.getTime() - progress.firstGuessAt.getTime());
          await prisma.$transaction([
            prisma.termoProgress.update({
              where: { date_playerId: { date, playerId } },
              data: { solved: true, solvedAt },
            }),
            prisma.termoResult.upsert({
              where: { date_playerId: { date, playerId } },
              create: { date, playerId, attempts: progress.attempts, durationMs },
              update: {},
            }),
          ]);
        }
      }
    }

    // Only reveal the answer once the player solved it or used every attempt.
    const revealed = solved || attemptsUsed >= MAX_ATTEMPTS ? display : undefined;

    return res.json({ results, solved, revealed });
  } catch (error) {
    console.error('Error handling termo guess:', error);
    return res.status(500).json({ error: 'Erro interno ao processar o palpite.' });
  }
});

// GET /api/termo/result — the logged-in player's recorded result for today.
router.get('/result', requireAuth, async (req, res) => {
  try {
    const date = getLocalDateString();
    const result = await prisma.termoResult.findUnique({
      where: { date_playerId: { date, playerId: req.auth!.userId } },
    });
    return res.json({ result: result ?? null });
  } catch (error) {
    console.error('Error loading termo result:', error);
    return res.status(500).json({ error: 'Erro ao carregar resultado.' });
  }
});

// GET /api/termo/ranking — daily ranking (fewer attempts first, then duration).
router.get('/ranking', async (req, res) => {
  try {
    const date = (req.query.date as string) || getLocalDateString();
    const results = await prisma.termoResult.findMany({
      where: { date },
      orderBy: [{ attempts: 'asc' }, { durationMs: 'asc' }, { createdAt: 'asc' }],
      include: { player: { select: { name: true, photoUrl: true } } },
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
    console.error('Error loading termo ranking:', error);
    return res.status(500).json({ error: 'Erro ao carregar o ranking.' });
  }
});

export default router;

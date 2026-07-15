import { Router } from 'express';
import { prisma } from '../../server/db';
import { getLocalDateString } from '../../shared/utils';
import { normalize } from '../../server/termo';
import { MAX_WRONG, getOrCreateDailyWord, countWrong, isSolved } from '../../server/forca';
import { recordStreakSolve, getStreak, getStreakWeek, type StreakInfo } from '../../server/streak';
import { requireAuth, withAuth } from '../middleware/auth';

const router = Router();

// GET /api/forca/daily — word length (number of blanks), theme hint, allowed
// wrong guesses, and a non-identifying daily key the client uses to detect an
// admin reset.
router.get('/daily', async (_req, res) => {
  try {
    const { word, theme, personName, personPhoto } = await getOrCreateDailyWord();
    const daily = await prisma.forcaDaily.findUnique({
      where: { date: getLocalDateString() },
      select: { id: true },
    });
    return res.json({
      wordLength: word.length,
      theme,
      maxWrong: MAX_WRONG,
      dailyKey: daily?.id ?? null,
      personName: personName ?? null,
      personPhoto: personPhoto ?? null,
    });
  } catch (error) {
    console.error('Error in forca/daily API:', error);
    return res.status(500).json({ error: 'Erro ao carregar o jogo.' });
  }
});

// POST /api/forca/guess — guess a single letter. Returns the positions it fills
// plus the authoritative game state. For logged-in players the guessed letters
// are tracked server-side so the ranking (fewest wrong guesses) is from real
// play; anonymous players send their own `guessed` set (no ranking).
router.post('/guess', withAuth, async (req, res) => {
  try {
    const letter = normalize(typeof req.body?.letter === 'string' ? req.body.letter : '');
    if (letter.length !== 1) {
      return res.status(400).json({ error: 'Envie uma única letra.' });
    }

    const { word: solution, display } = await getOrCreateDailyWord();

    // Positions in the (normalized) word where this letter appears.
    const positions: number[] = [];
    for (let i = 0; i < solution.length; i++) {
      if (solution[i] === letter) positions.push(i);
    }

    // Build the guessed-letters set: authoritative for logged-in players, taken
    // from the client for anonymous ones.
    let guessed: string;

    if (req.auth) {
      const date = getLocalDateString();
      const playerId = req.auth.userId;
      const playerExists = await prisma.user.findUnique({ where: { id: playerId }, select: { id: true } });

      if (playerExists) {
        const progress = await prisma.forcaProgress.upsert({
          where: { date_playerId: { date, playerId } },
          create: { date, playerId, guessed: letter, firstGuessAt: new Date() },
          update: {},
        });
        const set = new Set(progress.guessed.split(''));
        set.add(letter);
        guessed = [...set].join('');
        if (guessed !== progress.guessed) {
          await prisma.forcaProgress.update({
            where: { date_playerId: { date, playerId } },
            data: { guessed },
          });
        }

        const wrong = countWrong(guessed, solution);
        const solved = isSolved(guessed, solution);
        const lost = wrong >= MAX_WRONG;

        let streak: StreakInfo | undefined;
        if (solved && !progress.solved) {
          const solvedAt = new Date();
          const durationMs = Math.max(0, solvedAt.getTime() - progress.firstGuessAt.getTime());
          await prisma.$transaction([
            prisma.forcaProgress.update({
              where: { date_playerId: { date, playerId } },
              data: { solved: true, solvedAt },
            }),
            prisma.forcaResult.upsert({
              where: { date_playerId: { date, playerId } },
              create: { date, playerId, attempts: wrong, durationMs },
              update: {},
            }),
          ]);
          streak = await recordStreakSolve(playerId, 'forca', date);
        }

        const over = solved || lost;
        return res.json({
          positions,
          correct: positions.length > 0,
          guessed,
          wrong,
          solved,
          lost,
          maxWrong: MAX_WRONG,
          revealed: over ? display : undefined,
          streak,
        });
      }
    }

    // Anonymous (or a user whose account no longer exists): stateless, driven by
    // the client's reported guessed set.
    const prior = typeof req.body?.guessed === 'string' ? normalize(req.body.guessed) : '';
    guessed = [...new Set((prior + letter).split(''))].join('');
    const wrong = countWrong(guessed, solution);
    const solved = isSolved(guessed, solution);
    const lost = wrong >= MAX_WRONG;
    const over = solved || lost;

    return res.json({
      positions,
      correct: positions.length > 0,
      guessed,
      wrong,
      solved,
      lost,
      maxWrong: MAX_WRONG,
      revealed: over ? display : undefined,
    });
  } catch (error) {
    console.error('Error handling forca guess:', error);
    return res.status(500).json({ error: 'Erro interno ao processar o palpite.' });
  }
});

// GET /api/forca/streak — current streak + this week's completion calendar.
router.get('/streak', requireAuth, async (req, res) => {
  try {
    const data = await getStreakWeek(req.auth!.userId, 'forca');
    return res.json(data);
  } catch (error) {
    console.error('Error loading forca streak:', error);
    return res.status(500).json({ error: 'Erro ao carregar a sequência.' });
  }
});

// GET /api/forca/result — the logged-in player's recorded result for today.
router.get('/result', requireAuth, async (req, res) => {
  try {
    const date = getLocalDateString();
    const result = await prisma.forcaResult.findUnique({
      where: { date_playerId: { date, playerId: req.auth!.userId } },
    });
    const streak = await getStreak(req.auth!.userId, 'forca');
    return res.json({ result: result ?? null, streak });
  } catch (error) {
    console.error('Error loading forca result:', error);
    return res.status(500).json({ error: 'Erro ao carregar resultado.' });
  }
});

// GET /api/forca/ranking — daily ranking (fewest wrong guesses, then duration).
router.get('/ranking', async (req, res) => {
  try {
    const date = (req.query.date as string) || getLocalDateString();
    const results = await prisma.forcaResult.findMany({
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
    console.error('Error loading forca ranking:', error);
    return res.status(500).json({ error: 'Erro ao carregar o ranking.' });
  }
});

export default router;

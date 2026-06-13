import { Router } from 'express';
import { prisma } from '../../server/db';
import { getActiveUsers, getOrCreateDailyCharacter, compareCharacters, gameView } from '../../server/game';
import { recordStreakSolve, getStreak, type StreakInfo } from '../../server/streak';
import { computeLeaderboard } from '../../server/score';
import { getLocalDateString } from '../../shared/utils';
import { validateDailyMessage } from '../../shared/validation';
import { createProject, listProjectsWithCounts } from '../../server/projects';
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

// GET /api/game/leaderboard — overall ranking across all games (unified points).
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

// GET /api/game/members — public roster of registered members. Deliberately
// exposes only name + photo (never the guessable game attributes like area /
// projects / role), so the members page doesn't spoil the LSDLE game.
router.get('/members', async (_req, res) => {
  try {
    const members = await prisma.user.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, photoUrl: true },
    });
    return res.json({ members, count: members.length });
  } catch (error) {
    console.error('Error in members API:', error);
    return res.status(500).json({ error: 'Erro ao carregar os membros.' });
  }
});

// GET /api/game/members/:id/stats — aggregated public stats for one member,
// across all three games, for the member-profile modal. Only counts/aggregates,
// never the guessable attributes (so it doesn't spoil the LSDLE game).
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

    // Per-game wins + best (fewest attempts/wrongs, fastest) + current streak.
    const perGame = async (
      resultModel: { aggregate: Function; findFirst: Function },
      game: string,
    ) => {
      const agg = await resultModel.aggregate({
        where: { playerId: id },
        _count: { _all: true },
        _avg: { attempts: true },
        _min: { attempts: true },
      });
      const fastest = await resultModel.findFirst({
        where: { playerId: id },
        orderBy: [{ durationMs: 'asc' }],
        select: { durationMs: true },
      });
      const streak = await prisma.gameStreak.findUnique({
        where: { playerId_game: { playerId: id, game } },
        select: { current: true, best: true, lastDate: true },
      });
      return {
        wins: agg._count._all as number,
        avgAttempts: agg._avg.attempts as number | null,
        bestAttempts: agg._min.attempts as number | null,
        fastestMs: fastest?.durationMs ?? null,
        streakBest: streak?.best ?? 0,
      };
    };

    const [lsdle, termo, forca] = await Promise.all([
      perGame(prisma.gameResult, 'lsdle'),
      perGame(prisma.termoResult, 'termo'),
      perGame(prisma.forcaResult, 'forca'),
    ]);

    // Fun flavor counters tied to this person.
    const [timesPersonOfDay, timesForcaTarget] = await Promise.all([
      prisma.dailyCharacter.count({ where: { characterId: id } }),
      prisma.forcaDaily.count({ where: { personName: member.name } }),
    ]);

    const totalWins = lsdle.wins + termo.wins + forca.wins;
    const bestStreak = Math.max(lsdle.streakBest, termo.streakBest, forca.streakBest);

    return res.json({
      member,
      totals: { wins: totalWins, bestStreak, timesPersonOfDay, timesForcaTarget },
      games: { lsdle, termo, forca },
    });
  } catch (error) {
    console.error('Error in member stats API:', error);
    return res.status(500).json({ error: 'Erro ao carregar as estatísticas.' });
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

    const guessUserRaw = await prisma.user.findUnique({ where: { id: guessId } });
    if (!guessUserRaw) {
      return res.status(404).json({ error: 'Pessoa não encontrada.' });
    }

    // Compare using the daily snapshot so a same-day profile edit (to either the
    // guess or the target) doesn't change today's feedback.
    const feedback = compareCharacters(gameView(guessUserRaw), target);

    let streak: StreakInfo | undefined;
    let isPersonOfDay = false;

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
          streak = await recordStreakSolve(playerId, 'lsdle', date);
          isPersonOfDay = target.id === playerId;
        }
      }
    }

    return res.json({
      feedback,
      targetName: feedback.correct ? target.name : undefined,
      photoUrl: feedback.correct ? target.photoUrl : undefined,
      streak,
      isPersonOfDay: feedback.correct ? isPersonOfDay : undefined,
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
    const streak = await getStreak(req.auth!.userId, 'lsdle');
    return res.json({ result: result ?? null, streak });
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
        player: { select: { id: true, name: true, photoUrl: true } },
      },
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
    console.error('Error loading ranking:', error);
    return res.status(500).json({ error: 'Erro ao carregar o ranking.' });
  }
});

// GET /api/game/projects — catalog with how many active members selected each project.
router.get('/projects', async (_req, res) => {
  try {
    const projects = await listProjectsWithCounts();
    return res.json({ projects });
  } catch (error) {
    console.error('Error loading projects:', error);
    return res.status(500).json({ error: 'Erro ao carregar os projetos.' });
  }
});

// POST /api/game/projects — authenticated users may propose a new project name.
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

import { Router } from 'express';
import { prisma } from '../../server/db';
import { getLocalDateString } from '../../shared/utils';
import { getOrCreateDailyQuiz, parseAnswers, QUESTIONS_PER_DAY, type QuizAnswer } from '../../server/quiz';
import { recordStreakSolve, getStreak, getStreakWeek, type StreakInfo } from '../../server/streak';
import { requireAuth, withAuth } from '../middleware/auth';

const router = Router();

// GET /api/quiz/daily — today's questions WITHOUT the answers (they only come
// back, one at a time, from POST /answer), plus a non-identifying daily key the
// client uses to detect an admin reset. For logged-in players it also returns
// the questions already answered today (with their corrections), so the round
// resumes correctly on another device or after clearing the browser.
router.get('/daily', withAuth, async (req, res) => {
  try {
    const { dailyKey, questions } = await getOrCreateDailyQuiz();

    let answered: {
      i: number;
      choice: number;
      correct: boolean;
      answerIndex: number;
      explanation: string;
    }[] = [];

    if (req.auth) {
      const progress = await prisma.quizProgress.findUnique({
        where: { date_playerId: { date: getLocalDateString(), playerId: req.auth.userId } },
      });
      if (progress) {
        answered = parseAnswers(progress.answers)
          .filter((a) => questions[a.i])
          .map((a) => ({
            ...a,
            answerIndex: questions[a.i].answer,
            explanation: questions[a.i].explanation,
          }));
      }
    }

    return res.json({
      dailyKey,
      total: questions.length,
      questions: questions.map((q) => ({
        area: q.area,
        question: q.question,
        options: q.options,
      })),
      answered,
    });
  } catch (error) {
    console.error('Error in quiz/daily API:', error);
    return res.status(500).json({ error: 'Erro ao carregar o quiz.' });
  }
});

// POST /api/quiz/answer — answer one question (by its index in today's order).
// Returns whether it was right, the correct option and the explanation. For
// logged-in players the answer sheet is kept server-side: each question can only
// be answered once and the final score/ranking comes from real play.
router.post('/answer', withAuth, async (req, res) => {
  try {
    const questionIndex =
      typeof req.body?.questionIndex === 'number' ? req.body.questionIndex : -1;
    const choice = typeof req.body?.choice === 'number' ? req.body.choice : -1;

    const { questions } = await getOrCreateDailyQuiz();
    const question = questions[questionIndex];
    if (!question || choice < 0 || choice >= question.options.length) {
      return res.status(400).json({ error: 'Pergunta ou alternativa inválida.' });
    }

    const correct = choice === question.answer;
    let streak: StreakInfo | undefined;
    let finished = false;
    let score: { correct: number; total: number } | undefined;

    if (req.auth) {
      const date = getLocalDateString();
      const playerId = req.auth.userId;
      const playerExists = await prisma.user.findUnique({
        where: { id: playerId },
        select: { id: true },
      });

      if (playerExists) {
        const progress = await prisma.quizProgress.upsert({
          where: { date_playerId: { date, playerId } },
          create: { date, playerId, answers: '[]', firstAnswerAt: new Date() },
          update: {},
        });

        const answers = parseAnswers(progress.answers);
        if (answers.some((a) => a.i === questionIndex)) {
          return res.status(409).json({ error: 'Esta pergunta já foi respondida.' });
        }

        const newAnswer: QuizAnswer = { i: questionIndex, choice, correct };
        const newAnswers = [...answers, newAnswer];
        finished = newAnswers.length >= questions.length;
        const correctCount = newAnswers.filter((a) => a.correct).length;

        if (finished && !progress.finished) {
          const finishedAt = new Date();
          const durationMs = Math.max(0, finishedAt.getTime() - progress.firstAnswerAt.getTime());
          await prisma.$transaction([
            prisma.quizProgress.update({
              where: { date_playerId: { date, playerId } },
              data: { answers: JSON.stringify(newAnswers), finished: true, finishedAt },
            }),
            prisma.quizResult.upsert({
              where: { date_playerId: { date, playerId } },
              create: { date, playerId, correct: correctCount, total: questions.length, durationMs },
              update: {},
            }),
          ]);
          // Completing the daily quiz keeps the streak (micro-learning habit),
          // regardless of the score.
          streak = await recordStreakSolve(playerId, 'quiz', date);
        } else {
          await prisma.quizProgress.update({
            where: { date_playerId: { date, playerId } },
            data: { answers: JSON.stringify(newAnswers) },
          });
        }

        if (finished) score = { correct: correctCount, total: questions.length };
      }
    }

    return res.json({
      correct,
      answerIndex: question.answer,
      explanation: question.explanation,
      finished,
      score,
      streak,
    });
  } catch (error) {
    console.error('Error handling quiz answer:', error);
    return res.status(500).json({ error: 'Erro interno ao processar a resposta.' });
  }
});

// GET /api/quiz/streak — current streak + this week's completion calendar.
router.get('/streak', requireAuth, async (req, res) => {
  try {
    const data = await getStreakWeek(req.auth!.userId, 'quiz');
    return res.json(data);
  } catch (error) {
    console.error('Error loading quiz streak:', error);
    return res.status(500).json({ error: 'Erro ao carregar a sequência.' });
  }
});

// GET /api/quiz/result — the logged-in player's recorded result for today.
router.get('/result', requireAuth, async (req, res) => {
  try {
    const date = getLocalDateString();
    const result = await prisma.quizResult.findUnique({
      where: { date_playerId: { date, playerId: req.auth!.userId } },
    });
    const streak = await getStreak(req.auth!.userId, 'quiz');
    return res.json({ result: result ?? null, streak });
  } catch (error) {
    console.error('Error loading quiz result:', error);
    return res.status(500).json({ error: 'Erro ao carregar resultado.' });
  }
});

// GET /api/quiz/ranking — daily ranking (more correct answers first, then
// shorter duration). `attempts` carries the correct count so the shared ranking
// UI can display it as the score column.
router.get('/ranking', async (req, res) => {
  try {
    const date = (req.query.date as string) || getLocalDateString();
    const results = await prisma.quizResult.findMany({
      where: { date },
      orderBy: [{ correct: 'desc' }, { durationMs: 'asc' }, { createdAt: 'asc' }],
      include: { player: { select: { id: true, name: true, photoUrl: true } } },
    });

    const ranking = results.map((r, i) => ({
      rank: i + 1,
      playerId: r.player.id,
      name: r.player.name,
      photoUrl: r.player.photoUrl,
      attempts: r.correct,
      total: r.total || QUESTIONS_PER_DAY,
      durationMs: r.durationMs,
    }));

    return res.json({ date, ranking });
  } catch (error) {
    console.error('Error loading quiz ranking:', error);
    return res.status(500).json({ error: 'Erro ao carregar o ranking.' });
  }
});

export default router;

import { Router } from 'express';
import { computeLeaderboard } from '../../server/score';
import { getLocalDateString } from '../../shared/utils';
import {
  startRun,
  getRunState,
  answerRun,
  timeoutRun,
  stopRun,
  abandonRun,
  useLifeline,
  ALL_LIFELINES,
  type LifelineType,
} from '../../server/show';
import { requireAuth } from '../middleware/auth';
import { QUIZ_QUESTIONS, TOPICS } from '../../server/quiz-questions';

// O Show da Computação — the whole run is server-authoritative (see server/show.ts),
// so playing requires a logged-in user and the score is derived here, never sent
// by the client.
const router = Router();

// GET /api/show/topics — question themes with counts (for the pre-run picker).
router.get('/topics', (_req, res) => {
  const counts: Record<string, number> = {};
  for (const q of QUIZ_QUESTIONS) counts[q.topic] = (counts[q.topic] ?? 0) + 1;
  return res.json({ topics: TOPICS.map((id) => ({ id, count: counts[id] ?? 0 })) });
});

// POST /api/show/start — begin a new run. Optional { topics: string[] } filters
// the question themes (topped up from the rest when they can't fill the ladder).
router.post('/start', requireAuth, async (req, res) => {
  try {
    const raw = req.body?.topics;
    const topics = Array.isArray(raw)
      ? raw.filter((x): x is string => typeof x === 'string' && TOPICS.includes(x)).slice(0, 24)
      : undefined;
    const noLifelines = req.body?.noLifelines === true;
    const run = await startRun(req.auth!.userId, { topics, noLifelines });
    return res.json(run);
  } catch (error) {
    console.error('Error starting show run:', error);
    return res.status(500).json({ error: 'Erro ao iniciar o jogo.' });
  }
});

// GET /api/show/run/:id — resume the current state of a run (for reloads).
router.get('/run/:id', requireAuth, async (req, res) => {
  try {
    const run = await getRunState(req.params.id, req.auth!.userId);
    if (!run) return res.status(404).json({ error: 'Partida não encontrada.' });
    return res.json(run);
  } catch (error) {
    console.error('Error loading show run:', error);
    return res.status(500).json({ error: 'Erro ao carregar a partida.' });
  }
});

// POST /api/show/answer — answer the current question. { runId, optionIndex }
router.post('/answer', requireAuth, async (req, res) => {
  try {
    const { runId, optionIndex } = req.body ?? {};
    if (typeof runId !== 'string' || typeof optionIndex !== 'number') {
      return res.status(400).json({ error: 'Requisição inválida.' });
    }
    const result = await answerRun(runId, req.auth!.userId, optionIndex);
    if ('error' in result) {
      const code = result.error === 'not-found' ? 404 : 409;
      return res.status(code).json({ error: 'Não foi possível registrar a resposta.' });
    }
    return res.json(result);
  } catch (error) {
    console.error('Error answering show run:', error);
    return res.status(500).json({ error: 'Erro ao registrar a resposta.' });
  }
});

// POST /api/show/timeout — the 200s question timer ran out. { runId }
router.post('/timeout', requireAuth, async (req, res) => {
  try {
    const { runId } = req.body ?? {};
    if (typeof runId !== 'string') {
      return res.status(400).json({ error: 'Requisição inválida.' });
    }
    const result = await timeoutRun(runId, req.auth!.userId);
    if ('error' in result) {
      const code = result.error === 'not-found' ? 404 : 409;
      return res.status(code).json({ error: 'Não foi possível encerrar por tempo.' });
    }
    return res.json(result);
  } catch (error) {
    console.error('Error timing out show run:', error);
    return res.status(500).json({ error: 'Erro ao encerrar por tempo.' });
  }
});

// POST /api/show/lifeline — use an aid. { runId, type }
router.post('/lifeline', requireAuth, async (req, res) => {
  try {
    const { runId, type } = req.body ?? {};
    if (typeof runId !== 'string' || !ALL_LIFELINES.includes(type as LifelineType)) {
      return res.status(400).json({ error: 'Requisição inválida.' });
    }
    const result = await useLifeline(runId, req.auth!.userId, type as LifelineType);
    if ('error' in result) {
      const code = result.error === 'not-found' ? 404 : 409;
      return res.status(code).json({ error: 'Não foi possível usar a ajuda.' });
    }
    return res.json(result);
  } catch (error) {
    console.error('Error using lifeline:', error);
    return res.status(500).json({ error: 'Erro ao usar a ajuda.' });
  }
});

// POST /api/show/stop — bank the current prize and end the run. { runId }
router.post('/stop', requireAuth, async (req, res) => {
  try {
    const { runId } = req.body ?? {};
    if (typeof runId !== 'string') {
      return res.status(400).json({ error: 'Requisição inválida.' });
    }
    const result = await stopRun(runId, req.auth!.userId);
    if ('error' in result) {
      const code = result.error === 'not-found' ? 404 : 409;
      return res.status(code).json({ error: 'Não foi possível encerrar a partida.' });
    }
    return res.json(result);
  } catch (error) {
    console.error('Error stopping show run:', error);
    return res.status(500).json({ error: 'Erro ao encerrar a partida.' });
  }
});

// POST /api/show/quit — give up: bank nothing, exclude from ranking. { runId }
router.post('/quit', requireAuth, async (req, res) => {
  try {
    const { runId } = req.body ?? {};
    if (typeof runId !== 'string') {
      return res.status(400).json({ error: 'Requisição inválida.' });
    }
    const result = await abandonRun(runId, req.auth!.userId);
    if ('error' in result) {
      const code = result.error === 'not-found' ? 404 : 409;
      return res.status(code).json({ error: 'Não foi possível desistir da partida.' });
    }
    return res.json(result);
  } catch (error) {
    console.error('Error abandoning show run:', error);
    return res.status(500).json({ error: 'Erro ao desistir da partida.' });
  }
});

// GET /api/show/ranking — all-time ranking by best banked prize.
router.get('/ranking', async (_req, res) => {
  try {
    const board = await computeLeaderboard();
    const ranking = board.map((p, i) => ({ rank: i + 1, ...p }));
    return res.json({ date: getLocalDateString(), ranking });
  } catch (error) {
    console.error('Error loading show ranking:', error);
    return res.status(500).json({ error: 'Erro ao carregar o ranking.' });
  }
});

export default router;

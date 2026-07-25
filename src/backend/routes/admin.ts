import { Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../../server/db';
import { requireAdmin } from '../middleware/auth';
import { QUIZ_QUESTIONS, QUESTION_BY_ID, questionSource } from '../../server/quiz-questions';
import { getDisabledIds, setQuestionDisabled } from '../../server/disabled-questions';
import { LADDER_SIZE } from '../../server/show';

const router = Router();

// All admin routes require an authenticated admin user.
router.use(requireAdmin);

// GET /api/admin/users — list all users.
router.get('/users', async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        lastLogin: true,
        isActive: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    return res.json({ users });
  } catch (error) {
    console.error('Admin users fetch error:', error);
    return res.status(500).json({ error: 'Erro ao buscar usuários.' });
  }
});

// PUT /api/admin/users — toggle isActive / isAdmin for a user.
router.put('/users', async (req, res) => {
  try {
    const { userId, isActive, isAdmin: targetIsAdmin } = req.body ?? {};

    if (!userId) {
      return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
    }

    // Don't let an admin deactivate or remove admin rights from themselves
    if (userId === req.auth!.userId) {
      return res.status(400).json({
        error: 'Você não pode alterar seus próprios privilégios administrativos ou estado de atividade.',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(targetIsAdmin !== undefined && { isAdmin: targetIsAdmin }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        isAdmin: true,
      },
    });

    return res.json({
      message: 'Usuário atualizado com sucesso!',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Admin user update error:', error);
    return res.status(500).json({ error: 'Erro ao atualizar usuário.' });
  }
});

// POST /api/admin/users/reset-password — generate a new temporary password for
// a user when email recovery is unavailable. The plaintext is returned once.
// returned once, to the admin only, and never stored.
router.post('/users/reset-password', async (req, res) => {
  try {
    const { userId } = req.body ?? {};

    if (!userId) {
      return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
    }

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    });
    if (!target) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Random suffix from a mixed-case+digits alphabet; the "Scc" prefix plus a
    // digit guarantee the strong-password rules regardless of the random part.
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const random = Array.from(crypto.randomBytes(8))
      .map((b) => alphabet[b % alphabet.length])
      .join('');
    const tempPassword = `Scc${Math.floor(Math.random() * 10)}-${random}`;

    const passwordHash = await bcrypt.hash(tempPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

    return res.json({
      message: 'Senha temporária gerada com sucesso!',
      tempPassword,
      user: { id: target.id, name: target.name },
    });
  } catch (error) {
    console.error('Admin password reset error:', error);
    return res.status(500).json({ error: 'Erro ao redefinir a senha.' });
  }
});

// DELETE /api/admin/users?userId=... — delete a user.
router.delete('/users', async (req, res) => {
  try {
    const userId = req.query.userId as string | undefined;

    if (!userId) {
      return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
    }

    if (userId === req.auth!.userId) {
      return res.status(400).json({ error: 'Você não pode excluir a si mesmo.' });
    }

    await prisma.user.delete({ where: { id: userId } });

    return res.json({ message: 'Usuário excluído com sucesso!' });
  } catch (error) {
    console.error('Admin user deletion error:', error);
    return res.status(500).json({ error: 'Erro ao excluir usuário.' });
  }
});

// GET /api/admin/questions — the whole question bank with its disabled flag.
// Counts (by difficulty/topic/area) are derived on the client from this list.
router.get('/questions', async (_req, res) => {
  try {
    const disabled = await getDisabledIds();
    const questions = QUIZ_QUESTIONS.map((q) => ({
      id: q.id,
      area: q.area,
      topic: q.topic,
      difficulty: q.difficulty,
      question: q.question,
      source: questionSource(q),
      disabled: disabled.has(q.id),
    }));
    return res.json({ questions, ladderSize: LADDER_SIZE });
  } catch (error) {
    console.error('Admin questions fetch error:', error);
    return res.status(500).json({ error: 'Erro ao buscar as perguntas.' });
  }
});

// PUT /api/admin/questions — enable/disable one question. { questionId, disabled }
router.put('/questions', async (req, res) => {
  try {
    const { questionId, disabled } = req.body ?? {};
    if (typeof questionId !== 'string' || typeof disabled !== 'boolean') {
      return res.status(400).json({ error: 'Requisição inválida.' });
    }
    if (!QUESTION_BY_ID.has(questionId)) {
      return res.status(404).json({ error: 'Pergunta não encontrada.' });
    }

    // A run needs a full ladder, so never let the bank shrink below it.
    if (disabled) {
      const current = await getDisabledIds();
      if (!current.has(questionId) && QUIZ_QUESTIONS.length - current.size - 1 < LADDER_SIZE) {
        return res.status(400).json({
          error: `É preciso manter ao menos ${LADDER_SIZE} perguntas ativas para montar uma partida.`,
        });
      }
    }

    await setQuestionDisabled(questionId, disabled);
    return res.json({
      message: disabled ? 'Pergunta desabilitada com sucesso!' : 'Pergunta habilitada com sucesso!',
      questionId,
      disabled,
    });
  } catch (error) {
    console.error('Admin question update error:', error);
    return res.status(500).json({ error: 'Erro ao atualizar a pergunta.' });
  }
});

export default router;

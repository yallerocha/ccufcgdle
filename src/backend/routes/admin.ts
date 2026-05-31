import { Router } from 'express';
import { prisma } from '../../server/db';
import { getLocalDateString } from '../../shared/utils';
import { getOrCreateDailyCharacter } from '../../server/game';
import { normalize, isValidGuess, displayFor, getOrCreateDailyWord, WORD_LENGTH } from '../../server/termo';
import { requireAdmin } from '../middleware/auth';

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
        gender: true,
        role: true,
        entrySemester: true,
        isColab: true,
        area: true,
        projects: true,
        likesCoffee: true,
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

// POST /api/admin/force-daily — set today's person (specific or random) and
// reset today's round (progress + ranking).
router.post('/force-daily', async (req, res) => {
  try {
    const { characterId } = req.body ?? {};
    const today = getLocalDateString();

    // 1. Reset today's round: remove the current pick AND everyone's progress and
    // ranking results for today, so the new person of the day starts from a clean
    // slate (otherwise the ranking would mix results from different targets).
    await prisma.$transaction([
      prisma.dailyCharacter.deleteMany({ where: { date: today } }),
      prisma.dailyProgress.deleteMany({ where: { date: today } }),
      prisma.gameResult.deleteMany({ where: { date: today } }),
    ]);

    let selectedCharacter;

    if (characterId) {
      const userExists = await prisma.user.findUnique({ where: { id: characterId } });
      if (!userExists) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      const created = await prisma.dailyCharacter.create({
        data: { date: today, characterId },
        include: { character: true },
      });
      selectedCharacter = created.character;
    } else {
      selectedCharacter = await getOrCreateDailyCharacter(today);
    }

    if (!selectedCharacter) {
      return res.status(400).json({
        error: 'Não foi possível selecionar uma pessoa. Verifique se há usuários cadastrados.',
      });
    }

    return res.json({
      message: 'Pessoa do dia atualizada!',
      character: {
        id: selectedCharacter.id,
        name: selectedCharacter.name,
      },
    });
  } catch (error) {
    console.error('Error forcing daily character:', error);
    return res.status(500).json({ error: 'Erro ao atualizar a pessoa do dia.' });
  }
});

// POST /api/admin/termo-force-daily — set today's Termo word (a specific word or
// a fresh random one) and reset today's round (progress + ranking), mirroring
// the LSDLE force-daily so a changed answer never mixes results.
router.post('/termo-force-daily', async (req, res) => {
  try {
    const { word } = req.body ?? {};
    const today = getLocalDateString();

    // Reset today's round: drop the current word + everyone's progress/results.
    await prisma.$transaction([
      prisma.termoDaily.deleteMany({ where: { date: today } }),
      prisma.termoProgress.deleteMany({ where: { date: today } }),
      prisma.termoResult.deleteMany({ where: { date: today } }),
    ]);

    let daily;

    if (typeof word === 'string' && word.trim() !== '') {
      const norm = normalize(word);
      if (norm.length !== WORD_LENGTH) {
        return res.status(400).json({ error: `A palavra deve ter ${WORD_LENGTH} letras.` });
      }
      if (!isValidGuess(norm)) {
        return res.status(422).json({ error: 'Palavra não está na lista do jogo.' });
      }
      const created = await prisma.termoDaily.create({
        data: { date: today, word: norm, display: displayFor(norm) },
      });
      daily = { word: created.word, display: created.display };
    } else {
      // No word given → let the deterministic picker choose a fresh one.
      daily = await getOrCreateDailyWord(today);
    }

    return res.json({ message: 'Palavra do dia atualizada!', word: daily.display });
  } catch (error) {
    console.error('Error forcing termo word:', error);
    return res.status(500).json({ error: 'Erro ao atualizar a palavra do dia.' });
  }
});

export default router;

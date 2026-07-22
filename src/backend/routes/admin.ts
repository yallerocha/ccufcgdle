import { Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../../server/db';
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


export default router;

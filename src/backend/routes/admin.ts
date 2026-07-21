import { Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../../server/db';
import { requireAdmin } from '../middleware/auth';
import { createProject, deleteProject, listProjectsWithCounts } from '../../server/projects';
import { isInactivityExclusionEnabled, setInactivityExclusionEnabled } from '../../server/settings';

const router = Router();

// All admin routes require an authenticated admin user.
router.use(requireAdmin);

// GET /api/admin/settings — current admin-tunable settings.
router.get('/settings', async (_req, res) => {
  try {
    const inactivityExclusionEnabled = await isInactivityExclusionEnabled();
    return res.json({ inactivityExclusionEnabled });
  } catch (error) {
    console.error('Error loading admin settings:', error);
    return res.status(500).json({ error: 'Erro ao carregar as configurações.' });
  }
});

// PUT /api/admin/settings — update the inactivity-exclusion toggle
// (non-destructive: it only controls whether 30-day-inactive members are hidden
// from the ranking; nothing is deleted).
router.put('/settings', async (req, res) => {
  try {
    const { inactivityExclusionEnabled } = req.body ?? {};
    if (typeof inactivityExclusionEnabled === 'boolean') {
      await setInactivityExclusionEnabled(inactivityExclusionEnabled);
    }
    const current = await isInactivityExclusionEnabled();
    return res.json({ message: 'Configurações atualizadas!', inactivityExclusionEnabled: current });
  } catch (error) {
    console.error('Error updating admin settings:', error);
    return res.status(500).json({ error: 'Erro ao atualizar as configurações.' });
  }
});

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

// GET /api/admin/projects — catalog with member counts.
router.get('/projects', async (_req, res) => {
  try {
    const projects = await listProjectsWithCounts();
    return res.json({ projects });
  } catch (error) {
    console.error('Error listing admin projects:', error);
    return res.status(500).json({ error: 'Erro ao carregar os projetos.' });
  }
});

// POST /api/admin/projects — create a project in the catalog.
router.post('/projects', async (req, res) => {
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
      message: result.created ? 'Projeto criado com sucesso!' : 'Este projeto já existe no catálogo.',
      project: entry ?? { ...result.project, memberCount: 0 },
      created: result.created,
      projects,
    });
  } catch (error) {
    console.error('Error creating admin project:', error);
    return res.status(500).json({ error: 'Erro ao criar o projeto.' });
  }
});

// DELETE /api/admin/projects/:id — remove from catalog (members → "Outro").
router.delete('/projects/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await deleteProject(id);
    if ('error' in result) {
      const status = result.error.includes('não encontrado') ? 404 : 400;
      return res.status(status).json({ error: result.error });
    }

    const projects = await listProjectsWithCounts();
    return res.json({
      message:
        result.reassigned > 0
          ? `Projeto removido. ${result.reassigned} membro(s) movido(s) para "Outro".`
          : 'Projeto removido com sucesso!',
      projects,
    });
  } catch (error) {
    console.error('Error deleting admin project:', error);
    return res.status(500).json({ error: 'Erro ao excluir o projeto.' });
  }
});

export default router;

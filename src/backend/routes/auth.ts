import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../server/db';
import { signToken } from '../../server/auth';
import { requireAuth } from '../middleware/auth';
import { validateCharacterFields } from '../../shared/validation';

const router = Router();

// POST /api/auth/login — validates credentials and returns { token, user }.
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    // Update lastLogin, which renews their active status in the game
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
        isActive: true, // Reactivate if they were set inactive manually or automatically
      },
    });

    const token = signToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      isAdmin: updatedUser.isAdmin,
    });

    const { passwordHash: _, ...userWithoutPassword } = updatedUser;

    return res.json({
      message: 'Login realizado com sucesso!',
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Erro interno ao realizar login.' });
  }
});

// POST /api/auth/register — creates a user and returns { token, user }.
router.post('/register', async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      gender,
      role,
      entrySemester,
      isColab,
      area,
      projects,
      likesCoffee,
      photoUrl,
    } = req.body ?? {};

    if (!email || !password || !name || !gender || !role || !entrySemester || !isColab || !area || !likesCoffee) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    if (typeof name !== 'string' || name.length < 3 || name.length > 25) {
      return res.status(400).json({ error: 'O nome/apelido deve ter entre 3 e 25 caracteres.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof email !== 'string' || !emailRegex.test(email)) {
      return res.status(400).json({ error: 'Email inválido.' });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
    }

    const fieldError = validateCharacterFields({
      gender, role, entrySemester, isColab, area, projects, likesCoffee, photoUrl,
    });
    if (fieldError) {
      return res.status(400).json({ error: fieldError });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: email.toLowerCase() }, { name: name }],
      },
    });

    if (existingUser) {
      if (existingUser.email.toLowerCase() === email.toLowerCase()) {
        return res.status(400).json({ error: 'Este email já está cadastrado.' });
      }
      if (existingUser.name.toLowerCase() === name.toLowerCase()) {
        return res.status(400).json({ error: 'Este nome/apelido já está em uso.' });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // The first registered user becomes admin. Done in a Serializable
    // transaction so two simultaneous first registrations can't both win.
    const user = await prisma.$transaction(
      async (tx) => {
        const totalUsers = await tx.user.count();
        return tx.user.create({
          data: {
            email: email.toLowerCase(),
            passwordHash,
            name,
            gender,
            role,
            entrySemester,
            isColab,
            area,
            projects,
            likesCoffee,
            photoUrl,
            isAdmin: totalUsers === 0,
            lastLogin: new Date(),
            isActive: true,
          },
        });
      },
      { isolationLevel: 'Serializable' }
    );

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
    });

    const { passwordHash: _, ...userWithoutPassword } = user;

    return res.json({
      message: 'Cadastro realizado com sucesso!',
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Erro interno ao realizar cadastro.' });
  }
});

// GET /api/auth/me — returns the authenticated user.
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.auth!.userId },
    });

    if (!user) {
      return res.json({ user: null });
    }

    // Optimization: Update lastLogin if it is older than 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    if (user.lastLogin < oneDayAgo) {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    return res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Error fetching current user:', error);
    return res.json({ user: null });
  }
});

// PUT /api/auth/me — updates the authenticated user's game attributes.
router.put('/me', requireAuth, async (req, res) => {
  try {
    const {
      gender,
      role,
      entrySemester,
      isColab,
      area,
      projects,
      likesCoffee,
      photoUrl,
    } = req.body ?? {};

    const fieldError = validateCharacterFields({
      gender, role, entrySemester, isColab, area, projects, likesCoffee, photoUrl,
    });
    if (fieldError) {
      return res.status(400).json({ error: fieldError });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.auth!.userId },
      data: {
        gender,
        role,
        entrySemester,
        isColab,
        area,
        projects,
        likesCoffee,
        photoUrl,
        lastLogin: new Date(),
      },
    });

    const { passwordHash: _, ...userWithoutPassword } = updatedUser;
    return res.json({
      message: 'Perfil atualizado com sucesso!',
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({ error: 'Erro ao atualizar o perfil.' });
  }
});

export default router;

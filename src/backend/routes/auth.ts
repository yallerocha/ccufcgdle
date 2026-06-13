import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../server/db';
import { signToken } from '../../server/auth';
import { requireAuth } from '../middleware/auth';
import { validateCharacterFields, isAllowedEmailDomain, isStrongPassword } from '../../shared/validation';
import { getAllowedProjectNames } from '../../server/projects';
import { isEmailVerified, issueVerificationToken, consumeVerificationToken, findUnverifiedUserByEmail } from '../../server/email-verification';
import { isEmailVerificationRequired } from '../../server/email-verification-config';
import { sendVerificationEmail, sendPasswordResetEmail } from '../../server/email';
import {
  findVerifiedUserForPasswordReset,
  issuePasswordResetToken,
  validatePasswordResetToken,
  consumePasswordResetToken,
} from '../../server/password-reset';

const router = Router();

// A valid bcrypt hash used as a decoy when the email isn't found, so login always
// performs one bcrypt comparison. This keeps the response time constant whether
// or not the account exists, preventing email enumeration via timing.
const DUMMY_PASSWORD_HASH = '$2b$12$Q1lo.kalr7biqRwg.KHaN.UdNf15sfLrxvHYPjuFBZkC/h3isj40e';

function authSessionResponse(user: {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  passwordHash: string;
  [key: string]: unknown;
}) {
  const token = signToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    isAdmin: user.isAdmin,
  });
  const { passwordHash: _, ...userWithoutPassword } = user;
  return { token, user: userWithoutPassword };
}

// GET /api/auth/config — public auth settings for the client.
router.get('/config', (_req, res) => {
  res.json({ emailVerificationRequired: isEmailVerificationRequired() });
});

// POST /api/auth/login — validates credentials and returns { token, user }.
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always run a bcrypt comparison (against a decoy hash when the user is
    // absent) so the timing doesn't reveal whether the email is registered.
    const passwordMatch = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
    if (!user || !passwordMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    if (!isEmailVerified(user) && !isEmailVerificationRequired()) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date(), isActive: true },
      });
    }

    if (!isEmailVerified(user)) {
      return res.status(403).json({
        error: 'Confirme seu email antes de entrar. Verifique sua caixa de entrada ou solicite um novo link.',
        code: 'EMAIL_NOT_VERIFIED',
        email: user.email,
      });
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

    if (!isAllowedEmailDomain(email)) {
      return res.status(400).json({
        error: 'Apenas emails @ccc.ufcg.edu.br e @computacao.ufcg.edu.br podem se cadastrar.',
      });
    }

    if (typeof password !== 'string' || !isStrongPassword(password)) {
      return res.status(400).json({
        error: 'A senha deve ter ao menos 8 caracteres, incluindo letra maiúscula, minúscula e número.',
      });
    }

    const allowedProjects = await getAllowedProjectNames();
    const fieldError = validateCharacterFields(
      { gender, role, entrySemester, isColab, area, projects, likesCoffee, photoUrl },
      { allowedProjects }
    );
    if (fieldError) {
      return res.status(400).json({ error: fieldError });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: email.toLowerCase() }, { name: name }],
      },
      select: { email: true, name: true, id: true, emailVerifiedAt: true },
    });

    if (existingUser) {
      if (existingUser.email.toLowerCase() === email.toLowerCase()) {
        if (!existingUser.emailVerifiedAt) {
          if (!isEmailVerificationRequired()) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { emailVerifiedAt: new Date(), isActive: true },
            });
            return res.status(400).json({ error: 'Este email já está cadastrado. Faça login.' });
          }
          try {
            const verificationToken = await issueVerificationToken(existingUser.id);
            await sendVerificationEmail(existingUser.email, name, verificationToken);
          } catch (err) {
            console.error('Failed to resend verification email:', err);
            return res.status(503).json({
              error: 'Não foi possível enviar o email de verificação. Tente novamente em instantes.',
            });
          }
          return res.status(200).json({
            message: 'Este email já tem cadastro pendente. Enviamos um novo link de verificação.',
            needsEmailVerification: true,
            email: existingUser.email,
          });
        }
        return res.status(400).json({ error: 'Este email já está cadastrado.' });
      }
      if (existingUser.name.toLowerCase() === name.toLowerCase()) {
        return res.status(400).json({ error: 'Este nome/apelido já está em uso.' });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const verifyOnRegister = isEmailVerificationRequired();

    const user = await prisma.user.create({
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
        lastLogin: new Date(),
        isActive: true,
        emailVerifiedAt: verifyOnRegister ? null : new Date(),
      },
    });

    if (!verifyOnRegister) {
      const session = authSessionResponse(user);
      return res.status(201).json({
        message: 'Cadastro realizado com sucesso!',
        needsEmailVerification: false,
        ...session,
      });
    }

    try {
      const verificationToken = await issueVerificationToken(user.id);
      await sendVerificationEmail(user.email, user.name, verificationToken);
    } catch (err) {
      console.error('Failed to send verification email:', err);
      await prisma.user.delete({ where: { id: user.id } });
      return res.status(503).json({
        error: 'Não foi possível enviar o email de verificação. Tente novamente em instantes.',
      });
    }

    return res.status(201).json({
      message: 'Cadastro realizado! Verifique seu email para ativar a conta.',
      needsEmailVerification: true,
      email: user.email,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Erro interno ao realizar cadastro.' });
  }
});

// GET /api/auth/verify-email?token=... — confirms email and returns session.
router.get('/verify-email', async (req, res) => {
  try {
    const token = typeof req.query.token === 'string' ? req.query.token : '';
    const result = await consumeVerificationToken(token);
    if (!result) {
      return res.status(400).json({ error: 'Link inválido ou expirado. Solicite um novo email de verificação.' });
    }

    const user = await prisma.user.findUnique({ where: { id: result.userId } });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const jwt = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    return res.json({
      message: 'Email confirmado com sucesso!',
      token: jwt,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({ error: 'Erro ao confirmar email.' });
  }
});

// POST /api/auth/resend-verification — sends a fresh verification link.
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body ?? {};
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email é obrigatório.' });
    }

    const user = await findUnverifiedUserByEmail(email);
    const okMessage = isEmailVerificationRequired()
      ? 'Se existir uma conta pendente com este email, enviamos um novo link de verificação.'
      : 'Se existir uma conta pendente com este email, ela foi ativada. Você já pode fazer login.';

    if (!user) {
      return res.json({ message: okMessage });
    }

    if (!isEmailVerificationRequired()) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date(), isActive: true },
      });
      return res.json({ message: okMessage });
    }

    const token = await issueVerificationToken(user.id);
    await sendVerificationEmail(user.email, user.name, token);
    return res.json({ message: okMessage });
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({ error: 'Não foi possível reenviar o email de verificação.' });
  }
});

// POST /api/auth/forgot-password — sends a password reset link if the account exists.
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body ?? {};
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email é obrigatório.' });
    }

    const okMessage =
      'Se existir uma conta verificada com este email, enviamos um link para redefinir a senha.';

    const user = await findVerifiedUserForPasswordReset(email);
    if (!user) {
      return res.json({ message: okMessage });
    }

    const token = await issuePasswordResetToken(user.id);
    await sendPasswordResetEmail(user.email, user.name, token);
    return res.json({ message: okMessage });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Não foi possível enviar o email de redefinição.' });
  }
});

// GET /api/auth/reset-password?token=... — checks whether a reset link is still valid.
router.get('/reset-password', async (req, res) => {
  try {
    const token = typeof req.query.token === 'string' ? req.query.token : '';
    const result = await validatePasswordResetToken(token);
    if (!result) {
      return res.status(400).json({ error: 'Link inválido ou expirado. Solicite um novo email de redefinição.' });
    }
    return res.json({ valid: true });
  } catch (error) {
    console.error('Reset password validate error:', error);
    return res.status(500).json({ error: 'Erro ao validar link de redefinição.' });
  }
});

// POST /api/auth/reset-password — sets a new password using a valid reset token.
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body ?? {};

    if (!token || !password || !confirmPassword) {
      return res.status(400).json({ error: 'Token e nova senha são obrigatórios.' });
    }

    if (typeof password !== 'string' || !isStrongPassword(password)) {
      return res.status(400).json({
        error: 'A senha deve ter ao menos 8 caracteres, incluindo letra maiúscula, minúscula e número.',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'As senhas não coincidem.' });
    }

    const existing = await validatePasswordResetToken(token);
    if (!existing) {
      return res.status(400).json({ error: 'Link inválido ou expirado. Solicite um novo email de redefinição.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: existing.userId },
      select: { id: true, passwordHash: true, email: true, name: true, isAdmin: true },
    });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const sameAsCurrent = await bcrypt.compare(password, user.passwordHash);
    if (sameAsCurrent) {
      return res.status(400).json({ error: 'A nova senha deve ser diferente da atual.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await consumePasswordResetToken(token, passwordHash);
    if (!result) {
      return res.status(400).json({ error: 'Link inválido ou expirado. Solicite um novo email de redefinição.' });
    }

    const jwt = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
    });

    const fullUser = await prisma.user.findUnique({ where: { id: user.id } });
    const { passwordHash: _, ...userWithoutPassword } = fullUser!;

    return res.json({
      message: 'Senha redefinida com sucesso!',
      token: jwt,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Erro ao redefinir a senha.' });
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

    // A photo identical to the one already stored is never re-validated:
    // legacy photos saved before the format validation existed must not block
    // unrelated profile updates.
    const current = await prisma.user.findUnique({
      where: { id: req.auth!.userId },
      select: { photoUrl: true },
    });
    const photoUnchanged = (photoUrl || '') === (current?.photoUrl || '');

    const allowedProjects = await getAllowedProjectNames();
    const fieldError = validateCharacterFields(
      {
        gender, role, entrySemester, isColab, area, projects, likesCoffee,
        photoUrl: photoUnchanged ? null : photoUrl,
      },
      { allowedProjects }
    );
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

// PUT /api/auth/me/password — change the authenticated user's login password.
router.put('/me/password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body ?? {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias.' });
    }

    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      return res.status(400).json({ error: 'Senha inválida.' });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        error: 'A senha deve ter ao menos 8 caracteres, incluindo letra maiúscula, minúscula e número.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.auth!.userId },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const currentMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!currentMatch) {
      return res.status(401).json({ error: 'Senha atual incorreta.' });
    }

    const sameAsCurrent = await bcrypt.compare(newPassword, user.passwordHash);
    if (sameAsCurrent) {
      return res.status(400).json({ error: 'A nova senha deve ser diferente da atual.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return res.json({ message: 'Senha alterada com sucesso!' });
  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json({ error: 'Erro ao alterar a senha.' });
  }
});

export default router;

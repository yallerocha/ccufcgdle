import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../server/db';
import { signToken } from '../../server/auth';
import { requireAuth } from '../middleware/auth';
import { validatePhoto, isStrongPassword, validateDisplayName } from '../../shared/validation';
import { isEmailVerified, issueVerificationToken, consumeVerificationToken, findUnverifiedUserByEmail } from '../../server/email-verification';
import { isEmailVerificationRequired, isPasswordResetByEmailEnabled } from '../../server/email-verification-config';
import { sendVerificationEmail, sendPasswordResetEmail } from '../../server/email';
import {
  findVerifiedUserForPasswordReset,
  issuePasswordResetToken,
  validatePasswordResetToken,
  consumePasswordResetToken,
} from '../../server/password-reset';
import {
  isGoogleOAuthEnabled,
  getGoogleClientId,
  verifyGoogleIdToken,
  fetchGooglePhotoAsDataUrl,
  generateUniqueNickname,
} from '../../server/google-auth';
import { toPublicUser } from '../../server/user-public';
import type { User } from '@prisma/client';

const router = Router();

// A valid bcrypt hash used as a decoy when the email isn't found, so login always
// performs one bcrypt comparison. This keeps the response time constant whether
// or not the account exists, preventing email enumeration via timing.
const DUMMY_PASSWORD_HASH = '$2b$12$Q1lo.kalr7biqRwg.KHaN.UdNf15sfLrxvHYPjuFBZkC/h3isj40e';

function authSessionResponse(user: User) {
  const token = signToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    isAdmin: user.isAdmin,
  });
  return { token, user: toPublicUser(user) };
}

// GET /api/auth/config — public auth settings for the client.
router.get('/config', (_req, res) => {
  const googleClientId = getGoogleClientId();
  res.json({
    emailVerificationRequired: isEmailVerificationRequired(),
    passwordResetByEmailEnabled: isPasswordResetByEmailEnabled(),
    googleOAuthEnabled: Boolean(googleClientId),
    googleClientId,
  });
});

const PASSWORD_RESET_DISABLED_MESSAGE =
  'Recuperação de senha por email está desabilitada. Peça a um administrador uma senha temporária.';

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
      if (user && !user.passwordHash && user.googleId) {
        return res.status(401).json({
          error: 'Esta conta usa login com Google.',
          code: 'GOOGLE_ACCOUNT',
        });
      }
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

    const session = authSessionResponse(updatedUser);

    return res.json({
      message: 'Login realizado com sucesso!',
      ...session,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Erro interno ao realizar login.' });
  }
});

// POST /api/auth/google — verifies a Google ID token and returns { token, user }.
router.post('/google', async (req, res) => {
  try {
    if (!isGoogleOAuthEnabled()) {
      return res.status(503).json({ error: 'Login com Google não está configurado.' });
    }

    const { credential } = req.body ?? {};
    if (!credential || typeof credential !== 'string') {
      return res.status(400).json({ error: 'Token do Google é obrigatório.' });
    }

    const profile = await verifyGoogleIdToken(credential);
    if (!profile) {
      return res.status(401).json({ error: 'Token do Google inválido ou expirado.' });
    }

    const photoDataUrl = profile.picture ? await fetchGooglePhotoAsDataUrl(profile.picture) : null;

    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId: profile.googleId }, { email: profile.email }],
      },
    });

    if (user) {
      if (user.googleId && user.googleId !== profile.googleId) {
        return res.status(409).json({ error: 'Este email já está vinculado a outra conta Google.' });
      }

      const updates: {
        googleId?: string;
        photoUrl?: string;
        emailVerifiedAt?: Date;
        lastLogin: Date;
        isActive: boolean;
      } = {
        lastLogin: new Date(),
        isActive: true,
      };

      if (!user.googleId) updates.googleId = profile.googleId;
      if (!user.photoUrl && photoDataUrl) updates.photoUrl = photoDataUrl;
      if (!user.emailVerifiedAt && (profile.emailVerified || !isEmailVerificationRequired())) {
        updates.emailVerifiedAt = new Date();
      }

      user = await prisma.user.update({
        where: { id: user.id },
        data: updates,
      });
    } else {
      const name = await generateUniqueNickname(profile.email, profile.name);
      user = await prisma.user.create({
        data: {
          email: profile.email,
          googleId: profile.googleId,
          name,
          photoUrl: photoDataUrl,
          lastLogin: new Date(),
          isActive: true,
          emailVerifiedAt: profile.emailVerified || !isEmailVerificationRequired() ? new Date() : null,
        },
      });
    }

    if (!isEmailVerified(user) && isEmailVerificationRequired()) {
      return res.status(403).json({
        error: 'Confirme seu email antes de entrar.',
        code: 'EMAIL_NOT_VERIFIED',
        email: user.email,
      });
    }

    const session = authSessionResponse(user);
    return res.json({
      message: 'Login com Google realizado com sucesso!',
      ...session,
    });
  } catch (error) {
    console.error('Google login error:', error);
    return res.status(500).json({ error: 'Erro interno ao entrar com Google.' });
  }
});

// POST /api/auth/register — creates a user and returns { token, user }.
router.post('/register', async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      photoUrl,
    } = req.body ?? {};

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
    }

    const nameError = validateDisplayName(name);
    if (nameError) {
      return res.status(400).json({ error: nameError });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof email !== 'string' || !emailRegex.test(email)) {
      return res.status(400).json({ error: 'Email inválido.' });
    }

    if (typeof password !== 'string' || !isStrongPassword(password)) {
      return res.status(400).json({
        error: 'A senha deve ter ao menos 8 caracteres, incluindo letra maiúscula, minúscula e número.',
      });
    }

    const photoError = validatePhoto(photoUrl);
    if (photoError) {
      return res.status(400).json({ error: photoError });
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
        photoUrl: photoUrl || null,
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

    return res.json({
      message: 'Email confirmado com sucesso!',
      token: jwt,
      user: toPublicUser(user),
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
    if (!isPasswordResetByEmailEnabled()) {
      return res.status(403).json({ error: PASSWORD_RESET_DISABLED_MESSAGE });
    }

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
    if (!isPasswordResetByEmailEnabled()) {
      return res.status(403).json({ error: PASSWORD_RESET_DISABLED_MESSAGE });
    }

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
    if (!isPasswordResetByEmailEnabled()) {
      return res.status(403).json({ error: PASSWORD_RESET_DISABLED_MESSAGE });
    }

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

    const sameAsCurrent = await bcrypt.compare(password, user.passwordHash ?? DUMMY_PASSWORD_HASH);
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
    if (!fullUser) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    return res.json({
      message: 'Senha redefinida com sucesso!',
      token: jwt,
      user: toPublicUser(fullUser),
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

    return res.json({ user: toPublicUser(user) });
  } catch (error) {
    console.error('Error fetching current user:', error);
    return res.json({ user: null });
  }
});

// PUT /api/auth/me — updates the authenticated user's game attributes.
router.put('/me', requireAuth, async (req, res) => {
  try {
    const { name, photoUrl } = req.body ?? {};

    const current = await prisma.user.findUnique({
      where: { id: req.auth!.userId },
    });
    if (!current) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    let nextName = current.name;
    if (name !== undefined) {
      const nameError = validateDisplayName(name);
      if (nameError) {
        return res.status(400).json({ error: nameError });
      }
      const trimmed = name.trim();
      if (trimmed.toLowerCase() !== current.name.toLowerCase()) {
        const taken = await prisma.user.findFirst({
          where: {
            name: { equals: trimmed, mode: 'insensitive' },
            id: { not: current.id },
          },
          select: { id: true },
        });
        if (taken) {
          return res.status(400).json({ error: 'Este nome/apelido já está em uso.' });
        }
      }
      nextName = trimmed;
    }

    if (photoUrl !== undefined) {
      const photoError = validatePhoto(photoUrl);
      if (photoError) {
        return res.status(400).json({ error: photoError });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.auth!.userId },
      data: {
        name: nextName,
        ...(photoUrl !== undefined ? { photoUrl: photoUrl || null } : {}),
        lastLogin: new Date(),
      },
    });

    const nameChanged = nextName !== current.name;
    const session = nameChanged ? authSessionResponse(updatedUser) : null;

    return res.json({
      message: 'Perfil atualizado com sucesso!',
      user: toPublicUser(updatedUser),
      ...(session ? { token: session.token } : {}),
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

    if (!user.passwordHash) {
      return res.status(400).json({ error: 'Contas que usam apenas Google não têm senha local para alterar.' });
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

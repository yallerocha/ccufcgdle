import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRouter from './routes/auth';
import showRouter from './routes/show';
import communityRouter from './routes/community';
import adminRouter from './routes/admin';
import { isEmailVerificationRequired, isPasswordResetByEmailEnabled } from '../server/email-verification-config';
import { isSmtpConfigured } from '../server/mail-transport';

const app = express();

const PORT = Number(process.env.PORT) || 3001;
// Comma-separated list of allowed origins; "*" allows any (dev only). In
// production an explicit origin is required so we never silently allow any site.
const CORS_ORIGIN = process.env.CORS_ORIGIN;
if (!CORS_ORIGIN && process.env.NODE_ENV === 'production') {
  throw new Error(
    'CORS_ORIGIN is not defined. Set the allowed front-end origin(s) before starting in production.'
  );
}
const allowedOrigins =
  !CORS_ORIGIN || CORS_ORIGIN === '*'
    ? true
    : CORS_ORIGIN.split(',').map((o) => o.trim());

// Trust the first proxy hop so rate limiting keys on the real client IP when
// running behind a reverse proxy / container orchestrator.
app.set('trust proxy', 1);

// Sensible security headers.
app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
// 3mb covers a 2MB base64 photo plus the rest of the JSON payload.
app.use(express.json({ limit: '3mb' }));

// Throttle authentication attempts to slow down credential brute-forcing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Tente novamente mais tarde.' },
});

// Broader limiter for the rest of the API to curb abuse/scraping.
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em instantes.' },
});

// Lightweight healthcheck for containers/orchestration.
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/google', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/resend-verification', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);

app.use('/api/auth', authRouter);
app.use('/api/show', showRouter);
app.use('/api/community', communityRouter);
app.use('/api/admin', adminRouter);

function start() {
  app.listen(PORT, () => {
    console.log(`[api] listening on ${PORT} (CORS: ${CORS_ORIGIN || '*'})`);
    const emailOn = isEmailVerificationRequired();
    const smtpOn = isSmtpConfigured();
    console.log(
      `[api] Email verification: ${emailOn ? (smtpOn ? 'required (SMTP)' : 'required (dev: links in console)') : 'disabled (SKIP_EMAIL_VERIFICATION)'}`
    );
    console.log(
      `[api] Password reset by email: ${isPasswordResetByEmailEnabled() ? 'enabled' : 'disabled'}`
    );
    console.log(
      `[api] Google OAuth: ${process.env.GOOGLE_CLIENT_ID?.trim() ? 'enabled' : 'disabled'}`
    );
  });
}

void start();

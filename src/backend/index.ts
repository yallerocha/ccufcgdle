import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import gameRouter from './routes/game';
import adminRouter from './routes/admin';

const app = express();

const PORT = Number(process.env.PORT) || 3001;
// Comma-separated list of allowed origins; "*" allows any (dev only).
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const allowedOrigins =
  CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(',').map((o) => o.trim());

app.use(cors({ origin: allowedOrigins }));
// Large limit because profile photos are sent as base64 data URLs.
app.use(express.json({ limit: '5mb' }));

// Lightweight healthcheck for containers/orchestration.
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRouter);
app.use('/api/game', gameRouter);
app.use('/api/admin', adminRouter);

app.listen(PORT, () => {
  console.log(`[api] listening on ${PORT} (CORS: ${CORS_ORIGIN})`);
});

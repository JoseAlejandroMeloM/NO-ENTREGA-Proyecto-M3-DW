import { existsSync } from 'node:fs';
import path from 'node:path';
import cors from 'cors';
import express from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import { env, isProduction } from './config/env';
import { docsRouter } from './docs/router';
import { errorHandler, notFound } from './middleware/error';
import { requestLogger } from './middleware/logger';
import { requireDb } from './middleware/requireDb';
import { authRouter } from './modules/auth/router';
import { healthRouter } from './modules/health/router';

const app = express();

// Vercel and Render sit behind one proxy: trust it so req.ip (rate limiting) is the client's.
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: { scriptSrc: ["'self'", 'https://cdnjs.cloudflare.com'] },
    },
  }),
);
// Production is same-origin (/api), so CORS is only needed for local development.
if (env.CORS_ORIGIN) app.use(cors({ origin: env.CORS_ORIGIN.split(',') }));
app.use(express.json({ limit: '100kb' }));
app.use(mongoSanitize());
if (env.NODE_ENV !== 'test') app.use(requestLogger);

app.use('/api/health', healthRouter);
app.use('/api/docs', docsRouter);
app.use('/api/auth', requireDb, authRouter);
app.use('/api', notFound);

// Render: the same service also serves the React build. On Vercel the build is static, so this is skipped.
const clientDist = path.resolve(__dirname, '../../client/dist');
if (isProduction && existsSync(clientDist)) {
  app.use(express.static(clientDist, { index: false, maxAge: '1h' }));
  app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.use(errorHandler);

export default app;

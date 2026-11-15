import { Router } from 'express';
import { connectDb, dbState } from '../../db/connect';

export const healthRouter = Router();

/** GET /api/health — liveness check used by Render and the README badge. */
healthRouter.get('/', async (_req, res) => {
  try {
    await connectDb();
  } catch {
    // Report the state instead of failing: the API itself is up.
  }
  res.json({ status: 'ok', db: dbState(), time: new Date().toISOString() });
});

import { Router } from 'express';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { authenticate, currentUser } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { clientIp } from '../../utils/clientIp';
import { AppError } from '../../utils/errors';
import { loginSchema, registerDistributorSchema, registerStoreSchema } from './schemas';
import * as auth from './service';

// Both limits count per visitor address (see utils/clientIp.ts); ipKeyGenerator groups IPv6 by /56.
const keyGenerator = (req: Parameters<typeof clientIp>[0]) => ipKeyGenerator(clientIp(req));

// US-03 AC3: 5 failed logins per IP per 15 minutes. Successful logins do not count.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  keyGenerator,
  legacyHeaders: false,
  handler: (_req, _res, next) =>
    next(new AppError(429, 'RATE_LIMITED', 'Too many failed login attempts. Try again in 15 minutes.')),
});

// Basic protection for sign-ups (account spam): 20 registrations per IP per hour.
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  keyGenerator,
  legacyHeaders: false,
  handler: (_req, _res, next) => next(new AppError(429, 'RATE_LIMITED', 'Too many registrations. Try again later.')),
});

export const authRouter = Router();

authRouter.post('/register-store', registerLimiter, validate({ body: registerStoreSchema }), async (req, res, next) => {
  try {
    res.status(201).json(await auth.registerStore(req.body));
  } catch (err) {
    next(err);
  }
});

authRouter.post(
  '/register-distributor',
  registerLimiter,
  validate({ body: registerDistributorSchema }),
  async (req, res, next) => {
    try {
      res.status(201).json(await auth.registerDistributor(req.body));
    } catch (err) {
      next(err);
    }
  },
);

authRouter.post('/login', loginLimiter, validate({ body: loginSchema }), async (req, res, next) => {
  try {
    res.json(await auth.login(req.body));
  } catch (err) {
    next(err);
  }
});

authRouter.get('/me', authenticate, async (req, res, next) => {
  try {
    res.json(await auth.me(currentUser(req).id));
  } catch (err) {
    next(err);
  }
});

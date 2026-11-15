import { Router } from 'express';
import { authenticate, authorize, currentUser } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { daysQuery } from './schemas';
import * as insights from './service';

// Owner and inventory clerk only (US-13, US-14); cashiers and distributors get 403.
export const insightsRouter = Router();
insightsRouter.use(authenticate, authorize('store_owner', 'store_inventory'));

insightsRouter.get('/best-sellers', validate({ query: daysQuery }), async (req, res, next) => {
  try {
    res.json(await insights.bestSellers(currentUser(req), req.query.days as unknown as number));
  } catch (err) {
    next(err);
  }
});

insightsRouter.get('/daily-sales', validate({ query: daysQuery }), async (req, res, next) => {
  try {
    res.json(await insights.dailySales(currentUser(req), req.query.days as unknown as number));
  } catch (err) {
    next(err);
  }
});

insightsRouter.get('/restock', async (req, res, next) => {
  try {
    res.json(await insights.restock(currentUser(req)));
  } catch (err) {
    next(err);
  }
});

import { Router } from 'express';
import { authenticate, authorize, currentUser } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { rangeQuery } from './schemas';
import * as distributorInsights from './service';

// Distributor owner only: staff and every store role get 403.
export const distributorInsightsRouter = Router();
distributorInsightsRouter.use(authenticate, authorize('distributor_owner'));

distributorInsightsRouter.get('/', validate({ query: rangeQuery }), async (req, res, next) => {
  try {
    res.json(await distributorInsights.insights(currentUser(req), req.query.range as unknown as number));
  } catch (err) {
    next(err);
  }
});

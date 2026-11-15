import { Router, type RequestHandler } from 'express';
import { authenticate, authorize, currentUser } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { DISTRIBUTOR_ROLES, STORE_ROLES, type Role } from '../../models/roles';
import { atLeastOne } from '../../utils/validation';
import { distributorInputSchema, storeInputSchema } from '../auth/schemas';
import * as orgs from './service';

const handle =
  (fn: (orgId: string, body: Record<string, unknown>) => Promise<unknown>): RequestHandler =>
  async (req, res, next) => {
    try {
      res.json(await fn(currentUser(req).orgId, req.body));
    } catch (err) {
      next(err);
    }
  };

// GET: every member of the organization can read its profile. PATCH: owner only.
export const storesRouter = Router();
storesRouter.get('/me', authenticate, authorize(...(STORE_ROLES as Role[])), handle(orgs.getStore));
storesRouter.patch(
  '/me',
  authenticate,
  authorize('store_owner'),
  validate({ body: atLeastOne(storeInputSchema) }),
  handle(orgs.updateStore),
);

// `/me` routes are registered before the public directory routes (`/:id`) added by add-distributor-catalog.
export const distributorsRouter = Router();
distributorsRouter.get('/me', authenticate, authorize(...(DISTRIBUTOR_ROLES as Role[])), handle(orgs.getDistributor));
distributorsRouter.patch(
  '/me',
  authenticate,
  authorize('distributor_owner'),
  validate({ body: atLeastOne(distributorInputSchema) }),
  handle(orgs.updateDistributor),
);

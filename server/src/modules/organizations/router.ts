import { Router, type RequestHandler } from 'express';
import { authenticate, authorize, currentUser } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { DISTRIBUTOR_ROLES, STORE_ROLES, type Role } from '../../models/roles';
import { atLeastOne, idParams } from '../../utils/validation';
import { catalogQuery, type CatalogQuery } from '../catalog/schemas';
import { compareQuery, directoryQuery, type CompareQuery, type DirectoryQuery } from '../directory/schemas';
import * as directory from '../directory/service';
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

// Directory, profile, catalog and comparison (US-31): store owner/inventory and distributor users; cashiers get 403.
const canBrowse = authorize('store_owner', 'store_inventory', 'distributor_owner', 'distributor_staff');

distributorsRouter.get('/', authenticate, canBrowse, validate({ query: directoryQuery }), async (req, res, next) => {
  try {
    res.json(await directory.list(req.query as unknown as DirectoryQuery));
  } catch (err) {
    next(err);
  }
});

// Declared before `/:id` so "compare" is not read as an id.
distributorsRouter.get('/compare', authenticate, canBrowse, validate({ query: compareQuery }), async (req, res, next) => {
  try {
    res.json(await directory.compare(req.query as unknown as CompareQuery));
  } catch (err) {
    next(err);
  }
});

distributorsRouter.get('/:id', authenticate, canBrowse, validate({ params: idParams }), async (req, res, next) => {
  try {
    res.json(await directory.get(req.params.id as string));
  } catch (err) {
    next(err);
  }
});

distributorsRouter.get(
  '/:id/catalog',
  authenticate,
  canBrowse,
  validate({ params: idParams, query: catalogQuery }),
  async (req, res, next) => {
    try {
      res.json(await directory.catalog(req.params.id as string, req.query as unknown as CatalogQuery));
    } catch (err) {
      next(err);
    }
  },
);

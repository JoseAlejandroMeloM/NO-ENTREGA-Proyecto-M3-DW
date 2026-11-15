import { Router } from 'express';
import { authenticate, authorize, currentUser } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { idParams } from '../../utils/validation';
import {
  catalogQuery,
  createCatalogItemSchema,
  updateCatalogItemSchema,
  type CatalogQuery,
} from './schemas';
import * as catalog from './service';

// Distributor owner and staff read their own catalog; only the owner writes (US-30). Stores get 403.
const ownerOnly = authorize('distributor_owner');

export const catalogRouter = Router();
catalogRouter.use(authenticate, authorize('distributor_owner', 'distributor_staff'));

catalogRouter.get('/', validate({ query: catalogQuery }), async (req, res, next) => {
  try {
    res.json(await catalog.listMine(currentUser(req), req.query as unknown as CatalogQuery));
  } catch (err) {
    next(err);
  }
});

catalogRouter.post('/', ownerOnly, validate({ body: createCatalogItemSchema }), async (req, res, next) => {
  try {
    res.status(201).json(await catalog.create(currentUser(req), req.body));
  } catch (err) {
    next(err);
  }
});

catalogRouter.patch(
  '/:id',
  ownerOnly,
  validate({ params: idParams, body: updateCatalogItemSchema }),
  async (req, res, next) => {
    try {
      res.json(await catalog.update(currentUser(req), req.params.id as string, req.body));
    } catch (err) {
      next(err);
    }
  },
);

catalogRouter.delete('/:id', ownerOnly, validate({ params: idParams }), async (req, res, next) => {
  try {
    await catalog.remove(currentUser(req), req.params.id as string);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

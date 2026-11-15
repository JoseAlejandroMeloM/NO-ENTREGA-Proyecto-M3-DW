import { Router } from 'express';
import { authenticate, authorize, currentUser } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { idParams } from '../../utils/validation';
import {
  adjustmentSchema,
  createProductSchema,
  listProductsQuery,
  movementsQuery,
  updateProductSchema,
  type ListProductsQuery,
  type MovementsQuery,
} from './schemas';
import * as products from './service';

// Every store role can read; only owner and inventory can write (US-10 AC3). Distributors get 403.
const canRead = authorize('store_owner', 'store_inventory', 'store_cashier');
const canWrite = authorize('store_owner', 'store_inventory');

export const productsRouter = Router();
productsRouter.use(authenticate, canRead);

productsRouter.get('/', validate({ query: listProductsQuery }), async (req, res, next) => {
  try {
    res.json(await products.list(currentUser(req), req.query as unknown as ListProductsQuery));
  } catch (err) {
    next(err);
  }
});

productsRouter.post('/', canWrite, validate({ body: createProductSchema }), async (req, res, next) => {
  try {
    res.status(201).json(await products.create(currentUser(req), req.body));
  } catch (err) {
    next(err);
  }
});

productsRouter.get('/:id', validate({ params: idParams }), async (req, res, next) => {
  try {
    res.json(await products.get(currentUser(req), req.params.id as string));
  } catch (err) {
    next(err);
  }
});

productsRouter.patch(
  '/:id',
  canWrite,
  validate({ params: idParams, body: updateProductSchema }),
  async (req, res, next) => {
    try {
      res.json(await products.update(currentUser(req), req.params.id as string, req.body));
    } catch (err) {
      next(err);
    }
  },
);

productsRouter.delete('/:id', canWrite, validate({ params: idParams }), async (req, res, next) => {
  try {
    await products.remove(currentUser(req), req.params.id as string);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

productsRouter.post(
  '/:id/adjustments',
  canWrite,
  validate({ params: idParams, body: adjustmentSchema }),
  async (req, res, next) => {
    try {
      res.json(await products.adjust(currentUser(req), req.params.id as string, req.body));
    } catch (err) {
      next(err);
    }
  },
);

productsRouter.get(
  '/:id/movements',
  validate({ params: idParams, query: movementsQuery }),
  async (req, res, next) => {
    try {
      res.json(
        await products.movements(currentUser(req), req.params.id as string, req.query as unknown as MovementsQuery),
      );
    } catch (err) {
      next(err);
    }
  },
);

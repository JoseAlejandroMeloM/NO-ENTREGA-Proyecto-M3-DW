import { Router } from 'express';
import { authenticate, authorize, currentUser } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { idParams } from '../../utils/validation';
import { createOrderSchema, listOrdersQuery, ratingSchema, statusSchema, type ListOrdersQuery } from './schemas';
import * as messages from './messages';
import * as orders from './service';

// Both sides use /orders, scoped by organization. Cashiers have no access (US-32).
export const ordersRouter = Router();
ordersRouter.use(authenticate, authorize('store_owner', 'store_inventory', 'distributor_owner', 'distributor_staff'));
const storeBuyer = authorize('store_owner', 'store_inventory');

ordersRouter.get('/', validate({ query: listOrdersQuery }), async (req, res, next) => {
  try {
    res.json(await orders.list(currentUser(req), req.query as unknown as ListOrdersQuery));
  } catch (err) {
    next(err);
  }
});

ordersRouter.post('/', storeBuyer, validate({ body: createOrderSchema }), async (req, res, next) => {
  try {
    res.status(201).json(await orders.create(currentUser(req), req.body));
  } catch (err) {
    next(err);
  }
});

ordersRouter.get('/:id', validate({ params: idParams }), async (req, res, next) => {
  try {
    res.json(await orders.get(currentUser(req), req.params.id as string));
  } catch (err) {
    next(err);
  }
});

// Role checks per transition live in the service (BR5 table).
ordersRouter.patch('/:id/status', validate({ params: idParams, body: statusSchema }), async (req, res, next) => {
  try {
    res.json(await orders.changeStatus(currentUser(req), req.params.id as string, req.body));
  } catch (err) {
    next(err);
  }
});

ordersRouter.post('/:id/receive', storeBuyer, validate({ params: idParams }), async (req, res, next) => {
  try {
    res.json(await orders.receive(currentUser(req), req.params.id as string));
  } catch (err) {
    next(err);
  }
});

ordersRouter.post('/:id/rating', authorize('store_owner'), validate({ params: idParams, body: ratingSchema }), async (req, res, next) => {
  try {
    res.status(201).json(await orders.rate(currentUser(req), req.params.id as string, req.body));
  } catch (err) {
    next(err);
  }
});

// Messages (US-40): any order user of either side; the service returns 404 to third parties.
ordersRouter.get(
  '/:id/messages',
  validate({ params: idParams, query: messages.messagesQuery }),
  async (req, res, next) => {
    try {
      res.json(await messages.list(currentUser(req), req.params.id as string, req.query as unknown as messages.MessagesQuery));
    } catch (err) {
      next(err);
    }
  },
);

ordersRouter.post('/:id/messages', validate({ params: idParams, body: messages.messageSchema }), async (req, res, next) => {
  try {
    res.status(201).json(await messages.send(currentUser(req), req.params.id as string, req.body.text));
  } catch (err) {
    next(err);
  }
});

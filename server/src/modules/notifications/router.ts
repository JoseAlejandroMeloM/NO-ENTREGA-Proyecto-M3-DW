import { Router } from 'express';
import { authenticate, currentUser } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { idParams } from '../../utils/validation';
import { listNotificationsQuery, type ListNotificationsQuery } from './schemas';
import * as notifications from './service';

// Every logged-in user has an inbox; each route only touches the caller's own notifications.
export const notificationsRouter = Router();
notificationsRouter.use(authenticate);

notificationsRouter.get('/', validate({ query: listNotificationsQuery }), async (req, res, next) => {
  try {
    res.json(await notifications.listMine(currentUser(req), req.query as unknown as ListNotificationsQuery));
  } catch (err) {
    next(err);
  }
});

notificationsRouter.patch('/:id/read', validate({ params: idParams }), async (req, res, next) => {
  try {
    await notifications.markRead(currentUser(req), req.params.id as string);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

notificationsRouter.post('/read-all', async (req, res, next) => {
  try {
    await notifications.markAllRead(currentUser(req));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

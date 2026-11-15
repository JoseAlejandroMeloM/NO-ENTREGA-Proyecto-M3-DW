import { Router } from 'express';
import { authenticate, authorize, currentUser } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { idParams } from '../../utils/validation';
import { createEmployeeSchema, updateEmployeeSchema } from './schemas';
import * as users from './service';

// Only owners manage their team; employees get 403 on every route (US-04 AC3).
export const usersRouter = Router();
usersRouter.use(authenticate, authorize('store_owner', 'distributor_owner'));

usersRouter.get('/', async (req, res, next) => {
  try {
    res.json(await users.listTeam(currentUser(req)));
  } catch (err) {
    next(err);
  }
});

usersRouter.post('/', validate({ body: createEmployeeSchema }), async (req, res, next) => {
  try {
    res.status(201).json(await users.createEmployee(currentUser(req), req.body));
  } catch (err) {
    next(err);
  }
});

usersRouter.patch('/:id', validate({ params: idParams, body: updateEmployeeSchema }), async (req, res, next) => {
  try {
    res.json(await users.setActive(currentUser(req), req.params.id as string, req.body.active));
  } catch (err) {
    next(err);
  }
});

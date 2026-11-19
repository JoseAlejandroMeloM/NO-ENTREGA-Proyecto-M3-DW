import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize, currentUser } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { Closing, type ClosingDoc } from '../../models/Closing';
import { AppError } from '../../utils/errors';
import { dailySummary } from '../sales/service';
import { todayInBogota } from '../sales/time';

const createClosingSchema = z.object({
  date: z.iso.date().refine((date) => date <= todayInBogota(), 'Choose today or an earlier business day'),
  openingFloat: z.number().int().nonnegative(),
  countedCash: z.number().int().nonnegative(),
  note: z.string().trim().max(200).optional(),
});

function toClosingDto(closing: ClosingDoc) {
  const { date, openingFloat, countedCash, expectedCash, cardTotal, nequiTotal, difference, note } = closing;
  return { id: closing._id.toString(), date, openingFloat, countedCash, expectedCash, cardTotal, nequiTotal, difference, note };
}

export const closingsRouter = Router();
closingsRouter.use(authenticate, authorize('store_owner'));

closingsRouter.get('/', async (req, res, next) => {
  try {
    const closings = await Closing.find({ storeId: currentUser(req).orgId }).sort({ date: -1 });
    res.json(closings.map(toClosingDto));
  } catch (err) {
    next(err);
  }
});

closingsRouter.post('/', validate({ body: createClosingSchema }), async (req, res, next) => {
  try {
    const user = currentUser(req);
    const { date, openingFloat, countedCash, note } = req.body as z.infer<typeof createClosingSchema>;
    const { byMethod } = await dailySummary(user, date);
    const expectedCash = openingFloat + (byMethod.find(({ method }) => method === 'cash')?.total ?? 0);

    // Wait for the unique index so simultaneous requests cannot save two closings.
    await Closing.init();
    const closing = await Closing.create({
      storeId: user.orgId,
      date,
      openingFloat,
      countedCash,
      expectedCash,
      cardTotal: byMethod.find(({ method }) => method === 'card')?.total ?? 0,
      nequiTotal: byMethod.find(({ method }) => method === 'nequi')?.total ?? 0,
      difference: countedCash - expectedCash,
      note: note || null,
    });
    res.status(201).json(toClosingDto(closing));
  } catch (err) {
    if (err instanceof Error && 'code' in err && err.code === 11000) {
      next(new AppError(409, 'CONFLICT', 'This business day is already closed'));
    } else {
      next(err);
    }
  }
});

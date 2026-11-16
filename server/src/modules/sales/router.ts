import { Router } from 'express';
import { authenticate, authorize, currentUser } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { idParams } from '../../utils/validation';
import {
  createSaleSchema,
  dailySummaryQuery,
  exportSalesQuery,
  listSalesQuery,
  voidSaleSchema,
  type ExportSalesQuery,
  type ListSalesQuery,
} from './schemas';
import * as sales from './service';

// Permission matrix: owner and cashier sell; inventory reads history; only the owner sees daily totals.
export const salesRouter = Router();
salesRouter.use(authenticate, authorize('store_owner', 'store_inventory', 'store_cashier'));

salesRouter.post('/', authorize('store_owner', 'store_cashier'), validate({ body: createSaleSchema }), async (req, res, next) => {
  try {
    res.status(201).json(await sales.create(currentUser(req), req.body));
  } catch (err) {
    next(err);
  }
});

salesRouter.get('/', validate({ query: listSalesQuery }), async (req, res, next) => {
  try {
    res.json(await sales.list(currentUser(req), req.query as unknown as ListSalesQuery));
  } catch (err) {
    next(err);
  }
});

// Declared before /:id so "export" and "summary" are not taken as ids.
salesRouter.get('/export', authorize('store_owner'), validate({ query: exportSalesQuery }), async (req, res, next) => {
  try {
    const q = sales.exportRange(req.query as unknown as ExportSalesQuery);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="sales-${q.from}-to-${q.to}.csv"`);
    res.write('\ufeff'); // BOM so Excel reads accents (UTF-8) correctly
    await sales.exportCsv(currentUser(req), q, (chunk) => res.write(chunk));
    res.end();
  } catch (err) {
    if (res.headersSent) res.destroy(err as Error);
    else next(err);
  }
});

salesRouter.get('/summary/daily', authorize('store_owner'), validate({ query: dailySummaryQuery }), async (req, res, next) => {
  try {
    res.json(await sales.dailySummary(currentUser(req), req.query.date as string | undefined));
  } catch (err) {
    next(err);
  }
});

salesRouter.get('/:id', validate({ params: idParams }), async (req, res, next) => {
  try {
    res.json(await sales.get(currentUser(req), req.params.id as string));
  } catch (err) {
    next(err);
  }
});

salesRouter.post(
  '/:id/void',
  authorize('store_owner'),
  validate({ params: idParams, body: voidSaleSchema }),
  async (req, res, next) => {
    try {
      res.json(await sales.voidSale(currentUser(req), req.params.id as string, req.body.reason as string));
    } catch (err) {
      next(err);
    }
  },
);

import { z } from 'zod';
import { PAYMENT_METHODS } from '../../models/Sale';

const objectId = z.string().regex(/^[a-f0-9]{24}$/, 'Invalid id');
// A real calendar date (rejects 2026-02-30).
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD')
  .refine((d) => !Number.isNaN(Date.parse(`${d}T00:00:00Z`)) && new Date(`${d}T00:00:00Z`).toISOString().startsWith(d), 'Invalid date');
const paymentMethod = z.enum(PAYMENT_METHODS, { error: 'Choose card, Nequi or cash' });

// Prices and totals are never accepted from the client: unknown keys like `total` are stripped.
export const createSaleSchema = z.object({
  items: z
    .array(
      z.object({
        product: objectId,
        quantity: z
          .number({ error: 'Enter a whole number' })
          .int('Enter a whole number')
          .min(1, 'Quantity must be at least 1')
          .max(10_000, 'Quantity is too large'),
      }),
    )
    .min(1, 'Add at least one product')
    .max(100, 'A sale can have at most 100 lines'),
  paymentMethod,
  amountReceived: z.number({ error: 'Enter a whole number' }).int('Enter a whole number').min(0).optional(),
});
export type CreateSaleInput = z.infer<typeof createSaleSchema>;

export const listSalesQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  from: isoDate.optional(),
  to: isoDate.optional(),
  paymentMethod: paymentMethod.optional(),
  cashier: objectId.optional(),
});
export type ListSalesQuery = z.infer<typeof listSalesQuery>;

// Export (add-sales-export): same filters as the history, no paging, at most 92 days. Defaults to the last 30 days.
export const EXPORT_MAX_DAYS = 92;
const DAY = 24 * 60 * 60 * 1000;
export const exportSalesQuery = z
  .object({
    from: isoDate.optional(),
    to: isoDate.optional(),
    paymentMethod: paymentMethod.optional(),
    cashier: objectId.optional(),
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, { path: ['from'], message: '"From" must be on or before "To"' })
  .refine(
    (q) => !q.from || !q.to || (Date.parse(q.to) - Date.parse(q.from)) / DAY + 1 <= EXPORT_MAX_DAYS,
    { path: ['from'], message: `Export at most ${EXPORT_MAX_DAYS} days at a time` },
  );
export type ExportSalesQuery = z.infer<typeof exportSalesQuery>;

export const dailySummaryQuery = z.object({ date: isoDate.optional() });

export const voidSaleSchema = z.object({
  reason: z.string({ error: 'Enter a reason' }).trim().min(3, 'Enter a reason (at least 3 characters)').max(200),
});
export type VoidSaleInput = z.infer<typeof voidSaleSchema>;

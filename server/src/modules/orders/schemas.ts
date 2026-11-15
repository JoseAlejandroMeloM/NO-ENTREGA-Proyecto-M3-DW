import { z } from 'zod';
import { ORDER_STATUSES } from '../../models/PurchaseOrder';

const objectId = z.string().regex(/^[a-f0-9]{24}$/, 'Invalid id');

export const createOrderSchema = z.object({
  distributor: objectId,
  items: z
    .array(
      z.object({
        catalogItem: objectId,
        quantity: z.number({ error: 'Enter a whole number' }).int('Enter a whole number').min(1, 'Must be at least 1'),
      }),
    )
    .min(1, 'Add at least one item')
    .max(100, 'At most 100 items'),
  note: z.string().trim().max(300).optional(),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const listOrdersQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(ORDER_STATUSES).optional(),
});
export type ListOrdersQuery = z.infer<typeof listOrdersQuery>;

export const statusSchema = z
  .object({
    status: z.enum(['accepted', 'rejected', 'shipped', 'delivered', 'cancelled'], { error: 'Choose a valid status' }),
    note: z.string().trim().max(300).optional(),
  })
  .refine((v) => v.status !== 'rejected' || (v.note && v.note.length > 0), {
    message: 'Tell the store why you reject the order',
    path: ['note'],
  });
export type StatusInput = z.infer<typeof statusSchema>;

export const ratingSchema = z.object({
  stars: z.number({ error: 'Choose 1 to 5 stars' }).int().min(1, 'Choose 1 to 5 stars').max(5, 'Choose 1 to 5 stars'),
  comment: z.string().trim().max(300).optional(),
});
export type RatingInput = z.infer<typeof ratingSchema>;

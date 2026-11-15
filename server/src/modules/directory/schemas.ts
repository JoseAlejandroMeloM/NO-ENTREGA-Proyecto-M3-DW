import { z } from 'zod';
import { CATEGORIES } from '../../models/Product';

export const directoryQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(80).optional(),
  category: z.enum(CATEGORIES).optional(),
});
export type DirectoryQuery = z.infer<typeof directoryQuery>;

export const compareQuery = z
  .object({
    q: z.string().trim().min(1).max(80).optional(),
    category: z.enum(CATEGORIES).optional(),
    sort: z.enum(['price', 'deliveryDays', 'rating']).default('price'),
  })
  .refine((v) => v.q || v.category, { message: 'Enter a product name or choose a category', path: ['q'] });
export type CompareQuery = z.infer<typeof compareQuery>;

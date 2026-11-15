import { z } from 'zod';
import { CATEGORIES, UNITS } from '../../models/Product';
import { atLeastOne } from '../../utils/validation';

const fields = {
  name: z.string().trim().min(2, 'Name must have 2 to 80 characters').max(80, 'Name must have 2 to 80 characters'),
  category: z.enum(CATEGORIES, { error: 'Choose a category' }),
  unit: z.enum(UNITS, { error: 'Choose a unit' }),
  price: z.number({ error: 'Enter a whole number' }).int('Enter a whole number').min(1, 'Must be at least 1'),
  available: z.boolean({ error: 'Must be true or false' }),
};

export const createCatalogItemSchema = z.object({ ...fields, available: fields.available.default(true) });
export type CreateCatalogItemInput = z.infer<typeof createCatalogItemSchema>;

export const updateCatalogItemSchema = atLeastOne(z.object(fields));
export type UpdateCatalogItemInput = z.infer<typeof updateCatalogItemSchema>;

export const catalogQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(80).optional(),
  category: z.enum(CATEGORIES).optional(),
});
export type CatalogQuery = z.infer<typeof catalogQuery>;

import { z } from 'zod';
import { ADJUSTMENT_REASONS } from '../../models/StockMovement';
import { CATEGORIES, UNITS } from '../../models/Product';
import { atLeastOne } from '../../utils/validation';

const int = (min: number) =>
  z
    .number({ error: 'Enter a whole number' })
    .int('Enter a whole number')
    .min(min, `Must be at least ${min}`);

const productFields = {
  name: z.string().trim().min(2, 'Name must have 2 to 80 characters').max(80, 'Name must have 2 to 80 characters'),
  sku: z.string().trim().min(1, 'SKU is required').max(30, 'SKU must have at most 30 characters'),
  category: z.enum(CATEGORIES, { error: 'Choose a category' }),
  unit: z.enum(UNITS, { error: 'Choose a unit' }),
  price: int(1),
  cost: int(0),
  minStock: int(0),
};

export const createProductSchema = z.object({
  ...productFields,
  cost: productFields.cost.default(0),
  minStock: productFields.minStock.default(5),
  stock: int(0).default(0), // initial stock only; later changes go through adjustments
});
export type CreateProductInput = z.infer<typeof createProductSchema>;

// Strict: sending `stock` here is a 400 — stock only changes through adjustments.
export const updateProductSchema = atLeastOne(z.object(productFields));
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

const boolString = z.enum(['true', 'false']).transform((v) => v === 'true');

export const listProductsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(80).optional(),
  category: z.enum(CATEGORIES).optional(),
  lowStock: boolString.optional(),
});
export type ListProductsQuery = z.infer<typeof listProductsQuery>;

export const adjustmentSchema = z.object({
  quantity: z
    .number({ error: 'Enter a whole number' })
    .int('Enter a whole number')
    .refine((n) => n !== 0, 'Quantity cannot be 0'),
  reason: z.enum(ADJUSTMENT_REASONS, { error: 'Choose a reason' }),
  note: z.string().trim().max(200).optional(),
});
export type AdjustmentInput = z.infer<typeof adjustmentSchema>;

export const movementsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type MovementsQuery = z.infer<typeof movementsQuery>;

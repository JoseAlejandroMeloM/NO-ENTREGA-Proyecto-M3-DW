import { z } from 'zod';

// Mirrors the input schemas of docs/spec/openapi.yaml.
export const email = z.preprocess(
  (v) => (typeof v === 'string' ? v.trim().toLowerCase() : v),
  z.email({ message: 'Invalid email' }),
);
export const password = z
  .string()
  .min(8, 'Password must have at least 8 characters')
  .max(72, 'Password must have at most 72 characters')
  .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, 'Password must include letters and numbers');
export const name = z.string().trim().min(2).max(80);
export const phone = z.string().regex(/^\d{7,15}$/, 'Phone must have 7 to 15 digits');

export const storeInputSchema = z.object({
  name,
  address: z.string().trim().min(1).max(160),
  phone,
});

export const distributorInputSchema = z.object({
  name,
  nit: z.string().regex(/^\d{6,12}(-\d)?$/, 'NIT must have 6 to 12 digits and an optional check digit'),
  phone,
  coverageArea: z.string().trim().min(1).max(120),
  deliveryDays: z.number().int().min(1).max(30),
  minimumOrder: z.number().int().min(0),
});

export const registerStoreSchema = z.object({
  name,
  email,
  password,
  store: storeInputSchema,
});

export const registerDistributorSchema = z.object({
  name,
  email,
  password,
  distributor: distributorInputSchema,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128),
});

export type RegisterStoreInput = z.infer<typeof registerStoreSchema>;
export type RegisterDistributorInput = z.infer<typeof registerDistributorSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

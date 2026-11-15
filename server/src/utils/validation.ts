import { z } from 'zod';

/** Path parameter `{id}`: a MongoDB ObjectId (the `Id` parameter in openapi.yaml). */
export const idParams = z.object({ id: z.string().regex(/^[a-f0-9]{24}$/, 'Invalid id') });

/** Makes every field optional but requires at least one, for PATCH bodies. */
export const atLeastOne = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) =>
  schema
    .partial()
    .strict()
    .refine((v) => Object.keys(v).length > 0, { message: 'Send at least one field to update' });

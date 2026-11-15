import { z } from 'zod';

// The `Days` parameter in openapi.yaml: only 7, 30 or 90.
export const daysQuery = z.object({
  days: z
    .enum(['7', '30', '90'], { error: 'days must be 7, 30 or 90' })
    .default('30')
    .transform(Number),
});

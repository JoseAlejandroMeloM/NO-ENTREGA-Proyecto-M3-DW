import { z } from 'zod';

// The `Range` parameter in openapi.yaml: the last 7, 30 or 90 days.
export const rangeQuery = z.object({
  range: z
    .enum(['7', '30', '90'], { error: 'range must be 7, 30 or 90' })
    .default('30')
    .transform(Number),
});

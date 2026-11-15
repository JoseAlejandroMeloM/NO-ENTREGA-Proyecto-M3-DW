import { z } from 'zod';

const boolString = z.enum(['true', 'false']).transform((v) => v === 'true');

export const listNotificationsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unread: boolString.optional(),
});
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuery>;

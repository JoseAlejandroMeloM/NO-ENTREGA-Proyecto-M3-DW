import { z } from 'zod';
import { email, name, password } from '../auth/schemas';

export const EMPLOYEE_ROLES = ['store_inventory', 'store_cashier', 'distributor_staff'] as const;

export const createEmployeeSchema = z.object({
  name,
  email,
  password,
  role: z.enum(EMPLOYEE_ROLES),
});

export const updateEmployeeSchema = z.object({ active: z.boolean() }).strict();

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

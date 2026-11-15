import { z } from 'zod';

// Empty strings in .env files count as "not set".
const blankToUndefined = (v: unknown) => (v === '' ? undefined : v);

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    MONGODB_URI: z.preprocess(blankToUndefined, z.string().optional()),
    JWT_SECRET: z.preprocess(blankToUndefined, z.string().min(32).optional()),
    JWT_ISSUER: z.string().default('conecta-negocio-auth'),
    JWT_AUDIENCE: z.string().default('conecta-negocio-api'),
    CORS_ORIGIN: z.preprocess(blankToUndefined, z.string().optional()),
  })
  .superRefine((v, ctx) => {
    // Production must never run without a signing secret or a database.
    if (v.NODE_ENV === 'production') {
      if (!v.JWT_SECRET) ctx.addIssue({ code: 'custom', path: ['JWT_SECRET'], message: 'required in production' });
      if (!v.MONGODB_URI) ctx.addIssue({ code: 'custom', path: ['MONGODB_URI'], message: 'required in production' });
    }
  });

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // Fail fast with the names of the bad variables, never their values.
  const names = parsed.error.issues.map((i) => i.path.join('.')).join(', ');
  throw new Error(`Invalid environment variables: ${names}`);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';

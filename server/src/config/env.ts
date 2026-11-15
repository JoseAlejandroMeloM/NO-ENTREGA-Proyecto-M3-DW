import { z } from 'zod';

// Empty strings in .env files count as "not set".
const optional = z.preprocess((v) => (v === '' ? undefined : v), z.string().optional());

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: optional,
  JWT_SECRET: z.preprocess((v) => (v === '' ? undefined : v), z.string().min(32).optional()),
  JWT_ISSUER: z.string().default('conecta-negocio-auth'),
  JWT_AUDIENCE: z.string().default('conecta-negocio-api'),
  CORS_ORIGIN: optional,
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // Fail fast with the names of the bad variables, never their values.
  const names = parsed.error.issues.map((i) => i.path.join('.')).join(', ');
  throw new Error(`Invalid environment variables: ${names}`);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';

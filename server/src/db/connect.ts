import mongoose from 'mongoose';
import { env } from '../config/env';

// Reject query operators ($gt, $where...) coming from user input at the driver level.
mongoose.set('sanitizeFilter', true);
mongoose.set('strictQuery', true);

let pending: Promise<typeof mongoose> | null = null;

/**
 * Connects once and reuses the connection. Serverless functions (Vercel) keep the
 * module cached between invocations, so this avoids opening a connection per request.
 */
export async function connectDb(): Promise<typeof mongoose | null> {
  if (!env.MONGODB_URI) return null;
  if (mongoose.connection.readyState === 1) return mongoose;
  pending ??= mongoose
    .connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
    .catch((err: unknown) => {
      pending = null;
      throw err;
    });
  return pending;
}

const STATES: readonly string[] = ['disconnected', 'connected', 'connecting', 'disconnecting'];

export function dbState(): string {
  if (!env.MONGODB_URI) return 'not_configured';
  return STATES[mongoose.connection.readyState] ?? 'unknown';
}

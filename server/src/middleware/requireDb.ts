import type { RequestHandler } from 'express';
import { connectDb } from '../db/connect';
import { AppError } from '../utils/errors';

/** Makes sure the (cached) MongoDB connection is open before a route touches the database. */
export const requireDb: RequestHandler = async (_req, _res, next) => {
  try {
    const conn = await connectDb();
    if (!conn) throw new AppError(500, 'INTERNAL_ERROR', 'Database is not configured');
    next();
  } catch (err) {
    next(err);
  }
};

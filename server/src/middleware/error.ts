import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { isProduction } from '../config/env';
import { AppError } from '../utils/errors';

export const notFound: RequestHandler = (req, _res, next) => {
  next(new AppError(404, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`));
};

// Express recognizes error handlers by their 4 arguments, so `_next` must stay.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let error: AppError;
  if (err instanceof AppError) {
    error = err;
  } else if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    error = new AppError(400, 'VALIDATION_ERROR', 'Invalid request data', details);
  } else if (err?.type === 'entity.parse.failed') {
    error = new AppError(400, 'VALIDATION_ERROR', 'Malformed JSON body');
  } else if (err?.type === 'entity.too.large') {
    error = new AppError(413, 'VALIDATION_ERROR', 'Request body too large');
  } else {
    if (!isProduction) console.error(err);
    else console.error('Unhandled error:', err?.message);
    error = new AppError(500, 'INTERNAL_ERROR', 'Something went wrong');
  }
  res.status(error.status).json({
    error: { code: error.code, message: error.message, details: error.details },
  });
};

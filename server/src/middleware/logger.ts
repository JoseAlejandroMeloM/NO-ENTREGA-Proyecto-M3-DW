import type { RequestHandler } from 'express';

/** One line per request: method, path (no query string, it may carry data), status, time. */
export const requestLogger: RequestHandler = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl.split('?')[0]} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
};

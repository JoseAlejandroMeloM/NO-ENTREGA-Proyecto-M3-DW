import type { Request } from 'express';
import { env } from '../config/env';

/**
 * The visitor's address, for rate limits.
 * Vercel: `req.ip` (one trusted proxy, which writes the visitor's address).
 * Render: requests pass through Cloudflare and several Render proxies, so the last X-Forwarded-For entries are
 * shared proxy addresses. Cloudflare puts the visitor's address in `CF-Connecting-IP` and overwrites any value the
 * visitor sends, so it is used there. Elsewhere the header is ignored: without Cloudflare in front, anyone could fake it.
 */
export function clientIp(req: Request, onRender = Boolean(env.RENDER)): string {
  const cf = req.headers['cf-connecting-ip'];
  if (onRender && typeof cf === 'string' && cf) return cf;
  return req.ip ?? '';
}

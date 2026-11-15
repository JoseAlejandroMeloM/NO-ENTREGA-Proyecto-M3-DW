import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { OrgType, Role } from '../models/roles';
import { AppError } from './errors';

export const TOKEN_TTL_SECONDS = 15 * 60;
const ALGORITHM = 'HS256';

export interface TokenClaims {
  sub: string;
  role: Role;
  orgType: OrgType;
  orgId: string;
}

function secret(): string {
  if (!env.JWT_SECRET) throw new AppError(500, 'INTERNAL_ERROR', 'Authentication is not configured');
  return env.JWT_SECRET;
}

export function signAccessToken(claims: TokenClaims): string {
  const { sub, ...rest } = claims;
  return jwt.sign(rest, secret(), {
    algorithm: ALGORITHM,
    expiresIn: TOKEN_TTL_SECONDS,
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
    subject: sub,
  });
}

/** Verifies signature, algorithm (pinned, so `none`/RS256 tokens fail), issuer, audience and expiry. */
export function verifyAccessToken(token: string): TokenClaims {
  try {
    const payload = jwt.verify(token, secret(), {
      algorithms: [ALGORITHM],
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });
    if (typeof payload === 'string' || !payload.sub) throw new Error('Malformed token');
    return { sub: payload.sub, role: payload.role, orgType: payload.orgType, orgId: payload.orgId };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token');
  }
}

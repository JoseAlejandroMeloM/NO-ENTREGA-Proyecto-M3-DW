import type { Request, RequestHandler } from 'express';
import { type OrgType, type Role } from '../models/roles';
import { User } from '../models/User';
import { AppError } from '../utils/errors';
import { verifyAccessToken } from '../utils/jwt';

export interface AuthUser {
  id: string;
  name: string;
  role: Role;
  orgType: OrgType;
  orgId: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

/**
 * Requires a valid bearer token. The user is reloaded on every request so a
 * deactivated account is locked out immediately, even with an unexpired token.
 */
export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.headers.authorization ?? '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');

    const claims = verifyAccessToken(token);
    const user = await User.findById(claims.sub);
    if (!user || !user.active) throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token');

    req.user = {
      id: user._id.toString(),
      name: user.name,
      role: user.role as Role,
      orgType: user.orgType as OrgType,
      orgId: user.orgId.toString(),
    };
    next();
  } catch (err) {
    next(err);
  }
};

/** Allows only the given roles (permission matrix in docs/spec/01-scope-and-roles.md). */
export const authorize =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action'));
    }
    next();
  };

/** Query filter that limits any collection to the caller's organization. */
export function orgFilter(req: Request): { storeId: string } | { distributorId: string } {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  return req.user.orgType === 'store' ? { storeId: req.user.orgId } : { distributorId: req.user.orgId };
}

export function currentUser(req: Request): AuthUser {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  return req.user;
}

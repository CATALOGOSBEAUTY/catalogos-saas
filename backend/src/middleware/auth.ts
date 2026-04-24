import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';
import { verifySession } from '../lib/auth.js';
import { ApiError } from '../lib/http.js';
import { masterForUser, tenantForUser, type ClientRole, type MasterRole } from '../store/data.js';

export interface RequestUser {
  id: string;
  email: string;
  type: 'client' | 'master';
}

export interface TenantContext {
  id: string;
  slug: string;
  name: string;
  role: ClientRole;
}

export interface MasterContext {
  userId: string;
  role: MasterRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
      tenant?: TenantContext;
      master?: MasterContext;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const cookieToken = req.cookies?.[env.sessionCookieName] as string | undefined;
  const bearer = req.header('authorization')?.replace(/^Bearer\s+/i, '');
  const token = cookieToken ?? bearer;
  if (!token) {
    next(new ApiError(401, 'AUTH_REQUIRED', 'Authentication required'));
    return;
  }

  const session = verifySession(token);
  req.user = {
    id: session.sub,
    email: session.email,
    type: session.type
  };
  next();
}

export function requireTenant(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(new ApiError(401, 'AUTH_REQUIRED', 'Authentication required'));
    return;
  }
  req.tenant = tenantForUser(req.user.id);
  next();
}

export function requireRole(roles: ClientRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.tenant || !roles.includes(req.tenant.role)) {
      next(new ApiError(403, 'FORBIDDEN', 'Insufficient tenant role'));
      return;
    }
    next();
  };
}

export function requireMaster(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(new ApiError(401, 'AUTH_REQUIRED', 'Authentication required'));
    return;
  }
  const master = masterForUser(req.user.id);
  req.master = {
    userId: req.user.id,
    role: master.role
  };
  next();
}

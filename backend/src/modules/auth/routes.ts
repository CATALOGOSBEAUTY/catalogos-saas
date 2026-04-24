import { Router } from 'express';
import { env } from '../../config/env.js';
import { createSession, hashPassword, verifyPassword } from '../../lib/auth.js';
import { ApiError, asyncHandler, created, noContent, ok, requireString } from '../../lib/http.js';
import { requireAuth } from '../../middleware/auth.js';
import { loginRateLimit } from '../../middleware/security.js';
import { createClientAccount, db, masterForUser, tenantForUser } from '../../store/data.js';

export const authRouter = Router();

function setSessionCookie(res: import('express').Response, token: string): void {
  res.cookie(env.sessionCookieName, token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

function publicUser(user: { id: string; name: string; email: string }) {
  return { id: user.id, name: user.name, email: user.email };
}

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const name = requireString(req.body?.name, 'name');
    const email = requireString(req.body?.email, 'email').toLowerCase();
    const password = requireString(req.body?.password, 'password');
    const companyName = requireString(req.body?.companyName, 'companyName');
    const companySlug = requireString(req.body?.companySlug, 'companySlug')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (!companySlug) throw new ApiError(422, 'VALIDATION_ERROR', 'companySlug is invalid');

    const passwordHash = await hashPassword(password);
    const result = createClientAccount({ name, email, passwordHash, companyName, companySlug });
    const token = createSession({ sub: result.user.id, email: result.user.email, type: 'client' });
    setSessionCookie(res, token);
    created(res, {
      user: publicUser(result.user),
      companies: [{ id: result.company.id, slug: result.company.slug, name: result.company.name, role: 'owner' }],
      master: null
    });
  })
);

authRouter.post(
  '/login',
  loginRateLimit,
  asyncHandler(async (req, res) => {
    const email = requireString(req.body?.email, 'email').toLowerCase();
    const password = requireString(req.body?.password, 'password');
    const user = db.users.find((item) => item.email.toLowerCase() === email);
    if (!user || user.status !== 'active') {
      throw new ApiError(401, 'AUTH_REQUIRED', 'Invalid credentials');
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) throw new ApiError(401, 'AUTH_REQUIRED', 'Invalid credentials');

    const master = db.masterUsers.find((item) => item.userId === user.id && item.isActive);
    const type = master ? 'master' : 'client';
    const token = createSession({ sub: user.id, email: user.email, type });
    setSessionCookie(res, token);

    const companies = db.companyUsers
      .filter((item) => item.userId === user.id && item.isActive)
      .map((companyUser) => {
        const company = db.companies.find((item) => item.id === companyUser.companyId);
        return company ? { id: company.id, slug: company.slug, name: company.name, role: companyUser.role } : null;
      })
      .filter(Boolean);

    ok(res, {
      user: publicUser(user),
      companies,
      master: master ? { role: master.role } : null
    });
  })
);

authRouter.post('/logout', (_req, res) => {
  res.clearCookie(env.sessionCookieName, { path: '/' });
  noContent(res);
});

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = db.users.find((item) => item.id === req.user?.id);
    if (!user) throw new ApiError(401, 'AUTH_REQUIRED', 'User not found');

    let tenant = null;
    let master = null;
    try {
      tenant = tenantForUser(user.id);
    } catch {
      tenant = null;
    }
    try {
      master = masterForUser(user.id);
    } catch {
      master = null;
    }

    ok(res, {
      user: publicUser(user),
      tenant,
      master
    });
  })
);

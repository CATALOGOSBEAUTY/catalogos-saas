import { Router } from 'express';
import { env } from '../../config/env.js';
import { createSession, hashPassword, verifyPassword } from '../../lib/auth.js';
import { ApiError, asyncHandler, created, noContent, ok, requireString } from '../../lib/http.js';
import { requireAuth } from '../../middleware/auth.js';
import { loginRateLimit } from '../../middleware/security.js';
import { getRepository } from '../../repositories/index.js';

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

async function authenticateCredentials(emailValue: unknown, passwordValue: unknown) {
  const email = requireString(emailValue, 'email').toLowerCase();
  const password = requireString(passwordValue, 'password');
  const repository = getRepository();
  const user = await repository.findUserByEmail(email);
  if (!user || user.status !== 'active') {
    throw new ApiError(401, 'AUTH_REQUIRED', 'Invalid credentials');
  }
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) throw new ApiError(401, 'AUTH_REQUIRED', 'Invalid credentials');
  return { user, repository };
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
    const result = await getRepository().createClientAccount({ name, email, passwordHash, companyName, companySlug });
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
    const { user, repository } = await authenticateCredentials(req.body?.email, req.body?.password);

    const master = await repository.getMasterForUser(user.id);
    const type = master ? 'master' : 'client';
    const token = createSession({ sub: user.id, email: user.email, type });
    setSessionCookie(res, token);

    const companies = await repository.getLoginCompanies(user.id);

    ok(res, {
      user: publicUser(user),
      companies,
      master: master ? { role: master.role } : null
    });
  })
);

authRouter.post(
  '/client-login',
  loginRateLimit,
  asyncHandler(async (req, res) => {
    const { user, repository } = await authenticateCredentials(req.body?.email, req.body?.password);
    const tenant = await repository.getTenantForUser(user.id).catch(() => null);
    if (!tenant) throw new ApiError(403, 'FORBIDDEN', 'Client access required');

    const token = createSession({ sub: user.id, email: user.email, type: 'client' });
    setSessionCookie(res, token);

    ok(res, {
      user: publicUser(user),
      tenant,
      companies: await repository.getLoginCompanies(user.id),
      master: null
    });
  })
);

authRouter.post(
  '/master-login',
  loginRateLimit,
  asyncHandler(async (req, res) => {
    const { user, repository } = await authenticateCredentials(req.body?.email, req.body?.password);
    const master = await repository.getMasterForUser(user.id);
    if (!master) throw new ApiError(403, 'FORBIDDEN', 'Master access required');

    const token = createSession({ sub: user.id, email: user.email, type: 'master' });
    setSessionCookie(res, token);

    ok(res, {
      user: publicUser(user),
      tenant: null,
      companies: [],
      master: { role: master.role }
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
    const repository = getRepository();
    const user = req.user ? await repository.findUserById(req.user.id) : null;
    if (!user) throw new ApiError(401, 'AUTH_REQUIRED', 'User not found');

    let tenant = null;
    let master = null;
    try {
      tenant = await repository.getTenantForUser(user.id);
    } catch {
      tenant = null;
    }
    try {
      master = await repository.getMasterForUser(user.id);
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

import cors from 'cors';
import type { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env } from '../config/env.js';
import { ApiError } from '../lib/http.js';

export const securityHeaders = helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
});

export const corsMiddleware = cors({
  origin(origin, callback) {
    if (!origin || env.corsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new ApiError(403, 'FORBIDDEN', 'Origin not allowed'));
  },
  credentials: true
});

export const globalRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false
});

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60_000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many login attempts'
    }
  }
});

const blockedKeys = new Set(['__proto__', 'constructor', 'prototype']);

function scanJson(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(scanJson);
  return Object.entries(value).some(([key, nested]) => blockedKeys.has(key) || scanJson(nested));
}

export function jsonGuard(req: Request, _res: Response, next: NextFunction): void {
  if (scanJson(req.body)) {
    next(new ApiError(400, 'VALIDATION_ERROR', 'Unsafe JSON key detected'));
    return;
  }
  next();
}

export function csrfGuard(req: Request, _res: Response, next: NextFunction): void {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    next();
    return;
  }

  if (req.path.startsWith('/api/client') && req.header('X-Client-Request') !== 'true') {
    next(new ApiError(403, 'FORBIDDEN', 'Missing client CSRF header'));
    return;
  }

  if (req.path.startsWith('/api/master') && req.header('X-Master-Request') !== 'true') {
    next(new ApiError(403, 'FORBIDDEN', 'Missing master CSRF header'));
    return;
  }

  next();
}

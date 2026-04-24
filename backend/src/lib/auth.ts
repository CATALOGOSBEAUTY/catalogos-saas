import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from './http.js';

export interface SessionPayload {
  sub: string;
  email: string;
  type: 'client' | 'master';
}

export async function hashPassword(password: string): Promise<string> {
  if (password.length < 8) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'Password must have at least 8 chars');
  }
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createSession(payload: SessionPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: '7d',
    issuer: 'catalogos-saas'
  });
}

export function verifySession(token: string): SessionPayload {
  try {
    const decoded = jwt.verify(token, env.jwtSecret, {
      issuer: 'catalogos-saas'
    });
    if (typeof decoded !== 'object' || !decoded.sub || !decoded.email) {
      throw new ApiError(401, 'AUTH_REQUIRED', 'Invalid session');
    }
    return decoded as SessionPayload;
  } catch {
    throw new ApiError(401, 'AUTH_REQUIRED', 'Invalid session');
  }
}

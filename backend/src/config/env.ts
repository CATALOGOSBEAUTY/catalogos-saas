import dotenv from 'dotenv';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, '../../../..');
const backendRoot = path.resolve(currentDir, '../../..');

for (const envFile of [
  path.join(repoRoot, '.env.local'),
  path.join(backendRoot, '.env.local'),
  path.join(repoRoot, '.env')
]) {
  if (existsSync(envFile)) {
    dotenv.config({ path: envFile, override: false });
  }
}

const fallbackJwtSecret = 'development-only-jwt-secret-change-before-production';
const fallbackCookieSecret = 'development-only-cookie-secret-change-before-production';

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required env var ${name}`);
  }
  return value;
}

function splitCsv(value: string | undefined, fallback: string[]): string[] {
  if (!value) return fallback;
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3001),
  corsOrigins: splitCsv(process.env.CORS_ORIGINS, ['http://localhost:5173']),
  jwtSecret: required('JWT_SECRET', fallbackJwtSecret),
  cookieSecret: required('COOKIE_SECRET', fallbackCookieSecret),
  dataProvider: process.env.DATA_PROVIDER === 'supabase' ? 'supabase' : 'memory',
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  sessionCookieName: 'catalogos_session',
  isProduction: process.env.NODE_ENV === 'production'
};

if (env.isProduction) {
  for (const [name, value] of [
    ['JWT_SECRET', env.jwtSecret],
    ['COOKIE_SECRET', env.cookieSecret],
    ['CORS_ORIGINS', process.env.CORS_ORIGINS],
    ['SUPABASE_URL', env.supabaseUrl],
    ['SUPABASE_SERVICE_ROLE_KEY', env.supabaseServiceRoleKey]
  ]) {
    if (!value || value.includes('development-only')) {
      throw new Error(`Production requires a strong ${name}`);
    }
  }
}

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
  sessionCookieName: 'catalogos_session',
  isProduction: process.env.NODE_ENV === 'production'
};

if (env.isProduction) {
  for (const [name, value] of [
    ['JWT_SECRET', env.jwtSecret],
    ['COOKIE_SECRET', env.cookieSecret],
    ['CORS_ORIGINS', process.env.CORS_ORIGINS]
  ]) {
    if (!value || value.includes('development-only')) {
      throw new Error(`Production requires a strong ${name}`);
    }
  }
}

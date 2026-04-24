import cookieParser from 'cookie-parser';
import express from 'express';
import { authRouter } from './modules/auth/routes.js';
import { clientRouter } from './modules/client/routes.js';
import { masterRouter } from './modules/master/routes.js';
import { publicCatalogRouter } from './modules/publicCatalog/routes.js';
import { errorHandler, ok } from './lib/http.js';
import { corsMiddleware, csrfGuard, globalRateLimit, jsonGuard, securityHeaders } from './middleware/security.js';

export const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(securityHeaders);
app.use(corsMiddleware);
app.use(globalRateLimit);
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(jsonGuard);
app.use(csrfGuard);

app.get('/health', (_req, res) => {
  ok(res, {
    status: 'ok',
    service: 'catalogos-saas-api'
  });
});

app.use('/api/auth', authRouter);
app.use('/api/public', publicCatalogRouter);
app.use('/api/client', clientRouter);
app.use('/api/master', masterRouter);

app.use(errorHandler);

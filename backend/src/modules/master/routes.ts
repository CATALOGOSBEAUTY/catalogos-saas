import { Router } from 'express';
import { asyncHandler, ok } from '../../lib/http.js';
import { requireAuth, requireMaster } from '../../middleware/auth.js';
import { getRepository } from '../../repositories/index.js';

export const masterRouter = Router();

masterRouter.use(requireAuth, requireMaster);

masterRouter.get(
  '/dashboard',
  asyncHandler(async (_req, res) => {
    ok(res, { metrics: await getRepository().getMasterDashboard() });
  })
);

masterRouter.get(
  '/companies',
  asyncHandler(async (_req, res) => {
    ok(
      res,
      await getRepository().listMasterCompanies()
    );
  })
);

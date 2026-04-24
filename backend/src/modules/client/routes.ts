import { Router } from 'express';
import { asyncHandler, ok } from '../../lib/http.js';
import { requireAuth, requireRole, requireTenant } from '../../middleware/auth.js';
import { getRepository } from '../../repositories/index.js';

export const clientRouter = Router();

clientRouter.use(requireAuth, requireTenant);

clientRouter.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const companyId = req.tenant!.id;
    const metrics = await getRepository().getClientDashboard(companyId);
    ok(res, {
      tenant: req.tenant,
      metrics
    });
  })
);

clientRouter.get(
  '/products',
  asyncHandler(async (req, res) => {
    ok(
      res,
      await getRepository().listClientProducts(req.tenant!.id)
    );
  })
);

clientRouter.patch(
  '/products/bulk/stock',
  requireRole(['owner', 'manager', 'editor']),
  asyncHandler(async (req, res) => {
    const ids = Array.isArray(req.body?.productIds) ? req.body.productIds : [];
    const stockQuantity = Number(req.body?.stockQuantity);
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
      res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'stockQuantity must be >= 0' } });
      return;
    }
    const updated = await getRepository().bulkUpdateProductStock(req.tenant!.id, ids, stockQuantity);
    ok(res, { updatedCount: updated.length, products: updated });
  })
);

clientRouter.get(
  '/categories',
  asyncHandler(async (req, res) => {
    ok(
      res,
      await getRepository().listClientCategories(req.tenant!.id)
    );
  })
);

clientRouter.get(
  '/orders',
  asyncHandler(async (req, res) => {
    ok(
      res,
      await getRepository().listClientOrders(req.tenant!.id)
    );
  })
);

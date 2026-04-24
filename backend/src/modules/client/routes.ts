import { Router } from 'express';
import { asyncHandler, ok } from '../../lib/http.js';
import { requireAuth, requireRole, requireTenant } from '../../middleware/auth.js';
import { db } from '../../store/data.js';

export const clientRouter = Router();

clientRouter.use(requireAuth, requireTenant);

clientRouter.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const companyId = req.tenant!.id;
    const products = db.products.filter((item) => item.companyId === companyId);
    const orders = db.orders.filter((item) => item.companyId === companyId);
    ok(res, {
      tenant: req.tenant,
      metrics: {
        productsTotal: products.length,
        productsLive: products.filter((item) => item.isActive && item.catalogStatus === 'live').length,
        ordersTotal: orders.length,
        revenueTotal: Number(orders.reduce((sum, item) => sum + item.totalAmount, 0).toFixed(2))
      }
    });
  })
);

clientRouter.get(
  '/products',
  asyncHandler(async (req, res) => {
    ok(
      res,
      db.products.filter((item) => item.companyId === req.tenant!.id)
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
    const updated = db.products
      .filter((item) => item.companyId === req.tenant!.id && ids.includes(item.id))
      .map((item) => {
        item.stockQuantity = stockQuantity;
        return item;
      });
    ok(res, { updatedCount: updated.length, products: updated });
  })
);

clientRouter.get(
  '/categories',
  asyncHandler(async (req, res) => {
    ok(
      res,
      db.categories.filter((item) => item.companyId === req.tenant!.id)
    );
  })
);

clientRouter.get(
  '/orders',
  asyncHandler(async (req, res) => {
    ok(
      res,
      db.orders.filter((item) => item.companyId === req.tenant!.id)
    );
  })
);

import { Router } from 'express';
import { asyncHandler, ok } from '../../lib/http.js';
import { requireAuth, requireMaster } from '../../middleware/auth.js';
import { db } from '../../store/data.js';

export const masterRouter = Router();

masterRouter.use(requireAuth, requireMaster);

masterRouter.get(
  '/dashboard',
  asyncHandler(async (_req, res) => {
    ok(res, {
      metrics: {
        companiesTotal: db.companies.length,
        activeCompanies: db.companies.filter((item) => item.status === 'active').length,
        ordersTotal: db.orders.length,
        revenueTotal: Number(db.orders.reduce((sum, item) => sum + item.totalAmount, 0).toFixed(2))
      }
    });
  })
);

masterRouter.get(
  '/companies',
  asyncHandler(async (_req, res) => {
    ok(
      res,
      db.companies.map((company) => ({
        ...company,
        productsTotal: db.products.filter((product) => product.companyId === company.id).length,
        ordersTotal: db.orders.filter((order) => order.companyId === company.id).length
      }))
    );
  })
);

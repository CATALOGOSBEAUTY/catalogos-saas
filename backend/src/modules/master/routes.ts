import { Router } from 'express';
import { ApiError, asyncHandler, created, ok, requireString } from '../../lib/http.js';
import { requireAuth, requireMaster } from '../../middleware/auth.js';
import { getRepository } from '../../repositories/index.js';
import type { CompanyStatus, InvoiceStatus, ModuleWriteInput, PlanWriteInput } from '../../store/data.js';

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

function parseNumber(value: unknown, field: string): number {
  const numberValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 0) throw new ApiError(422, 'VALIDATION_ERROR', `${field} must be >= 0`);
  return Number(numberValue.toFixed(2));
}

function parseInteger(value: unknown, field: string): number {
  const numberValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(numberValue) || numberValue < 0) throw new ApiError(422, 'VALIDATION_ERROR', `${field} must be >= 0`);
  return numberValue;
}

function parseCompanyStatus(value: unknown): CompanyStatus {
  if (value === 'trial' || value === 'active' || value === 'suspended' || value === 'cancelled') return value;
  throw new ApiError(422, 'VALIDATION_ERROR', 'status is invalid');
}

function parseInvoiceStatus(value: unknown): InvoiceStatus {
  if (value === 'open' || value === 'paid' || value === 'overdue' || value === 'cancelled' || value === 'refunded') return value;
  throw new ApiError(422, 'VALIDATION_ERROR', 'status is invalid');
}

function planInput(body: Record<string, unknown>, partial = false): Partial<PlanWriteInput> | PlanWriteInput {
  const input: Partial<PlanWriteInput> = {};
  if (!partial || body.name !== undefined) input.name = requireString(body.name, 'name');
  if (!partial || body.code !== undefined) input.code = requireString(body.code, 'code').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  if (body.description !== undefined) input.description = String(body.description);
  if (!partial || body.priceMonthly !== undefined) input.priceMonthly = parseNumber(body.priceMonthly, 'priceMonthly');
  if (!partial || body.productLimit !== undefined) input.productLimit = parseInteger(body.productLimit, 'productLimit');
  if (!partial || body.userLimit !== undefined) input.userLimit = parseInteger(body.userLimit, 'userLimit');
  if (!partial || body.storageLimitMb !== undefined) input.storageLimitMb = parseInteger(body.storageLimitMb, 'storageLimitMb');
  if (body.isActive !== undefined) input.isActive = body.isActive === true;
  if (body.sortOrder !== undefined) input.sortOrder = parseInteger(body.sortOrder, 'sortOrder');
  return input as PlanWriteInput;
}

function moduleInput(body: Record<string, unknown>, partial = false): Partial<ModuleWriteInput> | ModuleWriteInput {
  const input: Partial<ModuleWriteInput> = {};
  if (!partial || body.name !== undefined) input.name = requireString(body.name, 'name');
  if (!partial || body.code !== undefined) input.code = requireString(body.code, 'code').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  if (body.description !== undefined) input.description = String(body.description);
  if (!partial || body.priceMonthly !== undefined) input.priceMonthly = parseNumber(body.priceMonthly, 'priceMonthly');
  if (body.isActive !== undefined) input.isActive = body.isActive === true;
  return input as ModuleWriteInput;
}

masterRouter.get(
  '/companies/:id',
  asyncHandler(async (req, res) => {
    ok(res, await getRepository().getMasterCompany(req.params.id));
  })
);

masterRouter.put(
  '/companies/:id',
  asyncHandler(async (req, res) => {
    ok(
      res,
      await getRepository().updateMasterCompany(
        req.params.id,
        {
          name: typeof req.body?.name === 'string' ? req.body.name : undefined,
          slug: typeof req.body?.slug === 'string' ? req.body.slug : undefined,
          status: req.body?.status === undefined ? undefined : parseCompanyStatus(req.body.status),
          planCode: typeof req.body?.planCode === 'string' ? req.body.planCode : undefined
        },
        req.master!.userId
      )
    );
  })
);

masterRouter.patch(
  '/companies/:id/status',
  asyncHandler(async (req, res) => {
    ok(res, await getRepository().updateMasterCompany(req.params.id, { status: parseCompanyStatus(req.body?.status) }, req.master!.userId));
  })
);

masterRouter.patch(
  '/companies/:id/plan',
  asyncHandler(async (req, res) => {
    ok(res, await getRepository().updateMasterCompany(req.params.id, { planCode: requireString(req.body?.planCode, 'planCode') }, req.master!.userId));
  })
);

masterRouter.get('/plans', asyncHandler(async (_req, res) => ok(res, await getRepository().listPlans())));

masterRouter.post(
  '/plans',
  asyncHandler(async (req, res) => {
    created(res, await getRepository().createPlan(planInput(req.body ?? {}) as PlanWriteInput, req.master!.userId));
  })
);

masterRouter.put(
  '/plans/:id',
  asyncHandler(async (req, res) => {
    ok(res, await getRepository().updatePlan(req.params.id, planInput(req.body ?? {}, true), req.master!.userId));
  })
);

masterRouter.patch(
  '/plans/:id/status',
  asyncHandler(async (req, res) => {
    ok(res, await getRepository().updatePlan(req.params.id, { isActive: req.body?.isActive === true }, req.master!.userId));
  })
);

masterRouter.get('/modules', asyncHandler(async (_req, res) => ok(res, await getRepository().listPlatformModules())));

masterRouter.post(
  '/modules',
  asyncHandler(async (req, res) => {
    created(res, await getRepository().createPlatformModule(moduleInput(req.body ?? {}) as ModuleWriteInput, req.master!.userId));
  })
);

masterRouter.put(
  '/modules/:id',
  asyncHandler(async (req, res) => {
    ok(res, await getRepository().updatePlatformModule(req.params.id, moduleInput(req.body ?? {}, true), req.master!.userId));
  })
);

masterRouter.get('/billing/subscriptions', asyncHandler(async (_req, res) => ok(res, await getRepository().listMasterSubscriptions())));
masterRouter.get('/billing/invoices', asyncHandler(async (_req, res) => ok(res, await getRepository().listMasterInvoices())));

masterRouter.post(
  '/billing/invoices',
  asyncHandler(async (req, res) => {
    created(
      res,
      await getRepository().createMasterInvoice(
        {
          companyId: requireString(req.body?.companyId, 'companyId'),
          amount: parseNumber(req.body?.amount, 'amount'),
          dueDate: typeof req.body?.dueDate === 'string' ? req.body.dueDate : undefined,
          paymentUrl: typeof req.body?.paymentUrl === 'string' ? req.body.paymentUrl : undefined
        },
        req.master!.userId
      )
    );
  })
);

masterRouter.patch(
  '/billing/invoices/:id/status',
  asyncHandler(async (req, res) => {
    ok(res, await getRepository().updateMasterInvoiceStatus(req.params.id, parseInvoiceStatus(req.body?.status), req.master!.userId));
  })
);

masterRouter.get('/orders', asyncHandler(async (_req, res) => ok(res, await getRepository().listMasterOrders())));
masterRouter.get('/audit-logs', asyncHandler(async (_req, res) => ok(res, await getRepository().listAuditLogs())));

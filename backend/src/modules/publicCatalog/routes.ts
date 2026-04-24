import { Router } from 'express';
import { asyncHandler, created, ok, requirePositiveInteger, requireString } from '../../lib/http.js';
import { getRepository } from '../../repositories/index.js';

export const publicCatalogRouter = Router();

publicCatalogRouter.get(
  '/:companySlug/bootstrap',
  asyncHandler(async (req, res) => {
    ok(res, await getRepository().getPublicBootstrap(req.params.companySlug));
  })
);

publicCatalogRouter.get(
  '/:companySlug/products',
  asyncHandler(async (req, res) => {
    ok(res, (await getRepository().getPublicBootstrap(req.params.companySlug)).products);
  })
);

publicCatalogRouter.get(
  '/:companySlug/products/:productSlug',
  asyncHandler(async (req, res) => {
    ok(res, await getRepository().getProductBySlug(req.params.companySlug, req.params.productSlug));
  })
);

publicCatalogRouter.get(
  '/:companySlug/categories',
  asyncHandler(async (req, res) => {
    ok(res, (await getRepository().getPublicBootstrap(req.params.companySlug)).categories);
  })
);

publicCatalogRouter.post(
  '/:companySlug/orders',
  asyncHandler(async (req, res) => {
    const customer = req.body?.customer ?? {};
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    const order = await getRepository().createPublicOrder({
      companySlug: req.params.companySlug,
      customer: {
        fullName: requireString(customer.fullName, 'customer.fullName'),
        phone: typeof customer.phone === 'string' ? customer.phone : undefined,
        fulfillmentType: customer.fulfillmentType === 'pickup' ? 'pickup' : 'delivery',
        paymentMethod: ['cash', 'pix', 'card', 'online'].includes(customer.paymentMethod)
          ? customer.paymentMethod
          : 'pix'
      },
      items: items.map((item: Record<string, unknown>) => ({
        productId: requireString(item.productId, 'items.productId'),
        variantId: typeof item.variantId === 'string' ? item.variantId : null,
        quantity: requirePositiveInteger(item.quantity, 'items.quantity')
      }))
    });
    created(res, order);
  })
);

import { type NextFunction, type Request, type Response, Router } from 'express';
import multer, { MulterError } from 'multer';
import { ApiError, asyncHandler, created, noContent, ok, requireString } from '../../lib/http.js';
import { requireAuth, requireRole, requireTenant } from '../../middleware/auth.js';
import { getRepository } from '../../repositories/index.js';
import { uploadProductImage } from '../../services/productMedia.js';
import type { Product } from '../../store/data.js';

export const clientRouter = Router();
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1
  }
});

clientRouter.use(requireAuth, requireTenant);

function handleProductImageUpload(req: Request, res: Response, next: NextFunction): void {
  imageUpload.single('image')(req, res, (error: unknown) => {
    if (error instanceof MulterError) {
      next(new ApiError(error.code === 'LIMIT_FILE_SIZE' ? 413 : 422, 'UPLOAD_ERROR', error.message));
      return;
    }
    if (error) {
      next(error);
      return;
    }
    next();
  });
}

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

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function parsePrice(value: unknown, field: string): number {
  const numberValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 0) {
    throw new ApiError(422, 'VALIDATION_ERROR', `${field} must be >= 0`);
  }
  return Number(numberValue.toFixed(2));
}

function parseStock(value: unknown): number {
  const numberValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(numberValue) || numberValue < 0) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'stockQuantity must be >= 0');
  }
  return numberValue;
}

function parseCatalogStatus(value: unknown): Product['catalogStatus'] | undefined {
  if (value === undefined) return undefined;
  if (value === 'draft' || value === 'ready' || value === 'live') return value;
  throw new ApiError(422, 'VALIDATION_ERROR', 'catalogStatus is invalid');
}

clientRouter.post(
  '/products',
  requireRole(['owner', 'manager', 'editor']),
  asyncHandler(async (req, res) => {
    const title = requireString(req.body?.title, 'title');
    const slug = slugify(typeof req.body?.slug === 'string' ? req.body.slug : title);
    if (!slug) throw new ApiError(422, 'VALIDATION_ERROR', 'slug is invalid');
    const product = await getRepository().createClientProduct(req.tenant!.id, {
      categoryId: requireString(req.body?.categoryId, 'categoryId'),
      slug,
      title,
      description: typeof req.body?.description === 'string' ? req.body.description : '',
      price: parsePrice(req.body?.price, 'price'),
      compareAtPrice: req.body?.compareAtPrice == null ? undefined : parsePrice(req.body.compareAtPrice, 'compareAtPrice'),
      stockQuantity: parseStock(req.body?.stockQuantity ?? 0),
      variantsEnabled: req.body?.variantsEnabled === true,
      features: Array.isArray(req.body?.features) ? req.body.features.map(String) : [],
      catalogStatus: parseCatalogStatus(req.body?.catalogStatus) ?? 'draft',
      isActive: req.body?.isActive !== false,
      isFeatured: req.body?.isFeatured === true,
      imageUrl: typeof req.body?.imageUrl === 'string' ? req.body.imageUrl : undefined
    });
    created(res, product);
  })
);

clientRouter.put(
  '/products/:id',
  requireRole(['owner', 'manager', 'editor']),
  asyncHandler(async (req, res) => {
    const patch = {
      categoryId: typeof req.body?.categoryId === 'string' ? req.body.categoryId : undefined,
      slug: typeof req.body?.slug === 'string' ? slugify(req.body.slug) : undefined,
      title: typeof req.body?.title === 'string' ? req.body.title : undefined,
      description: typeof req.body?.description === 'string' ? req.body.description : undefined,
      price: req.body?.price === undefined ? undefined : parsePrice(req.body.price, 'price'),
      compareAtPrice: req.body?.compareAtPrice == null ? undefined : parsePrice(req.body.compareAtPrice, 'compareAtPrice'),
      stockQuantity: req.body?.stockQuantity === undefined ? undefined : parseStock(req.body.stockQuantity),
      variantsEnabled: typeof req.body?.variantsEnabled === 'boolean' ? req.body.variantsEnabled : undefined,
      features: Array.isArray(req.body?.features) ? req.body.features.map(String) : undefined,
      catalogStatus: parseCatalogStatus(req.body?.catalogStatus),
      isActive: typeof req.body?.isActive === 'boolean' ? req.body.isActive : undefined,
      isFeatured: typeof req.body?.isFeatured === 'boolean' ? req.body.isFeatured : undefined,
      imageUrl: typeof req.body?.imageUrl === 'string' ? req.body.imageUrl : undefined
    };
    ok(res, await getRepository().updateClientProduct(req.tenant!.id, req.params.id, patch));
  })
);

clientRouter.post(
  '/products/:id/image',
  requireRole(['owner', 'manager', 'editor']),
  handleProductImageUpload,
  asyncHandler(async (req, res) => {
    const imageUrl = await uploadProductImage(req.tenant!.id, req.params.id, req.file);
    ok(res, await getRepository().setClientProductImage(req.tenant!.id, req.params.id, imageUrl));
  })
);

clientRouter.patch(
  '/products/:id/status',
  requireRole(['owner', 'manager', 'editor']),
  asyncHandler(async (req, res) => {
    ok(
      res,
      await getRepository().updateClientProductStatus(req.tenant!.id, req.params.id, {
        isActive: typeof req.body?.isActive === 'boolean' ? req.body.isActive : undefined,
        catalogStatus: parseCatalogStatus(req.body?.catalogStatus)
      })
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

clientRouter.delete(
  '/products/:id',
  requireRole(['owner', 'manager', 'editor']),
  asyncHandler(async (req, res) => {
    await getRepository().deleteClientProduct(req.tenant!.id, req.params.id);
    noContent(res);
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

clientRouter.post(
  '/categories',
  requireRole(['owner', 'manager', 'editor']),
  asyncHandler(async (req, res) => {
    const name = requireString(req.body?.name, 'name');
    const slug = slugify(typeof req.body?.slug === 'string' ? req.body.slug : name);
    if (!slug) throw new ApiError(422, 'VALIDATION_ERROR', 'slug is invalid');
    created(
      res,
      await getRepository().createClientCategory(req.tenant!.id, {
        name,
        slug,
        sortOrder: req.body?.sortOrder === undefined ? undefined : Number(req.body.sortOrder),
        isActive: req.body?.isActive !== false
      })
    );
  })
);

clientRouter.put(
  '/categories/:id',
  requireRole(['owner', 'manager', 'editor']),
  asyncHandler(async (req, res) => {
    ok(
      res,
      await getRepository().updateClientCategory(req.tenant!.id, req.params.id, {
        name: typeof req.body?.name === 'string' ? req.body.name : undefined,
        slug: typeof req.body?.slug === 'string' ? slugify(req.body.slug) : undefined,
        sortOrder: req.body?.sortOrder === undefined ? undefined : Number(req.body.sortOrder),
        isActive: typeof req.body?.isActive === 'boolean' ? req.body.isActive : undefined
      })
    );
  })
);

clientRouter.delete(
  '/categories/:id',
  requireRole(['owner', 'manager', 'editor']),
  asyncHandler(async (req, res) => {
    await getRepository().deleteClientCategory(req.tenant!.id, req.params.id);
    noContent(res);
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

import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { ApiError } from '../lib/http.js';

export type CompanyStatus = 'trial' | 'active' | 'suspended' | 'cancelled';
export type ClientRole = 'owner' | 'manager' | 'editor' | 'attendant';
export type MasterRole = 'super_admin' | 'finance' | 'support' | 'commercial';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  status: 'active' | 'blocked' | 'invited';
}

export interface Company {
  id: string;
  ownerUserId: string;
  name: string;
  slug: string;
  status: CompanyStatus;
  planCode: string;
}

export interface CompanyUser {
  companyId: string;
  userId: string;
  role: ClientRole;
  isActive: boolean;
}

export interface MasterUser {
  userId: string;
  role: MasterRole;
  isActive: boolean;
}

export interface PublicSettings {
  companyId: string;
  publicName: string;
  description: string;
  heroTitle: string;
  heroSubtitle: string;
  heroBadge: string;
  heroButtonLabel: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  instagramUrl?: string;
  whatsappPhone?: string;
}

export interface Category {
  id: string;
  companyId: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ProductVariant {
  id: string;
  companyId: string;
  productId: string;
  label: string;
  price?: number;
  stockQuantity: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  companyId: string;
  categoryId: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  stockQuantity: number;
  variantsEnabled: boolean;
  features: string[];
  catalogStatus: 'draft' | 'ready' | 'live';
  isActive: boolean;
  isFeatured: boolean;
  imageUrl: string;
}

export interface OrderItem {
  productId: string;
  variantId?: string;
  productName: string;
  variantLabel?: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  companyId: string;
  orderCode: string;
  customerName: string;
  customerPhone?: string;
  fulfillmentType: 'delivery' | 'pickup';
  paymentMethod: 'cash' | 'pix' | 'card' | 'online';
  totalAmount: number;
  status: 'new' | 'confirmed' | 'paid' | 'sent' | 'cancelled';
  whatsappUrl?: string;
  items: OrderItem[];
  createdAt: string;
}

export interface AppStore {
  users: User[];
  companies: Company[];
  companyUsers: CompanyUser[];
  masterUsers: MasterUser[];
  publicSettings: PublicSettings[];
  categories: Category[];
  products: Product[];
  variants: ProductVariant[];
  orders: Order[];
}

export interface PublicBootstrap {
  company: {
    id: string;
    slug: string;
    name: string;
    status: CompanyStatus;
  };
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };
  hero: {
    title: string;
    subtitle: string;
    badge: string;
    buttonLabel: string;
  };
  settings: PublicSettings;
  categories: Category[];
  products: Array<Product & { variants: ProductVariant[] }>;
}

export interface TenantContextData {
  id: string;
  slug: string;
  name: string;
  role: ClientRole;
}

export interface CatalogRepository {
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(userId: string): Promise<User | null>;
  createClientAccount(input: {
    name: string;
    email: string;
    passwordHash: string;
    companyName: string;
    companySlug: string;
  }): Promise<{ user: User; company: Company }>;
  getLoginCompanies(userId: string): Promise<Array<{ id: string; slug: string; name: string; role: ClientRole }>>;
  getMasterForUser(userId: string): Promise<MasterUser | null>;
  getTenantForUser(userId: string): Promise<TenantContextData>;
  getPublicBootstrap(companySlug: string): Promise<PublicBootstrap>;
  getProductBySlug(companySlug: string, productSlug: string): Promise<Product & { variants: ProductVariant[] }>;
  createPublicOrder(input: {
    companySlug: string;
    customer: {
      fullName: string;
      phone?: string;
      fulfillmentType: 'delivery' | 'pickup';
      paymentMethod: 'cash' | 'pix' | 'card' | 'online';
    };
    items: Array<{ productId: string; variantId?: string | null; quantity: number }>;
  }): Promise<Order>;
  getClientDashboard(companyId: string): Promise<{
    productsTotal: number;
    productsLive: number;
    ordersTotal: number;
    revenueTotal: number;
  }>;
  listClientProducts(companyId: string): Promise<Product[]>;
  createClientProduct(companyId: string, input: ProductWriteInput): Promise<Product>;
  updateClientProduct(companyId: string, productId: string, input: Partial<ProductWriteInput>): Promise<Product>;
  updateClientProductStatus(companyId: string, productId: string, input: { isActive?: boolean; catalogStatus?: Product['catalogStatus'] }): Promise<Product>;
  deleteClientProduct(companyId: string, productId: string): Promise<void>;
  bulkUpdateProductStock(companyId: string, productIds: string[], stockQuantity: number): Promise<Product[]>;
  listClientCategories(companyId: string): Promise<Category[]>;
  createClientCategory(companyId: string, input: CategoryWriteInput): Promise<Category>;
  updateClientCategory(companyId: string, categoryId: string, input: Partial<CategoryWriteInput>): Promise<Category>;
  deleteClientCategory(companyId: string, categoryId: string): Promise<void>;
  listClientOrders(companyId: string): Promise<Order[]>;
  getMasterDashboard(): Promise<{
    companiesTotal: number;
    activeCompanies: number;
    ordersTotal: number;
    revenueTotal: number;
  }>;
  listMasterCompanies(): Promise<Array<Company & { productsTotal: number; ordersTotal: number }>>;
}

export interface ProductWriteInput {
  categoryId: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  stockQuantity: number;
  variantsEnabled?: boolean;
  features?: string[];
  catalogStatus?: Product['catalogStatus'];
  isActive?: boolean;
  isFeatured?: boolean;
  imageUrl?: string;
}

export interface CategoryWriteInput {
  name: string;
  slug: string;
  sortOrder?: number;
  isActive?: boolean;
}

const ownerPasswordHash = bcrypt.hashSync('PulseFit@123', 12);
const masterPasswordHash = bcrypt.hashSync('Master@123', 12);

export function createInitialStore(): AppStore {
  const pulsefitCompanyId = 'company-pulsefit';
  const otherCompanyId = 'company-studio-renovo';
  const ownerId = 'user-pulsefit-owner';
  const masterId = 'user-master';

  return {
    users: [
      {
        id: ownerId,
        name: 'PulseFit Owner',
        email: 'owner@pulsefit.local',
        passwordHash: ownerPasswordHash,
        status: 'active' as const
      },
      {
        id: masterId,
        name: 'Master Admin',
        email: 'master@catalogos.local',
        passwordHash: masterPasswordHash,
        status: 'active' as const
      }
    ],
    companies: [
      {
        id: pulsefitCompanyId,
        ownerUserId: ownerId,
        name: 'PulseFit',
        slug: 'pulsefit',
        status: 'active' as const,
        planCode: 'silver'
      },
      {
        id: otherCompanyId,
        ownerUserId: 'user-renovo-owner',
        name: 'Studio Renovo',
        slug: 'studio-renovo',
        status: 'active' as const,
        planCode: 'bronze'
      }
    ],
    companyUsers: [
      { companyId: pulsefitCompanyId, userId: ownerId, role: 'owner' as const, isActive: true }
    ],
    masterUsers: [
      { userId: masterId, role: 'super_admin' as const, isActive: true }
    ],
    publicSettings: [
      {
        companyId: pulsefitCompanyId,
        publicName: 'PulseFit',
        description: 'Moda fitness, suplementos e acessorios para treino.',
        heroTitle: 'PulseFit Catalogo',
        heroSubtitle: 'Produtos selecionados para treino, performance e rotina.',
        heroBadge: 'Colecao ativa',
        heroButtonLabel: 'Ver catalogo',
        primaryColor: '#16A34A',
        secondaryColor: '#0F172A',
        accentColor: '#F8FAFC',
        instagramUrl: 'https://instagram.com/pulsefit',
        whatsappPhone: '5571999999999'
      },
      {
        companyId: otherCompanyId,
        publicName: 'Studio Renovo',
        description: 'Catalogo demonstrativo de outro tenant.',
        heroTitle: 'Studio Renovo',
        heroSubtitle: 'Esse tenant existe para testar isolamento.',
        heroBadge: 'Tenant isolado',
        heroButtonLabel: 'Ver catalogo',
        primaryColor: '#0EA5E9',
        secondaryColor: '#111827',
        accentColor: '#F0F9FF'
      }
    ],
    categories: [
      { id: 'cat-leggings', companyId: pulsefitCompanyId, name: 'Leggings', slug: 'leggings', sortOrder: 1, isActive: true },
      { id: 'cat-tops', companyId: pulsefitCompanyId, name: 'Tops', slug: 'tops', sortOrder: 2, isActive: true },
      { id: 'cat-supplements', companyId: pulsefitCompanyId, name: 'Suplementos', slug: 'suplementos', sortOrder: 3, isActive: true },
      { id: 'cat-renovo', companyId: otherCompanyId, name: 'Servicos', slug: 'servicos', sortOrder: 1, isActive: true }
    ],
    products: [
      {
        id: 'prod-legging-compressao',
        companyId: pulsefitCompanyId,
        categoryId: 'cat-leggings',
        slug: 'legging-compressao-verde',
        title: 'Legging Compressao Verde',
        description: 'Tecido firme, cintura alta e ajuste para treino intenso.',
        price: 129.9,
        compareAtPrice: 159.9,
        stockQuantity: 12,
        variantsEnabled: true,
        features: ['Cintura alta', 'Tecido compressivo', 'Secagem rapida'],
        catalogStatus: 'live' as const,
        isActive: true,
        isFeatured: true,
        imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80'
      },
      {
        id: 'prod-top-media-sustentacao',
        companyId: pulsefitCompanyId,
        categoryId: 'cat-tops',
        slug: 'top-media-sustentacao',
        title: 'Top Media Sustentacao',
        description: 'Top com alcas firmes e bojo removivel para treinos diarios.',
        price: 89.9,
        stockQuantity: 20,
        variantsEnabled: false,
        features: ['Bojo removivel', 'Alcas firmes', 'Conforto diario'],
        catalogStatus: 'live' as const,
        isActive: true,
        isFeatured: false,
        imageUrl: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=900&q=80'
      },
      {
        id: 'prod-whey-baunilha',
        companyId: pulsefitCompanyId,
        categoryId: 'cat-supplements',
        slug: 'whey-protein-baunilha',
        title: 'Whey Protein Baunilha',
        description: 'Proteina para suporte de performance e recuperacao muscular.',
        price: 149.9,
        stockQuantity: 8,
        variantsEnabled: false,
        features: ['900g', 'Sabor baunilha', 'Alto teor proteico'],
        catalogStatus: 'live' as const,
        isActive: true,
        isFeatured: true,
        imageUrl: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=900&q=80'
      },
      {
        id: 'prod-renovo-hidden',
        companyId: otherCompanyId,
        categoryId: 'cat-renovo',
        slug: 'servico-isolado',
        title: 'Servico Isolado',
        description: 'Produto de outro tenant que nao pode aparecer no PulseFit.',
        price: 99,
        stockQuantity: 1,
        variantsEnabled: false,
        features: [],
        catalogStatus: 'live' as const,
        isActive: true,
        isFeatured: false,
        imageUrl: ''
      }
    ],
    variants: [
      { id: 'var-legging-p', companyId: pulsefitCompanyId, productId: 'prod-legging-compressao', label: 'P', stockQuantity: 4, isActive: true },
      { id: 'var-legging-m', companyId: pulsefitCompanyId, productId: 'prod-legging-compressao', label: 'M', stockQuantity: 5, isActive: true },
      { id: 'var-legging-g', companyId: pulsefitCompanyId, productId: 'prod-legging-compressao', label: 'G', stockQuantity: 3, isActive: true }
    ],
    orders: [] as Order[]
  };
}

export const db = createInitialStore();

export function publicCompanyBySlug(slug: string): Company {
  const company = db.companies.find((item) => item.slug === slug);
  if (!company || company.status === 'cancelled' || company.status === 'suspended') {
    throw new ApiError(404, 'NOT_FOUND', 'Company not available');
  }
  return company;
}

export function getPublicBootstrap(companySlug: string): PublicBootstrap {
  const company = publicCompanyBySlug(companySlug);
  const settings = db.publicSettings.find((item) => item.companyId === company.id);
  if (!settings) throw new ApiError(404, 'NOT_FOUND', 'Public settings not found');

  const categories = db.categories
    .filter((item) => item.companyId === company.id && item.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const products = db.products
    .filter((item) => item.companyId === company.id && item.isActive && item.catalogStatus === 'live')
    .map((product) => ({
      ...product,
      variants: db.variants.filter((variant) => variant.productId === product.id && variant.isActive)
    }));

  return {
    company: {
      id: company.id,
      slug: company.slug,
      name: company.name,
      status: company.status
    },
    theme: {
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      accentColor: settings.accentColor
    },
    hero: {
      title: settings.heroTitle,
      subtitle: settings.heroSubtitle,
      badge: settings.heroBadge,
      buttonLabel: settings.heroButtonLabel
    },
    settings,
    categories,
    products
  };
}

export function getProductBySlug(companySlug: string, productSlug: string): Product & { variants: ProductVariant[] } {
  const company = publicCompanyBySlug(companySlug);
  const product = db.products.find(
    (item) =>
      item.companyId === company.id &&
      item.slug === productSlug &&
      item.isActive &&
      item.catalogStatus === 'live'
  );
  if (!product) throw new ApiError(404, 'NOT_FOUND', 'Product not found');
  return {
    ...product,
    variants: db.variants.filter((variant) => variant.productId === product.id && variant.isActive)
  };
}

export function createPublicOrder(input: {
  companySlug: string;
  customer: {
    fullName: string;
    phone?: string;
    fulfillmentType: 'delivery' | 'pickup';
    paymentMethod: 'cash' | 'pix' | 'card' | 'online';
  };
  items: Array<{ productId: string; variantId?: string | null; quantity: number }>;
}): Order {
  const company = publicCompanyBySlug(input.companySlug);
  if (input.items.length === 0) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'Order must have at least one item');
  }

  const orderItems: OrderItem[] = input.items.map((item) => {
    const product = db.products.find(
      (candidate) =>
        candidate.companyId === company.id &&
        candidate.id === item.productId &&
        candidate.isActive &&
        candidate.catalogStatus === 'live'
    );
    if (!product) throw new ApiError(404, 'NOT_FOUND', 'Product not found');

    const variant = item.variantId
      ? db.variants.find(
          (candidate) =>
            candidate.companyId === company.id &&
            candidate.productId === product.id &&
            candidate.id === item.variantId &&
            candidate.isActive
        )
      : undefined;

    if (item.variantId && !variant) {
      throw new ApiError(404, 'NOT_FOUND', 'Variant not found');
    }

    const stockTarget = variant ?? product;
    if (stockTarget.stockQuantity < item.quantity) {
      throw new ApiError(409, 'INSUFFICIENT_STOCK', 'Insufficient stock');
    }

    const unitPrice = variant?.price ?? product.price;
    stockTarget.stockQuantity -= item.quantity;

    return {
      productId: product.id,
      variantId: variant?.id,
      productName: product.title,
      variantLabel: variant?.label,
      unitPrice,
      quantity: item.quantity,
      subtotal: Number((unitPrice * item.quantity).toFixed(2))
    };
  });

  const totalAmount = Number(orderItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
  const settings = db.publicSettings.find((item) => item.companyId === company.id);
  const orderCode = `ORD-${Date.now().toString(36).toUpperCase()}`;
  const message = encodeURIComponent(
    `Novo pedido ${orderCode}\nCliente: ${input.customer.fullName}\nTotal: R$ ${totalAmount.toFixed(2)}`
  );

  const order: Order = {
    id: randomUUID(),
    companyId: company.id,
    orderCode,
    customerName: input.customer.fullName,
    customerPhone: input.customer.phone,
    fulfillmentType: input.customer.fulfillmentType,
    paymentMethod: input.customer.paymentMethod,
    totalAmount,
    status: 'new',
    whatsappUrl: settings?.whatsappPhone ? `https://wa.me/${settings.whatsappPhone}?text=${message}` : undefined,
    items: orderItems,
    createdAt: new Date().toISOString()
  };
  db.orders.push(order);
  return order;
}

export function tenantForUser(userId: string): TenantContextData {
  const companyUser = db.companyUsers.find((item) => item.userId === userId && item.isActive);
  if (!companyUser) throw new ApiError(403, 'TENANT_REQUIRED', 'Tenant access required');
  const company = db.companies.find((item) => item.id === companyUser.companyId);
  if (!company || company.status === 'suspended' || company.status === 'cancelled') {
    throw new ApiError(403, 'BILLING_PAST_DUE', 'Company is not active');
  }
  return {
    id: company.id,
    slug: company.slug,
    name: company.name,
    role: companyUser.role
  };
}

export function masterForUser(userId: string) {
  const master = db.masterUsers.find((item) => item.userId === userId && item.isActive);
  if (!master) throw new ApiError(403, 'FORBIDDEN', 'Master access required');
  return master;
}

export function createClientAccount(input: {
  name: string;
  email: string;
  passwordHash: string;
  companyName: string;
  companySlug: string;
}) {
  if (db.users.some((user) => user.email.toLowerCase() === input.email.toLowerCase())) {
    throw new ApiError(409, 'CONFLICT', 'Email already registered');
  }
  if (db.companies.some((company) => company.slug === input.companySlug)) {
    throw new ApiError(409, 'CONFLICT', 'Company slug already registered');
  }

  const user: User = {
    id: randomUUID(),
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash: input.passwordHash,
    status: 'active'
  };
  const company: Company = {
    id: randomUUID(),
    ownerUserId: user.id,
    name: input.companyName,
    slug: input.companySlug,
    status: 'trial',
    planCode: 'bronze'
  };

  db.users.push(user);
  db.companies.push(company);
  db.companyUsers.push({ companyId: company.id, userId: user.id, role: 'owner', isActive: true });
  db.publicSettings.push({
    companyId: company.id,
    publicName: company.name,
    description: 'Novo catalogo em configuracao.',
    heroTitle: company.name,
    heroSubtitle: 'Configure produtos e aparencia na central.',
    heroBadge: 'Novo catalogo',
    heroButtonLabel: 'Ver catalogo',
    primaryColor: '#16A34A',
    secondaryColor: '#0F172A',
    accentColor: '#F8FAFC'
  });

  return { user, company };
}

export class MemoryCatalogRepository implements CatalogRepository {
  async findUserByEmail(email: string): Promise<User | null> {
    return db.users.find((item) => item.email.toLowerCase() === email.toLowerCase()) ?? null;
  }

  async findUserById(userId: string): Promise<User | null> {
    return db.users.find((item) => item.id === userId) ?? null;
  }

  async createClientAccount(input: {
    name: string;
    email: string;
    passwordHash: string;
    companyName: string;
    companySlug: string;
  }): Promise<{ user: User; company: Company }> {
    return createClientAccount(input);
  }

  async getLoginCompanies(userId: string): Promise<Array<{ id: string; slug: string; name: string; role: ClientRole }>> {
    return db.companyUsers
      .filter((item) => item.userId === userId && item.isActive)
      .map((companyUser) => {
        const company = db.companies.find((item) => item.id === companyUser.companyId);
        return company ? { id: company.id, slug: company.slug, name: company.name, role: companyUser.role } : null;
      })
      .filter((item): item is { id: string; slug: string; name: string; role: ClientRole } => Boolean(item));
  }

  async getMasterForUser(userId: string): Promise<MasterUser | null> {
    try {
      return masterForUser(userId);
    } catch {
      return null;
    }
  }

  async getTenantForUser(userId: string): Promise<TenantContextData> {
    return tenantForUser(userId);
  }

  async getPublicBootstrap(companySlug: string): Promise<PublicBootstrap> {
    return getPublicBootstrap(companySlug);
  }

  async getProductBySlug(companySlug: string, productSlug: string): Promise<Product & { variants: ProductVariant[] }> {
    return getProductBySlug(companySlug, productSlug);
  }

  async createPublicOrder(input: {
    companySlug: string;
    customer: {
      fullName: string;
      phone?: string;
      fulfillmentType: 'delivery' | 'pickup';
      paymentMethod: 'cash' | 'pix' | 'card' | 'online';
    };
    items: Array<{ productId: string; variantId?: string | null; quantity: number }>;
  }): Promise<Order> {
    return createPublicOrder(input);
  }

  async getClientDashboard(companyId: string): Promise<{
    productsTotal: number;
    productsLive: number;
    ordersTotal: number;
    revenueTotal: number;
  }> {
    const products = db.products.filter((item) => item.companyId === companyId);
    const orders = db.orders.filter((item) => item.companyId === companyId);
    return {
      productsTotal: products.length,
      productsLive: products.filter((item) => item.isActive && item.catalogStatus === 'live').length,
      ordersTotal: orders.length,
      revenueTotal: Number(orders.reduce((sum, item) => sum + item.totalAmount, 0).toFixed(2))
    };
  }

  async listClientProducts(companyId: string): Promise<Product[]> {
    return db.products.filter((item) => item.companyId === companyId);
  }

  async createClientProduct(companyId: string, input: ProductWriteInput): Promise<Product> {
    if (!db.categories.some((category) => category.companyId === companyId && category.id === input.categoryId)) {
      throw new ApiError(422, 'VALIDATION_ERROR', 'Category does not belong to tenant');
    }
    if (db.products.some((product) => product.companyId === companyId && product.slug === input.slug)) {
      throw new ApiError(409, 'CONFLICT', 'Product slug already exists');
    }
    const product: Product = {
      id: randomUUID(),
      companyId,
      categoryId: input.categoryId,
      slug: input.slug,
      title: input.title,
      description: input.description,
      price: input.price,
      compareAtPrice: input.compareAtPrice,
      stockQuantity: input.stockQuantity,
      variantsEnabled: input.variantsEnabled ?? false,
      features: input.features ?? [],
      catalogStatus: input.catalogStatus ?? 'draft',
      isActive: input.isActive ?? true,
      isFeatured: input.isFeatured ?? false,
      imageUrl: input.imageUrl ?? ''
    };
    db.products.push(product);
    return product;
  }

  async updateClientProduct(companyId: string, productId: string, input: Partial<ProductWriteInput>): Promise<Product> {
    const product = db.products.find((item) => item.companyId === companyId && item.id === productId);
    if (!product) throw new ApiError(404, 'NOT_FOUND', 'Product not found');
    if (input.categoryId && !db.categories.some((category) => category.companyId === companyId && category.id === input.categoryId)) {
      throw new ApiError(422, 'VALIDATION_ERROR', 'Category does not belong to tenant');
    }
    if (input.slug && db.products.some((item) => item.companyId === companyId && item.slug === input.slug && item.id !== productId)) {
      throw new ApiError(409, 'CONFLICT', 'Product slug already exists');
    }
    Object.assign(product, {
      ...input,
      compareAtPrice: input.compareAtPrice ?? product.compareAtPrice,
      variantsEnabled: input.variantsEnabled ?? product.variantsEnabled,
      features: input.features ?? product.features,
      catalogStatus: input.catalogStatus ?? product.catalogStatus,
      isActive: input.isActive ?? product.isActive,
      isFeatured: input.isFeatured ?? product.isFeatured,
      imageUrl: input.imageUrl ?? product.imageUrl
    });
    return product;
  }

  async updateClientProductStatus(companyId: string, productId: string, input: { isActive?: boolean; catalogStatus?: Product['catalogStatus'] }): Promise<Product> {
    const product = db.products.find((item) => item.companyId === companyId && item.id === productId);
    if (!product) throw new ApiError(404, 'NOT_FOUND', 'Product not found');
    if (typeof input.isActive === 'boolean') product.isActive = input.isActive;
    if (input.catalogStatus) product.catalogStatus = input.catalogStatus;
    return product;
  }

  async deleteClientProduct(companyId: string, productId: string): Promise<void> {
    const index = db.products.findIndex((item) => item.companyId === companyId && item.id === productId);
    if (index === -1) throw new ApiError(404, 'NOT_FOUND', 'Product not found');
    db.products.splice(index, 1);
  }

  async bulkUpdateProductStock(companyId: string, productIds: string[], stockQuantity: number): Promise<Product[]> {
    return db.products
      .filter((item) => item.companyId === companyId && productIds.includes(item.id))
      .map((item) => {
        item.stockQuantity = stockQuantity;
        return item;
      });
  }

  async listClientCategories(companyId: string): Promise<Category[]> {
    return db.categories.filter((item) => item.companyId === companyId);
  }

  async createClientCategory(companyId: string, input: CategoryWriteInput): Promise<Category> {
    if (db.categories.some((category) => category.companyId === companyId && category.slug === input.slug)) {
      throw new ApiError(409, 'CONFLICT', 'Category slug already exists');
    }
    const category: Category = {
      id: randomUUID(),
      companyId,
      name: input.name,
      slug: input.slug,
      sortOrder: input.sortOrder ?? 0,
      isActive: input.isActive ?? true
    };
    db.categories.push(category);
    return category;
  }

  async updateClientCategory(companyId: string, categoryId: string, input: Partial<CategoryWriteInput>): Promise<Category> {
    const category = db.categories.find((item) => item.companyId === companyId && item.id === categoryId);
    if (!category) throw new ApiError(404, 'NOT_FOUND', 'Category not found');
    if (input.slug && db.categories.some((item) => item.companyId === companyId && item.slug === input.slug && item.id !== categoryId)) {
      throw new ApiError(409, 'CONFLICT', 'Category slug already exists');
    }
    Object.assign(category, {
      ...input,
      sortOrder: input.sortOrder ?? category.sortOrder,
      isActive: input.isActive ?? category.isActive
    });
    return category;
  }

  async deleteClientCategory(companyId: string, categoryId: string): Promise<void> {
    if (db.products.some((product) => product.companyId === companyId && product.categoryId === categoryId)) {
      throw new ApiError(409, 'CONFLICT', 'Category has products');
    }
    const index = db.categories.findIndex((item) => item.companyId === companyId && item.id === categoryId);
    if (index === -1) throw new ApiError(404, 'NOT_FOUND', 'Category not found');
    db.categories.splice(index, 1);
  }

  async listClientOrders(companyId: string): Promise<Order[]> {
    return db.orders.filter((item) => item.companyId === companyId);
  }

  async getMasterDashboard(): Promise<{
    companiesTotal: number;
    activeCompanies: number;
    ordersTotal: number;
    revenueTotal: number;
  }> {
    return {
      companiesTotal: db.companies.length,
      activeCompanies: db.companies.filter((item) => item.status === 'active').length,
      ordersTotal: db.orders.length,
      revenueTotal: Number(db.orders.reduce((sum, item) => sum + item.totalAmount, 0).toFixed(2))
    };
  }

  async listMasterCompanies(): Promise<Array<Company & { productsTotal: number; ordersTotal: number }>> {
    return db.companies.map((company) => ({
      ...company,
      productsTotal: db.products.filter((product) => product.companyId === company.id).length,
      ordersTotal: db.orders.filter((order) => order.companyId === company.id).length
    }));
  }
}

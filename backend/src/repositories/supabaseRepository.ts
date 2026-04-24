import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import { ApiError } from '../lib/http.js';
import {
  type CatalogRepository,
  type Category,
  type AuditLog,
  type ClientRole,
  type ClientBillingSummary,
  type ClientUsage,
  type Company,
  type Invoice,
  type InvoiceStatus,
  type MasterUser,
  type ModuleWriteInput,
  type Order,
  type OrderItem,
  type Plan,
  type PlanWriteInput,
  type PlatformModule,
  type Product,
  type ProductWriteInput,
  type ProductVariant,
  type PublicBootstrap,
  type PublicSettings,
  type CategoryWriteInput,
  type Subscription,
  type TenantContextData,
  type User
} from '../store/data.js';

type Row = Record<string, unknown>;

function getString(row: Row, key: string): string {
  const value = row[key];
  return typeof value === 'string' ? value : '';
}

function getNumber(row: Row, key: string): number {
  const value = row[key];
  return typeof value === 'number' ? value : Number(value ?? 0);
}

function getBoolean(row: Row, key: string): boolean {
  return row[key] === true;
}

function mapUser(row: Row): User {
  return {
    id: getString(row, 'id'),
    name: getString(row, 'name'),
    email: getString(row, 'email'),
    passwordHash: getString(row, 'password_hash'),
    status: getString(row, 'status') as User['status']
  };
}

function mapCompany(row: Row): Company {
  return {
    id: getString(row, 'id'),
    ownerUserId: getString(row, 'owner_user_id'),
    name: getString(row, 'name'),
    slug: getString(row, 'slug'),
    status: getString(row, 'status') as Company['status'],
    planCode: getString(row, 'plan_code') || 'bronze'
  };
}

function mapPlan(row: Row): Plan {
  return {
    id: getString(row, 'id'),
    name: getString(row, 'name'),
    code: getString(row, 'code'),
    description: getString(row, 'description'),
    priceMonthly: getNumber(row, 'price_monthly'),
    productLimit: getNumber(row, 'product_limit'),
    userLimit: getNumber(row, 'user_limit'),
    storageLimitMb: getNumber(row, 'storage_limit_mb'),
    isActive: getBoolean(row, 'is_active'),
    sortOrder: getNumber(row, 'sort_order')
  };
}

function mapSubscription(row: Row): Subscription {
  return {
    id: getString(row, 'id'),
    companyId: getString(row, 'company_id'),
    planCode: getString((row.plans as Row | null) ?? {}, 'code') || getString(row, 'plan_code') || 'bronze',
    status: getString(row, 'status') as Subscription['status'],
    billingCycle: getString(row, 'billing_cycle') as Subscription['billingCycle'],
    currentPeriodEnd: getString(row, 'current_period_end') || undefined,
    trialEndsAt: getString(row, 'trial_ends_at') || undefined
  };
}

function mapInvoice(row: Row, companyName?: string): Invoice {
  return {
    id: getString(row, 'id'),
    companyId: getString(row, 'company_id'),
    subscriptionId: getString(row, 'subscription_id') || undefined,
    amount: getNumber(row, 'amount'),
    status: getString(row, 'status') as Invoice['status'],
    dueDate: getString(row, 'due_date') || undefined,
    paidAt: getString(row, 'paid_at') || undefined,
    paymentUrl: getString(row, 'payment_url') || undefined,
    createdAt: getString(row, 'created_at'),
    companyName
  };
}

function mapModule(row: Row): PlatformModule {
  return {
    id: getString(row, 'id'),
    code: getString(row, 'code'),
    name: getString(row, 'name'),
    description: getString(row, 'description'),
    priceMonthly: getNumber(row, 'price_monthly'),
    isActive: getBoolean(row, 'is_active')
  };
}

function mapSettings(row: Row): PublicSettings {
  return {
    companyId: getString(row, 'company_id'),
    publicName: getString(row, 'public_name'),
    description: getString(row, 'description'),
    logoUrl: getString(row, 'logo_url') || undefined,
    coverUrl: getString(row, 'cover_url') || undefined,
    heroTitle: getString(row, 'hero_title'),
    heroSubtitle: getString(row, 'hero_subtitle'),
    heroBadge: getString(row, 'hero_badge'),
    heroButtonLabel: getString(row, 'hero_button_label') || 'Ver catalogo',
    primaryColor: getString(row, 'primary_color') || '#16A34A',
    secondaryColor: getString(row, 'secondary_color') || '#0F172A',
    accentColor: getString(row, 'accent_color') || '#F8FAFC',
    instagramUrl: getString(row, 'instagram_url') || undefined,
    whatsappPhone: getString(row, 'whatsapp_phone') || undefined,
    address: getString(row, 'address') || undefined,
    businessHours: getString(row, 'business_hours') || undefined,
    seoTitle: getString(row, 'seo_title') || undefined,
    seoDescription: getString(row, 'seo_description') || undefined
  };
}

function mapCategory(row: Row): Category {
  return {
    id: getString(row, 'id'),
    companyId: getString(row, 'company_id'),
    name: getString(row, 'name'),
    slug: getString(row, 'slug'),
    sortOrder: getNumber(row, 'sort_order'),
    isActive: getBoolean(row, 'is_active')
  };
}

function mapProduct(row: Row, imageUrl = ''): Product {
  return {
    id: getString(row, 'id'),
    companyId: getString(row, 'company_id'),
    categoryId: getString(row, 'category_id'),
    slug: getString(row, 'slug'),
    title: getString(row, 'title'),
    description: getString(row, 'description'),
    price: getNumber(row, 'price'),
    compareAtPrice: row.compare_at_price == null ? undefined : getNumber(row, 'compare_at_price'),
    stockQuantity: getNumber(row, 'stock_quantity'),
    variantsEnabled: getBoolean(row, 'variants_enabled'),
    features: Array.isArray(row.features) ? (row.features as string[]) : [],
    catalogStatus: getString(row, 'catalog_status') as Product['catalogStatus'],
    isActive: getBoolean(row, 'is_active'),
    isFeatured: getBoolean(row, 'is_featured'),
    imageUrl
  };
}

function mapVariant(row: Row): ProductVariant {
  return {
    id: getString(row, 'id'),
    companyId: getString(row, 'company_id'),
    productId: getString(row, 'product_id'),
    label: getString(row, 'label'),
    price: row.price == null ? undefined : getNumber(row, 'price'),
    stockQuantity: getNumber(row, 'stock_quantity'),
    isActive: getBoolean(row, 'is_active')
  };
}

function mapOrder(row: Row, items: OrderItem[] = []): Order {
  return {
    id: getString(row, 'id'),
    companyId: getString(row, 'company_id'),
    orderCode: getString(row, 'order_code'),
    customerName: getString(row, 'customer_name'),
    customerPhone: getString(row, 'customer_phone') || undefined,
    fulfillmentType: getString(row, 'fulfillment_type') as Order['fulfillmentType'],
    paymentMethod: getString(row, 'payment_method') as Order['paymentMethod'],
    totalAmount: getNumber(row, 'total_amount'),
    status: getString(row, 'status') as Order['status'],
    whatsappUrl: getString(row, 'whatsapp_url') || undefined,
    createdAt: getString(row, 'created_at'),
    items
  };
}

export class SupabaseCatalogRepository implements CatalogRepository {
  private client: SupabaseClient;

  constructor() {
    if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
      throw new Error('DATA_PROVIDER=supabase requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }
    this.client = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.client.from('users').select('*').eq('email', email.toLowerCase()).maybeSingle();
    if (error) throw error;
    return data ? mapUser(data) : null;
  }

  async findUserById(userId: string): Promise<User | null> {
    const { data, error } = await this.client.from('users').select('*').eq('id', userId).maybeSingle();
    if (error) throw error;
    return data ? mapUser(data) : null;
  }

  async createClientAccount(input: {
    name: string;
    email: string;
    passwordHash: string;
    companyName: string;
    companySlug: string;
  }): Promise<{ user: User; company: Company }> {
    const existingUser = await this.findUserByEmail(input.email);
    if (existingUser) throw new ApiError(409, 'CONFLICT', 'Email already registered');

    const { data: existingCompany, error: existingCompanyError } = await this.client
      .from('companies')
      .select('id')
      .eq('slug', input.companySlug)
      .maybeSingle();
    if (existingCompanyError) throw existingCompanyError;
    if (existingCompany) throw new ApiError(409, 'CONFLICT', 'Company slug already registered');

    const userId = randomUUID();
    const companyId = randomUUID();
    const bronzePlan = await this.getPlanByCode('bronze');

    const { error: userError } = await this.client.from('users').insert({
      id: userId,
      name: input.name,
      email: input.email.toLowerCase(),
      password_hash: input.passwordHash,
      status: 'active'
    });
    if (userError) throw userError;

    try {
      const { error: companyError } = await this.client.from('companies').insert({
        id: companyId,
        owner_user_id: userId,
        name: input.companyName,
        slug: input.companySlug,
        status: 'trial',
        plan_id: bronzePlan.id
      });
      if (companyError) throw companyError;

      const { error: linkError } = await this.client.from('company_users').insert({
        company_id: companyId,
        user_id: userId,
        role: 'owner',
        is_active: true
      });
      if (linkError) throw linkError;

      const { error: settingsError } = await this.client.from('company_public_settings').insert({
        company_id: companyId,
        public_name: input.companyName,
        description: 'Novo catalogo em configuracao.',
        hero_title: input.companyName,
        hero_subtitle: 'Configure produtos e aparencia na central.',
        hero_badge: 'Novo catalogo',
        hero_button_label: 'Ver catalogo',
        primary_color: '#16A34A',
        secondary_color: '#0F172A',
        accent_color: '#F8FAFC'
      });
      if (settingsError) throw settingsError;

      const { error: subscriptionError } = await this.client.from('subscriptions').insert({
        company_id: companyId,
        plan_id: bronzePlan.id,
        status: 'trial',
        billing_cycle: 'monthly',
        gateway: 'manual',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      });
      if (subscriptionError) throw subscriptionError;
    } catch (error) {
      await this.client.from('users').delete().eq('id', userId);
      throw error;
    }

    return {
      user: {
        id: userId,
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash: input.passwordHash,
        status: 'active'
      },
      company: {
        id: companyId,
        ownerUserId: userId,
        name: input.companyName,
        slug: input.companySlug,
        status: 'trial',
        planCode: 'bronze'
      }
    };
  }

  async getLoginCompanies(userId: string): Promise<Array<{ id: string; slug: string; name: string; role: ClientRole }>> {
    const { data, error } = await this.client
      .from('company_users')
      .select('role, companies(id, slug, name)')
      .eq('user_id', userId)
      .eq('is_active', true);
    if (error) throw error;

    return (data ?? []).flatMap((row: Row) => {
      const company = row.companies as Row | null;
      return company
        ? [{ id: getString(company, 'id'), slug: getString(company, 'slug'), name: getString(company, 'name'), role: getString(row, 'role') as ClientRole }]
        : [];
    });
  }

  async getMasterForUser(userId: string): Promise<MasterUser | null> {
    const { data, error } = await this.client
      .from('master_users')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();
    if (error) throw error;
    return data ? { userId: getString(data, 'user_id'), role: getString(data, 'role') as MasterUser['role'], isActive: true } : null;
  }

  async getTenantForUser(userId: string): Promise<TenantContextData> {
    const companies = await this.getLoginCompanies(userId);
    const tenant = companies[0];
    if (!tenant) throw new ApiError(403, 'TENANT_REQUIRED', 'Tenant access required');
    const company = await this.getCompanyById(tenant.id);
    if (company.status === 'suspended' || company.status === 'cancelled') {
      throw new ApiError(403, 'BILLING_PAST_DUE', 'Company is not active');
    }
    return tenant;
  }

  async getPublicBootstrap(companySlug: string): Promise<PublicBootstrap> {
    const company = await this.getPublicCompanyBySlug(companySlug);
    const { data: settingsRow, error: settingsError } = await this.client
      .from('company_public_settings')
      .select('*')
      .eq('company_id', company.id)
      .maybeSingle();
    if (settingsError) throw settingsError;
    if (!settingsRow) throw new ApiError(404, 'NOT_FOUND', 'Public settings not found');

    const [categories, products] = await Promise.all([
      this.listPublicCategories(company.id),
      this.listPublicProducts(company.id)
    ]);
    const settings = mapSettings(settingsRow);

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

  async getProductBySlug(companySlug: string, productSlug: string): Promise<Product & { variants: ProductVariant[] }> {
    const company = await this.getPublicCompanyBySlug(companySlug);
    const { data, error } = await this.client
      .from('products')
      .select('*')
      .eq('company_id', company.id)
      .eq('slug', productSlug)
      .eq('is_active', true)
      .eq('catalog_status', 'live')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new ApiError(404, 'NOT_FOUND', 'Product not found');

    const [imageUrl, variants] = await Promise.all([
      this.getPrimaryImageUrl(company.id, getString(data, 'id')),
      this.listProductVariants(company.id, getString(data, 'id'))
    ]);
    return { ...mapProduct(data, imageUrl), variants };
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
    const company = await this.getPublicCompanyBySlug(input.companySlug);
    const bootstrap = await this.getPublicBootstrap(input.companySlug);
    const orderItems: OrderItem[] = [];

    for (const item of input.items) {
      const product = bootstrap.products.find((candidate) => candidate.id === item.productId);
      if (!product) throw new ApiError(404, 'NOT_FOUND', 'Product not found');
      const variant = item.variantId ? product.variants.find((candidate) => candidate.id === item.variantId) : undefined;
      if (item.variantId && !variant) throw new ApiError(404, 'NOT_FOUND', 'Variant not found');

      const stockTarget = variant ?? product;
      if (stockTarget.stockQuantity < item.quantity) {
        throw new ApiError(409, 'INSUFFICIENT_STOCK', 'Insufficient stock');
      }
      const unitPrice = variant?.price ?? product.price;
      orderItems.push({
        productId: product.id,
        variantId: variant?.id,
        productName: product.title,
        variantLabel: variant?.label,
        unitPrice,
        quantity: item.quantity,
        subtotal: Number((unitPrice * item.quantity).toFixed(2))
      });
    }

    const totalAmount = Number(orderItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
    const orderId = randomUUID();
    const orderCode = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const message = encodeURIComponent(
      `Novo pedido ${orderCode}\nCliente: ${input.customer.fullName}\nTotal: R$ ${totalAmount.toFixed(2)}`
    );
    const whatsappUrl = bootstrap.settings.whatsappPhone
      ? `https://wa.me/${bootstrap.settings.whatsappPhone}?text=${message}`
      : undefined;

    const { data: orderRow, error: orderError } = await this.client
      .from('orders')
      .insert({
        id: orderId,
        company_id: company.id,
        order_code: orderCode,
        customer_name: input.customer.fullName,
        customer_phone: input.customer.phone,
        fulfillment_type: input.customer.fulfillmentType,
        payment_method: input.customer.paymentMethod,
        total_amount: totalAmount,
        status: 'new',
        whatsapp_url: whatsappUrl
      })
      .select('*')
      .single();
    if (orderError) throw orderError;

    const { error: itemError } = await this.client.from('order_items').insert(
      orderItems.map((item) => ({
        company_id: company.id,
        order_id: orderId,
        product_id: item.productId,
        product_variant_id: item.variantId,
        product_name: item.productName,
        variant_label: item.variantLabel,
        unit_price: item.unitPrice,
        quantity: item.quantity,
        subtotal: item.subtotal
      }))
    );
    if (itemError) throw itemError;

    return mapOrder(orderRow, orderItems);
  }

  async getClientDashboard(companyId: string): Promise<{
    productsTotal: number;
    productsLive: number;
    ordersTotal: number;
    revenueTotal: number;
  }> {
    const [products, orders] = await Promise.all([this.listClientProducts(companyId), this.listClientOrders(companyId)]);
    return {
      productsTotal: products.length,
      productsLive: products.filter((item) => item.isActive && item.catalogStatus === 'live').length,
      ordersTotal: orders.length,
      revenueTotal: Number(orders.reduce((sum, item) => sum + item.totalAmount, 0).toFixed(2))
    };
  }

  async getClientUsage(companyId: string): Promise<ClientUsage> {
    const company = await this.getCompanyById(companyId);
    const plan = await this.getPlanByCode(company.planCode);
    const [{ count: productCount, error: productError }, { count: userCount, error: userError }] = await Promise.all([
      this.client.from('products').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
      this.client.from('company_users').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('is_active', true)
    ]);
    if (productError) throw productError;
    if (userError) throw userError;
    return {
      products: { used: productCount ?? 0, limit: plan.productLimit },
      users: { used: userCount ?? 0, limit: plan.userLimit },
      storage: { usedMb: 0, limitMb: plan.storageLimitMb },
      plan
    };
  }

  async getClientPublicSettings(companyId: string): Promise<PublicSettings> {
    const { data, error } = await this.client.from('company_public_settings').select('*').eq('company_id', companyId).maybeSingle();
    if (error) throw error;
    if (!data) throw new ApiError(404, 'NOT_FOUND', 'Public settings not found');
    return mapSettings(data);
  }

  async updateClientPublicSettings(companyId: string, input: Partial<PublicSettings>): Promise<PublicSettings> {
    const patch: Row = {};
    const mapping: Record<string, string> = {
      publicName: 'public_name',
      description: 'description',
      logoUrl: 'logo_url',
      coverUrl: 'cover_url',
      heroTitle: 'hero_title',
      heroSubtitle: 'hero_subtitle',
      heroBadge: 'hero_badge',
      heroButtonLabel: 'hero_button_label',
      primaryColor: 'primary_color',
      secondaryColor: 'secondary_color',
      accentColor: 'accent_color',
      instagramUrl: 'instagram_url',
      whatsappPhone: 'whatsapp_phone',
      address: 'address',
      businessHours: 'business_hours',
      seoTitle: 'seo_title',
      seoDescription: 'seo_description'
    };
    for (const [key, column] of Object.entries(mapping)) {
      const value = input[key as keyof PublicSettings];
      if (typeof value === 'string') patch[column] = value;
    }
    const { data, error } = await this.client.from('company_public_settings').update(patch).eq('company_id', companyId).select('*').maybeSingle();
    if (error) throw error;
    if (!data) throw new ApiError(404, 'NOT_FOUND', 'Public settings not found');
    return mapSettings(data);
  }

  async getClientBillingSubscription(companyId: string): Promise<ClientBillingSummary> {
    const subscription = await this.getSubscriptionForCompany(companyId);
    const plan = await this.getPlanByCode(subscription.planCode);
    return {
      subscription,
      plan,
      openInvoices: (await this.listClientInvoices(companyId)).filter((item) => item.status === 'open' || item.status === 'overdue')
    };
  }

  async listClientInvoices(companyId: string): Promise<Invoice[]> {
    const { data, error } = await this.client.from('invoices').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row: Row) => mapInvoice(row));
  }

  async listClientModules(companyId: string): Promise<Array<PlatformModule & { enabled: boolean }>> {
    const [modules, enabled] = await Promise.all([
      this.listPlatformModules(),
      this.listEnabledModuleCodes(companyId)
    ]);
    return modules.filter((item) => item.isActive).map((item) => ({ ...item, enabled: enabled.includes(item.code) }));
  }

  async listClientProducts(companyId: string): Promise<Product[]> {
    const { data, error } = await this.client.from('products').select('*').eq('company_id', companyId).order('created_at');
    if (error) throw error;
    return Promise.all((data ?? []).map(async (row: Row) => mapProduct(row, await this.getPrimaryImageUrl(companyId, getString(row, 'id')))));
  }

  async createClientProduct(companyId: string, input: ProductWriteInput): Promise<Product> {
    const usage = await this.getClientUsage(companyId);
    if (usage.products.used >= usage.products.limit) {
      throw new ApiError(403, 'PLAN_LIMIT_REACHED', 'Product limit reached for current plan');
    }
    await this.assertCategoryBelongsToCompany(companyId, input.categoryId);
    const { data, error } = await this.client
      .from('products')
      .insert({
        company_id: companyId,
        category_id: input.categoryId,
        slug: input.slug,
        title: input.title,
        description: input.description,
        price: input.price,
        compare_at_price: input.compareAtPrice,
        stock_quantity: input.stockQuantity,
        variants_enabled: input.variantsEnabled ?? false,
        features: input.features ?? [],
        catalog_status: input.catalogStatus ?? 'draft',
        is_active: input.isActive ?? true,
        is_featured: input.isFeatured ?? false
      })
      .select('*')
      .single();
    if (error) this.handleConstraintError(error, 'Product slug already exists');
    const product = mapProduct(data);
    if (input.imageUrl) await this.upsertPrimaryImage(companyId, product.id, input.imageUrl);
    return { ...product, imageUrl: input.imageUrl ?? '' };
  }

  async updateClientProduct(companyId: string, productId: string, input: Partial<ProductWriteInput>): Promise<Product> {
    if (input.categoryId) await this.assertCategoryBelongsToCompany(companyId, input.categoryId);
    const patch: Row = {};
    if (input.categoryId !== undefined) patch.category_id = input.categoryId;
    if (input.slug !== undefined) patch.slug = input.slug;
    if (input.title !== undefined) patch.title = input.title;
    if (input.description !== undefined) patch.description = input.description;
    if (input.price !== undefined) patch.price = input.price;
    if (input.compareAtPrice !== undefined) patch.compare_at_price = input.compareAtPrice;
    if (input.stockQuantity !== undefined) patch.stock_quantity = input.stockQuantity;
    if (input.variantsEnabled !== undefined) patch.variants_enabled = input.variantsEnabled;
    if (input.features !== undefined) patch.features = input.features;
    if (input.catalogStatus !== undefined) patch.catalog_status = input.catalogStatus;
    if (input.isActive !== undefined) patch.is_active = input.isActive;
    if (input.isFeatured !== undefined) patch.is_featured = input.isFeatured;

    const { data, error } = await this.client
      .from('products')
      .update(patch)
      .eq('company_id', companyId)
      .eq('id', productId)
      .select('*')
      .maybeSingle();
    if (error) this.handleConstraintError(error, 'Product slug already exists');
    if (!data) throw new ApiError(404, 'NOT_FOUND', 'Product not found');
    if (input.imageUrl !== undefined) await this.upsertPrimaryImage(companyId, productId, input.imageUrl);
    return mapProduct(data, input.imageUrl ?? (await this.getPrimaryImageUrl(companyId, productId)));
  }

  async setClientProductImage(companyId: string, productId: string, imageUrl: string): Promise<Product> {
    const { data, error } = await this.client
      .from('products')
      .select('*')
      .eq('company_id', companyId)
      .eq('id', productId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new ApiError(404, 'NOT_FOUND', 'Product not found');
    await this.upsertPrimaryImage(companyId, productId, imageUrl);
    return mapProduct(data, imageUrl);
  }

  async updateClientProductStatus(companyId: string, productId: string, input: { isActive?: boolean; catalogStatus?: Product['catalogStatus'] }): Promise<Product> {
    const patch: Row = {};
    if (input.isActive !== undefined) patch.is_active = input.isActive;
    if (input.catalogStatus !== undefined) patch.catalog_status = input.catalogStatus;
    const { data, error } = await this.client
      .from('products')
      .update(patch)
      .eq('company_id', companyId)
      .eq('id', productId)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new ApiError(404, 'NOT_FOUND', 'Product not found');
    return mapProduct(data, await this.getPrimaryImageUrl(companyId, productId));
  }

  async deleteClientProduct(companyId: string, productId: string): Promise<void> {
    const { error, count } = await this.client
      .from('products')
      .delete({ count: 'exact' })
      .eq('company_id', companyId)
      .eq('id', productId);
    if (error) throw error;
    if (!count) throw new ApiError(404, 'NOT_FOUND', 'Product not found');
  }

  async bulkUpdateProductStock(companyId: string, productIds: string[], stockQuantity: number): Promise<Product[]> {
    const { data, error } = await this.client
      .from('products')
      .update({ stock_quantity: stockQuantity })
      .eq('company_id', companyId)
      .in('id', productIds)
      .select('*');
    if (error) throw error;
    return (data ?? []).map((row: Row) => mapProduct(row));
  }

  async listClientCategories(companyId: string): Promise<Category[]> {
    const { data, error } = await this.client.from('categories').select('*').eq('company_id', companyId).order('sort_order');
    if (error) throw error;
    return (data ?? []).map((row: Row) => mapCategory(row));
  }

  async createClientCategory(companyId: string, input: CategoryWriteInput): Promise<Category> {
    const { data, error } = await this.client
      .from('categories')
      .insert({
        company_id: companyId,
        name: input.name,
        slug: input.slug,
        sort_order: input.sortOrder ?? 0,
        is_active: input.isActive ?? true
      })
      .select('*')
      .single();
    if (error) this.handleConstraintError(error, 'Category slug already exists');
    return mapCategory(data);
  }

  async updateClientCategory(companyId: string, categoryId: string, input: Partial<CategoryWriteInput>): Promise<Category> {
    const patch: Row = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.slug !== undefined) patch.slug = input.slug;
    if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;
    if (input.isActive !== undefined) patch.is_active = input.isActive;
    const { data, error } = await this.client
      .from('categories')
      .update(patch)
      .eq('company_id', companyId)
      .eq('id', categoryId)
      .select('*')
      .maybeSingle();
    if (error) this.handleConstraintError(error, 'Category slug already exists');
    if (!data) throw new ApiError(404, 'NOT_FOUND', 'Category not found');
    return mapCategory(data);
  }

  async deleteClientCategory(companyId: string, categoryId: string): Promise<void> {
    const { count: productCount, error: productError } = await this.client
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('category_id', categoryId);
    if (productError) throw productError;
    if (productCount && productCount > 0) throw new ApiError(409, 'CONFLICT', 'Category has products');

    const { error, count } = await this.client
      .from('categories')
      .delete({ count: 'exact' })
      .eq('company_id', companyId)
      .eq('id', categoryId);
    if (error) throw error;
    if (!count) throw new ApiError(404, 'NOT_FOUND', 'Category not found');
  }

  async listClientOrders(companyId: string): Promise<Order[]> {
    const { data, error } = await this.client.from('orders').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row: Row) => mapOrder(row));
  }

  async updateClientOrderStatus(companyId: string, orderId: string, status: Order['status']): Promise<Order> {
    const { data, error } = await this.client
      .from('orders')
      .update({ status })
      .eq('company_id', companyId)
      .eq('id', orderId)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new ApiError(404, 'NOT_FOUND', 'Order not found');
    return mapOrder(data);
  }

  async getMasterDashboard(): Promise<{
    companiesTotal: number;
    activeCompanies: number;
    ordersTotal: number;
    revenueTotal: number;
  }> {
    const [companies, orders] = await Promise.all([this.listMasterCompanies(), this.listAllOrders()]);
    return {
      companiesTotal: companies.length,
      activeCompanies: companies.filter((item) => item.status === 'active').length,
      ordersTotal: orders.length,
      revenueTotal: Number(orders.reduce((sum, item) => sum + item.totalAmount, 0).toFixed(2))
    };
  }

  async listMasterCompanies(): Promise<Array<Company & { productsTotal: number; ordersTotal: number }>> {
    const { data, error } = await this.client.from('companies').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return Promise.all(
      (data ?? []).map(async (row: Row) => {
        const company = mapCompany(row);
        const [products, orders] = await Promise.all([this.listClientProducts(company.id), this.listClientOrders(company.id)]);
        return { ...company, productsTotal: products.length, ordersTotal: orders.length };
      })
    );
  }

  async getMasterCompany(companyId: string): Promise<Company & { productsTotal: number; ordersTotal: number; subscription?: Subscription; settings?: PublicSettings }> {
    const company = await this.getCompanyById(companyId);
    const [products, orders, subscription, settings] = await Promise.all([
      this.listClientProducts(company.id),
      this.listClientOrders(company.id),
      this.getSubscriptionForCompany(company.id).catch(() => undefined),
      this.getClientPublicSettings(company.id).catch(() => undefined)
    ]);
    return { ...company, productsTotal: products.length, ordersTotal: orders.length, subscription, settings };
  }

  async updateMasterCompany(companyId: string, input: Partial<Pick<Company, 'name' | 'slug' | 'status' | 'planCode'>>, actorUserId?: string): Promise<Company> {
    const patch: Row = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.slug !== undefined) patch.slug = input.slug;
    if (input.status !== undefined) patch.status = input.status;
    if (input.planCode !== undefined) {
      const plan = await this.getPlanByCode(input.planCode);
      patch.plan_id = plan.id;
    }
    const previous = await this.getCompanyById(companyId);
    const { data, error } = await this.client.from('companies').update(patch).eq('id', companyId).select('*, plans(code)').maybeSingle();
    if (error) this.handleConstraintError(error, 'Company slug already exists');
    if (!data) throw new ApiError(404, 'NOT_FOUND', 'Company not found');
    if (input.planCode !== undefined) {
      const plan = await this.getPlanByCode(input.planCode);
      await this.client.from('subscriptions').update({ plan_id: plan.id }).eq('company_id', companyId);
    }
    if (input.status === 'suspended') await this.client.from('subscriptions').update({ status: 'suspended' }).eq('company_id', companyId);
    if (input.status === 'active') await this.client.from('subscriptions').update({ status: 'active' }).eq('company_id', companyId).in('status', ['suspended', 'past_due']);
    const company = { ...mapCompany(data), planCode: getString((data.plans as Row | null) ?? {}, 'code') || input.planCode || previous.planCode };
    await this.createAuditLog({
      companyId,
      masterUserId: actorUserId,
      action: input.status && input.status !== previous.status ? 'company.status_updated' : input.planCode && input.planCode !== previous.planCode ? 'company.plan_updated' : 'company.updated',
      entity: 'company',
      entityId: companyId,
      metadata: { previous, next: company }
    });
    return company;
  }

  async listPlans(): Promise<Plan[]> {
    const { data, error } = await this.client.from('plans').select('*').order('sort_order');
    if (error) throw error;
    return (data ?? []).map((row: Row) => mapPlan(row));
  }

  async createPlan(input: PlanWriteInput, actorUserId?: string): Promise<Plan> {
    const { data, error } = await this.client
      .from('plans')
      .insert({
        name: input.name,
        code: input.code,
        description: input.description ?? '',
        price_monthly: input.priceMonthly,
        product_limit: input.productLimit,
        user_limit: input.userLimit,
        storage_limit_mb: input.storageLimitMb,
        is_active: input.isActive ?? true,
        sort_order: input.sortOrder ?? 0
      })
      .select('*')
      .single();
    if (error) this.handleConstraintError(error, 'Plan code already exists');
    const plan = mapPlan(data);
    await this.createAuditLog({ masterUserId: actorUserId, action: 'plan.created', entity: 'plan', entityId: plan.id, metadata: { plan } });
    return plan;
  }

  async updatePlan(planId: string, input: Partial<PlanWriteInput>, actorUserId?: string): Promise<Plan> {
    const patch: Row = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.code !== undefined) patch.code = input.code;
    if (input.description !== undefined) patch.description = input.description;
    if (input.priceMonthly !== undefined) patch.price_monthly = input.priceMonthly;
    if (input.productLimit !== undefined) patch.product_limit = input.productLimit;
    if (input.userLimit !== undefined) patch.user_limit = input.userLimit;
    if (input.storageLimitMb !== undefined) patch.storage_limit_mb = input.storageLimitMb;
    if (input.isActive !== undefined) patch.is_active = input.isActive;
    if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;
    const { data, error } = await this.client.from('plans').update(patch).or(`id.eq.${planId},code.eq.${planId}`).select('*').maybeSingle();
    if (error) this.handleConstraintError(error, 'Plan code already exists');
    if (!data) throw new ApiError(404, 'NOT_FOUND', 'Plan not found');
    const plan = mapPlan(data);
    await this.createAuditLog({ masterUserId: actorUserId, action: 'plan.updated', entity: 'plan', entityId: plan.id, metadata: { plan } });
    return plan;
  }

  async listPlatformModules(): Promise<PlatformModule[]> {
    const { data, error } = await this.client.from('modules').select('*').order('created_at');
    if (error) throw error;
    return (data ?? []).map((row: Row) => mapModule(row));
  }

  async createPlatformModule(input: ModuleWriteInput, actorUserId?: string): Promise<PlatformModule> {
    const { data, error } = await this.client
      .from('modules')
      .insert({
        code: input.code,
        name: input.name,
        description: input.description ?? '',
        price_monthly: input.priceMonthly,
        is_active: input.isActive ?? true
      })
      .select('*')
      .single();
    if (error) this.handleConstraintError(error, 'Module code already exists');
    const moduleItem = mapModule(data);
    await this.createAuditLog({ masterUserId: actorUserId, action: 'module.created', entity: 'module', entityId: moduleItem.id, metadata: { module: moduleItem } });
    return moduleItem;
  }

  async updatePlatformModule(moduleId: string, input: Partial<ModuleWriteInput>, actorUserId?: string): Promise<PlatformModule> {
    const patch: Row = {};
    if (input.code !== undefined) patch.code = input.code;
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    if (input.priceMonthly !== undefined) patch.price_monthly = input.priceMonthly;
    if (input.isActive !== undefined) patch.is_active = input.isActive;
    const { data, error } = await this.client.from('modules').update(patch).or(`id.eq.${moduleId},code.eq.${moduleId}`).select('*').maybeSingle();
    if (error) this.handleConstraintError(error, 'Module code already exists');
    if (!data) throw new ApiError(404, 'NOT_FOUND', 'Module not found');
    const moduleItem = mapModule(data);
    await this.createAuditLog({ masterUserId: actorUserId, action: 'module.updated', entity: 'module', entityId: moduleItem.id, metadata: { module: moduleItem } });
    return moduleItem;
  }

  async listMasterSubscriptions(): Promise<Array<Subscription & { companyName: string }>> {
    const { data, error } = await this.client.from('subscriptions').select('*, plans(code), companies(name)').order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row: Row) => ({ ...mapSubscription(row), companyName: getString((row.companies as Row | null) ?? {}, 'name') }));
  }

  async listMasterInvoices(): Promise<Invoice[]> {
    const { data, error } = await this.client.from('invoices').select('*, companies(name)').order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row: Row) => mapInvoice(row, getString((row.companies as Row | null) ?? {}, 'name')));
  }

  async createMasterInvoice(input: { companyId: string; amount: number; dueDate?: string; paymentUrl?: string }, actorUserId?: string): Promise<Invoice> {
    const company = await this.getCompanyById(input.companyId);
    const subscription = await this.getSubscriptionForCompany(company.id);
    const { data, error } = await this.client
      .from('invoices')
      .insert({
        company_id: company.id,
        subscription_id: subscription.id,
        amount: input.amount,
        status: 'open',
        due_date: input.dueDate,
        payment_url: input.paymentUrl
      })
      .select('*')
      .single();
    if (error) throw error;
    const invoice = mapInvoice(data, company.name);
    await this.createAuditLog({ companyId: company.id, masterUserId: actorUserId, action: 'invoice.created', entity: 'invoice', entityId: invoice.id, metadata: { invoice } });
    return invoice;
  }

  async updateMasterInvoiceStatus(invoiceId: string, status: InvoiceStatus, actorUserId?: string): Promise<Invoice> {
    const patch: Row = { status };
    if (status === 'paid') patch.paid_at = new Date().toISOString();
    const { data, error } = await this.client.from('invoices').update(patch).eq('id', invoiceId).select('*, companies(name)').maybeSingle();
    if (error) throw error;
    if (!data) throw new ApiError(404, 'NOT_FOUND', 'Invoice not found');
    if (status === 'paid') {
      await this.client.from('subscriptions').update({ status: 'active' }).eq('company_id', getString(data, 'company_id'));
      await this.client.from('companies').update({ status: 'active' }).eq('id', getString(data, 'company_id')).eq('status', 'suspended');
    }
    if (status === 'overdue') await this.client.from('subscriptions').update({ status: 'past_due' }).eq('company_id', getString(data, 'company_id'));
    const invoice = mapInvoice(data, getString((data.companies as Row | null) ?? {}, 'name'));
    await this.createAuditLog({ companyId: invoice.companyId, masterUserId: actorUserId, action: 'invoice.status_updated', entity: 'invoice', entityId: invoice.id, metadata: { status } });
    return invoice;
  }

  async listMasterOrders(): Promise<Array<Order & { companyName: string }>> {
    const { data, error } = await this.client.from('orders').select('*, companies(name)').order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row: Row) => ({ ...mapOrder(row), companyName: getString((row.companies as Row | null) ?? {}, 'name') }));
  }

  async listAuditLogs(): Promise<AuditLog[]> {
    const { data, error } = await this.client.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200);
    if (error) throw error;
    return (data ?? []).map((row: Row) => ({
      id: getString(row, 'id'),
      companyId: getString(row, 'company_id') || undefined,
      userId: getString(row, 'user_id') || undefined,
      masterUserId: getString(row, 'master_user_id') || undefined,
      action: getString(row, 'action'),
      entity: getString(row, 'entity'),
      entityId: getString(row, 'entity_id') || undefined,
      metadata: (row.metadata as Record<string, unknown>) ?? {},
      createdAt: getString(row, 'created_at')
    }));
  }

  private async getCompanyById(companyId: string): Promise<Company> {
    const { data, error } = await this.client.from('companies').select('*, plans(code)').eq('id', companyId).maybeSingle();
    if (error) throw error;
    if (!data) throw new ApiError(404, 'NOT_FOUND', 'Company not found');
    return { ...mapCompany(data), planCode: getString((data.plans as Row | null) ?? {}, 'code') || 'bronze' };
  }

  private async getPlanByCode(planCode: string): Promise<Plan> {
    const { data, error } = await this.client.from('plans').select('*').eq('code', planCode).maybeSingle();
    if (error) throw error;
    if (!data) throw new ApiError(422, 'VALIDATION_ERROR', 'Plan not found');
    return mapPlan(data);
  }

  private async getSubscriptionForCompany(companyId: string): Promise<Subscription> {
    const { data, error } = await this.client
      .from('subscriptions')
      .select('*, plans(code)')
      .eq('company_id', companyId)
      .maybeSingle();
    if (error) throw error;
    if (data) return mapSubscription(data);
    const company = await this.getCompanyById(companyId);
    const plan = await this.getPlanByCode(company.planCode);
    const { data: created, error: createError } = await this.client
      .from('subscriptions')
      .insert({
        company_id: companyId,
        plan_id: plan.id,
        status: company.status === 'trial' ? 'trial' : 'active',
        billing_cycle: 'monthly',
        gateway: 'manual'
      })
      .select('*, plans(code)')
      .single();
    if (createError) throw createError;
    return mapSubscription(created);
  }

  private async listEnabledModuleCodes(companyId: string): Promise<string[]> {
    const { data, error } = await this.client.from('company_modules').select('module_code').eq('company_id', companyId).eq('status', 'active');
    if (error) {
      if (String((error as { code?: string }).code) === '42P01') return [];
      throw error;
    }
    return (data ?? []).map((row: Row) => getString(row, 'module_code'));
  }

  private async createAuditLog(input: {
    companyId?: string;
    userId?: string;
    masterUserId?: string;
    action: string;
    entity: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const { error } = await this.client.from('audit_logs').insert({
      company_id: input.companyId,
      user_id: input.userId,
      master_user_id: input.masterUserId,
      action: input.action,
      entity: input.entity,
      entity_id: input.entityId,
      metadata: input.metadata ?? {}
    });
    if (error) throw error;
  }

  private async getPublicCompanyBySlug(slug: string): Promise<Company> {
    const { data, error } = await this.client
      .from('companies')
      .select('*, plans(code)')
      .eq('slug', slug)
      .in('status', ['trial', 'active'])
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new ApiError(404, 'NOT_FOUND', 'Company not available');
    return { ...mapCompany(data), planCode: getString((data.plans as Row | null) ?? {}, 'code') || 'bronze' };
  }

  private async listPublicCategories(companyId: string): Promise<Category[]> {
    const { data, error } = await this.client
      .from('categories')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('sort_order');
    if (error) throw error;
    return (data ?? []).map((row: Row) => mapCategory(row));
  }

  private async listPublicProducts(companyId: string): Promise<Array<Product & { variants: ProductVariant[] }>> {
    const { data, error } = await this.client
      .from('products')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .eq('catalog_status', 'live')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return Promise.all(
      (data ?? []).map(async (row: Row) => {
        const productId = getString(row, 'id');
        const [imageUrl, variants] = await Promise.all([
          this.getPrimaryImageUrl(companyId, productId),
          this.listProductVariants(companyId, productId)
        ]);
        return { ...mapProduct(row, imageUrl), variants };
      })
    );
  }

  private async listProductVariants(companyId: string, productId: string): Promise<ProductVariant[]> {
    const { data, error } = await this.client
      .from('product_variants')
      .select('*')
      .eq('company_id', companyId)
      .eq('product_id', productId)
      .eq('is_active', true);
    if (error) throw error;
    return (data ?? []).map((row: Row) => mapVariant(row));
  }

  private async getPrimaryImageUrl(companyId: string, productId: string): Promise<string> {
    const { data, error } = await this.client
      .from('product_images')
      .select('url')
      .eq('company_id', companyId)
      .eq('product_id', productId)
      .order('sort_order')
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ? getString(data, 'url') : '';
  }

  private async upsertPrimaryImage(companyId: string, productId: string, imageUrl: string): Promise<void> {
    if (!imageUrl) {
      await this.client.from('product_images').delete().eq('company_id', companyId).eq('product_id', productId);
      return;
    }
    const { error } = await this.client.from('product_images').upsert(
      {
        company_id: companyId,
        product_id: productId,
        url: imageUrl,
        sort_order: 1
      },
      { onConflict: 'company_id,product_id,url' }
    );
    if (error) throw error;
  }

  private async assertCategoryBelongsToCompany(companyId: string, categoryId: string): Promise<void> {
    const { data, error } = await this.client
      .from('categories')
      .select('id')
      .eq('company_id', companyId)
      .eq('id', categoryId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new ApiError(422, 'VALIDATION_ERROR', 'Category does not belong to tenant');
  }

  private handleConstraintError(error: unknown, conflictMessage: string): never {
    if (
      typeof error === 'object' &&
      error &&
      'code' in error &&
      ((error as { code?: string }).code === '23505' || (error as { code?: string }).code === '23503')
    ) {
      throw new ApiError((error as { code?: string }).code === '23505' ? 409 : 422, (error as { code?: string }).code === '23505' ? 'CONFLICT' : 'VALIDATION_ERROR', conflictMessage);
    }
    throw error;
  }

  private async listAllOrders(): Promise<Order[]> {
    const { data, error } = await this.client.from('orders').select('*');
    if (error) throw error;
    return (data ?? []).map((row: Row) => mapOrder(row));
  }
}

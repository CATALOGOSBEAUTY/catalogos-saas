import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import { ApiError } from '../lib/http.js';
import {
  type CatalogRepository,
  type Category,
  type ClientRole,
  type Company,
  type MasterUser,
  type Order,
  type OrderItem,
  type Product,
  type ProductVariant,
  type PublicBootstrap,
  type PublicSettings,
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

function mapSettings(row: Row): PublicSettings {
  return {
    companyId: getString(row, 'company_id'),
    publicName: getString(row, 'public_name'),
    description: getString(row, 'description'),
    heroTitle: getString(row, 'hero_title'),
    heroSubtitle: getString(row, 'hero_subtitle'),
    heroBadge: getString(row, 'hero_badge'),
    heroButtonLabel: getString(row, 'hero_button_label') || 'Ver catalogo',
    primaryColor: getString(row, 'primary_color') || '#16A34A',
    secondaryColor: getString(row, 'secondary_color') || '#0F172A',
    accentColor: getString(row, 'accent_color') || '#F8FAFC',
    instagramUrl: getString(row, 'instagram_url') || undefined,
    whatsappPhone: getString(row, 'whatsapp_phone') || undefined
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
        status: 'trial'
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

  async listClientProducts(companyId: string): Promise<Product[]> {
    const { data, error } = await this.client.from('products').select('*').eq('company_id', companyId).order('created_at');
    if (error) throw error;
    return Promise.all((data ?? []).map(async (row: Row) => mapProduct(row, await this.getPrimaryImageUrl(companyId, getString(row, 'id')))));
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

  async listClientOrders(companyId: string): Promise<Order[]> {
    const { data, error } = await this.client.from('orders').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row: Row) => mapOrder(row));
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

  private async listAllOrders(): Promise<Order[]> {
    const { data, error } = await this.client.from('orders').select('*');
    if (error) throw error;
    return (data ?? []).map((row: Row) => mapOrder(row));
  }
}

import { env } from '../config/env';

interface ApiEnvelope<T> {
  data: T;
}

export interface PublicVariant {
  id: string;
  label: string;
  price?: number;
  stockQuantity: number;
}

export interface PublicProduct {
  id: string;
  categoryId: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  stockQuantity: number;
  variantsEnabled: boolean;
  features: string[];
  catalogStatus?: 'draft' | 'ready' | 'live';
  isActive?: boolean;
  isFeatured: boolean;
  imageUrl: string;
  variants: PublicVariant[];
}

export interface PublicCategory {
  id: string;
  name: string;
  slug: string;
}

export interface PublicBootstrap {
  company: {
    id: string;
    slug: string;
    name: string;
    status: string;
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
  categories: PublicCategory[];
  products: PublicProduct[];
}

export interface PublicSettings {
  companyId: string;
  publicName: string;
  description: string;
  logoUrl?: string;
  coverUrl?: string;
  heroTitle: string;
  heroSubtitle: string;
  heroBadge: string;
  heroButtonLabel: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  instagramUrl?: string;
  whatsappPhone?: string;
  address?: string;
  businessHours?: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface Plan {
  id: string;
  name: string;
  code: string;
  description: string;
  priceMonthly: number;
  productLimit: number;
  userLimit: number;
  storageLimitMb: number;
  isActive: boolean;
  sortOrder: number;
}

export interface Invoice {
  id: string;
  companyId: string;
  companyName?: string;
  amount: number;
  status: 'open' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
  dueDate?: string;
  paidAt?: string;
  paymentUrl?: string;
  createdAt: string;
}

export interface PlatformModule {
  id: string;
  code: string;
  name: string;
  description: string;
  priceMonthly: number;
  isActive: boolean;
  enabled?: boolean;
}

export interface Subscription {
  id: string;
  companyId: string;
  companyName?: string;
  planCode: string;
  status: 'trial' | 'active' | 'past_due' | 'suspended' | 'cancelled';
  billingCycle: 'monthly' | 'yearly';
  currentPeriodEnd?: string;
  trialEndsAt?: string;
}

export interface ClientUsage {
  products: { used: number; limit: number };
  users: { used: number; limit: number };
  storage: { usedMb: number; limitMb: number };
  plan: Plan;
}

export interface ClientBillingSummary {
  subscription: Subscription;
  plan: Plan;
  openInvoices: Invoice[];
}

export interface OrderRow {
  id: string;
  companyId?: string;
  companyName?: string;
  orderCode: string;
  customerName: string;
  customerPhone?: string;
  fulfillmentType?: 'delivery' | 'pickup';
  paymentMethod?: 'cash' | 'pix' | 'card' | 'online';
  totalAmount: number;
  status: 'new' | 'confirmed' | 'paid' | 'sent' | 'cancelled';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  companyId?: string;
  userId?: string;
  masterUserId?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface SessionResponse {
  user: {
    id: string;
    name: string;
    email: string;
  };
  tenant?: {
    id: string;
    slug: string;
    name: string;
    role: string;
  } | null;
  master?: {
    role: string;
  } | null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${env.apiUrl}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    ...init
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message ?? 'Erro inesperado';
    throw new Error(message);
  }
  return (payload as ApiEnvelope<T>).data;
}

async function upload<T>(path: string, formData: FormData): Promise<T> {
  const response = await fetch(`${env.apiUrl}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'X-Client-Request': 'true'
    },
    body: formData
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message ?? 'Erro inesperado';
    throw new Error(message);
  }
  return (payload as ApiEnvelope<T>).data;
}

export const api = {
  getPublicBootstrap(companySlug: string) {
    return request<PublicBootstrap>(`/api/public/${companySlug}/bootstrap`);
  },
  createPublicOrder(companySlug: string, body: unknown) {
    return request(`/api/public/${companySlug}/orders`, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },
  login(email: string, password: string) {
    return request<SessionResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },
  clientLogin(email: string, password: string) {
    return request<SessionResponse>('/api/auth/client-login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },
  masterLogin(email: string, password: string) {
    return request<SessionResponse>('/api/auth/master-login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },
  logout() {
    return request<void>('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({})
    });
  },
  me() {
    return request<SessionResponse>('/api/auth/me');
  },
  clientDashboard() {
    return request('/api/client/dashboard');
  },
  clientUsage() {
    return request<ClientUsage>('/api/client/usage');
  },
  clientPublicSettings() {
    return request<PublicSettings>('/api/client/settings/public');
  },
  updateClientPublicSettings(body: Partial<PublicSettings>) {
    return request<PublicSettings>('/api/client/settings/public', {
      method: 'PUT',
      headers: { 'X-Client-Request': 'true' },
      body: JSON.stringify(body)
    });
  },
  clientBillingSubscription() {
    return request<ClientBillingSummary>('/api/client/billing/subscription');
  },
  clientInvoices() {
    return request<Invoice[]>('/api/client/billing/invoices');
  },
  clientModules() {
    return request<PlatformModule[]>('/api/client/modules');
  },
  clientProducts() {
    return request<PublicProduct[]>('/api/client/products');
  },
  clientCategories() {
    return request<PublicCategory[]>('/api/client/categories');
  },
  clientOrders() {
    return request<OrderRow[]>('/api/client/orders');
  },
  updateClientOrderStatus(orderId: string, status: OrderRow['status']) {
    return request<OrderRow>(`/api/client/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'X-Client-Request': 'true' },
      body: JSON.stringify({ status })
    });
  },
  createClientCategory(body: { name: string; slug?: string }) {
    return request<PublicCategory>('/api/client/categories', {
      method: 'POST',
      headers: { 'X-Client-Request': 'true' },
      body: JSON.stringify(body)
    });
  },
  deleteClientCategory(categoryId: string) {
    return request<void>(`/api/client/categories/${categoryId}`, {
      method: 'DELETE',
      headers: { 'X-Client-Request': 'true' }
    });
  },
  createClientProduct(body: {
    categoryId: string;
    title: string;
    slug?: string;
    description?: string;
    price: number;
    stockQuantity: number;
    catalogStatus?: 'draft' | 'ready' | 'live';
    imageUrl?: string;
  }) {
    return request<PublicProduct>('/api/client/products', {
      method: 'POST',
      headers: { 'X-Client-Request': 'true' },
      body: JSON.stringify(body)
    });
  },
  uploadClientProductImage(productId: string, file: File) {
    const formData = new FormData();
    formData.append('image', file);
    return upload<PublicProduct>(`/api/client/products/${productId}/image`, formData);
  },
  updateClientProduct(productId: string, body: Partial<{
    categoryId: string;
    slug: string;
    title: string;
    description: string;
    price: number;
    compareAtPrice: number;
    stockQuantity: number;
    variantsEnabled: boolean;
    features: string[];
    catalogStatus: PublicProduct['catalogStatus'];
    isActive: boolean;
    isFeatured: boolean;
    imageUrl: string;
  }>) {
    return request<PublicProduct>(`/api/client/products/${productId}`, {
      method: 'PUT',
      headers: { 'X-Client-Request': 'true' },
      body: JSON.stringify(body)
    });
  },
  updateClientProductStatus(productId: string, body: { isActive?: boolean; catalogStatus?: 'draft' | 'ready' | 'live' }) {
    return request<PublicProduct>(`/api/client/products/${productId}/status`, {
      method: 'PATCH',
      headers: { 'X-Client-Request': 'true' },
      body: JSON.stringify(body)
    });
  },
  deleteClientProduct(productId: string) {
    return request<void>(`/api/client/products/${productId}`, {
      method: 'DELETE',
      headers: { 'X-Client-Request': 'true' }
    });
  },
  bulkUpdateProductStock(productIds: string[], stockQuantity: number) {
    return request<{ updatedCount: number; products: PublicProduct[] }>('/api/client/products/bulk/stock', {
      method: 'PATCH',
      headers: { 'X-Client-Request': 'true' },
      body: JSON.stringify({ productIds, stockQuantity })
    });
  },
  masterDashboard() {
    return request('/api/master/dashboard');
  },
  masterCompanies() {
    return request('/api/master/companies');
  },
  masterCompany(companyId: string) {
    return request(`/api/master/companies/${companyId}`);
  },
  updateMasterCompanyStatus(companyId: string, status: string) {
    return request(`/api/master/companies/${companyId}/status`, {
      method: 'PATCH',
      headers: { 'X-Master-Request': 'true' },
      body: JSON.stringify({ status })
    });
  },
  updateMasterCompanyPlan(companyId: string, planCode: string) {
    return request(`/api/master/companies/${companyId}/plan`, {
      method: 'PATCH',
      headers: { 'X-Master-Request': 'true' },
      body: JSON.stringify({ planCode })
    });
  },
  masterPlans() {
    return request<Plan[]>('/api/master/plans');
  },
  createMasterPlan(body: Omit<Plan, 'id'>) {
    return request<Plan>('/api/master/plans', {
      method: 'POST',
      headers: { 'X-Master-Request': 'true' },
      body: JSON.stringify(body)
    });
  },
  updateMasterPlan(planId: string, body: Partial<Plan>) {
    return request<Plan>(`/api/master/plans/${planId}`, {
      method: 'PUT',
      headers: { 'X-Master-Request': 'true' },
      body: JSON.stringify(body)
    });
  },
  masterModules() {
    return request<PlatformModule[]>('/api/master/modules');
  },
  createMasterInvoice(body: { companyId: string; amount: number; dueDate?: string; paymentUrl?: string }) {
    return request<Invoice>('/api/master/billing/invoices', {
      method: 'POST',
      headers: { 'X-Master-Request': 'true' },
      body: JSON.stringify(body)
    });
  },
  masterInvoices() {
    return request<Invoice[]>('/api/master/billing/invoices');
  },
  updateMasterInvoiceStatus(invoiceId: string, status: string) {
    return request<Invoice>(`/api/master/billing/invoices/${invoiceId}/status`, {
      method: 'PATCH',
      headers: { 'X-Master-Request': 'true' },
      body: JSON.stringify({ status })
    });
  },
  masterSubscriptions() {
    return request<Array<Subscription & { companyName: string }>>('/api/master/billing/subscriptions');
  },
  masterOrders() {
    return request<OrderRow[]>('/api/master/orders');
  },
  masterAuditLogs() {
    return request<AuditLog[]>('/api/master/audit-logs');
  },
  createMasterModule(body: Omit<PlatformModule, 'id' | 'enabled'>) {
    return request<PlatformModule>('/api/master/modules', {
      method: 'POST',
      headers: { 'X-Master-Request': 'true' },
      body: JSON.stringify(body)
    });
  },
  updateMasterModule(moduleId: string, body: Partial<Omit<PlatformModule, 'id' | 'enabled'>>) {
    return request<PlatformModule>(`/api/master/modules/${moduleId}`, {
      method: 'PUT',
      headers: { 'X-Master-Request': 'true' },
      body: JSON.stringify(body)
    });
  }
};

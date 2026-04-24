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
  settings: {
    publicName: string;
    description: string;
    instagramUrl?: string;
    whatsappPhone?: string;
  };
  categories: PublicCategory[];
  products: PublicProduct[];
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
  clientProducts() {
    return request<PublicProduct[]>('/api/client/products');
  },
  clientCategories() {
    return request<PublicCategory[]>('/api/client/categories');
  },
  clientOrders() {
    return request('/api/client/orders');
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
  masterDashboard() {
    return request('/api/master/dashboard');
  },
  masterCompanies() {
    return request('/api/master/companies');
  }
};

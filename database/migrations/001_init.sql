create extension if not exists "pgcrypto";

create table public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  status text not null default 'active' check (status in ('active', 'blocked', 'invited')),
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  description text,
  price_monthly numeric(12,2) not null default 0,
  product_limit integer not null default 50,
  user_limit integer not null default 1,
  storage_limit_mb integer not null default 100,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references public.users(id) on delete set null,
  name text not null,
  legal_name text,
  document text,
  slug text not null unique,
  status text not null default 'trial' check (status in ('trial', 'active', 'suspended', 'cancelled')),
  plan_id uuid references public.plans(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.company_users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null check (role in ('owner', 'manager', 'editor', 'attendant')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(company_id, user_id)
);

create table public.master_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null check (role in ('super_admin', 'finance', 'support', 'commercial')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(user_id)
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete restrict,
  status text not null default 'trial' check (status in ('trial', 'active', 'past_due', 'suspended', 'cancelled')),
  billing_cycle text not null default 'monthly' check (billing_cycle in ('monthly', 'yearly')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_ends_at timestamptz,
  gateway text check (gateway in ('asaas', 'mercado_pago', 'stripe', 'manual')),
  gateway_customer_id text,
  gateway_subscription_id text,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  price_monthly numeric(12,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.company_public_settings (
  company_id uuid primary key references public.companies(id) on delete cascade,
  public_name text not null,
  description text,
  logo_url text,
  cover_url text,
  hero_title text,
  hero_subtitle text,
  hero_badge text,
  hero_button_label text default 'Ver catalogo',
  primary_color text default '#16A34A',
  secondary_color text default '#0F172A',
  accent_color text default '#F8FAFC',
  instagram_url text,
  whatsapp_phone text,
  address text,
  business_hours text,
  template text not null default 'pulsefit',
  catalog_mode text not null default 'whatsapp' check (catalog_mode in ('whatsapp', 'checkout', 'payment')),
  seo_title text,
  seo_description text,
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  parent_id uuid,
  name text not null,
  slug text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, id),
  unique(company_id, slug),
  foreign key (company_id, parent_id) references public.categories(company_id, id) on delete restrict
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  category_id uuid not null,
  subcategory_id uuid,
  slug text not null,
  title text not null,
  description text not null default '',
  price numeric(12,2) not null check (price >= 0),
  compare_at_price numeric(12,2) check (compare_at_price is null or compare_at_price >= 0),
  sku text,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  variants_enabled boolean not null default false,
  features jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  catalog_status text not null default 'draft' check (catalog_status in ('draft', 'ready', 'live')),
  is_active boolean not null default true,
  is_featured boolean not null default false,
  is_promo boolean not null default false,
  is_new boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, id),
  unique(company_id, slug),
  foreign key (company_id, category_id) references public.categories(company_id, id) on delete restrict,
  foreign key (company_id, subcategory_id) references public.categories(company_id, id) on delete set null
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  product_id uuid not null,
  label text not null,
  sku text,
  options jsonb not null default '[]'::jsonb,
  price numeric(12,2) check (price is null or price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, id),
  foreign key (company_id, product_id) references public.products(company_id, id) on delete cascade
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  product_id uuid not null,
  url text not null,
  path text,
  name text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique(company_id, product_id, url),
  foreign key (company_id, product_id) references public.products(company_id, id) on delete cascade
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  order_code text not null,
  customer_name text not null,
  customer_phone text,
  customer_email text,
  fulfillment_type text not null default 'delivery' check (fulfillment_type in ('delivery', 'pickup')),
  payment_method text not null default 'pix' check (payment_method in ('cash', 'pix', 'card', 'online')),
  total_amount numeric(12,2) not null check (total_amount >= 0),
  status text not null default 'new' check (status in ('new', 'confirmed', 'paid', 'sent', 'cancelled')),
  whatsapp_url text,
  source text not null default 'public_catalog',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, id),
  unique(company_id, order_code)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  order_id uuid not null,
  product_id uuid,
  product_variant_id uuid,
  product_name text not null,
  variant_label text,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  created_at timestamptz not null default now(),
  foreign key (company_id, order_id) references public.orders(company_id, id) on delete cascade,
  foreign key (company_id, product_id) references public.products(company_id, id) on delete set null,
  foreign key (company_id, product_variant_id) references public.product_variants(company_id, id) on delete set null
);

create table public.media_files (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  url text not null,
  path text,
  name text not null,
  mime_type text,
  size_bytes integer not null default 0,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  amount numeric(12,2) not null check (amount >= 0),
  status text not null default 'open' check (status in ('open', 'paid', 'overdue', 'cancelled', 'refunded')),
  due_date date,
  paid_at timestamptz,
  gateway_invoice_id text,
  payment_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.billing_gateway_events (
  id uuid primary key default gen_random_uuid(),
  gateway text not null check (gateway in ('asaas', 'mercado_pago', 'stripe')),
  event_id text not null,
  payload jsonb not null,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(gateway, event_id)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  user_id uuid references public.users(id) on delete set null,
  master_user_id uuid references public.users(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  ip_address text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_companies_slug on public.companies(slug);
create index idx_products_public on public.products(company_id, is_active, catalog_status, created_at desc);
create index idx_products_company_slug on public.products(company_id, slug);
create index idx_categories_company_id on public.categories(company_id);
create index idx_orders_company_created_at on public.orders(company_id, created_at desc);
create index idx_invoices_company_id on public.invoices(company_id);
create index idx_audit_logs_company_id on public.audit_logs(company_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_users_updated_at before update on public.users for each row execute function public.set_updated_at();
create trigger trg_companies_updated_at before update on public.companies for each row execute function public.set_updated_at();
create trigger trg_products_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger trg_categories_updated_at before update on public.categories for each row execute function public.set_updated_at();
create trigger trg_product_variants_updated_at before update on public.product_variants for each row execute function public.set_updated_at();
create trigger trg_orders_updated_at before update on public.orders for each row execute function public.set_updated_at();
create trigger trg_subscriptions_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();
create trigger trg_invoices_updated_at before update on public.invoices for each row execute function public.set_updated_at();

alter table public.products enable row level security;
alter table public.categories enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.media_files enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.company_public_settings enable row level security;

create table if not exists public.company_modules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  module_id uuid references public.modules(id) on delete cascade,
  module_code text not null,
  status text not null default 'active' check (status in ('active', 'cancelled')),
  activated_at timestamptz not null default now(),
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  unique(company_id, module_code)
);

create index if not exists idx_company_modules_company_id on public.company_modules(company_id);

alter table public.company_modules enable row level security;

insert into public.plans (name, code, description, price_monthly, product_limit, user_limit, storage_limit_mb, sort_order, is_active)
values
  ('Platinum', 'platinum', 'WhatsApp Pro, suporte prioritario, automacoes e analise de conversao.', 397.90, 500, 10, 3072, 4, true),
  ('Enterprise', 'enterprise', 'Multiunidade, suporte dedicado e limites customizados.', 497.90, 1000, 99, 10240, 5, true)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  price_monthly = excluded.price_monthly,
  product_limit = excluded.product_limit,
  user_limit = excluded.user_limit,
  storage_limit_mb = excluded.storage_limit_mb,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

insert into public.modules (code, name, description, price_monthly, is_active)
values
  ('advanced_reports', 'Relatorios avancados', 'Indicadores de venda, conversao e catalogo.', 49.90, true),
  ('whatsapp_pro', 'WhatsApp Pro', 'Recursos extras para atendimento e automacao.', 79.90, true),
  ('online_payments', 'Pagamento online', 'Checkout e gateway de pagamento.', 69.90, true),
  ('coupons', 'Cupons e promocoes', 'Cupons, campanhas e descontos controlados.', 39.90, true),
  ('custom_domain', 'Dominio proprio', 'Uso de dominio personalizado por cliente.', 29.90, true),
  ('chatbot', 'Chatbot', 'Atendimento automatico conectado ao catalogo.', 99.90, true)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  price_monthly = excluded.price_monthly,
  is_active = excluded.is_active;

insert into public.plans (id, name, code, description, price_monthly, product_limit, user_limit, storage_limit_mb, sort_order)
values
  ('00000000-0000-4000-8000-000000000001', 'Bronze', 'bronze', 'Catalogo publico, pedidos por WhatsApp e painel basico.', 49.90, 50, 1, 100, 1),
  ('00000000-0000-4000-8000-000000000002', 'Silver', 'silver', 'Mais produtos, usuarios e personalizacao.', 149.90, 150, 2, 500, 2),
  ('00000000-0000-4000-8000-000000000003', 'Gold', 'gold', 'Relatorios, cupons e pagamentos online.', 299.90, 250, 5, 1024, 3)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  price_monthly = excluded.price_monthly,
  product_limit = excluded.product_limit,
  user_limit = excluded.user_limit,
  storage_limit_mb = excluded.storage_limit_mb;

insert into public.users (id, name, email, password_hash)
values ('10000000-0000-4000-8000-000000000001', 'PulseFit Owner', 'owner@pulsefit.local', '$2a$10$demo.hash.replace.before.production')
on conflict (email) do nothing;

insert into public.companies (id, owner_user_id, name, slug, status, plan_id)
values ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'PulseFit', 'pulsefit', 'active', '00000000-0000-4000-8000-000000000002')
on conflict (slug) do update set status = 'active';

insert into public.company_users (company_id, user_id, role)
values ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'owner')
on conflict (company_id, user_id) do nothing;

insert into public.company_public_settings (company_id, public_name, description, hero_title, hero_subtitle, hero_badge, primary_color, secondary_color, whatsapp_phone, instagram_url)
values (
  '20000000-0000-4000-8000-000000000001',
  'PulseFit',
  'Moda fitness e suplementos para treino.',
  'PulseFit Catalogo',
  'Produtos selecionados para treino, performance e rotina.',
  'Colecao ativa',
  '#16A34A',
  '#0F172A',
  '5571999999999',
  'https://instagram.com/pulsefit'
)
on conflict (company_id) do update set public_name = excluded.public_name;

insert into public.subscriptions (company_id, plan_id, status, billing_cycle, gateway)
values ('20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', 'active', 'monthly', 'manual')
on conflict (company_id) do update set status = 'active';

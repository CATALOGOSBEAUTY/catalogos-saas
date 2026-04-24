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
values ('10000000-0000-4000-8000-000000000001', 'PulseFit Owner', 'owner@pulsefit.local', '$2a$12$a3ee34OQLHu0oouP5ZwS5.cKq/ZQMaHotTdSArjKP3eX/jizE8d.y')
on conflict (email) do nothing;

insert into public.users (id, name, email, password_hash)
values ('10000000-0000-4000-8000-000000000002', 'Master Admin', 'master@catalogos.local', '$2a$12$xwW3QQiryc72u5FR7W1qR.ecQrWN9ekEJI7NR5SEgO2/h/7csNBLm')
on conflict (email) do nothing;

insert into public.master_users (user_id, role, is_active)
values ('10000000-0000-4000-8000-000000000002', 'super_admin', true)
on conflict (user_id) do update set role = excluded.role, is_active = true;

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

insert into public.categories (id, company_id, name, slug, sort_order, is_active)
values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Leggings', 'leggings', 1, true),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'Tops', 'tops', 2, true),
  ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', 'Suplementos', 'suplementos', 3, true)
on conflict (company_id, slug) do update set
  name = excluded.name,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

insert into public.products (
  id,
  company_id,
  category_id,
  slug,
  title,
  description,
  price,
  compare_at_price,
  stock_quantity,
  variants_enabled,
  features,
  catalog_status,
  is_active,
  is_featured
)
values
  (
    '40000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    'legging-compressao-verde',
    'Legging Compressao Verde',
    'Tecido firme, cintura alta e ajuste para treino intenso.',
    129.90,
    159.90,
    12,
    true,
    '["Cintura alta", "Tecido compressivo", "Secagem rapida"]'::jsonb,
    'live',
    true,
    true
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000002',
    'top-media-sustentacao',
    'Top Media Sustentacao',
    'Top com alcas firmes e bojo removivel para treinos diarios.',
    89.90,
    null,
    20,
    false,
    '["Bojo removivel", "Alcas firmes", "Conforto diario"]'::jsonb,
    'live',
    true,
    false
  ),
  (
    '40000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000003',
    'whey-protein-baunilha',
    'Whey Protein Baunilha',
    'Proteina para suporte de performance e recuperacao muscular.',
    149.90,
    null,
    8,
    false,
    '["900g", "Sabor baunilha", "Alto teor proteico"]'::jsonb,
    'live',
    true,
    true
  )
on conflict (company_id, slug) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  compare_at_price = excluded.compare_at_price,
  stock_quantity = excluded.stock_quantity,
  variants_enabled = excluded.variants_enabled,
  features = excluded.features,
  catalog_status = excluded.catalog_status,
  is_active = excluded.is_active,
  is_featured = excluded.is_featured;

insert into public.product_variants (id, company_id, product_id, label, stock_quantity, is_active)
values
  ('50000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'P', 4, true),
  ('50000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'M', 5, true),
  ('50000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'G', 3, true)
on conflict (company_id, id) do update set
  label = excluded.label,
  stock_quantity = excluded.stock_quantity,
  is_active = excluded.is_active;

insert into public.product_images (company_id, product_id, url, sort_order)
values
  ('20000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80', 1),
  ('20000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000002', 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=900&q=80', 1),
  ('20000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000003', 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=900&q=80', 1)
on conflict (company_id, product_id, url) do update set sort_order = excluded.sort_order;

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  Eye,
  Image,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  Star,
  Tag,
  Trash2,
  X
} from 'lucide-react';
import { api, type PublicCategory, type PublicProduct } from '../../services/apiClient';

interface DashboardPayload {
  tenant: {
    name: string;
    slug: string;
    role: string;
  };
  metrics: {
    productsTotal: number;
    productsLive: number;
    ordersTotal: number;
    revenueTotal: number;
  };
}

interface OrderRow {
  id: string;
  orderCode: string;
  customerName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

type ClientTab = 'dashboard' | 'produtos' | 'categorias' | 'midia' | 'destaques' | 'pedidos' | 'configuracoes';

const navItems: Array<{ tab: ClientTab; label: string; icon: typeof LayoutDashboard }> = [
  { tab: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { tab: 'produtos', label: 'Produtos', icon: Package },
  { tab: 'categorias', label: 'Categorias', icon: Tag },
  { tab: 'midia', label: 'Midia e Imagens', icon: Image },
  { tab: 'destaques', label: 'Destaques', icon: Star },
  { tab: 'pedidos', label: 'Pedidos', icon: ShoppingBag },
  { tab: 'configuracoes', label: 'Configuracoes', icon: Settings }
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function ClientDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = (location.pathname.split('/').pop() || 'dashboard') as ClientTab;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [productDraft, setProductDraft] = useState({
    title: '',
    categoryId: '',
    price: '',
    stockQuantity: '',
    description: '',
    imageFile: null as File | null
  });

  async function loadDashboard() {
    const [dashboardPayload, productsPayload, categoriesPayload, ordersPayload] = await Promise.all([
      api.clientDashboard() as Promise<DashboardPayload>,
      api.clientProducts(),
      api.clientCategories(),
      api.clientOrders() as Promise<OrderRow[]>
    ]);
    setDashboard(dashboardPayload);
    setProducts(productsPayload);
    setCategories(categoriesPayload);
    setOrders(ordersPayload);
    setProductDraft((current) => ({
      ...current,
      categoryId: current.categoryId || categoriesPayload[0]?.id || ''
    }));
  }

  useEffect(() => {
    loadDashboard()
      .then(() => setError(null))
      .catch((err: Error) => setError(err.message));
  }, []);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return products.filter((product) => `${product.title} ${product.slug} ${product.description}`.toLowerCase().includes(term));
  }, [products, searchTerm]);

  async function createCategory(event: FormEvent) {
    event.preventDefault();
    setStatus(null);
    try {
      await api.createClientCategory({ name: categoryName });
      setCategoryName('');
      await loadDashboard();
      setStatus('Categoria criada.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Falha ao criar categoria.');
    }
  }

  async function createProduct(event: FormEvent) {
    event.preventDefault();
    setStatus(null);
    try {
      const product = await api.createClientProduct({
        title: productDraft.title,
        categoryId: productDraft.categoryId,
        description: productDraft.description,
        price: Number(productDraft.price),
        stockQuantity: Number(productDraft.stockQuantity),
        catalogStatus: 'draft'
      });
      if (productDraft.imageFile) {
        await api.uploadClientProductImage(product.id, productDraft.imageFile);
      }
      setProductDraft({
        title: '',
        categoryId: categories[0]?.id || '',
        price: '',
        stockQuantity: '',
        description: '',
        imageFile: null
      });
      await loadDashboard();
      setStatus(productDraft.imageFile ? 'Produto criado com imagem.' : 'Produto criado como rascunho.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Falha ao criar produto.');
    }
  }

  async function publishProduct(product: PublicProduct) {
    await api.updateClientProductStatus(product.id, {
      isActive: true,
      catalogStatus: product.catalogStatus === 'live' ? 'draft' : 'live'
    });
    await loadDashboard();
  }

  async function deleteProduct(productId: string) {
    await api.deleteClientProduct(productId);
    await loadDashboard();
  }

  async function deleteCategory(categoryId: string) {
    try {
      await api.deleteClientCategory(categoryId);
      await loadDashboard();
      setStatus('Categoria excluida.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Falha ao excluir categoria.');
    }
  }

  async function logout() {
    await api.logout().catch(() => undefined);
    navigate('/cliente/login');
  }

  if (!navItems.some((item) => item.tab === activeTab)) {
    return <Navigate to="/cliente/app/dashboard" replace />;
  }

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center bg-neutral-50 p-8 text-center">
        <div>
          <p className="mb-4 text-red-600">{error}</p>
          <Link className="font-bold text-purple-700" to="/cliente/login">Entrar novamente</Link>
        </div>
      </main>
    );
  }

  if (!dashboard) return <main className="min-h-screen bg-neutral-50" />;

  return (
    <div className="flex h-screen bg-neutral-50">
      {sidebarOpen ? <div className="fixed inset-0 z-40 bg-neutral-900/50 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} /> : null}
      <aside className={`fixed inset-y-0 left-0 z-50 flex h-screen w-72 flex-col overflow-y-auto border-r border-neutral-200 bg-white transition-transform duration-300 lg:static lg:w-64 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-6 flex items-center justify-between border-b border-neutral-100 p-6 lg:justify-center">
          <img src="/assets/sistematize-logo.svg" alt="Sistematize" className="h-12 w-40 object-contain object-left lg:object-center" />
          <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-2 px-4">
          {navItems.map((item) => (
            <button
              key={item.tab}
              onClick={() => {
                navigate(`/cliente/app/${item.tab}`);
                setSidebarOpen(false);
              }}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${activeTab === item.tab ? 'bg-purple-50 font-bold text-purple-800' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'}`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-neutral-100 p-4">
          <button onClick={logout} className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-500 transition-colors hover:bg-red-100">
            <LogOut className="h-4 w-4" />
            Sair do Sistema
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 md:h-20 md:px-8">
          <div className="flex flex-1 items-center gap-2 md:gap-4">
            <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 lg:hidden">
              <Menu className="h-6 w-6" />
            </button>
            <div className="hidden max-w-xl flex-1 sm:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Pesquisar produtos..." className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2 pl-10 pr-4 text-sm outline-none transition-colors focus:border-purple-500 focus:ring-1 focus:ring-purple-500" />
              </div>
            </div>
          </div>
          <div className="ml-4 flex items-center gap-4 md:gap-6">
            <Link to={`/loja/${dashboard.tenant.slug}/catalogo`} className="hidden items-center gap-2 rounded-xl bg-purple-50 px-3 py-2 text-xs font-bold uppercase tracking-widest text-purple-700 md:flex">
              <Eye className="h-4 w-4" />
              Ver loja
            </Link>
            <Bell className="h-5 w-5 text-neutral-400" />
            <div className="border-l border-neutral-200 pl-4 text-right">
              <strong className="block max-w-[160px] truncate text-sm text-neutral-900">{dashboard.tenant.name}</strong>
              <span className="text-xs text-neutral-500">{dashboard.tenant.role}</span>
            </div>
          </div>
        </header>

        <main className="custom-scrollbar flex-1 overflow-y-auto bg-neutral-50/50 p-4 md:p-8">
          {activeTab === 'dashboard' ? <DashboardTab dashboard={dashboard} products={products} /> : null}
          {activeTab === 'produtos' ? <ProductsTab products={filteredProducts} categories={categories} productDraft={productDraft} setProductDraft={setProductDraft} createProduct={createProduct} publishProduct={publishProduct} deleteProduct={deleteProduct} status={status} /> : null}
          {activeTab === 'categorias' ? <CategoriesTab categories={categories} categoryName={categoryName} setCategoryName={setCategoryName} createCategory={createCategory} deleteCategory={deleteCategory} status={status} /> : null}
          {activeTab === 'midia' ? <MediaTab products={products} /> : null}
          {activeTab === 'destaques' ? <HighlightsTab products={products} publishProduct={publishProduct} /> : null}
          {activeTab === 'pedidos' ? <OrdersTab orders={orders} /> : null}
          {activeTab === 'configuracoes' ? <SettingsTab tenantSlug={dashboard.tenant.slug} /> : null}
        </main>
      </div>
    </div>
  );
}

function DashboardTab({ dashboard, products }: { dashboard: DashboardPayload; products: PublicProduct[] }) {
  const stats = [
    { label: 'Total de Produtos', value: dashboard.metrics.productsTotal, icon: Package, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Produtos Publicados', value: dashboard.metrics.productsLive, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Pedidos', value: dashboard.metrics.ordersTotal, icon: BarChart3, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Receita', value: formatCurrency(dashboard.metrics.revenueTotal), icon: Star, color: 'text-amber-600', bg: 'bg-amber-100' }
  ];
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 pb-6">
      <header>
        <h1 className="text-2xl font-bold uppercase tracking-tight text-neutral-900 md:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500">Visao geral do catalogo e operacao.</p>
      </header>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 md:gap-6">
        {stats.map((stat) => (
          <article key={stat.label} className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:p-6">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">{stat.label}</p>
              <h3 className="mt-1 text-xl font-bold text-neutral-900">{stat.value}</h3>
            </div>
          </article>
        ))}
      </div>
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-neutral-900">Ultimos produtos</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {products.slice(0, 4).map((product) => (
            <div key={product.id} className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50 p-3">
              <img src={product.imageUrl || '/assets/pulsefit-logo-transparent.png'} alt={product.title} className="h-12 w-12 rounded-lg object-cover" />
              <div>
                <h4 className="font-bold text-neutral-900">{product.title}</h4>
                <p className="text-xs text-neutral-500">{formatCurrency(product.price)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ProductsTab({
  products,
  categories,
  productDraft,
  setProductDraft,
  createProduct,
  publishProduct,
  deleteProduct,
  status
}: {
  products: PublicProduct[];
  categories: PublicCategory[];
  productDraft: { title: string; categoryId: string; price: string; stockQuantity: string; description: string; imageFile: File | null };
  setProductDraft: React.Dispatch<React.SetStateAction<{ title: string; categoryId: string; price: string; stockQuantity: string; description: string; imageFile: File | null }>>;
  createProduct: (event: FormEvent) => Promise<void>;
  publishProduct: (product: PublicProduct) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  status: string | null;
}) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 pb-20">
      <header>
        <h1 className="text-2xl font-bold uppercase tracking-tight text-neutral-900 md:text-3xl">Produtos</h1>
        <p className="mt-1 text-sm text-neutral-500">Gerencie catalogo, estoque, status e imagens.</p>
      </header>
      <form onSubmit={createProduct} className="grid gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm lg:grid-cols-4">
        <input value={productDraft.title} onChange={(event) => setProductDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Nome do produto" required className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:border-purple-500" />
        <select value={productDraft.categoryId} onChange={(event) => setProductDraft((current) => ({ ...current, categoryId: event.target.value }))} required className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:border-purple-500">
          <option value="">Categoria</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <input value={productDraft.price} onChange={(event) => setProductDraft((current) => ({ ...current, price: event.target.value }))} placeholder="Preco" type="number" min="0" step="0.01" required className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:border-purple-500" />
        <input value={productDraft.stockQuantity} onChange={(event) => setProductDraft((current) => ({ ...current, stockQuantity: event.target.value }))} placeholder="Estoque" type="number" min="0" step="1" required className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:border-purple-500" />
        <textarea value={productDraft.description} onChange={(event) => setProductDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Descricao" className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:border-purple-500 lg:col-span-2" />
        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setProductDraft((current) => ({ ...current, imageFile: event.target.files?.[0] ?? null }))} className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm" />
        <button type="submit" className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-800 to-purple-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-purple-500/20">
          <Plus className="h-5 w-5" />
          Criar rascunho
        </button>
      </form>
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-xs font-bold uppercase tracking-widest text-neutral-500">
              <th className="p-4">Produto</th>
              <th className="p-4">Status</th>
              <th className="p-4">Estoque</th>
              <th className="p-4">Preco</th>
              <th className="p-4 text-right">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <img src={product.imageUrl || '/assets/pulsefit-logo-transparent.png'} alt={product.title} className="h-12 w-12 rounded-lg object-cover" />
                    <div>
                      <h4 className="font-bold text-neutral-900">{product.title}</h4>
                      <p className="text-xs text-neutral-500">{product.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">{product.catalogStatus}</td>
                <td className="p-4">{product.stockQuantity}</td>
                <td className="p-4">{formatCurrency(product.price)}</td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => publishProduct(product)} className="rounded-lg bg-purple-50 px-3 py-2 text-xs font-bold text-purple-700">{product.catalogStatus === 'live' ? 'Rascunho' : 'Publicar'}</button>
                    <button onClick={() => deleteProduct(product.id)} className="rounded-lg bg-red-50 p-2 text-red-600"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {status ? <p className="text-sm font-bold text-purple-700">{status}</p> : null}
    </div>
  );
}

function CategoriesTab({ categories, categoryName, setCategoryName, createCategory, deleteCategory, status }: { categories: PublicCategory[]; categoryName: string; setCategoryName: (value: string) => void; createCategory: (event: FormEvent) => Promise<void>; deleteCategory: (categoryId: string) => Promise<void>; status: string | null }) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header><h1 className="text-3xl font-bold uppercase tracking-tight">Categorias</h1><p className="text-sm text-neutral-500">Organize o catalogo por colecoes.</p></header>
      <form onSubmit={createCategory} className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:flex-row">
        <input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="Nova categoria" required className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:border-purple-500" />
        <button className="rounded-xl bg-gradient-to-r from-purple-800 to-purple-600 px-5 py-3 text-sm font-bold text-white">Adicionar</button>
      </form>
      <div className="grid gap-4 md:grid-cols-2">
        {categories.map((category) => (
          <article key={category.id} className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div><h2 className="font-bold text-neutral-900">{category.name}</h2><p className="text-xs text-neutral-400">/{category.slug}</p></div>
            <button onClick={() => deleteCategory(category.id)} className="rounded-lg bg-red-50 p-2 text-red-600"><Trash2 className="h-4 w-4" /></button>
          </article>
        ))}
      </div>
      {status ? <p className="text-sm font-bold text-purple-700">{status}</p> : null}
    </div>
  );
}

function MediaTab({ products }: { products: PublicProduct[] }) {
  const withImages = products.filter((product) => product.imageUrl);
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header><h1 className="text-3xl font-bold uppercase tracking-tight">Midia e Imagens</h1><p className="text-sm text-neutral-500">Biblioteca inicial baseada nas imagens dos produtos.</p></header>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
        {withImages.map((product) => <img key={product.id} src={product.imageUrl} alt={product.title} className="aspect-square rounded-2xl border border-neutral-200 object-cover shadow-sm" />)}
      </div>
    </div>
  );
}

function HighlightsTab({ products, publishProduct }: { products: PublicProduct[]; publishProduct: (product: PublicProduct) => Promise<void> }) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header><h1 className="text-3xl font-bold uppercase tracking-tight">Destaques e Vitrine</h1><p className="text-sm text-neutral-500">Produtos publicados e destacados.</p></header>
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {products.map((product) => (
          <div key={product.id} className="flex items-center justify-between border-b border-neutral-100 p-4">
            <div className="flex items-center gap-3"><img src={product.imageUrl || '/assets/pulsefit-logo-transparent.png'} alt={product.title} className="h-12 w-12 rounded-lg object-cover" /><strong>{product.title}</strong></div>
            <button onClick={() => publishProduct(product)} className="rounded-lg bg-purple-50 px-3 py-2 text-xs font-bold text-purple-700">{product.catalogStatus === 'live' ? 'Remover da vitrine' : 'Publicar'}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrdersTab({ orders }: { orders: OrderRow[] }) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header><h1 className="text-3xl font-bold uppercase tracking-tight">Pedidos</h1><p className="text-sm text-neutral-500">Acompanhe pedidos recebidos pelo catalogo.</p></header>
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full text-left">
          <thead><tr className="bg-neutral-50 text-xs font-bold uppercase tracking-widest text-neutral-500"><th className="p-4">Pedido</th><th className="p-4">Cliente</th><th className="p-4">Status</th><th className="p-4">Total</th></tr></thead>
          <tbody>{orders.map((order) => <tr key={order.id} className="border-b border-neutral-100"><td className="p-4 font-bold">{order.orderCode}</td><td className="p-4">{order.customerName}</td><td className="p-4">{order.status}</td><td className="p-4">{formatCurrency(order.totalAmount)}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

function SettingsTab({ tenantSlug }: { tenantSlug: string }) {
  return (
    <div className="mx-auto max-w-5xl rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-bold uppercase tracking-tight">Configuracoes</h1>
      <p className="mt-2 text-sm text-neutral-500">Identidade da loja, WhatsApp, tema e dominio entram nesta area.</p>
      <Link to={`/loja/${tenantSlug}/catalogo`} className="mt-6 inline-flex rounded-xl bg-neutral-900 px-5 py-3 text-sm font-bold text-white">Abrir loja publica</Link>
    </div>
  );
}

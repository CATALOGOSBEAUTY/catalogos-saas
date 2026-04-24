import { type Dispatch, type FormEvent, type SetStateAction, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  CreditCard,
  Eye,
  Image,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Plus,
  Save,
  Search,
  Settings,
  ShoppingBag,
  Star,
  Tag,
  Trash2,
  X
} from 'lucide-react';
import {
  api,
  type ClientBillingSummary,
  type ClientUsage,
  type OrderRow,
  type PlatformModule,
  type PublicCategory,
  type PublicProduct,
  type PublicSettings
} from '../../services/apiClient';

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

interface ProductDraft {
  title: string;
  categoryId: string;
  price: string;
  stockQuantity: string;
  description: string;
  imageFile: File | null;
}

interface ProductEdit {
  title: string;
  categoryId: string;
  price: string;
  stockQuantity: string;
  description: string;
  isFeatured: boolean;
}

type ClientTab = 'dashboard' | 'produtos' | 'categorias' | 'midia' | 'destaques' | 'pedidos' | 'faturamento' | 'configuracoes';

const navItems: Array<{ tab: ClientTab; label: string; icon: typeof LayoutDashboard }> = [
  { tab: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { tab: 'produtos', label: 'Produtos', icon: Package },
  { tab: 'categorias', label: 'Categorias', icon: Tag },
  { tab: 'midia', label: 'Midia e Imagens', icon: Image },
  { tab: 'destaques', label: 'Destaques', icon: Star },
  { tab: 'pedidos', label: 'Pedidos', icon: ShoppingBag },
  { tab: 'faturamento', label: 'Plano e Faturas', icon: CreditCard },
  { tab: 'configuracoes', label: 'Configuracoes', icon: Settings }
];

const orderStatuses: Array<OrderRow['status']> = ['new', 'confirmed', 'paid', 'sent', 'cancelled'];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(value?: string) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value));
}

function limitLabel(limit: number) {
  return limit >= 99999 ? 'Ilimitado' : String(limit);
}

function orderStatusLabel(status: OrderRow['status']) {
  const labels: Record<OrderRow['status'], string> = {
    new: 'Novo',
    confirmed: 'Confirmado',
    paid: 'Pago',
    sent: 'Enviado',
    cancelled: 'Cancelado'
  };
  return labels[status];
}

function invoiceStatusLabel(status: string) {
  const labels: Record<string, string> = {
    open: 'Aberta',
    paid: 'Paga',
    overdue: 'Vencida',
    cancelled: 'Cancelada',
    refunded: 'Estornada'
  };
  return labels[status] ?? status;
}

function productEditsFrom(products: PublicProduct[]): Record<string, ProductEdit> {
  return Object.fromEntries(
    products.map((product) => [
      product.id,
      {
        title: product.title,
        categoryId: product.categoryId,
        price: String(product.price),
        stockQuantity: String(product.stockQuantity),
        description: product.description,
        isFeatured: product.isFeatured
      }
    ])
  );
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
  const [usage, setUsage] = useState<ClientUsage | null>(null);
  const [billing, setBilling] = useState<ClientBillingSummary | null>(null);
  const [modules, setModules] = useState<PlatformModule[]>([]);
  const [settingsDraft, setSettingsDraft] = useState<PublicSettings | null>(null);
  const [productEdits, setProductEdits] = useState<Record<string, ProductEdit>>({});
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [bulkStockValue, setBulkStockValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [productDraft, setProductDraft] = useState<ProductDraft>({
    title: '',
    categoryId: '',
    price: '',
    stockQuantity: '',
    description: '',
    imageFile: null
  });

  async function loadDashboard() {
    const [dashboardPayload, productsPayload, categoriesPayload, ordersPayload, usagePayload, settingsPayload, billingPayload, modulesPayload] = await Promise.all([
      api.clientDashboard() as Promise<DashboardPayload>,
      api.clientProducts(),
      api.clientCategories(),
      api.clientOrders(),
      api.clientUsage(),
      api.clientPublicSettings(),
      api.clientBillingSubscription(),
      api.clientModules()
    ]);
    setDashboard(dashboardPayload);
    setProducts(productsPayload);
    setCategories(categoriesPayload);
    setOrders(ordersPayload);
    setUsage(usagePayload);
    setSettingsDraft(settingsPayload);
    setBilling(billingPayload);
    setModules(modulesPayload);
    setProductEdits(productEditsFrom(productsPayload));
    setSelectedProductIds((current) => current.filter((id) => productsPayload.some((product) => product.id === id)));
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

  async function saveProduct(product: PublicProduct) {
    const edit = productEdits[product.id];
    if (!edit) return;
    const price = Number(edit.price);
    const stockQuantity = Number(edit.stockQuantity);
    if (!edit.title.trim() || !Number.isFinite(price) || price < 0 || !Number.isInteger(stockQuantity) || stockQuantity < 0) {
      setStatus('Revise nome, preco e estoque antes de salvar.');
      return;
    }
    setStatus(null);
    try {
      await api.updateClientProduct(product.id, {
        title: edit.title,
        categoryId: edit.categoryId,
        description: edit.description,
        price,
        stockQuantity,
        isFeatured: edit.isFeatured
      });
      await loadDashboard();
      setStatus('Produto atualizado.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Falha ao atualizar produto.');
    }
  }

  async function publishProduct(product: PublicProduct) {
    setStatus(null);
    try {
      await api.updateClientProductStatus(product.id, {
        isActive: true,
        catalogStatus: product.catalogStatus === 'live' ? 'draft' : 'live'
      });
      await loadDashboard();
      setStatus(product.catalogStatus === 'live' ? 'Produto voltou para rascunho.' : 'Produto publicado.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Falha ao alterar status.');
    }
  }

  async function deleteProduct(productId: string) {
    setStatus(null);
    try {
      await api.deleteClientProduct(productId);
      await loadDashboard();
      setStatus('Produto excluido.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Falha ao excluir produto.');
    }
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

  async function bulkUpdateStock(scope: 'selected' | 'filtered') {
    const stockQuantity = Number(bulkStockValue);
    const productIds = scope === 'selected' ? selectedProductIds : filteredProducts.map((product) => product.id);
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0 || productIds.length === 0) {
      setStatus('Informe um estoque valido e selecione ao menos um produto.');
      return;
    }
    setStatus(null);
    try {
      const result = await api.bulkUpdateProductStock(productIds, stockQuantity);
      await loadDashboard();
      setStatus(`${result.updatedCount} produto(s) atualizados.`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Falha ao atualizar estoque.');
    }
  }

  async function updateOrderStatus(orderId: string, nextStatus: OrderRow['status']) {
    setStatus(null);
    try {
      await api.updateClientOrderStatus(orderId, nextStatus);
      await loadDashboard();
      setStatus('Status do pedido atualizado.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Falha ao atualizar pedido.');
    }
  }

  async function saveSettings(event: FormEvent) {
    event.preventDefault();
    if (!settingsDraft) return;
    setStatus(null);
    try {
      await api.updateClientPublicSettings(settingsDraft);
      await loadDashboard();
      setStatus('Configuracoes publicas salvas.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Falha ao salvar configuracoes.');
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
          {activeTab === 'dashboard' ? <DashboardTab dashboard={dashboard} products={products} usage={usage} /> : null}
          {activeTab === 'produtos' ? (
            <ProductsTab
              products={filteredProducts}
              categories={categories}
              productDraft={productDraft}
              setProductDraft={setProductDraft}
              productEdits={productEdits}
              setProductEdits={setProductEdits}
              selectedProductIds={selectedProductIds}
              setSelectedProductIds={setSelectedProductIds}
              bulkStockValue={bulkStockValue}
              setBulkStockValue={setBulkStockValue}
              createProduct={createProduct}
              saveProduct={saveProduct}
              publishProduct={publishProduct}
              deleteProduct={deleteProduct}
              bulkUpdateStock={bulkUpdateStock}
              status={status}
            />
          ) : null}
          {activeTab === 'categorias' ? <CategoriesTab categories={categories} categoryName={categoryName} setCategoryName={setCategoryName} createCategory={createCategory} deleteCategory={deleteCategory} status={status} /> : null}
          {activeTab === 'midia' ? <MediaTab products={products} /> : null}
          {activeTab === 'destaques' ? <HighlightsTab products={products} publishProduct={publishProduct} /> : null}
          {activeTab === 'pedidos' ? <OrdersTab orders={orders} updateOrderStatus={updateOrderStatus} status={status} /> : null}
          {activeTab === 'faturamento' ? <BillingTab usage={usage} billing={billing} invoices={billing?.openInvoices ?? []} modules={modules} /> : null}
          {activeTab === 'configuracoes' ? <SettingsTab tenantSlug={dashboard.tenant.slug} settingsDraft={settingsDraft} setSettingsDraft={setSettingsDraft} saveSettings={saveSettings} status={status} /> : null}
        </main>
      </div>
    </div>
  );
}

function DashboardTab({ dashboard, products, usage }: { dashboard: DashboardPayload; products: PublicProduct[]; usage: ClientUsage | null }) {
  const stats = [
    { label: 'Total de Produtos', value: dashboard.metrics.productsTotal, icon: Package, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Produtos Publicados', value: dashboard.metrics.productsLive, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Pedidos', value: dashboard.metrics.ordersTotal, icon: BarChart3, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Receita', value: formatCurrency(dashboard.metrics.revenueTotal), icon: Star, color: 'text-amber-600', bg: 'bg-amber-100' }
  ];
  const productUsage = usage ? Math.round((usage.products.used / Math.max(usage.products.limit, 1)) * 100) : 0;
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 pb-6">
      <header>
        <h1 className="text-2xl font-bold uppercase tracking-tight text-neutral-900 md:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500">Visao geral do catalogo, plano e operacao.</p>
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
      {usage ? (
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-neutral-900">Plano {usage.plan.name}</h2>
              <p className="text-sm text-neutral-500">{usage.products.used} de {limitLabel(usage.products.limit)} produtos usados.</p>
            </div>
            <strong className="text-2xl font-bold text-purple-700">{formatCurrency(usage.plan.priceMonthly)} / mes</strong>
          </div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-neutral-100">
            <div className="h-full rounded-full bg-gradient-to-r from-purple-800 to-purple-500" style={{ width: `${Math.min(productUsage, 100)}%` }} />
          </div>
        </section>
      ) : null}
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
  productEdits,
  setProductEdits,
  selectedProductIds,
  setSelectedProductIds,
  bulkStockValue,
  setBulkStockValue,
  createProduct,
  saveProduct,
  publishProduct,
  deleteProduct,
  bulkUpdateStock,
  status
}: {
  products: PublicProduct[];
  categories: PublicCategory[];
  productDraft: ProductDraft;
  setProductDraft: Dispatch<SetStateAction<ProductDraft>>;
  productEdits: Record<string, ProductEdit>;
  setProductEdits: Dispatch<SetStateAction<Record<string, ProductEdit>>>;
  selectedProductIds: string[];
  setSelectedProductIds: Dispatch<SetStateAction<string[]>>;
  bulkStockValue: string;
  setBulkStockValue: (value: string) => void;
  createProduct: (event: FormEvent) => Promise<void>;
  saveProduct: (product: PublicProduct) => Promise<void>;
  publishProduct: (product: PublicProduct) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  bulkUpdateStock: (scope: 'selected' | 'filtered') => Promise<void>;
  status: string | null;
}) {
  const visibleIds = products.map((product) => product.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedProductIds.includes(id));

  function toggleAllVisible() {
    setSelectedProductIds((current) => {
      if (allVisibleSelected) return current.filter((id) => !visibleIds.includes(id));
      return Array.from(new Set([...current, ...visibleIds]));
    });
  }

  function toggleSelected(productId: string) {
    setSelectedProductIds((current) => (current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]));
  }

  function updateEdit(productId: string, patch: Partial<ProductEdit>) {
    setProductEdits((current) => ({
      ...current,
      [productId]: {
        ...current[productId],
        ...patch
      }
    }));
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 pb-20">
      <header>
        <h1 className="text-2xl font-bold uppercase tracking-tight text-neutral-900 md:text-3xl">Produtos</h1>
        <p className="mt-1 text-sm text-neutral-500">Gerencie catalogo, estoque, status, destaque e imagens.</p>
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
      <section className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-700">Estoque em massa</h2>
          <p className="text-xs text-neutral-500">{selectedProductIds.length} selecionado(s). Tambem pode aplicar em todos os produtos filtrados.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input value={bulkStockValue} onChange={(event) => setBulkStockValue(event.target.value)} type="number" min="0" step="1" placeholder="Novo estoque" className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm outline-none focus:border-purple-500" />
          <button onClick={() => bulkUpdateStock('selected')} className="rounded-xl bg-purple-50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-purple-700">Selecionados</button>
          <button onClick={() => bulkUpdateStock('filtered')} className="rounded-xl bg-neutral-900 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white">Todos filtrados</button>
        </div>
      </section>
      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full min-w-[1040px] border-collapse text-left">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-xs font-bold uppercase tracking-widest text-neutral-500">
              <th className="p-4"><input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} /></th>
              <th className="p-4">Produto</th>
              <th className="p-4">Categoria</th>
              <th className="p-4">Preco</th>
              <th className="p-4">Estoque</th>
              <th className="p-4">Status</th>
              <th className="p-4">Destaque</th>
              <th className="p-4 text-right">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const edit = productEdits[product.id] ?? {
                title: product.title,
                categoryId: product.categoryId,
                price: String(product.price),
                stockQuantity: String(product.stockQuantity),
                description: product.description,
                isFeatured: product.isFeatured
              };
              return (
                <tr key={product.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                  <td className="p-4 align-top"><input type="checkbox" checked={selectedProductIds.includes(product.id)} onChange={() => toggleSelected(product.id)} /></td>
                  <td className="p-4 align-top">
                    <div className="flex min-w-[260px] items-start gap-3">
                      <img src={product.imageUrl || '/assets/pulsefit-logo-transparent.png'} alt={product.title} className="h-12 w-12 rounded-lg object-cover" />
                      <div className="grid flex-1 gap-2">
                        <input value={edit.title} onChange={(event) => updateEdit(product.id, { title: event.target.value })} className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-bold text-neutral-900 outline-none focus:border-purple-500" />
                        <textarea value={edit.description} onChange={(event) => updateEdit(product.id, { description: event.target.value })} className="h-16 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-600 outline-none focus:border-purple-500" />
                        <span className="text-[11px] text-neutral-400">/{product.slug}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 align-top">
                    <select value={edit.categoryId} onChange={(event) => updateEdit(product.id, { categoryId: event.target.value })} className="w-40 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-purple-500">
                      {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                    </select>
                  </td>
                  <td className="p-4 align-top">
                    <input value={edit.price} onChange={(event) => updateEdit(product.id, { price: event.target.value })} type="number" min="0" step="0.01" className="w-28 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-purple-500" />
                  </td>
                  <td className="p-4 align-top">
                    <input value={edit.stockQuantity} onChange={(event) => updateEdit(product.id, { stockQuantity: event.target.value })} type="number" min="0" step="1" className="w-24 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-purple-500" />
                  </td>
                  <td className="p-4 align-top"><span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold uppercase text-neutral-600">{product.catalogStatus}</span></td>
                  <td className="p-4 align-top">
                    <label className="inline-flex items-center gap-2 text-xs font-bold text-neutral-600">
                      <input type="checkbox" checked={edit.isFeatured} onChange={(event) => updateEdit(product.id, { isFeatured: event.target.checked })} />
                      Destaque
                    </label>
                  </td>
                  <td className="p-4 align-top text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => saveProduct(product)} className="rounded-lg bg-neutral-900 p-2 text-white"><Save className="h-4 w-4" /></button>
                      <button onClick={() => publishProduct(product)} className="rounded-lg bg-purple-50 px-3 py-2 text-xs font-bold text-purple-700">{product.catalogStatus === 'live' ? 'Rascunho' : 'Publicar'}</button>
                      <button onClick={() => deleteProduct(product.id)} className="rounded-lg bg-red-50 p-2 text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
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
            <div className="flex items-center gap-3">
              {product.isFeatured ? <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold uppercase text-amber-700">Destaque</span> : null}
              <button onClick={() => publishProduct(product)} className="rounded-lg bg-purple-50 px-3 py-2 text-xs font-bold text-purple-700">{product.catalogStatus === 'live' ? 'Remover da vitrine' : 'Publicar'}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrdersTab({ orders, updateOrderStatus, status }: { orders: OrderRow[]; updateOrderStatus: (orderId: string, status: OrderRow['status']) => Promise<void>; status: string | null }) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header><h1 className="text-3xl font-bold uppercase tracking-tight">Pedidos</h1><p className="text-sm text-neutral-500">Acompanhe pedidos recebidos pelo catalogo.</p></header>
      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full min-w-[760px] text-left">
          <thead><tr className="bg-neutral-50 text-xs font-bold uppercase tracking-widest text-neutral-500"><th className="p-4">Pedido</th><th className="p-4">Cliente</th><th className="p-4">Status</th><th className="p-4">Data</th><th className="p-4">Total</th></tr></thead>
          <tbody>{orders.map((order) => (
            <tr key={order.id} className="border-b border-neutral-100">
              <td className="p-4 font-bold">{order.orderCode}</td>
              <td className="p-4">{order.customerName}</td>
              <td className="p-4">
                <select value={order.status} onChange={(event) => updateOrderStatus(order.id, event.target.value as OrderRow['status'])} className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-purple-500">
                  {orderStatuses.map((item) => <option key={item} value={item}>{orderStatusLabel(item)}</option>)}
                </select>
              </td>
              <td className="p-4 text-neutral-500">{formatDate(order.createdAt)}</td>
              <td className="p-4">{formatCurrency(order.totalAmount)}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {status ? <p className="text-sm font-bold text-purple-700">{status}</p> : null}
    </div>
  );
}

function BillingTab({ usage, billing, invoices, modules }: { usage: ClientUsage | null; billing: ClientBillingSummary | null; invoices: ClientBillingSummary['openInvoices']; modules: PlatformModule[] }) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header><h1 className="text-3xl font-bold uppercase tracking-tight">Plano e Faturas</h1><p className="text-sm text-neutral-500">Limites, assinatura, faturas abertas e modulos contratados.</p></header>
      <div className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm lg:col-span-1">
          <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Plano atual</p>
          <h2 className="mt-2 text-2xl font-bold text-neutral-900">{billing?.plan.name ?? usage?.plan.name ?? '-'}</h2>
          <strong className="mt-4 block text-3xl text-purple-700">{formatCurrency(billing?.plan.priceMonthly ?? usage?.plan.priceMonthly ?? 0)}</strong>
          <p className="mt-2 text-sm text-neutral-500">Status: {billing?.subscription.status ?? '-'}</p>
        </article>
        <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm lg:col-span-2">
          <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Limites</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <MetricPill label="Produtos" value={`${usage?.products.used ?? 0}/${limitLabel(usage?.products.limit ?? 0)}`} />
            <MetricPill label="Usuarios" value={`${usage?.users.used ?? 0}/${limitLabel(usage?.users.limit ?? 0)}`} />
            <MetricPill label="Storage" value={`${usage?.storage.usedMb ?? 0}/${usage?.storage.limitMb ?? 0} MB`} />
          </div>
        </article>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-neutral-900">Faturas abertas</h2>
          <div className="grid gap-3">
            {invoices.length === 0 ? <p className="text-sm text-neutral-500">Nenhuma fatura aberta.</p> : null}
            {invoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50 p-4">
                <div>
                  <strong>{formatCurrency(invoice.amount)}</strong>
                  <p className="text-xs text-neutral-500">Vence em {formatDate(invoice.dueDate)}</p>
                </div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold uppercase text-amber-700">{invoiceStatusLabel(invoice.status)}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-neutral-900">Modulos da plataforma</h2>
          <div className="grid gap-3">
            {modules.map((moduleItem) => (
              <div key={moduleItem.id} className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50 p-4">
                <div>
                  <strong>{moduleItem.name}</strong>
                  <p className="text-xs text-neutral-500">{moduleItem.description}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${moduleItem.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'}`}>{moduleItem.enabled ? 'Ativo' : formatCurrency(moduleItem.priceMonthly)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">{label}</p>
      <strong className="mt-1 block text-lg text-neutral-900">{value}</strong>
    </div>
  );
}

function SettingsTab({
  tenantSlug,
  settingsDraft,
  setSettingsDraft,
  saveSettings,
  status
}: {
  tenantSlug: string;
  settingsDraft: PublicSettings | null;
  setSettingsDraft: Dispatch<SetStateAction<PublicSettings | null>>;
  saveSettings: (event: FormEvent) => Promise<void>;
  status: string | null;
}) {
  if (!settingsDraft) return null;
  function patch(field: keyof PublicSettings, value: string) {
    setSettingsDraft((current) => (current ? { ...current, [field]: value } : current));
  }
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 pb-20">
      <header>
        <h1 className="text-3xl font-bold uppercase tracking-tight">Configuracoes</h1>
        <p className="mt-2 text-sm text-neutral-500">Identidade publica, WhatsApp, tema e SEO basico do catalogo.</p>
      </header>
      <form onSubmit={saveSettings} className="grid gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm lg:grid-cols-2">
        <InputField label="Nome publico" value={settingsDraft.publicName} onChange={(value) => patch('publicName', value)} />
        <InputField label="WhatsApp" value={settingsDraft.whatsappPhone ?? ''} onChange={(value) => patch('whatsappPhone', value)} />
        <InputField label="Instagram" value={settingsDraft.instagramUrl ?? ''} onChange={(value) => patch('instagramUrl', value)} />
        <InputField label="Logo URL" value={settingsDraft.logoUrl ?? ''} onChange={(value) => patch('logoUrl', value)} />
        <InputField label="Imagem de capa URL" value={settingsDraft.coverUrl ?? ''} onChange={(value) => patch('coverUrl', value)} />
        <InputField label="Endereco" value={settingsDraft.address ?? ''} onChange={(value) => patch('address', value)} />
        <InputField label="Horario de atendimento" value={settingsDraft.businessHours ?? ''} onChange={(value) => patch('businessHours', value)} />
        <InputField label="Titulo SEO" value={settingsDraft.seoTitle ?? ''} onChange={(value) => patch('seoTitle', value)} />
        <div className="lg:col-span-2">
          <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-neutral-500">Descricao</label>
          <textarea value={settingsDraft.description} onChange={(event) => patch('description', event.target.value)} className="h-24 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:border-purple-500" />
        </div>
        <InputField label="Hero badge" value={settingsDraft.heroBadge} onChange={(value) => patch('heroBadge', value)} />
        <InputField label="Botao do hero" value={settingsDraft.heroButtonLabel} onChange={(value) => patch('heroButtonLabel', value)} />
        <InputField label="Titulo do hero" value={settingsDraft.heroTitle} onChange={(value) => patch('heroTitle', value)} />
        <InputField label="Subtitulo do hero" value={settingsDraft.heroSubtitle} onChange={(value) => patch('heroSubtitle', value)} />
        <div className="grid gap-3 sm:grid-cols-3 lg:col-span-2">
          <ColorField label="Primaria" value={settingsDraft.primaryColor} onChange={(value) => patch('primaryColor', value)} />
          <ColorField label="Secundaria" value={settingsDraft.secondaryColor} onChange={(value) => patch('secondaryColor', value)} />
          <ColorField label="Destaque" value={settingsDraft.accentColor} onChange={(value) => patch('accentColor', value)} />
        </div>
        <div className="flex flex-col gap-3 border-t border-neutral-100 pt-5 sm:flex-row lg:col-span-2">
          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-bold text-white">
            <Save className="h-4 w-4" />
            Salvar configuracoes
          </button>
          <Link to={`/loja/${tenantSlug}/catalogo`} className="inline-flex items-center justify-center rounded-xl bg-purple-50 px-5 py-3 text-sm font-bold text-purple-700">Abrir loja publica</Link>
        </div>
      </form>
      {status ? <p className="text-sm font-bold text-purple-700">{status}</p> : null}
    </div>
  );
}

function InputField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-neutral-500">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:border-purple-500" />
    </label>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-neutral-500">{label}</span>
      <div className="flex gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-2">
        <input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-9 w-12 rounded border-0 bg-transparent" />
        <input value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
      </div>
    </label>
  );
}

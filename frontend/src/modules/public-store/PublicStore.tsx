import { AnimatePresence, motion } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Instagram,
  Menu,
  Minus,
  PackageX,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Trash2,
  X
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api, type PublicBootstrap, type PublicProduct, type PublicVariant } from '../../services/apiClient';

interface CartItem {
  key: string;
  product: PublicProduct;
  variant?: PublicVariant | null;
  quantity: number;
}

type PublicTab = 'inicio' | 'catalogo' | 'contato';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function productImage(product: PublicProduct): string {
  return product.imageUrl || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=900&q=80';
}

function cartKey(product: PublicProduct, variant?: PublicVariant | null): string {
  return variant?.id ? `${product.id}:${variant.id}` : product.id;
}

export function PublicStore() {
  const { companySlug = 'pulsefit', '*': restPath = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [bootstrap, setBootstrap] = useState<PublicBootstrap | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<'relevance' | 'price-asc' | 'price-desc'>('relevance');
  const [currentPage, setCurrentPage] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const productSlug = restPath.startsWith('produto/') ? restPath.replace('produto/', '') : null;
  const activeTab: PublicTab = productSlug ? 'catalogo' : restPath.startsWith('inicio') ? 'inicio' : restPath.startsWith('contato') ? 'contato' : 'catalogo';
  const activeProduct = productSlug ? bootstrap?.products.find((product) => product.slug === productSlug || product.id === productSlug) ?? null : null;

  useEffect(() => {
    let mounted = true;
    api
      .getPublicBootstrap(companySlug)
      .then((payload) => {
        if (!mounted) return;
        setBootstrap(payload);
        setStatus(null);
      })
      .catch((error: Error) => {
        if (!mounted) return;
        setStatus(error.message);
      });
    return () => {
      mounted = false;
    };
  }, [companySlug]);

  useEffect(() => {
    setCurrentPage(1);
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [activeCategory, searchTerm, sortOption, location.pathname]);

  const filteredProducts = useMemo(() => {
    const products = bootstrap?.products ?? [];
    const filtered = products.filter((product) => {
      const matchesCategory = activeCategory ? product.categoryId === activeCategory : true;
      const search = `${product.title} ${product.description}`.toLowerCase();
      return matchesCategory && search.includes(searchTerm.toLowerCase());
    });
    return filtered.sort((a, b) => {
      if (sortOption === 'price-asc') return a.price - b.price;
      if (sortOption === 'price-desc') return b.price - a.price;
      return Number(b.isFeatured) - Number(a.isFeatured);
    });
  }, [activeCategory, bootstrap?.products, searchTerm, sortOption]);

  const itemsPerPage = 8;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  function goToTab(tab: PublicTab) {
    navigate(`/loja/${companySlug}/${tab}`);
  }

  function openProduct(product: PublicProduct) {
    navigate(`/loja/${companySlug}/produto/${product.slug || product.id}`);
  }

  function addToCart(product: PublicProduct, variant?: PublicVariant | null, quantity = 1) {
    const key = cartKey(product, variant);
    setCart((items) => {
      const existing = items.find((item) => item.key === key);
      if (existing) {
        return items.map((item) => (item.key === key ? { ...item, quantity: item.quantity + quantity } : item));
      }
      return [...items, { key, product, variant, quantity }];
    });
    setIsCartOpen(true);
  }

  function updateQuantity(key: string, quantity: number) {
    if (quantity <= 0) {
      setCart((items) => items.filter((item) => item.key !== key));
      return;
    }
    setCart((items) => items.map((item) => (item.key === key ? { ...item, quantity } : item)));
  }

  if (!bootstrap) {
    return (
      <main className="grid min-h-screen place-items-center bg-neutral-50 p-8 text-center text-neutral-500">
        {status ?? 'Carregando catalogo...'}
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 selection:bg-purple-200">
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-neutral-200 bg-white/80 px-6 backdrop-blur-md lg:px-16">
        <button className="flex items-center gap-2" onClick={() => goToTab('inicio')}>
          <img src="/assets/pulsefit-logo-transparent.png" alt={bootstrap.settings.publicName} className="h-10 w-36 object-contain object-left" />
        </button>
        <nav className="hidden gap-8 text-sm font-medium uppercase tracking-wider text-neutral-500 md:flex">
          {(['inicio', 'catalogo', 'contato'] as const).map((tab) => (
            <button key={tab} onClick={() => goToTab(tab)} className={activeTab === tab ? 'font-bold text-purple-700' : 'hover:text-purple-600'}>
              {tab === 'inicio' ? 'Inicio' : tab === 'catalogo' ? 'Catalogo' : 'Contato'}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsCartOpen(true)} className="relative p-2 text-neutral-500 transition-colors hover:text-purple-700">
            <ShoppingCart className="h-6 w-6" />
            {cartCount > 0 ? (
              <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-purple-800 to-purple-500 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            ) : null}
          </button>
          <Link to="/cliente/login" className="hidden rounded-lg bg-gradient-to-r from-purple-800 to-purple-500 px-5 py-2 text-xs font-bold uppercase tracking-tight text-white shadow-md shadow-purple-500/20 transition-all hover:from-purple-700 hover:to-purple-400 sm:flex">
            Painel Cliente
          </Link>
        </div>
      </header>

      {activeTab === 'inicio' ? (
        <section className="relative flex min-h-[calc(100vh-4rem)] flex-col overflow-hidden bg-white">
          <div className="absolute inset-0 bg-white">
            <video autoPlay loop muted playsInline className="h-full w-full object-cover opacity-[0.18] grayscale mix-blend-multiply">
              <source src="https://videos.pexels.com/video-files/6550881/6550881-uhd_2560_1440_30fps.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-purple-100/35" />
            <div className="dot-pattern absolute inset-0 opacity-60" />
          </div>
          <div className="container relative z-10 mx-auto flex flex-1 flex-col justify-center px-6 pb-52 pt-12 lg:px-16 lg:pb-32">
            <div className="max-w-2xl">
              <span className="mb-4 inline-flex items-center gap-2 rounded bg-purple-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-purple-800 ring-1 ring-purple-200">
                <Sparkles className="h-3.5 w-3.5" />
                {bootstrap.hero.badge || 'Catalogo Fitness Premium'}
              </span>
              <h1 className="mb-6 text-[36px] font-bold uppercase leading-[1.05] tracking-tight text-neutral-900 md:text-[64px]">
                {bootstrap.hero.title || 'Performance pronta para o '}
                <span className="bg-gradient-to-r from-purple-800 to-purple-500 bg-clip-text text-transparent">seu treino.</span>
              </h1>
              <p className="mb-5 max-w-xl text-sm font-medium leading-relaxed text-neutral-600 md:text-base">
                {bootstrap.hero.subtitle || bootstrap.settings.description}
              </p>
              <div className="mb-8 flex flex-wrap gap-2">
                {['Moda Fitness', 'Performance', 'Suplementos', 'Acessorios'].map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white/85 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-700 shadow-sm">
                    <Dumbbell className="h-3 w-3 text-purple-600" />
                    {item}
                  </span>
                ))}
              </div>
              <button onClick={() => goToTab('catalogo')} className="flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-800 to-purple-500 px-6 py-3.5 text-sm font-bold uppercase tracking-tight text-white shadow-[0_8px_32px_rgba(168,85,247,0.3)] transition-all hover:scale-105 hover:from-purple-700 hover:to-purple-400">
                <ShoppingBag className="h-5 w-5" />
                {bootstrap.hero.buttonLabel || 'Ver Catalogo'}
              </button>
            </div>
          </div>
          <div className="absolute bottom-4 right-4 z-20 w-[220px] lg:bottom-8 lg:right-16 lg:w-[280px]">
            <div className="bento-card flex flex-col gap-3 bg-white/90 p-3.5 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-purple-200 bg-purple-100 text-purple-700">
                  <Instagram className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-tight text-neutral-900">Siga a loja</h3>
                  <p className="hidden text-[10px] font-medium leading-tight text-neutral-500 sm:block">Novidades, looks e ofertas.</p>
                </div>
              </div>
              <button onClick={() => window.open(bootstrap.settings.instagramUrl || 'https://www.instagram.com/', '_blank', 'noopener,noreferrer')} className="rounded-lg border border-neutral-200 bg-neutral-100 px-4 py-2 text-[11px] font-bold uppercase text-neutral-900 transition-colors hover:border-purple-300 hover:bg-purple-50 hover:text-purple-800">
                Instagram
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === 'catalogo' && !productSlug ? (
        <section className="relative flex min-h-[calc(100vh-4rem)] overflow-hidden bg-neutral-50/50">
          <div className="dot-pattern pointer-events-none absolute inset-0 opacity-60" />
          {isSidebarOpen ? <div className="fixed inset-0 z-40 bg-neutral-900/50 backdrop-blur-sm lg:hidden" onClick={() => setIsSidebarOpen(false)} /> : null}
          <aside className={`fixed inset-y-0 left-0 z-50 h-screen w-72 overflow-hidden border-r border-neutral-200 bg-white transition-all duration-300 lg:static lg:w-64 ${isSidebarOpen ? 'translate-x-0 shadow-2xl lg:shadow-none' : '-translate-x-full lg:translate-x-0'}`}>
            <div className="flex h-full flex-col overflow-y-auto p-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Categorias</h3>
                <button onClick={() => setIsSidebarOpen(false)} className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-purple-700 lg:hidden">
                  <X className="h-3.5 w-3.5" /> Fechar
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => setActiveCategory(null)} className={`rounded-lg px-4 py-2 text-left text-sm transition-colors ${activeCategory === null ? 'bg-purple-100 font-bold text-purple-800 shadow-sm' : 'text-neutral-600 hover:bg-purple-50 hover:text-purple-800'}`}>
                  Todos os Itens
                </button>
                {bootstrap.categories.map((category) => (
                  <button key={category.id} onClick={() => setActiveCategory(category.id)} className={`rounded-lg px-4 py-2 text-left text-sm transition-colors ${activeCategory === category.id ? 'bg-purple-100 font-bold text-purple-800 shadow-sm' : 'text-neutral-600 hover:bg-purple-50 hover:text-purple-800'}`}>
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="custom-scrollbar relative z-10 flex h-full flex-1 flex-col overflow-y-auto p-4 lg:p-12">
            <header className="mb-6 flex flex-col gap-4 lg:mb-10 lg:gap-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-4">
                  <button onClick={() => setIsSidebarOpen(true)} className="mt-1 flex shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white p-2 text-neutral-600 shadow-sm transition-colors hover:text-purple-600 lg:hidden">
                    <Menu className="h-5 w-5" />
                  </button>
                  <div>
                    <h2 className="mb-1 text-2xl font-bold uppercase tracking-tight text-neutral-900 lg:text-4xl">
                      Moda <span className="bg-gradient-to-r from-purple-800 to-purple-500 bg-clip-text text-transparent">Fitness</span>
                    </h2>
                    <p className="text-xs text-neutral-500 lg:text-sm">Mais do que roupa, e um estilo de vida.</p>
                  </div>
                </div>
                <div className="w-full lg:w-[260px]">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">Ordenar por</label>
                  <select value={sortOption} onChange={(event) => setSortOption(event.target.value as typeof sortOption)} className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500">
                    <option value="relevance">Mais Relevante</option>
                    <option value="price-asc">Menor Preco</option>
                    <option value="price-desc">Maior Preco</option>
                  </select>
                </div>
              </div>
              <div className="relative w-full lg:w-96">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar por nome ou descricao..." className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-9 pr-4 text-sm shadow-sm outline-none transition-colors focus:border-purple-500 focus:ring-1 focus:ring-purple-500" />
              </div>
            </header>

            {paginatedProducts.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-white p-8 text-center shadow-sm">
                <PackageX className="mb-4 h-12 w-12 text-purple-300" />
                <h3 className="mb-2 text-lg font-bold uppercase tracking-wide text-neutral-800">Catalogo vazio</h3>
                <p className="max-w-md text-sm text-neutral-500">Nenhum produto encontrado nesta selecao.</p>
              </div>
            ) : (
              <div className="flex flex-1 flex-col">
                <div className="mb-10 grid content-start gap-4 border-t border-neutral-200 pt-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {paginatedProducts.map((product) => (
                    <motion.article key={product.id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} onClick={() => openProduct(product)} className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-all duration-300 hover:-translate-y-1.5 hover:border-purple-600 hover:shadow-xl hover:shadow-purple-500/10">
                      <div className="relative aspect-square overflow-hidden border-b border-neutral-100 bg-neutral-100">
                        <img src={productImage(product)} alt={product.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
                        <span className="absolute left-3 top-3 rounded bg-gradient-to-r from-purple-800 to-purple-500 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-white shadow-sm">
                          {product.isFeatured ? 'Destaque' : 'Produto'}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        <h3 className="mb-2 text-base font-bold leading-tight text-neutral-900 transition-colors group-hover:text-purple-700">{product.title}</h3>
                        <p className="line-clamp-3 mb-4 flex-1 text-xs text-neutral-500">{product.description}</p>
                        <div className="mt-auto flex items-end justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Por apenas</span>
                            <strong className="block bg-gradient-to-r from-purple-800 to-purple-500 bg-clip-text text-lg text-transparent">{formatCurrency(product.price)}</strong>
                          </div>
                          <button onClick={(event) => { event.stopPropagation(); product.variantsEnabled && product.variants.length > 0 ? openProduct(product) : addToCart(product); }} className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-purple-800 to-purple-500 text-white shadow-md shadow-purple-500/20 transition-all hover:scale-105">
                            <ShoppingCart className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </div>
                {totalPages > 1 ? (
                  <div className="mt-auto flex items-center justify-center gap-4 border-t border-neutral-200 pt-6">
                    <button onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="rounded-lg border border-neutral-200 bg-white p-2 text-neutral-600 disabled:opacity-50">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="text-sm font-bold text-neutral-500">{currentPage} / {totalPages}</span>
                    <button onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="rounded-lg border border-neutral-200 bg-white p-2 text-neutral-600 disabled:opacity-50">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {activeTab === 'catalogo' && productSlug ? (
        <section className="min-h-[calc(100vh-4rem)] bg-neutral-50 p-4 lg:p-12">
          <button onClick={() => goToTab('catalogo')} className="mb-6 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-bold text-neutral-600 hover:text-purple-700">
            Voltar ao catalogo
          </button>
          {!activeProduct ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-neutral-500">Produto nao encontrado.</div>
          ) : (
            <div className="mx-auto grid max-w-6xl gap-8 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_420px] lg:p-8">
              <div className="lg:hidden">
                <h1 className="text-3xl font-bold uppercase tracking-tight text-neutral-900">{activeProduct.title}</h1>
              </div>
              <div className="overflow-hidden rounded-2xl bg-neutral-100">
                <img src={productImage(activeProduct)} alt={activeProduct.title} className="aspect-square w-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="flex flex-col gap-5">
                <div className="hidden lg:block">
                  <span className="text-xs font-bold uppercase tracking-widest text-purple-700">Produto PulseFit</span>
                  <h1 className="mt-2 text-4xl font-bold uppercase tracking-tight text-neutral-900">{activeProduct.title}</h1>
                </div>
                <p className="text-sm leading-relaxed text-neutral-600">{activeProduct.description}</p>
                <strong className="text-3xl font-bold text-purple-700">{formatCurrency(activeProduct.price)}</strong>
                {activeProduct.features.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {activeProduct.features.map((feature) => (
                      <span key={feature} className="rounded-full bg-purple-50 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-purple-700">{feature}</span>
                    ))}
                  </div>
                ) : null}
                {activeProduct.variantsEnabled && activeProduct.variants.length > 0 ? (
                  <div className="grid gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">Variacoes disponiveis</span>
                    {activeProduct.variants.map((variant) => (
                      <button key={variant.id} onClick={() => addToCart(activeProduct, variant)} className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-left text-sm font-bold hover:border-purple-300 hover:bg-purple-50">
                        <span>{variant.label}</span>
                        <span>{formatCurrency(variant.price ?? activeProduct.price)}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <button onClick={() => addToCart(activeProduct)} className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-800 to-purple-500 px-6 py-3.5 text-sm font-bold uppercase tracking-tight text-white shadow-md shadow-purple-500/20">
                    <ShoppingCart className="h-5 w-5" />
                    Adicionar ao carrinho
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      ) : null}

      {activeTab === 'contato' ? (
        <section className="grid min-h-[calc(100vh-4rem)] place-items-center bg-neutral-50 p-8">
          <div className="max-w-xl rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
            <Store className="mx-auto mb-4 h-10 w-10 text-purple-600" />
            <h1 className="mb-2 text-3xl font-bold uppercase tracking-tight">Contato</h1>
            <p className="text-neutral-500">{bootstrap.settings.description}</p>
            {bootstrap.settings.whatsappPhone ? <p className="mt-4 font-bold text-purple-700">WhatsApp: {bootstrap.settings.whatsappPhone}</p> : null}
          </div>
        </section>
      ) : null}

      <CartDrawer
        companySlug={companySlug}
        cart={cart}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        updateQuantity={updateQuantity}
        removeItem={(key) => setCart((items) => items.filter((item) => item.key !== key))}
        clearCart={() => setCart([])}
      />
    </div>
  );
}

function CartDrawer({
  companySlug,
  cart,
  isOpen,
  onClose,
  updateQuantity,
  removeItem,
  clearCart
}: {
  companySlug: string;
  cart: CartItem[];
  isOpen: boolean;
  onClose: () => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
}) {
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [orderCode, setOrderCode] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    fulfillmentType: 'delivery' as 'delivery' | 'pickup',
    paymentMethod: 'pix' as 'cash' | 'pix' | 'card' | 'online'
  });
  const total = cart.reduce((sum, item) => sum + (item.variant?.price ?? item.product.price) * item.quantity, 0);

  async function handleCheckout(event: FormEvent) {
    event.preventDefault();
    if (cart.length === 0) return;
    setCheckoutLoading(true);
    setCheckoutError('');
    setOrderCode('');
    try {
      const response = await api.createPublicOrder(companySlug, {
        customer: formData,
        items: cart.map((item) => ({
          productId: item.product.id,
          variantId: item.variant?.id,
          quantity: item.quantity
        }))
      }) as { orderCode?: string; whatsappUrl?: string };
      setOrderCode(response.orderCode || 'Pedido enviado');
      clearCart();
      if (response.whatsappUrl) window.open(response.whatsappUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'Nao foi possivel enviar o pedido.');
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm" />
          <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed right-0 top-0 z-[101] flex h-full w-full max-w-lg flex-col border-l border-neutral-200 bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50/80 p-6">
              <h2 className="flex items-center gap-2 text-xl font-bold uppercase tracking-tight text-neutral-900">
                Seu Carrinho
                <span className="rounded-full bg-gradient-to-r from-purple-800 to-purple-500 px-2 py-0.5 text-xs text-white">{cart.reduce((sum, item) => sum + item.quantity, 0)} itens</span>
              </h2>
              <button onClick={onClose} className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900">
                <X className="h-5 w-5" />
              </button>
            </header>
            <main className="custom-scrollbar flex flex-1 flex-col overflow-y-auto">
              {cart.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-neutral-400">
                  <ShoppingCart className="mb-4 h-12 w-12 opacity-30" />
                  <p>Seu carrinho esta vazio.</p>
                  {orderCode ? <p className="mt-3 text-sm font-bold text-purple-700">{orderCode}</p> : null}
                </div>
              ) : (
                <div className="flex flex-col gap-6 p-6">
                  {cart.map((item) => {
                    const unitPrice = item.variant?.price ?? item.product.price;
                    return (
                      <div key={item.key} className="flex gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                        <img src={productImage(item.product)} alt={item.product.title} className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                        <div className="flex flex-1 flex-col">
                          <div className="mb-1 flex items-start justify-between">
                            <div>
                              <h4 className="line-clamp-1 text-sm font-bold text-neutral-900">{item.product.title}</h4>
                              {item.variant ? <p className="text-[11px] font-semibold text-neutral-500">{item.variant.label}</p> : null}
                            </div>
                            <button onClick={() => removeItem(item.key)} className="text-neutral-400 hover:text-red-500">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <span className="mb-3 text-xs font-bold text-purple-700">{formatCurrency(unitPrice)}</span>
                          <div className="mt-auto flex items-center gap-3">
                            <button onClick={() => updateQuantity(item.key, item.quantity - 1)} className="flex h-6 w-6 items-center justify-center rounded bg-neutral-100 text-neutral-700">
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-4 text-center text-xs font-bold">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.key, item.quantity + 1)} className="flex h-6 w-6 items-center justify-center rounded bg-neutral-100 text-neutral-700">
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {checkoutError ? <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-xs font-bold text-red-600">{checkoutError}</div> : null}
                  <form id="checkout-form" onSubmit={handleCheckout} className="flex flex-col gap-4">
                    <input required value={formData.fullName} onChange={(event) => setFormData((current) => ({ ...current, fullName: event.target.value }))} placeholder="Nome completo *" className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" />
                    <input required value={formData.phone} onChange={(event) => setFormData((current) => ({ ...current, phone: event.target.value }))} placeholder="WhatsApp *" className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" />
                    <select value={formData.fulfillmentType} onChange={(event) => setFormData((current) => ({ ...current, fulfillmentType: event.target.value as 'delivery' | 'pickup' }))} className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-purple-500">
                      <option value="delivery">Entrega</option>
                      <option value="pickup">Retirada</option>
                    </select>
                    <select value={formData.paymentMethod} onChange={(event) => setFormData((current) => ({ ...current, paymentMethod: event.target.value as 'cash' | 'pix' | 'card' | 'online' }))} className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-purple-500">
                      <option value="pix">Pix</option>
                      <option value="cash">Dinheiro</option>
                      <option value="card">Cartao</option>
                      <option value="online">Online</option>
                    </select>
                  </form>
                </div>
              )}
            </main>
            <footer className="border-t border-neutral-200 bg-white/80 p-6 backdrop-blur-md">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Total estimado</span>
                <strong className="text-xl font-bold text-neutral-900">{formatCurrency(total)}</strong>
              </div>
              <button form="checkout-form" type="submit" disabled={cart.length === 0 || checkoutLoading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-800 to-purple-500 py-3.5 text-sm font-bold uppercase tracking-tight text-white shadow-md shadow-purple-500/20 transition-all hover:from-purple-700 hover:to-purple-400 disabled:opacity-50">
                {checkoutLoading ? 'Enviando pedido...' : 'Enviar pedido pelo WhatsApp'}
              </button>
            </footer>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

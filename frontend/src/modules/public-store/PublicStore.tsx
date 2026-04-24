import { Search, ShoppingCart, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, type PublicBootstrap, type PublicProduct } from '../../services/apiClient';

interface CartItem {
  product: PublicProduct;
  quantity: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function PublicStore() {
  const { companySlug = 'pulsefit' } = useParams();
  const [bootstrap, setBootstrap] = useState<PublicBootstrap | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    api
      .getPublicBootstrap(companySlug)
      .then(setBootstrap)
      .catch((error: Error) => setStatus(error.message));
  }, [companySlug]);

  const filteredProducts = useMemo(() => {
    const products = bootstrap?.products ?? [];
    return products.filter((product) => {
      const matchesCategory = activeCategory === 'all' || product.categoryId === activeCategory;
      const text = `${product.title} ${product.description}`.toLowerCase();
      return matchesCategory && text.includes(searchTerm.toLowerCase());
    });
  }, [activeCategory, bootstrap?.products, searchTerm]);

  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  function addToCart(product: PublicProduct) {
    setCart((items) => {
      const current = items.find((item) => item.product.id === product.id);
      if (current) {
        return items.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...items, { product, quantity: 1 }];
    });
  }

  function removeFromCart(productId: string) {
    setCart((items) => items.filter((item) => item.product.id !== productId));
  }

  async function submitOrder(event: FormEvent) {
    event.preventDefault();
    if (cart.length === 0) {
      setStatus('Adicione produtos ao carrinho.');
      return;
    }
    const order = await api.createPublicOrder(companySlug, {
      customer: {
        fullName: customerName,
        phone: customerPhone,
        fulfillmentType: 'delivery',
        paymentMethod: 'pix'
      },
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity
      }))
    });
    setStatus('Pedido criado com sucesso.');
    setCart([]);
    if (typeof order === 'object' && order && 'whatsappUrl' in order && typeof order.whatsappUrl === 'string') {
      window.open(order.whatsappUrl, '_blank', 'noopener,noreferrer');
    }
  }

  if (!bootstrap) {
    return <main className="screen-center">{status ?? 'Carregando catalogo...'}</main>;
  }

  return (
    <main
      className="public-store"
      style={
        {
          '--brand': bootstrap.theme.primaryColor,
          '--ink': bootstrap.theme.secondaryColor,
          '--soft': bootstrap.theme.accentColor
        } as React.CSSProperties
      }
    >
      <header className="public-header">
        <Link to={`/loja/${companySlug}/catalogo`} className="brand-mark">
          <span>{bootstrap.settings.publicName.slice(0, 2).toUpperCase()}</span>
          {bootstrap.settings.publicName}
        </Link>
        <nav>
          <a href="#catalogo">Catalogo</a>
          <a href="#checkout">Pedido</a>
          <Link to="/login">Entrar</Link>
        </nav>
      </header>

      <section className="public-hero">
        <div>
          <p className="eyebrow">{bootstrap.hero.badge}</p>
          <h1>{bootstrap.hero.title}</h1>
          <p>{bootstrap.hero.subtitle}</p>
          <a href="#catalogo" className="primary-action">
            {bootstrap.hero.buttonLabel}
          </a>
        </div>
        <div className="hero-metrics">
          <strong>{bootstrap.products.length}</strong>
          <span>produtos ativos</span>
          <strong>{bootstrap.categories.length}</strong>
          <span>categorias</span>
        </div>
      </section>

      <section id="catalogo" className="catalog-layout">
        <aside className="catalog-sidebar">
          <label className="search-box">
            <Search size={18} />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar" />
          </label>
          <button className={activeCategory === 'all' ? 'active' : ''} onClick={() => setActiveCategory('all')}>
            Todos
          </button>
          {bootstrap.categories.map((category) => (
            <button
              key={category.id}
              className={activeCategory === category.id ? 'active' : ''}
              onClick={() => setActiveCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </aside>

        <div className="product-grid">
          {filteredProducts.map((product) => (
            <article className="product-card" key={product.id}>
              <img src={product.imageUrl} alt={product.title} />
              <div>
                <span>{product.isFeatured ? 'Destaque' : 'Produto'}</span>
                <h2>{product.title}</h2>
                <p>{product.description}</p>
                <div className="price-row">
                  <strong>{formatCurrency(product.price)}</strong>
                  <button onClick={() => addToCart(product)} aria-label={`Adicionar ${product.title}`}>
                    <ShoppingCart size={18} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside id="checkout" className="checkout-panel">
          <h2>Carrinho</h2>
          {cart.length === 0 ? (
            <p className="muted">Nenhum item selecionado.</p>
          ) : (
            <ul className="cart-list">
              {cart.map((item) => (
                <li key={item.product.id}>
                  <span>
                    {item.quantity}x {item.product.title}
                  </span>
                  <button onClick={() => removeFromCart(item.product.id)} aria-label="Remover item">
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <strong className="cart-total">{formatCurrency(total)}</strong>
          <form onSubmit={submitOrder}>
            <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Nome" required />
            <input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} placeholder="WhatsApp" />
            <button type="submit">Finalizar</button>
          </form>
          {status ? <p className="status-line">{status}</p> : null}
        </aside>
      </section>
    </main>
  );
}

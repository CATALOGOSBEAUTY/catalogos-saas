import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

export function ClientDashboard() {
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
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
    const [dashboardPayload, productsPayload, categoriesPayload] = await Promise.all([
      api.clientDashboard() as Promise<DashboardPayload>,
      api.clientProducts(),
      api.clientCategories()
    ]);
    setDashboard(dashboardPayload);
    setProducts(productsPayload);
    setCategories(categoriesPayload);
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

  if (error) {
    return (
      <main className="screen-center">
        <p>{error}</p>
        <Link to="/login">Entrar novamente</Link>
      </main>
    );
  }

  if (!dashboard) return <main className="screen-center">Carregando painel...</main>;

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <span className="eyebrow">{dashboard.tenant.role}</span>
          <h1>{dashboard.tenant.name}</h1>
        </div>
        <Link to={`/loja/${dashboard.tenant.slug}/catalogo`}>Ver loja</Link>
      </header>

      <section className="metric-grid">
        <article>
          <span>Produtos</span>
          <strong>{dashboard.metrics.productsTotal}</strong>
        </article>
        <article>
          <span>Publicados</span>
          <strong>{dashboard.metrics.productsLive}</strong>
        </article>
        <article>
          <span>Pedidos</span>
          <strong>{dashboard.metrics.ordersTotal}</strong>
        </article>
        <article>
          <span>Receita</span>
          <strong>R$ {dashboard.metrics.revenueTotal.toFixed(2)}</strong>
        </article>
      </section>

      <section className="workbench-grid">
        <form className="workbench-panel" onSubmit={createCategory}>
          <h2>Nova categoria</h2>
          <input
            value={categoryName}
            onChange={(event) => setCategoryName(event.target.value)}
            placeholder="Nome da categoria"
            required
          />
          <button type="submit">Criar categoria</button>
        </form>

        <form className="workbench-panel" onSubmit={createProduct}>
          <h2>Novo produto</h2>
          <div className="form-grid">
            <input
              value={productDraft.title}
              onChange={(event) => setProductDraft((current) => ({ ...current, title: event.target.value }))}
              placeholder="Nome do produto"
              required
            />
            <select
              value={productDraft.categoryId}
              onChange={(event) => setProductDraft((current) => ({ ...current, categoryId: event.target.value }))}
              required
            >
              <option value="">Categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <input
              value={productDraft.price}
              onChange={(event) => setProductDraft((current) => ({ ...current, price: event.target.value }))}
              placeholder="Preco"
              type="number"
              min="0"
              step="0.01"
              required
            />
            <input
              value={productDraft.stockQuantity}
              onChange={(event) => setProductDraft((current) => ({ ...current, stockQuantity: event.target.value }))}
              placeholder="Estoque"
              type="number"
              min="0"
              step="1"
              required
            />
          </div>
          <textarea
            value={productDraft.description}
            onChange={(event) => setProductDraft((current) => ({ ...current, description: event.target.value }))}
            placeholder="Descricao"
          />
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => setProductDraft((current) => ({ ...current, imageFile: event.target.files?.[0] ?? null }))}
          />
          <button type="submit">Criar rascunho</button>
        </form>
      </section>

      <section className="table-section compact-section">
        <h2>Categorias</h2>
        <div className="chip-list">
          {categories.map((category) => (
            <span key={category.id} className="category-chip">
              {category.name}
              <button onClick={() => deleteCategory(category.id)} aria-label={`Excluir ${category.name}`}>
                x
              </button>
            </span>
          ))}
        </div>
      </section>

      <section className="table-section">
        <h2>Produtos</h2>
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Status</th>
              <th>Estoque</th>
              <th>Preco</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.title}</td>
                <td>{product.catalogStatus ?? (product.stockQuantity > 0 ? 'Disponivel' : 'Sem estoque')}</td>
                <td>{product.stockQuantity}</td>
                <td>R$ {product.price.toFixed(2)}</td>
                <td>
                  <div className="row-actions">
                    <button onClick={() => publishProduct(product)}>
                      {product.catalogStatus === 'live' ? 'Rascunho' : 'Publicar'}
                    </button>
                    <button onClick={() => deleteProduct(product.id)}>Excluir</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {status ? <p className="status-line">{status}</p> : null}
      </section>
    </main>
  );
}

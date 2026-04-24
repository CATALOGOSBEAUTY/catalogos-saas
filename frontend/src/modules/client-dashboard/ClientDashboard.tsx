import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type PublicProduct } from '../../services/apiClient';

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.clientDashboard() as Promise<DashboardPayload>, api.clientProducts()])
      .then(([dashboardPayload, productsPayload]) => {
        setDashboard(dashboardPayload);
        setProducts(productsPayload);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

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

      <section className="table-section">
        <h2>Produtos</h2>
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Status</th>
              <th>Estoque</th>
              <th>Preco</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.title}</td>
                <td>{product.stockQuantity > 0 ? 'Disponivel' : 'Sem estoque'}</td>
                <td>{product.stockQuantity}</td>
                <td>R$ {product.price.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/apiClient';

interface MasterDashboardPayload {
  metrics: {
    companiesTotal: number;
    activeCompanies: number;
    ordersTotal: number;
    revenueTotal: number;
  };
}

interface CompanyRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  planCode: string;
  productsTotal: number;
  ordersTotal: number;
}

export function MasterDashboard() {
  const [dashboard, setDashboard] = useState<MasterDashboardPayload | null>(null);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.masterDashboard() as Promise<MasterDashboardPayload>, api.masterCompanies() as Promise<CompanyRow[]>])
      .then(([dashboardPayload, companiesPayload]) => {
        setDashboard(dashboardPayload);
        setCompanies(companiesPayload);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) {
    return (
      <main className="screen-center">
        <p>{error}</p>
        <Link to="/login">Entrar como master</Link>
      </main>
    );
  }

  if (!dashboard) return <main className="screen-center">Carregando master...</main>;

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <span className="eyebrow">Backoffice Master</span>
          <h1>Controle da plataforma</h1>
        </div>
        <Link to="/loja/pulsefit/catalogo">Loja demo</Link>
      </header>

      <section className="metric-grid">
        <article>
          <span>Empresas</span>
          <strong>{dashboard.metrics.companiesTotal}</strong>
        </article>
        <article>
          <span>Ativas</span>
          <strong>{dashboard.metrics.activeCompanies}</strong>
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
        <h2>Clientes</h2>
        <table>
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Slug</th>
              <th>Status</th>
              <th>Plano</th>
              <th>Produtos</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <tr key={company.id}>
                <td>{company.name}</td>
                <td>{company.slug}</td>
                <td>{company.status}</td>
                <td>{company.planCode}</td>
                <td>{company.productsTotal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

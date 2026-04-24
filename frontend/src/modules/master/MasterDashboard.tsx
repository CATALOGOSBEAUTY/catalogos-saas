import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Building2,
  CreditCard,
  FileClock,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  ShoppingBag,
  Users,
  X
} from 'lucide-react';
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

type MasterTab = 'dashboard' | 'clientes' | 'planos' | 'assinaturas' | 'pedidos' | 'usuarios' | 'auditoria' | 'configuracoes';

const masterNav: Array<{ tab: MasterTab; label: string; icon: typeof LayoutDashboard }> = [
  { tab: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { tab: 'clientes', label: 'Clientes', icon: Building2 },
  { tab: 'planos', label: 'Planos', icon: BarChart3 },
  { tab: 'assinaturas', label: 'Assinaturas', icon: CreditCard },
  { tab: 'pedidos', label: 'Pedidos', icon: ShoppingBag },
  { tab: 'usuarios', label: 'Usuarios Master', icon: Users },
  { tab: 'auditoria', label: 'Auditoria', icon: FileClock },
  { tab: 'configuracoes', label: 'Configuracoes', icon: Settings }
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function MasterDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = (location.pathname.split('/').pop() || 'dashboard') as MasterTab;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboard, setDashboard] = useState<MasterDashboardPayload | null>(null);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    Promise.all([api.masterDashboard() as Promise<MasterDashboardPayload>, api.masterCompanies() as Promise<CompanyRow[]>])
      .then(([dashboardPayload, companiesPayload]) => {
        setDashboard(dashboardPayload);
        setCompanies(companiesPayload);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const filteredCompanies = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return companies.filter((company) => `${company.name} ${company.slug} ${company.status} ${company.planCode}`.toLowerCase().includes(term));
  }, [companies, searchTerm]);

  async function logout() {
    await api.logout().catch(() => undefined);
    navigate('/master/login');
  }

  if (!masterNav.some((item) => item.tab === activeTab)) {
    return <Navigate to="/master/app/dashboard" replace />;
  }

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center bg-neutral-950 p-8 text-center">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8 text-neutral-300">
          <p className="mb-4 text-red-300">{error}</p>
          <Link className="font-bold text-white" to="/master/login">Entrar no master</Link>
        </div>
      </main>
    );
  }

  if (!dashboard) return <main className="min-h-screen bg-neutral-950" />;

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100">
      {sidebarOpen ? <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} /> : null}
      <aside className={`fixed inset-y-0 left-0 z-50 flex h-screen w-72 flex-col overflow-y-auto border-r border-neutral-800 bg-neutral-950 transition-transform duration-300 lg:static lg:w-72 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="border-b border-neutral-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <img src="/assets/sistematize-logo.svg" alt="Sistematize" className="h-12 w-44 rounded bg-white object-contain px-2" />
              <h1 className="mt-4 text-lg font-bold uppercase tracking-tight">Sistematize Master</h1>
              <p className="text-xs text-neutral-500">Backoffice da plataforma</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-900 lg:hidden">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-2 p-4">
          {masterNav.map((item) => (
            <button
              key={item.tab}
              onClick={() => {
                navigate(`/master/app/${item.tab}`);
                setSidebarOpen(false);
              }}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors ${activeTab === item.tab ? 'bg-white text-neutral-950' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'}`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-neutral-800 p-4">
          <button onClick={logout} className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300 transition-colors hover:bg-red-500/20">
            <LogOut className="h-4 w-4" />
            Sair do Master
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 flex h-20 shrink-0 items-center justify-between border-b border-neutral-800 bg-neutral-950/90 px-4 backdrop-blur-md md:px-8">
          <div className="flex flex-1 items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-900 lg:hidden">
              <Menu className="h-6 w-6" />
            </button>
            <div className="relative hidden max-w-xl flex-1 sm:block">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Pesquisar clientes, planos, status..." className="w-full rounded-xl border border-neutral-800 bg-neutral-900 py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-white" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/loja/pulsefit/catalogo" className="rounded-xl border border-neutral-800 px-4 py-2 text-xs font-bold uppercase tracking-widest text-neutral-300 hover:bg-neutral-900">
              Loja demo
            </Link>
            <div className="hidden text-right md:block">
              <strong className="block text-sm">Super Admin</strong>
              <span className="text-xs text-neutral-500">Ambiente master</span>
            </div>
          </div>
        </header>

        <main className="custom-scrollbar flex-1 overflow-y-auto bg-neutral-950 p-4 md:p-8">
          {activeTab === 'dashboard' ? <DashboardTab dashboard={dashboard} companies={companies} /> : null}
          {activeTab === 'clientes' ? <ClientsTab companies={filteredCompanies} /> : null}
          {activeTab === 'planos' ? <PlansTab /> : null}
          {activeTab === 'assinaturas' ? <SubscriptionsTab companies={filteredCompanies} /> : null}
          {activeTab === 'pedidos' ? <MasterPlaceholder title="Pedidos Globais" description="Fila consolidada de pedidos de todos os tenants, com filtros por empresa, status e periodo." icon={ShoppingBag} /> : null}
          {activeTab === 'usuarios' ? <MasterPlaceholder title="Usuarios Master" description="Gestao de operadores internos, papeis e permissoes administrativas." icon={Users} /> : null}
          {activeTab === 'auditoria' ? <AuditTab /> : null}
          {activeTab === 'configuracoes' ? <MasterPlaceholder title="Configuracoes da Plataforma" description="Parametros globais, dominios, webhooks, limites e politicas operacionais." icon={Settings} /> : null}
        </main>
      </div>
    </div>
  );
}

function DashboardTab({ dashboard, companies }: { dashboard: MasterDashboardPayload; companies: CompanyRow[] }) {
  const metrics = [
    { label: 'Empresas', value: dashboard.metrics.companiesTotal, detail: 'tenants cadastrados', icon: Building2 },
    { label: 'Ativas', value: dashboard.metrics.activeCompanies, detail: 'operando agora', icon: Activity },
    { label: 'Pedidos', value: dashboard.metrics.ordersTotal, detail: 'na plataforma', icon: ShoppingBag },
    { label: 'Receita', value: formatCurrency(dashboard.metrics.revenueTotal), detail: 'GMV total', icon: CreditCard }
  ];
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold uppercase tracking-tight text-white">Controle da plataforma</h1>
        <p className="mt-1 text-sm text-neutral-500">Visao executiva do SaaS, clientes e operacao.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article key={metric.label} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 shadow-2xl shadow-black/20">
            <metric.icon className="mb-5 h-6 w-6 text-neutral-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">{metric.label}</span>
            <strong className="mt-2 block text-3xl font-bold text-white">{metric.value}</strong>
            <p className="mt-1 text-xs text-neutral-500">{metric.detail}</p>
          </article>
        ))}
      </div>
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="mb-4 text-lg font-bold text-white">Clientes recentes</h2>
        <div className="grid gap-3">
          {companies.map((company) => (
            <div key={company.id} className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950 p-4">
              <div>
                <strong className="text-white">{company.name}</strong>
                <p className="text-xs text-neutral-500">/{company.slug} - plano {company.planCode}</p>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase text-emerald-300">{company.status}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ClientsTab({ companies }: { companies: CompanyRow[] }) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header><h1 className="text-3xl font-bold uppercase tracking-tight text-white">Clientes</h1><p className="text-sm text-neutral-500">Tenants contratantes da plataforma.</p></header>
      <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
        <table className="w-full text-left">
          <thead><tr className="border-b border-neutral-800 text-xs font-bold uppercase tracking-widest text-neutral-500"><th className="p-4">Empresa</th><th className="p-4">Slug</th><th className="p-4">Status</th><th className="p-4">Plano</th><th className="p-4">Produtos</th><th className="p-4">Pedidos</th></tr></thead>
          <tbody>
            {companies.map((company) => (
              <tr key={company.id} className="border-b border-neutral-800 hover:bg-neutral-950">
                <td className="p-4 font-bold text-white">{company.name}</td>
                <td className="p-4 text-neutral-400">{company.slug}</td>
                <td className="p-4 text-neutral-300">{company.status}</td>
                <td className="p-4 text-neutral-300">{company.planCode}</td>
                <td className="p-4 text-neutral-300">{company.productsTotal}</td>
                <td className="p-4 text-neutral-300">{company.ordersTotal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlansTab() {
  const plans = [
    { name: 'Bronze', price: 'R$ 97/m', limit: '100 produtos', status: 'Ativo' },
    { name: 'Prata', price: 'R$ 197/m', limit: '500 produtos', status: 'Modelo' },
    { name: 'Ouro', price: 'R$ 397/m', limit: 'Produtos ilimitados', status: 'Modelo' }
  ];
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header><h1 className="text-3xl font-bold uppercase tracking-tight text-white">Planos</h1><p className="text-sm text-neutral-500">Catalogo comercial e limites do SaaS.</p></header>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => <article key={plan.name} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6"><h2 className="text-xl font-bold text-white">{plan.name}</h2><strong className="mt-4 block text-3xl text-white">{plan.price}</strong><p className="mt-2 text-sm text-neutral-500">{plan.limit}</p><span className="mt-6 inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold uppercase text-neutral-950">{plan.status}</span></article>)}
      </div>
    </div>
  );
}

function SubscriptionsTab({ companies }: { companies: CompanyRow[] }) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header><h1 className="text-3xl font-bold uppercase tracking-tight text-white">Assinaturas</h1><p className="text-sm text-neutral-500">Estado financeiro dos tenants.</p></header>
      <div className="grid gap-3">
        {companies.map((company) => <div key={company.id} className="flex items-center justify-between rounded-2xl border border-neutral-800 bg-neutral-900 p-5"><div><strong className="text-white">{company.name}</strong><p className="text-xs text-neutral-500">Plano {company.planCode}</p></div><span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase text-emerald-300">Em dia</span></div>)}
      </div>
    </div>
  );
}

function AuditTab() {
  const rows = ['Login master realizado', 'Deploy Render verificado', 'Bucket de midia configurado', 'Tenant PulseFit ativo'];
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header><h1 className="text-3xl font-bold uppercase tracking-tight text-white">Auditoria</h1><p className="text-sm text-neutral-500">Linha inicial de eventos administrativos.</p></header>
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900">
        {rows.map((row) => <div key={row} className="flex items-center gap-3 border-b border-neutral-800 p-4 text-sm text-neutral-300"><FileClock className="h-4 w-4 text-neutral-500" />{row}</div>)}
      </div>
    </div>
  );
}

function MasterPlaceholder({ title, description, icon: Icon }: { title: string; description: string; icon: typeof LayoutDashboard }) {
  return (
    <div className="mx-auto grid min-h-[480px] max-w-5xl place-items-center rounded-2xl border border-dashed border-neutral-800 bg-neutral-900 p-8 text-center">
      <div>
        <Icon className="mx-auto mb-4 h-10 w-10 text-neutral-500" />
        <h1 className="text-3xl font-bold uppercase tracking-tight text-white">{title}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-neutral-500">{description}</p>
      </div>
    </div>
  );
}

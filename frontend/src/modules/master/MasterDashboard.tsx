import { type FormEvent, useEffect, useMemo, useState } from 'react';
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
  Package,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  Users,
  X
} from 'lucide-react';
import {
  api,
  type AuditLog,
  type Invoice,
  type OrderRow,
  type Plan,
  type PlatformModule,
  type Subscription
} from '../../services/apiClient';

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
  status: 'trial' | 'active' | 'suspended' | 'cancelled';
  planCode: string;
  productsTotal: number;
  ordersTotal: number;
}

interface PlanDraft {
  name: string;
  code: string;
  description: string;
  priceMonthly: string;
  productLimit: string;
  userLimit: string;
  storageLimitMb: string;
  sortOrder: string;
}

interface ModuleDraft {
  name: string;
  code: string;
  description: string;
  priceMonthly: string;
}

interface InvoiceDraft {
  companyId: string;
  amount: string;
  dueDate: string;
  paymentUrl: string;
}

type MasterTab = 'dashboard' | 'clientes' | 'planos' | 'modulos' | 'assinaturas' | 'faturas' | 'pedidos' | 'usuarios' | 'auditoria' | 'configuracoes';

const masterNav: Array<{ tab: MasterTab; label: string; icon: typeof LayoutDashboard }> = [
  { tab: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { tab: 'clientes', label: 'Clientes', icon: Building2 },
  { tab: 'planos', label: 'Planos', icon: BarChart3 },
  { tab: 'modulos', label: 'Modulos', icon: Package },
  { tab: 'assinaturas', label: 'Assinaturas', icon: CreditCard },
  { tab: 'faturas', label: 'Faturas', icon: FileClock },
  { tab: 'pedidos', label: 'Pedidos', icon: ShoppingBag },
  { tab: 'usuarios', label: 'Usuarios Master', icon: Users },
  { tab: 'auditoria', label: 'Auditoria', icon: FileClock },
  { tab: 'configuracoes', label: 'Configuracoes', icon: Settings }
];

const companyStatuses: CompanyRow['status'][] = ['trial', 'active', 'suspended', 'cancelled'];
const invoiceStatuses: Invoice['status'][] = ['open', 'paid', 'overdue', 'cancelled', 'refunded'];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(value?: string) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value));
}

function invoiceStatusLabel(status: Invoice['status']) {
  const labels: Record<Invoice['status'], string> = {
    open: 'Aberta',
    paid: 'Paga',
    overdue: 'Vencida',
    cancelled: 'Cancelada',
    refunded: 'Estornada'
  };
  return labels[status];
}

function companyStatusLabel(status: CompanyRow['status']) {
  const labels: Record<CompanyRow['status'], string> = {
    trial: 'Trial',
    active: 'Ativa',
    suspended: 'Suspensa',
    cancelled: 'Cancelada'
  };
  return labels[status];
}

function subscriptionStatusLabel(status: Subscription['status']) {
  const labels: Record<Subscription['status'], string> = {
    trial: 'Trial',
    active: 'Ativa',
    past_due: 'Em atraso',
    suspended: 'Suspensa',
    cancelled: 'Cancelada'
  };
  return labels[status];
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

function emptyPlanDraft(): PlanDraft {
  return {
    name: '',
    code: '',
    description: '',
    priceMonthly: '',
    productLimit: '',
    userLimit: '',
    storageLimitMb: '',
    sortOrder: '10'
  };
}

function emptyModuleDraft(): ModuleDraft {
  return {
    name: '',
    code: '',
    description: '',
    priceMonthly: ''
  };
}

function emptyInvoiceDraft(companyId = ''): InvoiceDraft {
  return {
    companyId,
    amount: '',
    dueDate: '',
    paymentUrl: ''
  };
}

export function MasterDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = (location.pathname.split('/').pop() || 'dashboard') as MasterTab;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboard, setDashboard] = useState<MasterDashboardPayload | null>(null);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [modules, setModules] = useState<PlatformModule[]>([]);
  const [subscriptions, setSubscriptions] = useState<Array<Subscription & { companyName: string }>>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [planDraft, setPlanDraft] = useState<PlanDraft>(emptyPlanDraft);
  const [moduleDraft, setModuleDraft] = useState<ModuleDraft>(emptyModuleDraft);
  const [invoiceDraft, setInvoiceDraft] = useState<InvoiceDraft>(emptyInvoiceDraft);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  async function loadMaster() {
    const [dashboardPayload, companiesPayload, plansPayload, modulesPayload, subscriptionsPayload, invoicesPayload, ordersPayload, auditPayload] = await Promise.all([
      api.masterDashboard() as Promise<MasterDashboardPayload>,
      api.masterCompanies() as Promise<CompanyRow[]>,
      api.masterPlans(),
      api.masterModules(),
      api.masterSubscriptions(),
      api.masterInvoices(),
      api.masterOrders(),
      api.masterAuditLogs()
    ]);
    setDashboard(dashboardPayload);
    setCompanies(companiesPayload);
    setPlans(plansPayload);
    setModules(modulesPayload);
    setSubscriptions(subscriptionsPayload);
    setInvoices(invoicesPayload);
    setOrders(ordersPayload);
    setAuditLogs(auditPayload);
    setInvoiceDraft((current) => ({ ...current, companyId: current.companyId || companiesPayload[0]?.id || '' }));
  }

  useEffect(() => {
    loadMaster()
      .then(() => setError(null))
      .catch((err: Error) => setError(err.message));
  }, []);

  const filteredCompanies = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return companies.filter((company) => `${company.name} ${company.slug} ${company.status} ${company.planCode}`.toLowerCase().includes(term));
  }, [companies, searchTerm]);

  async function updateCompanyStatus(companyId: string, nextStatus: CompanyRow['status']) {
    setStatus(null);
    try {
      await api.updateMasterCompanyStatus(companyId, nextStatus);
      await loadMaster();
      setStatus('Status da empresa atualizado.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Falha ao alterar empresa.');
    }
  }

  async function updateCompanyPlan(companyId: string, planCode: string) {
    setStatus(null);
    try {
      await api.updateMasterCompanyPlan(companyId, planCode);
      await loadMaster();
      setStatus('Plano da empresa atualizado.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Falha ao alterar plano.');
    }
  }

  async function createPlan(event: FormEvent) {
    event.preventDefault();
    setStatus(null);
    try {
      await api.createMasterPlan({
        name: planDraft.name,
        code: planDraft.code,
        description: planDraft.description,
        priceMonthly: Number(planDraft.priceMonthly),
        productLimit: Number(planDraft.productLimit),
        userLimit: Number(planDraft.userLimit),
        storageLimitMb: Number(planDraft.storageLimitMb),
        isActive: true,
        sortOrder: Number(planDraft.sortOrder || 10)
      });
      setPlanDraft(emptyPlanDraft());
      await loadMaster();
      setStatus('Plano criado.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Falha ao criar plano.');
    }
  }

  async function togglePlan(plan: Plan) {
    setStatus(null);
    try {
      await api.updateMasterPlan(plan.id, { isActive: !plan.isActive });
      await loadMaster();
      setStatus('Plano atualizado.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Falha ao atualizar plano.');
    }
  }

  async function createModule(event: FormEvent) {
    event.preventDefault();
    setStatus(null);
    try {
      await api.createMasterModule({
        name: moduleDraft.name,
        code: moduleDraft.code,
        description: moduleDraft.description,
        priceMonthly: Number(moduleDraft.priceMonthly),
        isActive: true
      });
      setModuleDraft(emptyModuleDraft());
      await loadMaster();
      setStatus('Modulo criado.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Falha ao criar modulo.');
    }
  }

  async function toggleModule(moduleItem: PlatformModule) {
    setStatus(null);
    try {
      await api.updateMasterModule(moduleItem.id, { isActive: !moduleItem.isActive });
      await loadMaster();
      setStatus('Modulo atualizado.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Falha ao atualizar modulo.');
    }
  }

  async function createInvoice(event: FormEvent) {
    event.preventDefault();
    setStatus(null);
    try {
      await api.createMasterInvoice({
        companyId: invoiceDraft.companyId,
        amount: Number(invoiceDraft.amount),
        dueDate: invoiceDraft.dueDate || undefined,
        paymentUrl: invoiceDraft.paymentUrl || undefined
      });
      setInvoiceDraft(emptyInvoiceDraft(invoiceDraft.companyId));
      await loadMaster();
      setStatus('Fatura criada.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Falha ao criar fatura.');
    }
  }

  async function updateInvoiceStatus(invoiceId: string, nextStatus: Invoice['status']) {
    setStatus(null);
    try {
      await api.updateMasterInvoiceStatus(invoiceId, nextStatus);
      await loadMaster();
      setStatus('Fatura atualizada.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Falha ao atualizar fatura.');
    }
  }

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
          {activeTab === 'dashboard' ? <DashboardTab dashboard={dashboard} companies={companies} invoices={invoices} /> : null}
          {activeTab === 'clientes' ? <ClientsTab companies={filteredCompanies} plans={plans} updateCompanyStatus={updateCompanyStatus} updateCompanyPlan={updateCompanyPlan} status={status} /> : null}
          {activeTab === 'planos' ? <PlansTab plans={plans} planDraft={planDraft} setPlanDraft={setPlanDraft} createPlan={createPlan} togglePlan={togglePlan} status={status} /> : null}
          {activeTab === 'modulos' ? <ModulesTab modules={modules} moduleDraft={moduleDraft} setModuleDraft={setModuleDraft} createModule={createModule} toggleModule={toggleModule} status={status} /> : null}
          {activeTab === 'assinaturas' ? <SubscriptionsTab subscriptions={subscriptions} /> : null}
          {activeTab === 'faturas' ? <InvoicesTab invoices={invoices} companies={companies} invoiceDraft={invoiceDraft} setInvoiceDraft={setInvoiceDraft} createInvoice={createInvoice} updateInvoiceStatus={updateInvoiceStatus} status={status} /> : null}
          {activeTab === 'pedidos' ? <OrdersTab orders={orders} /> : null}
          {activeTab === 'usuarios' ? <UsersTab /> : null}
          {activeTab === 'auditoria' ? <AuditTab rows={auditLogs} /> : null}
          {activeTab === 'configuracoes' ? <SettingsTab /> : null}
        </main>
      </div>
    </div>
  );
}

function DashboardTab({ dashboard, companies, invoices }: { dashboard: MasterDashboardPayload; companies: CompanyRow[]; invoices: Invoice[] }) {
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
        <p className="mt-1 text-sm text-neutral-500">Visao executiva do SaaS, clientes, faturas e operacao.</p>
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
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="mb-4 text-lg font-bold text-white">Clientes recentes</h2>
          <div className="grid gap-3">
            {companies.slice(0, 5).map((company) => (
              <div key={company.id} className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950 p-4">
                <div>
                  <strong className="text-white">{company.name}</strong>
                  <p className="text-xs text-neutral-500">/{company.slug} - plano {company.planCode}</p>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase text-emerald-300">{companyStatusLabel(company.status)}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="mb-4 text-lg font-bold text-white">Faturas recentes</h2>
          <div className="grid gap-3">
            {invoices.slice(0, 5).map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950 p-4">
                <div>
                  <strong className="text-white">{invoice.companyName ?? invoice.companyId}</strong>
                  <p className="text-xs text-neutral-500">{formatCurrency(invoice.amount)} - vence {formatDate(invoice.dueDate)}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase text-neutral-950">{invoiceStatusLabel(invoice.status)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function ClientsTab({
  companies,
  plans,
  updateCompanyStatus,
  updateCompanyPlan,
  status
}: {
  companies: CompanyRow[];
  plans: Plan[];
  updateCompanyStatus: (companyId: string, status: CompanyRow['status']) => Promise<void>;
  updateCompanyPlan: (companyId: string, planCode: string) => Promise<void>;
  status: string | null;
}) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header><h1 className="text-3xl font-bold uppercase tracking-tight text-white">Clientes</h1><p className="text-sm text-neutral-500">Tenants contratantes, plano, status e limites operacionais.</p></header>
      <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-900">
        <table className="w-full min-w-[980px] text-left">
          <thead><tr className="border-b border-neutral-800 text-xs font-bold uppercase tracking-widest text-neutral-500"><th className="p-4">Empresa</th><th className="p-4">Slug</th><th className="p-4">Status</th><th className="p-4">Plano</th><th className="p-4">Produtos</th><th className="p-4">Pedidos</th><th className="p-4">Loja</th></tr></thead>
          <tbody>
            {companies.map((company) => (
              <tr key={company.id} className="border-b border-neutral-800 hover:bg-neutral-950">
                <td className="p-4 font-bold text-white">{company.name}</td>
                <td className="p-4 text-neutral-400">{company.slug}</td>
                <td className="p-4">
                  <select value={company.status} onChange={(event) => updateCompanyStatus(company.id, event.target.value as CompanyRow['status'])} className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-white">
                    {companyStatuses.map((item) => <option key={item} value={item}>{companyStatusLabel(item)}</option>)}
                  </select>
                </td>
                <td className="p-4">
                  <select value={company.planCode} onChange={(event) => updateCompanyPlan(company.id, event.target.value)} className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-white">
                    {plans.map((plan) => <option key={plan.id} value={plan.code}>{plan.name}</option>)}
                  </select>
                </td>
                <td className="p-4 text-neutral-300">{company.productsTotal}</td>
                <td className="p-4 text-neutral-300">{company.ordersTotal}</td>
                <td className="p-4"><Link to={`/loja/${company.slug}/catalogo`} className="rounded-lg bg-white px-3 py-2 text-xs font-bold uppercase text-neutral-950">Abrir</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {status ? <p className="text-sm font-bold text-white">{status}</p> : null}
    </div>
  );
}

function PlansTab({
  plans,
  planDraft,
  setPlanDraft,
  createPlan,
  togglePlan,
  status
}: {
  plans: Plan[];
  planDraft: PlanDraft;
  setPlanDraft: React.Dispatch<React.SetStateAction<PlanDraft>>;
  createPlan: (event: FormEvent) => Promise<void>;
  togglePlan: (plan: Plan) => Promise<void>;
  status: string | null;
}) {
  function patch(field: keyof PlanDraft, value: string) {
    setPlanDraft((current) => ({ ...current, [field]: value }));
  }
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header><h1 className="text-3xl font-bold uppercase tracking-tight text-white">Planos</h1><p className="text-sm text-neutral-500">Catalogo comercial, precos e limites do SaaS.</p></header>
      <form onSubmit={createPlan} className="grid gap-3 rounded-2xl border border-neutral-800 bg-neutral-900 p-5 md:grid-cols-4">
        <DarkInput label="Nome" value={planDraft.name} onChange={(value) => patch('name', value)} required />
        <DarkInput label="Codigo" value={planDraft.code} onChange={(value) => patch('code', value)} required />
        <DarkInput label="Preco mensal" value={planDraft.priceMonthly} onChange={(value) => patch('priceMonthly', value)} type="number" required />
        <DarkInput label="Ordem" value={planDraft.sortOrder} onChange={(value) => patch('sortOrder', value)} type="number" required />
        <DarkInput label="Limite produtos" value={planDraft.productLimit} onChange={(value) => patch('productLimit', value)} type="number" required />
        <DarkInput label="Limite usuarios" value={planDraft.userLimit} onChange={(value) => patch('userLimit', value)} type="number" required />
        <DarkInput label="Storage MB" value={planDraft.storageLimitMb} onChange={(value) => patch('storageLimitMb', value)} type="number" required />
        <button className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-neutral-950"><Plus className="h-4 w-4" />Criar plano</button>
        <label className="md:col-span-4">
          <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-neutral-500">Descricao</span>
          <textarea value={planDraft.description} onChange={(event) => patch('description', event.target.value)} className="h-20 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-white" />
        </label>
      </form>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => (
          <article key={plan.id} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">{plan.name}</h2>
                <p className="text-xs uppercase tracking-widest text-neutral-500">{plan.code}</p>
              </div>
              <button onClick={() => togglePlan(plan)} className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${plan.isActive ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}>{plan.isActive ? 'Ativo' : 'Inativo'}</button>
            </div>
            <strong className="mt-4 block text-3xl text-white">{formatCurrency(plan.priceMonthly)}</strong>
            <p className="mt-3 text-sm text-neutral-500">{plan.description}</p>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs text-neutral-400">
              <span className="rounded-lg bg-neutral-950 p-2">{plan.productLimit} produtos</span>
              <span className="rounded-lg bg-neutral-950 p-2">{plan.userLimit} usuarios</span>
              <span className="rounded-lg bg-neutral-950 p-2">{plan.storageLimitMb} MB</span>
            </div>
          </article>
        ))}
      </div>
      {status ? <p className="text-sm font-bold text-white">{status}</p> : null}
    </div>
  );
}

function ModulesTab({
  modules,
  moduleDraft,
  setModuleDraft,
  createModule,
  toggleModule,
  status
}: {
  modules: PlatformModule[];
  moduleDraft: ModuleDraft;
  setModuleDraft: React.Dispatch<React.SetStateAction<ModuleDraft>>;
  createModule: (event: FormEvent) => Promise<void>;
  toggleModule: (moduleItem: PlatformModule) => Promise<void>;
  status: string | null;
}) {
  function patch(field: keyof ModuleDraft, value: string) {
    setModuleDraft((current) => ({ ...current, [field]: value }));
  }
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header><h1 className="text-3xl font-bold uppercase tracking-tight text-white">Modulos</h1><p className="text-sm text-neutral-500">Add-ons comerciais para evoluir receita e recursos por tenant.</p></header>
      <form onSubmit={createModule} className="grid gap-3 rounded-2xl border border-neutral-800 bg-neutral-900 p-5 md:grid-cols-4">
        <DarkInput label="Nome" value={moduleDraft.name} onChange={(value) => patch('name', value)} required />
        <DarkInput label="Codigo" value={moduleDraft.code} onChange={(value) => patch('code', value)} required />
        <DarkInput label="Preco mensal" value={moduleDraft.priceMonthly} onChange={(value) => patch('priceMonthly', value)} type="number" required />
        <button className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-neutral-950"><Plus className="h-4 w-4" />Criar modulo</button>
        <label className="md:col-span-4">
          <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-neutral-500">Descricao</span>
          <textarea value={moduleDraft.description} onChange={(event) => patch('description', event.target.value)} className="h-20 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-white" />
        </label>
      </form>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((moduleItem) => (
          <article key={moduleItem.id} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">{moduleItem.name}</h2>
                <p className="text-xs uppercase tracking-widest text-neutral-500">{moduleItem.code}</p>
              </div>
              <button onClick={() => toggleModule(moduleItem)} className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${moduleItem.isActive ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}>{moduleItem.isActive ? 'Ativo' : 'Inativo'}</button>
            </div>
            <p className="mt-4 text-sm text-neutral-500">{moduleItem.description}</p>
            <strong className="mt-4 block text-2xl text-white">{formatCurrency(moduleItem.priceMonthly)}</strong>
          </article>
        ))}
      </div>
      {status ? <p className="text-sm font-bold text-white">{status}</p> : null}
    </div>
  );
}

function SubscriptionsTab({ subscriptions }: { subscriptions: Array<Subscription & { companyName: string }> }) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header><h1 className="text-3xl font-bold uppercase tracking-tight text-white">Assinaturas</h1><p className="text-sm text-neutral-500">Estado financeiro dos tenants e ciclo de cobranca.</p></header>
      <div className="grid gap-3">
        {subscriptions.map((subscription) => (
          <div key={subscription.id} className="flex flex-col gap-3 rounded-2xl border border-neutral-800 bg-neutral-900 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <strong className="text-white">{subscription.companyName}</strong>
              <p className="text-xs text-neutral-500">Plano {subscription.planCode} - ciclo {subscription.billingCycle}</p>
            </div>
            <div className="text-sm text-neutral-400">Proximo periodo: {formatDate(subscription.currentPeriodEnd || subscription.trialEndsAt)}</div>
            <span className="w-fit rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase text-emerald-300">{subscriptionStatusLabel(subscription.status)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InvoicesTab({
  invoices,
  companies,
  invoiceDraft,
  setInvoiceDraft,
  createInvoice,
  updateInvoiceStatus,
  status
}: {
  invoices: Invoice[];
  companies: CompanyRow[];
  invoiceDraft: InvoiceDraft;
  setInvoiceDraft: React.Dispatch<React.SetStateAction<InvoiceDraft>>;
  createInvoice: (event: FormEvent) => Promise<void>;
  updateInvoiceStatus: (invoiceId: string, status: Invoice['status']) => Promise<void>;
  status: string | null;
}) {
  function patch(field: keyof InvoiceDraft, value: string) {
    setInvoiceDraft((current) => ({ ...current, [field]: value }));
  }
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header><h1 className="text-3xl font-bold uppercase tracking-tight text-white">Faturas</h1><p className="text-sm text-neutral-500">Cobranca manual, baixa, atraso e restauracao de empresas suspensas.</p></header>
      <form onSubmit={createInvoice} className="grid gap-3 rounded-2xl border border-neutral-800 bg-neutral-900 p-5 md:grid-cols-4">
        <label>
          <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-neutral-500">Cliente</span>
          <select value={invoiceDraft.companyId} onChange={(event) => patch('companyId', event.target.value)} required className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-white">
            {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
          </select>
        </label>
        <DarkInput label="Valor" value={invoiceDraft.amount} onChange={(value) => patch('amount', value)} type="number" required />
        <DarkInput label="Vencimento" value={invoiceDraft.dueDate} onChange={(value) => patch('dueDate', value)} type="date" />
        <button className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-neutral-950"><Plus className="h-4 w-4" />Criar fatura</button>
        <label className="md:col-span-4">
          <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-neutral-500">Link de pagamento</span>
          <input value={invoiceDraft.paymentUrl} onChange={(event) => patch('paymentUrl', event.target.value)} className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-white" />
        </label>
      </form>
      <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-900">
        <table className="w-full min-w-[900px] text-left">
          <thead><tr className="border-b border-neutral-800 text-xs font-bold uppercase tracking-widest text-neutral-500"><th className="p-4">Cliente</th><th className="p-4">Valor</th><th className="p-4">Status</th><th className="p-4">Vencimento</th><th className="p-4">Criada em</th><th className="p-4">Pagamento</th></tr></thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-b border-neutral-800 hover:bg-neutral-950">
                <td className="p-4 font-bold text-white">{invoice.companyName ?? invoice.companyId}</td>
                <td className="p-4 text-neutral-300">{formatCurrency(invoice.amount)}</td>
                <td className="p-4">
                  <select value={invoice.status} onChange={(event) => updateInvoiceStatus(invoice.id, event.target.value as Invoice['status'])} className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-white">
                    {invoiceStatuses.map((item) => <option key={item} value={item}>{invoiceStatusLabel(item)}</option>)}
                  </select>
                </td>
                <td className="p-4 text-neutral-300">{formatDate(invoice.dueDate)}</td>
                <td className="p-4 text-neutral-300">{formatDate(invoice.createdAt)}</td>
                <td className="p-4">{invoice.paymentUrl ? <a className="text-sm font-bold text-white underline" href={invoice.paymentUrl} target="_blank" rel="noreferrer">Abrir</a> : <span className="text-neutral-600">-</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {status ? <p className="text-sm font-bold text-white">{status}</p> : null}
    </div>
  );
}

function OrdersTab({ orders }: { orders: OrderRow[] }) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header><h1 className="text-3xl font-bold uppercase tracking-tight text-white">Pedidos Globais</h1><p className="text-sm text-neutral-500">Fila consolidada de pedidos de todos os tenants.</p></header>
      <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-900">
        <table className="w-full min-w-[820px] text-left">
          <thead><tr className="border-b border-neutral-800 text-xs font-bold uppercase tracking-widest text-neutral-500"><th className="p-4">Pedido</th><th className="p-4">Empresa</th><th className="p-4">Cliente</th><th className="p-4">Status</th><th className="p-4">Total</th><th className="p-4">Data</th></tr></thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-neutral-800 hover:bg-neutral-950">
                <td className="p-4 font-bold text-white">{order.orderCode}</td>
                <td className="p-4 text-neutral-300">{order.companyName ?? order.companyId}</td>
                <td className="p-4 text-neutral-300">{order.customerName}</td>
                <td className="p-4 text-neutral-300">{orderStatusLabel(order.status)}</td>
                <td className="p-4 text-neutral-300">{formatCurrency(order.totalAmount)}</td>
                <td className="p-4 text-neutral-300">{formatDate(order.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UsersTab() {
  const roles = [
    { title: 'Super Admin', description: 'Controle total da plataforma, planos, faturas, clientes e configuracoes.' },
    { title: 'Financeiro', description: 'Operacao de assinaturas, faturas, baixas e inadimplencia.' },
    { title: 'Suporte', description: 'Apoio operacional a clientes, leitura de pedidos e diagnostico de conta.' },
    { title: 'Comercial', description: 'Acompanhamento de planos, trial e evolucao de contas.' }
  ];
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header><h1 className="text-3xl font-bold uppercase tracking-tight text-white">Usuarios Master</h1><p className="text-sm text-neutral-500">Matriz de papeis interna preparada para evoluir para CRUD completo de operadores.</p></header>
      <div className="grid gap-4 md:grid-cols-2">
        {roles.map((role) => (
          <article key={role.title} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="text-lg font-bold text-white">{role.title}</h2>
            <p className="mt-2 text-sm text-neutral-500">{role.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function AuditTab({ rows }: { rows: AuditLog[] }) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header><h1 className="text-3xl font-bold uppercase tracking-tight text-white">Auditoria</h1><p className="text-sm text-neutral-500">Eventos administrativos, mudancas financeiras e alteracoes de planos.</p></header>
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900">
        {rows.length === 0 ? <p className="p-5 text-sm text-neutral-500">Nenhum evento registrado.</p> : null}
        {rows.map((row) => (
          <div key={row.id} className="grid gap-2 border-b border-neutral-800 p-4 text-sm text-neutral-300 md:grid-cols-[180px_1fr_180px]">
            <span className="text-neutral-500">{formatDate(row.createdAt)}</span>
            <span><strong className="text-white">{row.action}</strong> em {row.entity}</span>
            <span className="truncate text-neutral-500">{row.entityId ?? row.companyId ?? '-'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsTab() {
  const items = [
    'Rotas separadas para cliente e master',
    'CORS configurado para o dominio sistemalizecatalogo.vercel.app',
    'Billing manual com fatura, baixa e atraso',
    'Plano com limite de produtos aplicado no backend',
    'Auditoria de acoes master'
  ];
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <header><h1 className="text-3xl font-bold uppercase tracking-tight text-white">Configuracoes da Plataforma</h1><p className="text-sm text-neutral-500">Controles globais ja conectados e pontos operacionais monitoraveis.</p></header>
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <div className="grid gap-3">
          {items.map((item) => (
            <div key={item} className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950 p-4">
              <span className="text-sm text-neutral-300">{item}</span>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase text-emerald-300">Ativo</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DarkInput({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return (
    <label>
      <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-neutral-500">{label}</span>
      <input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-white" />
    </label>
  );
}

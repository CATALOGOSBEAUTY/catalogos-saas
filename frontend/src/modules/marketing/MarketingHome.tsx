import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Check, LayoutDashboard, MessageCircle, ShieldCheck, ShoppingBag, Sparkles } from 'lucide-react';
import { commercialPlans, marketingNavigation, platformModules, productHighlights, systemBrand, workflowSteps } from './landingContent';

const highlightIcons = [ShoppingBag, LayoutDashboard, ShieldCheck];

export function MarketingHome() {
  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-neutral-950/90 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 md:px-8">
          <Link to="/" className="flex items-center gap-3" aria-label="Sistematize inicio">
            <img src="/assets/sistematize-logo.svg" alt="Sistematize" className="h-11 w-44 rounded bg-white object-contain px-2" />
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-neutral-300 lg:flex">
            {marketingNavigation.slice(0, 3).map((item) => (
              <a key={item.href} href={item.href} className="hover:text-white">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/cliente/login" className="hidden rounded-lg border border-white/15 px-4 py-2 text-sm font-bold text-white hover:bg-white/10 sm:inline-flex">
              Painel cliente
            </Link>
            <Link to="/master/login" className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-neutral-950 hover:bg-sky-100">
              Master
            </Link>
          </div>
        </div>
      </header>

      <section className="relative flex min-h-[92vh] items-center overflow-hidden bg-neutral-950 pt-24 text-white">
        <div className="absolute inset-0 opacity-30 dot-pattern" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent" />
        <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 pb-16 pt-10 md:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-300/30 bg-sky-300/10 px-4 py-2 text-xs font-bold uppercase text-sky-100">
              <Sparkles className="h-4 w-4" />
              SaaS de catalogos digitais
            </div>
            <h1 className="text-5xl font-black leading-[0.95] text-white md:text-7xl">
              {systemBrand.name} transforma catalogos em operacao de venda.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-300">
              {systemBrand.description}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/loja/pulsefit/catalogo" className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-sky-400 via-indigo-500 to-fuchsia-600 px-6 py-4 text-sm font-black text-white shadow-xl shadow-indigo-950/30">
                Ver catalogo demo
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link to="/cliente/login" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 px-6 py-4 text-sm font-black text-white hover:bg-white/10">
                Entrar no painel
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[2rem] border border-white/15 bg-white/10 p-3 shadow-2xl shadow-black/40 backdrop-blur-md">
              <div className="overflow-hidden rounded-[1.5rem] bg-white text-neutral-950">
                <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <img src="/assets/sistematize-logo.svg" alt="" className="h-9 w-36 object-contain object-left" />
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">online</span>
                </div>
                <div className="grid gap-4 p-5 md:grid-cols-[0.8fr_1.2fr]">
                  <aside className="rounded-2xl bg-neutral-100 p-4">
                    {['Moda fitness', 'Acessorios', 'Suplementos', 'Ofertas'].map((item, index) => (
                      <div key={item} className={`mb-3 rounded-xl px-3 py-3 text-sm font-bold ${index === 0 ? 'bg-neutral-950 text-white' : 'bg-white text-neutral-700'}`}>
                        {item}
                      </div>
                    ))}
                  </aside>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {['Top esportivo', 'Legging premium', 'Whey isolado', 'Garrafa termica'].map((item, index) => (
                      <article key={item} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                        <div className={`mb-4 aspect-square rounded-xl ${['bg-sky-100', 'bg-fuchsia-100', 'bg-emerald-100', 'bg-amber-100'][index]}`} />
                        <strong className="block text-sm">{item}</strong>
                        <span className="mt-1 block text-xs text-neutral-500">Pedido via WhatsApp</span>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="produto" className="mx-auto grid max-w-7xl gap-6 px-4 py-20 md:px-8 lg:grid-cols-3">
        {productHighlights.map((item, index) => (
          <article key={item.title} className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
            <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-lg ${['bg-sky-100 text-sky-700', 'bg-emerald-100 text-emerald-700', 'bg-fuchsia-100 text-fuchsia-700'][index]}`}>
              {(() => {
                const Icon = highlightIcons[index];
                return <Icon className="h-6 w-6" />;
              })()}
            </div>
            <h2 className="text-xl font-black text-neutral-950">{item.title}</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-600">{item.description}</p>
          </article>
        ))}
      </section>

      <section className="border-y border-neutral-200 bg-neutral-50">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 md:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <span className="text-sm font-black uppercase text-indigo-700">Operacao completa</span>
            <h2 className="mt-3 text-4xl font-black leading-tight text-neutral-950">Da criacao do catalogo ate o controle master.</h2>
            <p className="mt-4 text-base leading-7 text-neutral-600">
              A plataforma foi pensada para separar visitante publico, cliente contratante e operador master. Isso evita confusao de login e cria base para planos, billing, modulos e suporte.
            </p>
          </div>
          <div className="grid gap-3">
            {workflowSteps.map((step, index) => (
              <div key={step} className="flex items-center gap-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-950 text-sm font-black text-white">{index + 1}</span>
                <strong className="text-sm text-neutral-800">{step}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="planos" className="mx-auto max-w-7xl px-4 py-20 md:px-8">
        <div className="mb-10 max-w-3xl">
          <span className="text-sm font-black uppercase text-indigo-700">Planos</span>
          <h2 className="mt-3 text-4xl font-black text-neutral-950">Escada comercial pronta para vender e evoluir.</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-5">
          {commercialPlans.map((plan) => (
            <article key={plan.name} className="flex min-h-[360px] flex-col rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
              <h3 className="text-xl font-black">{plan.name}</h3>
              <strong className="mt-4 text-3xl font-black text-neutral-950">{plan.price}</strong>
              <div className="mt-4 space-y-1 text-sm text-neutral-600">
                <p>{plan.limit}</p>
                <p>{plan.users}</p>
                <p>{plan.storage}</p>
              </div>
              <ul className="mt-5 flex flex-1 flex-col gap-2 text-sm text-neutral-700">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {feature}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-neutral-950 px-4 py-20 text-white md:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <span className="text-sm font-black uppercase text-sky-300">Modulos pagos</span>
            <h2 className="mt-3 text-4xl font-black">A plataforma nasce simples, mas preparada para crescer.</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {platformModules.map((moduleName) => (
              <div key={moduleName} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-4">
                <BarChart3 className="h-5 w-5 text-sky-300" />
                <strong>{moduleName}</strong>
              </div>
            ))}
            <Link to="/master/login" className="flex items-center justify-center gap-2 rounded-lg bg-white p-4 font-black text-neutral-950">
              Abrir master
              <MessageCircle className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

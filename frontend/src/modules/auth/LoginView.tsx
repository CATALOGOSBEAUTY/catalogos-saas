import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, KeyRound, Lock, Mail, ShieldCheck } from 'lucide-react';
import { api } from '../../services/apiClient';

interface LoginViewProps {
  mode: 'client' | 'master';
}

export function LoginView({ mode }: LoginViewProps) {
  const navigate = useNavigate();
  const isMaster = mode === 'master';
  const [email, setEmail] = useState(isMaster ? 'master@catalogos.local' : 'owner@pulsefit.local');
  const [password, setPassword] = useState(isMaster ? 'Master@123' : 'PulseFit@123');
  const [gateCode, setGateCode] = useState('');
  const [gatePassed, setGatePassed] = useState(!isMaster);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validateGate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (gateCode.trim().toLowerCase() !== 'master') {
      setError('Codigo master invalido.');
      return;
    }
    setGatePassed(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const session = isMaster ? await api.masterLogin(email, password) : await api.clientLogin(email, password);
      if (isMaster && !session.master) throw new Error('Credencial nao pertence ao master.');
      if (!isMaster && !session.tenant) throw new Error('Credencial nao pertence a um cliente.');
      navigate(isMaster ? '/master/app/dashboard' : '/cliente/app/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={`min-h-screen flex items-center justify-center p-4 ${isMaster ? 'bg-neutral-950' : 'bg-neutral-50'}`}>
      <section className="w-full max-w-md overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl">
        <div className={`p-8 text-center ${isMaster ? 'bg-neutral-900' : 'bg-gradient-to-r from-purple-800 to-purple-600'}`}>
          <div className="mx-auto mb-4 flex h-16 w-56 items-center justify-center rounded-xl bg-white/95 px-4 shadow-lg">
            <img src="/assets/sistematize-logo.svg" alt="Sistematize" className="h-12 w-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white">
            {isMaster ? 'Backoffice Master' : 'Painel do Cliente'}
          </h1>
          <p className={isMaster ? 'mt-2 text-sm text-neutral-300' : 'mt-2 text-sm text-purple-100'}>
            {isMaster ? 'Acesso isolado da plataforma SaaS' : 'Central de gerenciamento do catalogo'}
          </p>
        </div>

        <div className="p-8">
          <form onSubmit={isMaster && !gatePassed ? validateGate : submit} className="flex flex-col gap-5">
            {error ? (
              <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-center text-sm text-red-600">
                {error}
              </div>
            ) : null}

            {isMaster && !gatePassed ? (
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">Codigo master</span>
                <span className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="password"
                    value={gateCode}
                    onChange={(event) => setGateCode(event.target.value)}
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-3 pl-10 pr-4 text-sm outline-none transition-colors focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                    placeholder="Digite: master"
                    autoComplete="one-time-code"
                    required
                  />
                </span>
              </label>
            ) : (
              <>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">E-mail</span>
                  <span className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-3 pl-10 pr-4 text-sm outline-none transition-colors focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                      autoComplete="username"
                      required
                    />
                  </span>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">Senha</span>
                  <span className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-3 pl-10 pr-4 text-sm outline-none transition-colors focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                      autoComplete="current-password"
                      required
                    />
                  </span>
                </label>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold uppercase tracking-tight text-white shadow-md transition-all disabled:opacity-50 ${
                isMaster ? 'bg-neutral-900 hover:bg-neutral-800' : 'bg-gradient-to-r from-purple-800 to-purple-600 hover:from-purple-700 hover:to-purple-500 shadow-purple-500/20'
              }`}
            >
              {isMaster ? <ShieldCheck className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
              {loading ? 'Autenticando...' : isMaster && !gatePassed ? 'Validar acesso master' : 'Entrar no sistema'}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-neutral-400">
            <Link to="/" className="hover:text-purple-700">Inicio</Link>
            <Link to="/loja/pulsefit/catalogo" className="hover:text-purple-700">Catalogo demo</Link>
            <Link to={isMaster ? '/cliente/login' : '/master/login'} className="hover:text-purple-700">
              {isMaster ? 'Login cliente' : 'Login master'}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

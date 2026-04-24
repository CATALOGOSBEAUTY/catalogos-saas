import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/apiClient';

export function LoginView() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('owner@pulsefit.local');
  const [password, setPassword] = useState('PulseFit@123');
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const session = await api.login(email, password);
      navigate(session.master ? '/master' : '/app');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no login');
    }
  }

  return (
    <main className="auth-screen">
      <form className="auth-panel" onSubmit={submit}>
        <span className="eyebrow">Catalogos SaaS</span>
        <h1>Entrar</h1>
        <label>
          E-mail
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
        </label>
        <label>
          Senha
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" />
        </label>
        <button type="submit">Acessar</button>
        {error ? <p className="status-line error">{error}</p> : null}
      </form>
    </main>
  );
}

# Catalogos SaaS

SaaS multiempresa de catalogos, usando a experiencia publica do PulseFit como referencia visual e uma arquitetura nova para tenant, auth, central do cliente e backoffice master.

## Estrutura

```txt
frontend/   React + Vite + TypeScript
backend/    Express + TypeScript
database/   Supabase/PostgreSQL migrations e seeds
```

## Rodar local

```powershell
npm install
npm run dev:backend
npm run dev:frontend
```

Backend: `http://localhost:3001`

Frontend: `http://localhost:5173`

Loja demo: `http://localhost:5173/loja/pulsefit/catalogo`

## Validacao

```powershell
npm run lint
npm test
npm run build
```

## Deploy

Frontend Vercel:

```powershell
cd frontend
vercel deploy --prod
```

Backend Render:

- usar `render.yaml`;
- configurar `DATA_PROVIDER=supabase`;
- configurar `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`;
- configurar `JWT_SECRET`, `COOKIE_SECRET` e `CORS_ORIGINS`.

## Seguranca

- Nunca versionar `.env` real.
- Nunca enviar `company_id` pelo frontend em rotas privadas.
- Toda rota `/api/client` usa tenant derivado da sessao.
- Toda rota `/api/master` exige papel master.
- Preco e total de pedido publico sao calculados no backend.

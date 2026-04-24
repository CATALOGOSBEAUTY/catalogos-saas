# Platform Separation And PulseFit Layout Design

## Objective

Make the SaaS feel like a real product by separating three experiences:

- Public catalog for shoppers.
- Client backoffice for the tenant that bought the catalog.
- Master backoffice for the SaaS operator.

The public catalog and client backoffice should follow the local PulseFit model in `C:\Users\AI\Documents\PROJETOS\PulseFit`. The master backoffice should be separate, operational and SaaS-oriented.

## Current Problem

The current app uses one generic `/login` route for both client and master users. Public catalog links also point to this generic login. This causes the master path to feel like the same product as the client admin and creates confusion between platform operator and tenant.

## Target Routes

- Public store:
  - `/loja/:companySlug/inicio`
  - `/loja/:companySlug/catalogo`
  - `/loja/:companySlug/produto/:productSlug`
  - `/loja/:companySlug/contato`
- Client admin:
  - `/cliente/login`
  - `/cliente/app/dashboard`
  - `/cliente/app/produtos`
  - `/cliente/app/categorias`
  - `/cliente/app/midia`
  - `/cliente/app/destaques`
  - `/cliente/app/pedidos`
  - `/cliente/app/configuracoes`
- Master admin:
  - `/master/login`
  - `/master/app/dashboard`
  - `/master/app/clientes`
  - `/master/app/planos`
  - `/master/app/assinaturas`
  - `/master/app/pedidos`
  - `/master/app/usuarios`
  - `/master/app/auditoria`
  - `/master/app/configuracoes`

## Backend Auth Design

Add explicit API login endpoints:

- `POST /api/auth/client-login`: authenticates only users with tenant access.
- `POST /api/auth/master-login`: authenticates only users with master access.
- Keep `POST /api/auth/login` for compatibility, but stop linking the frontend to it.

Both flows can still use the same secure session cookie. Authorization remains enforced by `requireTenant` and `requireMaster`.

## Frontend Design

The frontend will use a richer Vite/Tailwind shell similar to PulseFit:

- Public store gets a PulseFit-style header, hero, catalog grid, product cards and drawer cart.
- Client admin gets a sidebar/header layout with separate tabs/pages.
- Master admin gets a separate SaaS backoffice layout with its own sidebar, metrics and operational tables.

## Validation

Required checks:

- Backend tests prove client and master login separation.
- Existing tenant isolation tests stay green.
- `npm run lint`, `npm test`, `npm run build`, and `npm audit --audit-level=moderate` pass.
- Production deploys verify public catalog, client login, master login, Render health and CORS.

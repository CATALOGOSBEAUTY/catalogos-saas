# Operational MVP Completion Design

## Goal

Complete the sellable SaaS MVP described in the supplied documentation by adding real operational controls for master, manual billing, client public settings, plan limits, and order/product workflows.

## Scope

This phase intentionally implements the manual MVP, not external payment gateways. Asaas, Mercado Pago, Stripe, chatbot, and custom-domain automation remain future integrations.

## Backend Contract

- Client APIs:
  - `GET /api/client/usage`
  - `GET /api/client/settings/public`
  - `PUT /api/client/settings/public`
  - `GET /api/client/billing/subscription`
  - `GET /api/client/billing/invoices`
  - `GET /api/client/modules`
  - `PATCH /api/client/orders/:id/status`
  - existing product creation enforces plan product limits.
- Master APIs:
  - `GET /api/master/companies/:id`
  - `PUT /api/master/companies/:id`
  - `PATCH /api/master/companies/:id/status`
  - `PATCH /api/master/companies/:id/plan`
  - `GET/POST/PUT/PATCH /api/master/plans`
  - `GET/POST/PUT /api/master/modules`
  - `GET /api/master/billing/subscriptions`
  - `GET/POST /api/master/billing/invoices`
  - `PATCH /api/master/billing/invoices/:id/status`
  - `GET /api/master/orders`
  - `GET /api/master/audit-logs`

## Data Model

Use existing `plans`, `subscriptions`, `invoices`, `modules`, and `audit_logs` tables. Add `company_modules` as the missing join table. All private tenant mutations stay scoped by `company_id`.

## Frontend Contract

- Client dashboard gains product edit, selected/all bulk stock, public appearance/settings, plan usage, billing and modules views.
- Master dashboard gains real operational tabs for company detail/actions, plans, modules, subscriptions, invoices, global orders, and audit logs.
- Public store gains a useful contact view from tenant settings.

## Validation

Backend tests prove plan limits, billing/status actions, settings updates, and audit logs. Full validation remains `npm run lint`, `npm test`, `npm run build`, production deploy, and live route/API checks.

# Catalogos SaaS Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first executable foundation for a multi-tenant catalog SaaS derived from the PulseFit public experience.

**Architecture:** Create a monorepo with a Vite frontend, Express backend and Supabase/PostgreSQL database folder. The backend owns authentication, tenant resolution, role checks, public catalog reads and order creation; the frontend consumes APIs and never sends `company_id` for private operations.

**Tech Stack:** React, Vite, TypeScript, Express, Vitest, Supertest, PostgreSQL/Supabase SQL.

---

### Task 1: Repository Foundation

**Files:**
- Create: `package.json`
- Create: `tsconfig.base.json`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `README.md`

- [x] Add npm workspaces for `frontend` and `backend`.
- [x] Add shared TypeScript strict config.
- [x] Add env template without secrets.
- [x] Add usage docs and validation commands.

### Task 2: Database Foundation

**Files:**
- Create: `database/migrations/001_init.sql`
- Create: `database/seeds/001_plans_and_demo.sql`

- [x] Create tenant-aware tables with `company_id`.
- [x] Add composite uniqueness and foreign keys to keep child records inside the same tenant.
- [x] Add indexes for public catalog, client lists and dashboard queries.
- [x] Add baseline RLS enablement for operational tables.
- [x] Add demo plan and PulseFit tenant seed.

### Task 3: Backend Foundation

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/vitest.config.ts`
- Create: `backend/src/app.ts`
- Create: `backend/src/server.ts`
- Create: `backend/src/config/env.ts`
- Create: `backend/src/lib/http.ts`
- Create: `backend/src/lib/auth.ts`
- Create: `backend/src/store/data.ts`
- Create: `backend/src/middleware/security.ts`
- Create: `backend/src/middleware/auth.ts`
- Create: `backend/src/modules/auth/routes.ts`
- Create: `backend/src/modules/publicCatalog/routes.ts`
- Create: `backend/src/modules/client/routes.ts`
- Create: `backend/src/modules/master/routes.ts`
- Create: `backend/src/tests/tenant.test.ts`

- [x] Build Express app with security headers, CORS, rate limit, JSON guard and standard errors.
- [x] Implement cookie JWT auth and password hashing.
- [x] Implement tenant and master guards.
- [x] Implement public catalog bootstrap and order creation with backend price calculation.
- [x] Implement client product/category/orders endpoints against tenant context.
- [x] Implement master dashboard and company list endpoints.
- [x] Add tests for tenant isolation, master protection and order total calculation.

### Task 4: Frontend Foundation

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/index.css`
- Create: `frontend/src/config/env.ts`
- Create: `frontend/src/services/apiClient.ts`
- Create: `frontend/src/modules/public-store/PublicStore.tsx`
- Create: `frontend/src/modules/auth/LoginView.tsx`
- Create: `frontend/src/modules/client-dashboard/ClientDashboard.tsx`
- Create: `frontend/src/modules/master/MasterDashboard.tsx`

- [x] Add route groups for `/loja/:companySlug`, `/login`, `/app` and `/master`.
- [x] Add public store catalog using backend bootstrap.
- [x] Add login view using cookie credentials.
- [x] Add client and master dashboard shells backed by APIs.

### Task 5: Verification

- [ ] Run `npm install`.
- [ ] Run `npm run lint`.
- [ ] Run `npm test`.
- [ ] Run `npm run build`.

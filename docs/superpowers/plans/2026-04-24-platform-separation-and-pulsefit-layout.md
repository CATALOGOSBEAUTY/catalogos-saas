# Platform Separation And PulseFit Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate public, client and master experiences while bringing the PulseFit public/admin visual structure into the SaaS.

**Architecture:** Backend exposes explicit client/master login endpoints using the existing cookie session and role guards. Frontend receives route-specific login pages and separate layout shells for public catalog, client admin and master admin.

**Tech Stack:** React, Vite, TypeScript, Express, Supabase, Tailwind CSS, Vitest, Supertest.

---

### Task 1: Auth Separation

**Files:**
- Modify: `backend/src/modules/auth/routes.ts`
- Modify: `backend/src/tests/tenant.test.ts`
- Modify: `frontend/src/services/apiClient.ts`
- Modify: `frontend/src/modules/auth/LoginView.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] Add failing tests for `POST /api/auth/client-login` rejecting master-only users.
- [ ] Add failing tests for `POST /api/auth/master-login` rejecting tenant-only users.
- [ ] Implement explicit login endpoints.
- [ ] Wire frontend client login to `/api/auth/client-login`.
- [ ] Wire frontend master login to `/api/auth/master-login`.

### Task 2: Visual Foundation

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/src/index.css`
- Copy: `frontend/public/assets/pulsefit-logo-transparent.png`

- [ ] Add Tailwind and motion dependencies.
- [ ] Configure Tailwind Vite plugin.
- [ ] Import Tailwind and PulseFit utilities.
- [ ] Copy PulseFit logo asset.

### Task 3: Public Store

**Files:**
- Modify: `frontend/src/modules/public-store/PublicStore.tsx`

- [ ] Replace minimal current catalog with PulseFit-style public shell.
- [ ] Add Inicio, Catalogo, Produto and Contato views under `/loja/:companySlug`.
- [ ] Preserve API-backed products, categories and public order creation.

### Task 4: Client Admin

**Files:**
- Modify: `frontend/src/modules/client-dashboard/ClientDashboard.tsx`

- [ ] Replace single-page client dashboard with sidebar/header layout.
- [ ] Add Dashboard, Produtos, Categorias, Midia, Destaques, Pedidos and Configuracoes tabs.
- [ ] Keep existing product/category CRUD and upload behavior.

### Task 5: Master Backoffice

**Files:**
- Modify: `frontend/src/modules/master/MasterDashboard.tsx`

- [ ] Replace minimal master table with a separate SaaS backoffice shell.
- [ ] Add Dashboard, Clientes, Planos, Assinaturas, Pedidos, Usuarios, Auditoria and Configuracoes tabs.
- [ ] Keep current master metrics and companies API working.

### Task 6: Verification And Deploy

- [ ] Run `npm run lint`.
- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Run `npm audit --audit-level=moderate`.
- [ ] Commit and push.
- [ ] Deploy Render and Vercel.
- [ ] Verify production routes.

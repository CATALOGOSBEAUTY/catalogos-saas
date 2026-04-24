# Operational MVP Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the SaaS manual MVP with master operations, billing, settings, limits, and richer client workflows.

**Architecture:** Extend the existing repository interface and Express routers rather than introducing a second data layer. Keep security decisions in backend routes and use React dashboards only as operational clients.

**Tech Stack:** React, Vite, TypeScript, Express, Vitest, Supertest, Supabase/PostgreSQL.

---

### Task 1: Backend Contracts

**Files:**
- Modify: `backend/src/tests/tenant.test.ts`
- Modify: `backend/src/store/data.ts`
- Modify: `backend/src/repositories/supabaseRepository.ts`
- Modify: `backend/src/modules/client/routes.ts`
- Modify: `backend/src/modules/master/routes.ts`

- [ ] Add failing tests for settings, plan limits, manual invoices, company suspension, and order status updates.
- [ ] Extend repository types and memory store.
- [ ] Implement Supabase repository methods.
- [ ] Add client and master routes.
- [ ] Run backend tests until green.

### Task 2: Database Delta

**Files:**
- Create: `database/migrations/003_operational_mvp.sql`
- Modify: `database/seeds/001_plans_and_demo.sql`

- [ ] Add `company_modules`.
- [ ] Seed Platinum, Enterprise, and standard modules.
- [ ] Keep migration idempotent.

### Task 3: Frontend Operations

**Files:**
- Modify: `frontend/src/services/apiClient.ts`
- Modify: `frontend/src/modules/client-dashboard/ClientDashboard.tsx`
- Modify: `frontend/src/modules/master/MasterDashboard.tsx`
- Modify: `frontend/src/modules/public-store/PublicStore.tsx`

- [ ] Wire new APIs.
- [ ] Add client edit/bulk/settings/billing/modules views.
- [ ] Replace master placeholders with operational data/actions.
- [ ] Add contact surface to public store.

### Task 4: Verification And Deployment

**Commands:**
- `npm run lint`
- `npm test`
- `npm run build`
- deploy frontend through Vercel
- deploy backend through Render if backend changes require it
- verify production routes and API CORS.

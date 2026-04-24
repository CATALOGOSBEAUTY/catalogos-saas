# Sistematize Home And Domain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Sistematize homepage, apply system branding, and publish the new Vercel alias.

**Architecture:** A new marketing module owns the landing page and content contract. Routing keeps tenant catalog, client panel, and master panel separated.

**Tech Stack:** React, Vite, TypeScript, Tailwind CSS, Vitest, Vercel CLI.

---

### Task 1: Landing Content Contract

**Files:**
- Create: `frontend/src/modules/marketing/landingContent.test.ts`
- Create: `frontend/src/modules/marketing/landingContent.ts`

- [ ] Write failing tests for brand name, navigation links, and commercial plan prices.
- [ ] Run the focused Vitest command and confirm the module is missing.
- [ ] Implement `landingContent.ts` with the tested arrays and constants.
- [ ] Re-run the focused Vitest command and confirm it passes.

### Task 2: Marketing Home UI And Branding

**Files:**
- Create: `frontend/public/assets/sistematize-logo.svg`
- Create: `frontend/src/modules/marketing/MarketingHome.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/modules/auth/LoginView.tsx`
- Modify: `frontend/src/modules/client-dashboard/ClientDashboard.tsx`
- Modify: `frontend/src/modules/master/MasterDashboard.tsx`

- [ ] Add the SVG logo asset.
- [ ] Implement the home with hero, product explanation, workflow, plans, modules, and CTAs.
- [ ] Route `/` to `MarketingHome`.
- [ ] Change fallback route to `/`.
- [ ] Replace platform-level PulseFit branding with Sistematize logo.

### Task 3: Verification And Production

**Files:**
- Modify: `frontend/package.json` if a test script is needed.
- Modify: `package.json` if root test orchestration is updated.

- [ ] Run focused frontend test.
- [ ] Run `npm run lint`.
- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Deploy to Vercel production.
- [ ] Assign `sistemalizecatalogo.vercel.app` to the ready deployment.
- [ ] Verify `/`, `/loja/pulsefit/catalogo`, `/cliente/login`, and `/master/login` in production.

# Sistematize Home And Domain Design

## Goal

Turn the root route into the Sistematize institutional homepage, apply the system brand to platform surfaces, and publish the current Vercel project under `sistemalizecatalogo.vercel.app`.

## Requirements

- `/` must be a SaaS landing page, not a redirect to the PulseFit demo store.
- The page must explain the catalog product, show plans, and provide clear entry points for demo catalog, client login, and master login.
- `/loja/:companySlug/*` remains the tenant public catalog area.
- Platform login and backoffice surfaces use Sistematize branding. Tenant catalog surfaces may keep the tenant logo.
- The requested Vercel alias is `sistemalizecatalogo.vercel.app`. Vercel will serve it over HTTPS even if the user typed `http`.

## Architecture

- Add a focused marketing module under `frontend/src/modules/marketing`.
- Keep marketing content in a small data file so plan cards, navigation, and highlights are testable without browser tooling.
- Use a static SVG asset for the system logo to avoid depending on uploaded chat image extraction.
- Update React routes so `/` renders the marketing page and unknown routes return to `/`.

## Verification

- Add a Vitest unit test for the landing content contract.
- Run frontend lint/build plus existing backend tests through root scripts.
- Deploy to Vercel production, assign the alias, and verify the alias root and key routes return HTTP 200.

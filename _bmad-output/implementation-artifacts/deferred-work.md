# Deferred Work

## Deferred from: code review of 1-1-turborepo-monorepo-shared-packages-scaffold (2026-06-12)

- `packages/*/package.json` source exports (`./src/index.ts`) — add `transpilePackages: ['@kandles/db', '@kandles/types', '@kandles/env', '@kandles/ui', '@kandles/email']` to `apps/admin/next.config.ts` when real imports are added (Story 1.2+)
- `packages/*/tsconfig.json` missing `declaration: true` / `declarationMap: true` — add if exports move from source to `dist/`
- `apps/storefront/package.json` missing `@kandles/ui` dependency — add in Story 2.1 when UI components scaffolded
- Root `tsconfig.json` `paths` silently overridden by app-level `paths` (TypeScript does not merge `paths`) — works via pnpm workspace symlinks; document or refactor in Story 2.1
- Root `tsconfig.json` missing `composite: true` / `declarationMap: true` for TypeScript project references — revisit if moving to compiled dist/ exports
- No `vercel.json` for Vercel monorepo deployment — Story 1.6 (split-hosting-setup)
- No Turborepo remote cache config (TURBO_TOKEN/TURBO_TEAM absent) → cold CI builds — Story 1.7 (CI/CD pipeline)
- `@astrojs/tailwind` peer dep mismatch with Astro v6 (declares peer `astro: ^3||^4||^5`, installed with v6) — switch to `@tailwindcss/vite` direct integration in Story 2.1 (brand design system)
- `apps/storefront/dist/server/wrangler.json` SESSION KV binding has no `id` — `@astrojs/cloudflare` injects it by default with `output: 'server'`; supply KV namespace ID or disable in adapter config in Story 1.6 (split-hosting-setup)
- `packages/*/tsconfig.json` `rootDir: "./src"` will cause `tsc` build failure when cross-package imports are added (file outside rootDir); currently masked because all packages are `export {}`— fix with `composite: true` + project references or remove `rootDir` when real code is added

## Deferred from: code review of 1-2-environment-validation-secrets-management (2026-06-12)

- `packages/env/src/astro.ts`: `import.meta.env` not available for CF dashboard secrets at request time in CF Workers SSR — secrets must be threaded via `context.env` worker bindings. Addressed in Story 1.6 (split-hosting-setup). Known, documented in story Dev Notes.
- `packages/env/src/nextjs.ts`: `experimental__runtimeEnv` only maps declared NEXT_PUBLIC_ vars — new client vars added later must be manually added to the mapping or they silently skip validation. Document as team convention when adding new client vars.
- `packages/env/src/index.ts`: `isServer` detection (`typeof window === "undefined"`) may not hold in CF DurableObject/WorkerEntrypoint context. Revisit if DOs or WorkerEntrypoints are introduced.
- `packages/env/src/astro.ts`: `PUBLIC_GTM_CONTAINER_ID` must be a build-time Cloudflare Pages variable (not a runtime secret binding) or it will be `undefined` client-side. Document in Story 6-3 (GTM setup) or CF Pages deployment config.

## Deferred from: code review of 1-3-core-db-schema-products-collections-drizzle-migration-strategy (2026-06-12)

- `packages/db/drizzle/migrations/meta/` — миграция `0001_products_search_index.sql` е регистрирана в `_journal.json` но няма snapshot; drizzle-kit може да я презапише или конфликтира при следващо `generate` в Story 1.4+. Изисква внимание преди пускане на `drizzle-kit generate` за следваща миграция.

## Deferred from: code review of 1-4-orders-checkout-db-schema (2026-06-12)

- `orders.ts`: indexes on (user_id, status) — deferred to Story 1.7 per dev notes
- `order_items.ts`: index on order_id — deferred to Story 1.7 per dev notes
- `cart_reservations.ts`: indexes on (expires_at, product_id, session_id) — deferred to Story 1.10 per dev notes
- `cart_reservations.ts`: overselling race condition, no SELECT FOR UPDATE on products.stock — deferred to Story 4.1
- `orders.ts`: payment_method vs stripePaymentIntentId consistency constraint — app-layer validation sufficient for MVP
- `cart_reservations.ts`: (session_id, product_id) partial unique index preventing duplicate active reservations — requires raw SQL, deferred to Story 4.1
- `order_items.ts`: (order_id, product_id) unique constraint — checkout flow design decision, deferred to Story 4.2
- `stripe.ts`: eventType column (e.g. `payment_intent.succeeded`) for audit — MVP scope, add when debugging becomes needed
- `orders.ts`: CHECK (approved_at >= preview_uploaded_at) ordering constraint — future preview workflow story
- `orders.ts`: tracking_number + courier co-presence constraint — future courier/shipping story
- `cart_reservations.ts`: CHECK (expires_at > created_at) — minor, app-layer ensures valid values
- `order_items.ts`: snapshot_price column — future returns/exchange story may need catalog price at order time
- `orders.ts`: updated_at DB-level trigger (currently ORM-only, stale if row updated via raw SQL) — Story 1.7 or dedicated DB work
- `orders.ts`: guest_email format validation at DB level — app-layer validation is standard approach
- `orders.ts`: totalPrice integrity link to SUM(order_items.unit_price * quantity) — complex trigger or generated column, future story

## Deferred from: code review of 1-6-split-hosting-setup-cloudflare-pages-vercel (2026-06-12)

- `apps/storefront/public/_headers` CSP `unsafe-inline` in script-src/style-src — MVP tradeoff; Astro injects inline scripts for hydration; revisit with nonce-based CSP in a future security hardening story
- `apps/storefront/public/_headers` CSP missing Meta Pixel/Sentry/Turnstile/Stripe Radar entries — features not yet implemented; add in Stories 6.4, 1.9, 4.6, 4.3 respectively
- `apps/storefront/astro.config.ts` missing `site` option — needed for sitemap/canonical URLs; add in Story 2.7 (Schema.org/sitemap)
- `packages/db` postgres singleton without max:1/prepare:false for Supabase Supavisor — pre-existing from Story 1.3; revisit in Story 1.10 or dedicated DB perf story
- `apps/storefront/wrangler.toml` compatibility_date "2025-01-01" — minor staleness; update in Story 1.7 alongside CF Pages deploy config
- `apps/admin/vercel.json` function timeout/region limits — not required for MVP; add in Story 1.7 CI/CD
- `apps/storefront/src/lib/supabase.ts` + CF Pages import.meta.env static replacement nuance — standard @astrojs/cloudflare pattern; revisit if runtime env binding issues arise

## Deferred from: code review of 1-8-self-hosted-fonts-brand-css-design-tokens (2026-06-12)

- `e2e/fonts.spec.ts` — test doesn't await `networkidle`; low-risk (preload fires before load event), but add `waitForLoadState('networkidle')` in a future e2e hardening story
- `e2e/fonts.spec.ts` — test doesn't assert HTTP 200 from `/`; false-pass if route returns 404; validate page response status in Story 2.x e2e suite

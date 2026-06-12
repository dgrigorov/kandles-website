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

## Deferred from: code review of 1-10-db-seed-data-data-retention-cron-jobs (2026-06-12)

- `apps/admin/src/app/api/cron/cleanup/route.ts:8-10` — CRON_SECRET auth header compared with `!==` (not constant-time); use `crypto.timingSafeEqual` for timing-safe comparison in production security hardening story
- `packages/db/src/seed.ts:20` — `ADMIN_SEED_AUTH_UUID` is a hardcoded dummy UUID; won't match real Supabase `auth.users.id`; acceptable for dev-only seed; revisit if FK to auth.users is ever enforced or if seed is reused in staging
- `packages/db/src/seed.ts:79` — `process.exit(0)` bypasses postgres.js `client.end()` teardown; dev tooling only, OS cleans up; fix in future dev tooling improvement

## Deferred from: code review of 2-1-brand-design-system-component-library (2026-06-12)

- `packages/ui/src/components/KandlesIcon.tsx:14` — Zero-area placeholder paths for `pot` + `sunburst` variants; invisible without `stroke`; replace with final artwork from Hamza Shehzad (UX-DR2) before launch
- `apps/storefront/src/styles/tokens.css:30` — `[data-theme]` CSS valid but no element sets the attribute yet; Stories 2.2+ add `data-theme` to sections; `--color-bg`/`--color-text`/`--color-accent` undefined until then
- `apps/admin` — CSS vars `--color-amber` etc. not defined in admin; when KandlesIcon is used in admin (Stories 5.x), add token definitions to `apps/admin/src/app/globals.css` or add `var(--color-amber, #B5621E)` fallbacks to component
- `packages/ui/src/components/KandlesIcon.tsx:23` — A11yProps discriminant `aria-hidden?: false` can dissolve via `Partial<>` spread; harden to `aria-hidden: true` (required) in future component hardening story
- `apps/storefront/src/layouts/BaseLayout.astro:38` — `patternUnits="userSpaceOnUse"` may misalign at usage sites; add `patternTransform` or switch to `objectBoundingBox` when sections implement the pattern in Story 2.5+
- `apps/storefront/src/styles/tokens.css:45` — Asymmetric seasonal coverage (winter/summer override `--color-sand`, spring/autumn do not); confirm with designer in Story 2.5
- `apps/storefront/src/layouts/BaseLayout.astro:27` — SVG sprite rendered before `<slot>` in body DOM; reorder after `<slot>` during Story 2.10 full layout finalisation

## Deferred from: code review of 2-2-editorial-hero-section (2026-06-12)

- `apps/storefront/src/components/ui/HeroSection.astro:33` — SVG `<text>` placeholder uses `font-family="'Cormorant Garamond', serif"` attribute; CSS font inheritance in SVG is not guaranteed cross-browser; deferred because this is a placeholder SVG explicitly marked TODO — replace with final artwork from designer before launch
- `apps/storefront/src/pages/index.astro:20` — Empty `<section id="produkti" aria-label="Продукти">` announces a region to AT with no content; intentional placeholder for Story 2.3 product grid; add `aria-busy` or remove `aria-label` until content exists if AT feedback is received

## Deferred from: code review of 2-3-product-grid-occasion-filter-react-island (2026-06-12)

- `apps/storefront/src/components/islands/ProductGrid/OccasionFilter.tsx:18` — `role="radiogroup"` missing arrow-key (ArrowLeft/Right/Up/Down) roving tabindex navigation; WAI-ARIA §3.18 requires it; only Space/Enter handled; defer to Story 2.7 a11y hardening
- `apps/storefront/src/components/islands/ProductGrid/OccasionFilter.tsx:18` — ARIA radiogroup: all tiles can be `aria-checked=false` simultaneously (deselectable null state); strict ARIA radiogroup requires one checked at all times; Dev Notes acknowledge this as a deliberate tradeoff; defer to Story 2.7 a11y hardening
- `apps/storefront/src/pages/index.astro` — Supabase fetch error only logs to console, no user-facing empty state or error message; acceptable for MVP; address in future story when error handling patterns are standardized

## Deferred from: code review of 1-9-sentry-monitoring-stack-setup (2026-06-12)

- `apps/storefront/astro.config.ts` — `tracesSampleRate: 0.1` hardcoded in @sentry/astro integration; dev builds also get 0.1 instead of 1.0; minor dev experience impact; fix in future monitoring hardening story
- `apps/admin/next.config.ts` — `SENTRY_ORG` and `SENTRY_PROJECT_ADMIN` (and `SENTRY_PROJECT_STOREFRONT` in astro.config.ts) not validated in `@kandles/env` schema; build-time-only vars not in AC8 scope; Sentry SDK will surface missing vars during source map upload phase; add validation if upload reliability becomes an issue

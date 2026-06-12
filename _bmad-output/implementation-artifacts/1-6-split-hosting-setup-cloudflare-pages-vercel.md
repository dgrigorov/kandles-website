---
baseline_commit: 1bbf9f15f7d0a7bd99872b0a0ef5a3f79a09d283
---

# Story 1.6: Split hosting setup — Cloudflare Pages + Vercel

Status: done

## Story

As a developer,
I want both apps deployable to their respective hosting platforms with working base routes,
so that the storefront runs on Cloudflare edge globally and the admin runs on Vercel with Supabase access.

## Acceptance Criteria

1. **Given** `apps/storefront/astro.config.ts` is configured
   **Then** `output: 'server'` is set (Astro 5/6 removed 'hybrid' — see Dev Notes)
   **And** `@astrojs/cloudflare` adapter is installed and configured

2. **Given** `apps/storefront/wrangler.toml` exists
   **When** `wrangler pages deploy ./dist` runs
   **Then** storefront deploys to Cloudflare Pages and `GET /` returns HTTP 200

3. **Given** `apps/admin/vercel.json` exists
   **When** `vercel deploy` runs
   **Then** admin deploys and `GET /` returns HTTP 200 (renders "Kandles Admin" placeholder)

4. **Given** both apps import from `@kandles/env`
   **Then** all required env vars are validated at build time on both platforms
   **And** builds fail descriptively if any secret is missing

5. **Given** admin app uses `@kandles/db`
   **Then** `next.config.ts` has `transpilePackages` for all `@kandles/*` workspace packages
   **And** `apps/admin/src/lib/db.ts` re-exports `db` from `@kandles/db`
   **And** no Supabase credentials appear in any client bundle

6. **Given** storefront connects to Supabase
   **Then** `apps/storefront/src/lib/supabase.ts` exports a server-only Supabase anon client factory
   **And** `@supabase/supabase-js` is installed in storefront package

7. **Given** `apps/storefront/public/_headers` exists
   **Then** it sets `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and a base CSP

8. **Given** `turbo typecheck` runs
   **Then** completes with 0 errors

## Tasks / Subtasks

- [x] Task 1: Rename astro config + ensure output mode (AC: 1)
  - [x] Delete `apps/storefront/astro.config.mjs`
  - [x] Create `apps/storefront/astro.config.ts` with `output: 'server'`, cloudflare adapter, tailwind integration
  - [x] NOTE: `output: 'hybrid'` was removed in Astro 5 — `'server'` is the correct equivalent

- [x] Task 2: Създай `apps/storefront/wrangler.toml` (AC: 2)
  - [x] `name = "kandles-storefront"`
  - [x] `pages_build_output_dir = "dist"`
  - [x] `compatibility_date = "2025-01-01"`
  - [x] `compatibility_flags = ["nodejs_compat"]` — задължително за Astro (Node.js APIs)

- [x] Task 3: Създай `apps/storefront/public/_headers` + `_redirects` (AC: 7)
  - [x] `_headers` — X-Frame-Options, X-Content-Type-Options, CSP
  - [x] `_redirects` — placeholder за SSR

- [x] Task 4: Инсталирай `@supabase/supabase-js` в storefront + създай client (AC: 6)
  - [x] `pnpm --filter @kandles/storefront add @supabase/supabase-js`
  - [x] Създай `apps/storefront/src/lib/supabase.ts` — фабрична функция за server-only anon клиент
  - [x] Client се използва САМО в Astro SSR файлове (`.astro` pages + API routes) — не в React islands

- [x] Task 5: Създай `apps/admin/vercel.json` (AC: 3)
  - [x] `{ "framework": "nextjs" }` — Vercel auto-детектира Next.js
  - [x] Виж Dev Notes за Vercel dashboard config

- [x] Task 6: Обнови `apps/admin/next.config.ts` — transpilePackages (AC: 5)
  - [x] Добави `transpilePackages: ['@kandles/db', '@kandles/env', '@kandles/types', '@kandles/ui', '@kandles/email']`

- [x] Task 7: Създай `apps/admin/src/lib/db.ts` — db import helper (AC: 5)
  - [x] Re-export `db` от `@kandles/db` с коментар за server-only context

- [x] Task 8: Typecheck (AC: 8)
  - [x] `export PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH" && pnpm turbo typecheck`
  - [x] 0 TypeScript грешки — 10/10 successful

### Review Findings

- [x] [Review][Patch] supabase.ts bypasses @kandles/env validation [apps/storefront/src/lib/supabase.ts:7-8]
- [x] [Review][Patch] vercel.json missing installCommand/buildCommand for pnpm monorepo [apps/admin/vercel.json:2]
- [x] [Review][Patch] Remove @kandles/ui, @kandles/email from transpilePackages (not in admin deps yet) [apps/admin/next.config.ts:7-8]
- [x] [Review][Patch] _headers connect-src missing wss://*.supabase.co for Supabase Realtime [apps/storefront/public/_headers:7]
- [x] [Review][Defer] unsafe-inline in CSP script-src/style-src [apps/storefront/public/_headers] — deferred, MVP tradeoff; Astro injects inline scripts for hydration
- [x] [Review][Defer] Missing CSP entries for Meta Pixel/Sentry/Turnstile/Stripe Radar [apps/storefront/public/_headers] — deferred, features not yet implemented (Stories 6.4, 1.9, 4.6, 4.3)
- [x] [Review][Defer] astro.config.ts missing site option — deferred, Story 2.7 (sitemap/Schema.org)
- [x] [Review][Defer] postgres singleton without max:1/prepare:false (packages/db) — deferred, pre-existing from Story 1.3
- [x] [Review][Defer] wrangler.toml compatibility_date "2025-01-01" stale — deferred, Story 1.7
- [x] [Review][Defer] Vercel function timeout limits — deferred, Story 1.7
- [x] [Review][Defer] import.meta.env CF Pages static replacement nuance — deferred, standard @astrojs/cloudflare docs pattern

## Dev Notes

### ВАЖНО: Astro 5/6 — 'hybrid' output премахнат

Архитектурния документ и epics.md използват `output: 'hybrid'`, но **Astro 5 премахна `hybrid` mode**.
В Astro 5/6 има само два режима:
- `output: 'static'` — пълен SSG (без SSR)
- `output: 'server'` — SSR по подразбиране (може да се prerender-ват отделни pages с `export const prerender = true`)

За storefront (SSG product pages + SSR dynamic endpoints) → `output: 'server'` е правилният избор.
Страниците, които трябва да са статични, ще ползват `export const prerender = true` (Stories 2.x+).
Текущата конфигурация вече има `output: 'server'` — правилно.

### Task 1: astro.config.ts — точна имплементация

```typescript
// apps/storefront/astro.config.ts
import { defineConfig } from 'astro/config'
import cloudflare from '@astrojs/cloudflare'
import tailwind from '@astrojs/tailwind'

export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  integrations: [tailwind()],
})
```

**Защо rename .mjs → .ts:**
- AC изисква `astro.config.ts`
- TypeScript config дава type-safety за Astro options
- Проектът ползва TypeScript навсякъде другаде

**ВАЖНО:** Изтрий `astro.config.mjs` след като създадеш `astro.config.ts` — не може да съществуват и двата.

### Task 2: wrangler.toml — точна имплементация

```toml
# apps/storefront/wrangler.toml
name = "kandles-storefront"
pages_build_output_dir = "dist"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]
```

**Защо `nodejs_compat`:**
Astro 6 ползва Node.js APIs (fs, path, crypto, etc.) дори на edge. `nodejs_compat` flag казва на Cloudflare Workers runtime да emulate тези APIs. БЕЗ него, Astro build-ът ще хвърля runtime грешки на CF Pages.

**Деплой команда (за reference — Story 1.7 CI/CD):**
```bash
wrangler pages deploy apps/storefront/dist --project-name kandles-storefront
```

**Local dev:**
```bash
pnpm --filter @kandles/storefront dev  # astro dev (без Wrangler)
```

### Task 3: public/_headers и _redirects

```
# apps/storefront/public/_headers
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 0
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self'; connect-src 'self' https://*.supabase.co https://api.stripe.com; frame-src https://js.stripe.com https://hooks.stripe.com; object-src 'none'; base-uri 'self'
```

```
# apps/storefront/public/_redirects
# SSR mode — няма нужда от SPA fallback
# Ще се допълва в Story 1.7+ при нужда
```

**Бележка:** `_headers` и `_redirects` са специфични за Cloudflare Pages — обработват се от CF edge ПРЕДИ да достигнат до Astro. За SSR (output: 'server'), всеки request минава през Workers function и тези файлове се прилагат върху статичните assets.

### Task 4: Supabase client — storefront

```typescript
// apps/storefront/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export function createServerSupabaseClient() {
  return createClient(
    import.meta.env.SUPABASE_URL as string,
    import.meta.env.SUPABASE_ANON_KEY as string
  )
}
```

**Правила за употреба:**
- Ползва се САМО в `.astro` файлове (frontmatter) и API endpoints — НЕ в React islands
- `import.meta.env.SUPABASE_URL` и `SUPABASE_ANON_KEY` са достъпни в Astro SSR context
- Validated от `packages/env/src/astro.ts` при build time
- Factory function (не singleton) за да е safe за edge Workers (stateless между requests)

**Install команда:**
```bash
export PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH" && \
pnpm --filter @kandles/storefront add @supabase/supabase-js
```

**Важно — не инсталирай `@supabase/ssr`:**
`@supabase/ssr` е за cookie-based session management (admin). За storefront read-only SSR → `@supabase/supabase-js` е достатъчен.

### Task 5: vercel.json — Admin

```json
{
  "framework": "nextjs"
}
```

**Vercel Dashboard конфигурация (ръчна стъпка — НЕ код):**
1. Vercel Dashboard → New Project → Import Git Repository → kandles-website
2. **Root Directory:** `apps/admin` (задължително — иначе Vercel търси Next.js в repo root)
3. Framework Preset: Next.js (auto-detect)
4. Build Command: `cd ../.. && pnpm turbo build --filter=@kandles/admin` (или оставен default)
5. Node.js version: 22.x

**Защо толкова прост vercel.json:**
При `Root Directory = apps/admin` в Vercel dashboard, Vercel auto-детектира Next.js и знае как да build-ва. `framework: "nextjs"` е само за explicit потвърждение. Сложните build commands се конфигурират в dashboard или в Story 1.7 CI/CD workflow.

### Task 6: next.config.ts — transpilePackages

```typescript
// apps/admin/next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: [
    '@kandles/db',
    '@kandles/env',
    '@kandles/types',
    '@kandles/ui',
    '@kandles/email',
  ],
}

export default nextConfig
```

**Защо transpilePackages:**
`@kandles/*` packages използват TypeScript source директно (no pre-build за dev). Next.js не транспилира `node_modules` по подразбиране. `transpilePackages` казва на Next.js Webpack/Turbopack да include тези packages в TypeScript компилацията.

Без `transpilePackages`:
- `import { db } from '@kandles/db'` → `Module not found: Can't resolve '@kandles/db'`
- Или TypeScript syntax errors при import

### Task 7: apps/admin/src/lib/db.ts

```typescript
// apps/admin/src/lib/db.ts
// Server-only — ползва DATABASE_URL от .env.local / Vercel environment
import { db } from '@kandles/db'

export { db }
```

**Как работи @kandles/db:**
`packages/db/src/index.ts` чете `process.env.DATABASE_URL` и инициализира Drizzle с `postgres` client.
В admin, `DATABASE_URL` трябва да е в `.env.local` (dev) или Vercel environment variables (prod).
`DATABASE_URL` = Supabase direct connection string (не pooled): `postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres`

**ВАЖНО:** `@kandles/db` НЕ е в `packages/env` schema — чете `process.env.DATABASE_URL` директно и хвърля ако е undefined. Това е OK за сега — Story 1.7 може да добави validation ако е нужно.

### env vars за dev — .env.local файлове

За local development, всяка app трябва да има `.env.local` с нужните стойности:

**apps/storefront/.env.local** (НОВО — трябва да се създаде от dev):
```bash
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_ANON_KEY=[anon-key]
SENTRY_DSN_STOREFRONT=https://...@sentry.io/...
FALLBACK_SHIPPING_PRICE_BGN=8.99
TURNSTILE_SITE_KEY=[key]
META_PIXEL_ID=[id]
```

**apps/admin/.env.local** (вероятно вече съществува от Story 1.2 за typecheck):
```bash
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
# + всички останали от .env.example
```

**ЗАБЕЛЕЖКА:** .env.local файловете НЕ са в git (gitignored). Story НЕ трябва да ги създава — само да провери typecheck преминава.

### Learnings от Stories 1.1–1.5

- **pnpm path**: `export PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH"` преди всяка pnpm/turbo команда
- **turbo typecheck** зависи от `turbo build` — при clean cache може да отнеме ~30s
- **Workspace installs**: `pnpm --filter @kandles/storefront add [pkg]` за per-app install
- **Astro check vs tsc**: storefront ползва `astro check` (не tsc директно) — вече конфигуриран в package.json
- **Файловете трябва да съществуват** за да мине typecheck — placeholder content е достатъчен

### Текущо състояние на репото (важно за Task 1)

```
apps/storefront/
  astro.config.mjs  ← ТРЯБВА ДА СЕ ИЗТРИЕ (замества се от .ts)
  astro.config.ts   ← НЕ СЪЩЕСТВУВА → ТРЯБВА ДА СЕ СЪЗДАДЕ
  src/
    pages/index.astro  ← съществува (placeholder)
    layouts/BaseLayout.astro  ← съществува

apps/admin/
  next.config.ts  ← съществува, ПРАЗЕН → ТРЯБВА ДА СЕ ОБНОВИ
  src/app/
    layout.tsx  ← съществува
    page.tsx    ← съществува
  # src/lib/db.ts  ← НЕ СЪЩЕСТВУВА → ТРЯБВА ДА СЕ СЪЗДАДЕ

packages/env/src/
  astro.ts    ← съществува (SUPABASE_URL + SUPABASE_ANON_KEY вече дефинирани)
  nextjs.ts   ← съществува (SUPABASE_SERVICE_ROLE_KEY в server block)
```

### Anti-patterns — ЗАБРАНЕНО

```typescript
// ❌ Supabase client в React island (client-side) — АНОН KEY В BUNDLE!
// В apps/storefront/src/components/islands/SomeIsland.tsx:
import { createServerSupabaseClient } from '../lib/supabase' // ГРЕШНО в client component

// ❌ service_role key в storefront env
// Никога не добавяй SUPABASE_SERVICE_ROLE_KEY в packages/env/src/astro.ts

// ❌ DATABASE_URL exposed client-side
// DATABASE_URL трябва само в server-side на admin (process.env, не NEXT_PUBLIC_)

// ❌ output: 'hybrid' в astro.config — не съществува в Astro 5/6
output: 'hybrid'  // ГРЕШНО

// ❌ И двата config файла едновременно
// astro.config.mjs + astro.config.ts → КОНФЛИКТ — изтрий .mjs
```

### References

- [Source: epics.md#Story-1.6] — Story acceptance criteria
- [Source: architecture.md#Infrastructure-Deployment] — CF Pages + Vercel hosting split
- [Source: architecture.md#Authentication-Security] — secrets boundary (service_role Vercel only)
- [Source: architecture.md#Cross-Cutting-Concerns] — `@t3-oss/env-nextjs` build fail при missing secret
- [Source: architecture.md#Directory-Structure] — `apps/storefront/astro.config.mjs` (arc note: file е .ts в AC)
- [Source: story-1-2.md] — env validation setup (@t3-oss/env-nextjs + @t3-oss/env-core already done)
- [Source: story-1-5.md] — RLS policies (service_role bypasses RLS; anon key subject to RLS)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- `astro.config.mjs` → renamed/replaced с `astro.config.ts` (AC изисква .ts; функционално идентично)
- `output: 'server'` е правилното за Astro 5/6 — 'hybrid' е премахнат
- `wrangler.toml` с `nodejs_compat` flag — задължителен за Astro на Cloudflare Pages
- `@supabase/supabase-js` инсталиран; factory function (не singleton) за edge Workers stateless context
- `next.config.ts` — `transpilePackages` за всички @kandles/* workspace packages
- `apps/admin/src/lib/db.ts` — re-export от @kandles/db (сервър контекст само)
- `turbo typecheck → 10/10 successful, 0 грешки`
- Ръчна стъпка: Vercel dashboard → Root Directory = `apps/admin`

### File List

- apps/storefront/astro.config.ts *(new — replaces astro.config.mjs)*
- apps/storefront/astro.config.mjs *(deleted)*
- apps/storefront/wrangler.toml *(new)*
- apps/storefront/public/_headers *(new)*
- apps/storefront/public/_redirects *(new)*
- apps/storefront/src/lib/supabase.ts *(new)*
- apps/admin/vercel.json *(new)*
- apps/admin/next.config.ts *(modified — transpilePackages)*
- apps/admin/src/lib/db.ts *(new)*

## Change Log

- 2026-06-13: Story създадена — Cloudflare Pages + Vercel hosting setup
- 2026-06-13: Имплементация завършена — astro.config.ts, wrangler.toml, vercel.json, supabase client, transpilePackages, typecheck 0 грешки

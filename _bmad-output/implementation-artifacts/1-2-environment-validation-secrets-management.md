---
baseline_commit: ae411209e8529d08327b141c993444ead1e61526
---

# Story 1.2: Environment validation + secrets management

Status: done

## Story

As a developer,
I want `@kandles/env` to validate all environment variables at build time,
so that the app fails fast at build if any required secret is missing — never silently at runtime.

## Acceptance Criteria

1. **Given** `packages/env/src/nextjs.ts` exports NEXT_PUBLIC_ vars via `@t3-oss/env-nextjs`
   **When** Next.js build runs with a required var missing
   **Then** build fails with a descriptive Zod error naming the missing variable

2. **Given** `packages/env/src/astro.ts` exports PUBLIC_ vars
   **When** Astro build runs with a required var missing
   **Then** build fails with a descriptive error (not a runtime crash)

3. **Given** `packages/env/src/index.ts` exports server-only secrets (Supabase service_role, Stripe secret key, etc.)
   **When** this module is imported in a file that ends up in a client bundle
   **Then** TypeScript compilation fails with a clear error

4. **Given** all required env vars are set correctly
   **When** both apps build
   **Then** env values are accessible as fully-typed objects throughout the codebase

5. **Given** `.env.example` exists in repo root
   **Then** it lists every required variable with placeholder values and one-line comments explaining each

6. **Given** `git-secrets` is configured as a pre-commit hook
   **When** a commit contains a pattern matching `sk_live_`, `AKIA`, or `sk_test_` outside of `.env.example`
   **Then** the commit is rejected with the matching secret pattern shown

## Tasks / Subtasks

- [x] Task 1: Add runtime dependencies to `packages/env` (AC: 1, 2, 3)
  - [x] Add `@t3-oss/env-nextjs`, `@t3-oss/env-core`, `zod` as `dependencies` (NOT devDependencies) in `packages/env/package.json`
  - [x] Add `server-only` as `dependency` in `packages/env/package.json`
  - [x] Add `zod` to `pnpm-workspace.yaml` catalog (e.g. `zod: "^3.24.0"`)
  - [x] Run `pnpm install` → exit 0

- [x] Task 2: Implement `packages/env/src/index.ts` — server-only secrets (AC: 3, 4)
  - [x] First line: `import 'server-only'`
  - [x] Use `@t3-oss/env-core` `createEnv` with only `server` section (no `client` / `clientPrefix`)
  - [x] Include vars: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY, ADMIN_EMAIL, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, CLOUDFLARE_IMAGES_TOKEN, CLOUDFLARE_ACCOUNT_ID, TRIGGER_SECRET_KEY, VIBER_API_KEY, VIBER_ADMIN_NUMBER, VIBER_BUSINESS_NUMBER, WHATSAPP_NUMBER, CRON_SECRET, TURNSTILE_SECRET_KEY, META_CAPI_ACCESS_TOKEN, PREVIEW_JWT_SECRET, SENTRY_AUTH_TOKEN, FALLBACK_SHIPPING_PRICE_BGN
  - [x] `runtimeEnv: process.env`
  - [x] Export as `export const env = createEnv(...)`

- [x] Task 3: Implement `packages/env/src/nextjs.ts` — admin Next.js env (AC: 1, 4)
  - [x] Use `@t3-oss/env-nextjs` `createEnv`
  - [x] `server` section: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY, ADMIN_EMAIL, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, CLOUDFLARE_IMAGES_TOKEN, CLOUDFLARE_ACCOUNT_ID, TRIGGER_SECRET_KEY, VIBER_API_KEY, VIBER_ADMIN_NUMBER, VIBER_BUSINESS_NUMBER, WHATSAPP_NUMBER, CRON_SECRET, TURNSTILE_SECRET_KEY, META_CAPI_ACCESS_TOKEN, PREVIEW_JWT_SECRET, SENTRY_DSN_ADMIN, SENTRY_AUTH_TOKEN, FALLBACK_SHIPPING_PRICE_BGN
  - [x] `client` section: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  - [x] Used `experimental__runtimeEnv` (Next.js >=13.4.4 pattern — only client vars need explicit destructuring)
  - [x] Export as `export const env = createEnv(...)`

- [x] Task 4: Implement `packages/env/src/astro.ts` — storefront Astro env (AC: 2, 4)
  - [x] Use `@t3-oss/env-core` `createEnv`
  - [x] `clientPrefix: 'PUBLIC_'`
  - [x] `server` section: SUPABASE_URL, SUPABASE_ANON_KEY, SENTRY_DSN_STOREFRONT, FALLBACK_SHIPPING_PRICE_BGN, TURNSTILE_SITE_KEY, META_PIXEL_ID
  - [x] `client` section: PUBLIC_GTM_CONTAINER_ID (z.string().optional())
  - [x] `runtimeEnv: import.meta.env`
  - [x] Export as `export const env = createEnv(...)`

- [x] Task 5: Update `packages/env/package.json` exports (AC: 1, 2, 3, 4)
  - [x] Add `"./nextjs"` export: `{ "import": "./src/nextjs.ts" }`
  - [x] Add `"./astro"` export: `{ "import": "./src/astro.ts" }`
  - [x] Keep existing `"."` export pointing to `./src/index.ts`
  - [x] Move `@t3-oss/*`, `zod`, `server-only` to `dependencies` (not devDependencies)

- [x] Task 6: Verify and update `.env.example` (AC: 5)
  - [x] `.env.example` already exists from Story 1.1 — verify all vars present
  - [x] Add one-line comment explaining each var's purpose (see Dev Notes for exact comments)
  - [x] Do NOT add real values — placeholders only

- [x] Task 7: Configure `git-secrets` pre-commit hook (AC: 6)
  - [x] Create `scripts/setup-git-secrets.sh` (executable) with setup commands (see Dev Notes)
  - [x] Run the script locally to install hook into `.git/hooks/pre-commit`
  - [x] Test: `sk_live_abc123xyz` in test file → blocked by git-secrets scan ✓
  - [x] Test: `.env.example` scan → exit 0 (allowed) ✓

- [x] Task 8: Verify end-to-end (AC: 1, 2, 3, 4)
  - [x] `pnpm install` → exit 0 (+4 new packages)
  - [x] `turbo typecheck` → 10 successful, 0 errors
  - [x] `@kandles/env/nextjs` resolves to `packages/env/src/nextjs.ts` via TypeScript bundler resolution ✓
  - [x] `@kandles/env/astro` resolves to `packages/env/src/astro.ts` via TypeScript bundler resolution ✓

### Review Findings

- [x] [Review][Patch] SENTRY_AUTH_TOKEN in runtime schema — CI-only secret, not set in Vercel prod → app throws `Invalid environment variables` on deploy. Remove from `index.ts` + `nextjs.ts` server blocks. [`packages/env/src/index.ts` + `packages/env/src/nextjs.ts`]
- [x] [Review][Patch] emptyStringAsUndefined missing — empty string placeholder vars produce cryptic Zod URL/coerce errors instead of "Required". Add `emptyStringAsUndefined: true` to all 3 `createEnv` calls. [`packages/env/src/index.ts`, `packages/env/src/nextjs.ts`, `packages/env/src/astro.ts`]
- [x] [Review][Patch] git-secrets --register-aws doesn't auto-allow .env.example for AKIA — committing AKIA placeholder in .env.example blocked. Add explicit `git secrets --add --allowed '^\.env\.example$'` after `--register-aws`. [`scripts/setup-git-secrets.sh`]
- [x] [Review][Patch] git-secrets --add patterns not idempotent — re-running script duplicates sk_live_/sk_test_ patterns in .git/config. Add `grep` guards before each `--add`. [`scripts/setup-git-secrets.sh`]
- [x] [Review][Patch] --allowed pattern too broad — `\.env\.example` matches any path containing that string. Anchor: `^\.env\.example$`. [`scripts/setup-git-secrets.sh`]
- [x] [Review][Defer] astro.ts CF Worker runtime bindings — `import.meta.env` not available for CF dashboard secrets at request time. Deferred to Story 1.6 per story notes. [`packages/env/src/astro.ts`] — deferred, pre-existing
- [x] [Review][Defer] experimental__runtimeEnv future NEXT_PUBLIC_ vars silently skipped — known design property of t3-env; document when adding new client vars. [`packages/env/src/nextjs.ts`] — deferred, pre-existing
- [x] [Review][Defer] isServer detection edge case in CF DurableObject/WorkerEntrypoint — not in scope for Story 1.2. [`packages/env/src/index.ts`] — deferred, pre-existing
- [x] [Review][Defer] PUBLIC_GTM_CONTAINER_ID must be build-time CF Pages var (not runtime binding) — GTM setup is Story 6-3 scope. [`packages/env/src/astro.ts`] — deferred, pre-existing

## Dev Notes

### Package Versions — Pin These

```
@t3-oss/env-nextjs: ^0.11.1
@t3-oss/env-core:   ^0.11.1
zod:                ^3.24.0
server-only:        ^0.0.1
```

### Three-File Architecture

```
packages/env/src/
  index.ts    → server-only secrets (import 'server-only'; both apps import this on server)
  nextjs.ts   → admin Next.js env (NEXT_PUBLIC_ prefix for client vars)
  astro.ts    → storefront Astro env (PUBLIC_ prefix for client vars)
```

### `packages/env/src/index.ts` — Exact Implementation Pattern

```typescript
import 'server-only'
import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),
    RESEND_API_KEY: z.string().min(1),
    ADMIN_EMAIL: z.string().email(),
    UPSTASH_REDIS_REST_URL: z.string().url(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
    CLOUDFLARE_IMAGES_TOKEN: z.string().min(1),
    CLOUDFLARE_ACCOUNT_ID: z.string().min(1),
    TRIGGER_SECRET_KEY: z.string().min(1),
    VIBER_API_KEY: z.string().min(1),
    VIBER_ADMIN_NUMBER: z.string().min(1),
    VIBER_BUSINESS_NUMBER: z.string().min(1),
    WHATSAPP_NUMBER: z.string().min(1),
    CRON_SECRET: z.string().min(1),
    TURNSTILE_SECRET_KEY: z.string().min(1),
    META_CAPI_ACCESS_TOKEN: z.string().min(1),
    PREVIEW_JWT_SECRET: z.string().min(32),
    SENTRY_AUTH_TOKEN: z.string().min(1),
    FALLBACK_SHIPPING_PRICE_BGN: z.coerce.number().positive(),
  },
  runtimeEnv: process.env,
})
```

### `packages/env/src/nextjs.ts` — Exact Implementation Pattern

`@t3-oss/env-nextjs` requires explicit `runtimeEnv` mapping — NO `runtimeEnv: process.env` shorthand.

```typescript
import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),
    RESEND_API_KEY: z.string().min(1),
    ADMIN_EMAIL: z.string().email(),
    UPSTASH_REDIS_REST_URL: z.string().url(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
    CLOUDFLARE_IMAGES_TOKEN: z.string().min(1),
    CLOUDFLARE_ACCOUNT_ID: z.string().min(1),
    TRIGGER_SECRET_KEY: z.string().min(1),
    VIBER_API_KEY: z.string().min(1),
    VIBER_ADMIN_NUMBER: z.string().min(1),
    VIBER_BUSINESS_NUMBER: z.string().min(1),
    WHATSAPP_NUMBER: z.string().min(1),
    CRON_SECRET: z.string().min(1),
    TURNSTILE_SECRET_KEY: z.string().min(1),
    META_CAPI_ACCESS_TOKEN: z.string().min(1),
    PREVIEW_JWT_SECRET: z.string().min(32),
    SENTRY_DSN_ADMIN: z.string().url(),
    SENTRY_AUTH_TOKEN: z.string().min(1),
    FALLBACK_SHIPPING_PRICE_BGN: z.coerce.number().positive(),
  },
  client: {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  },
  runtimeEnv: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    CLOUDFLARE_IMAGES_TOKEN: process.env.CLOUDFLARE_IMAGES_TOKEN,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    TRIGGER_SECRET_KEY: process.env.TRIGGER_SECRET_KEY,
    VIBER_API_KEY: process.env.VIBER_API_KEY,
    VIBER_ADMIN_NUMBER: process.env.VIBER_ADMIN_NUMBER,
    VIBER_BUSINESS_NUMBER: process.env.VIBER_BUSINESS_NUMBER,
    WHATSAPP_NUMBER: process.env.WHATSAPP_NUMBER,
    CRON_SECRET: process.env.CRON_SECRET,
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
    META_CAPI_ACCESS_TOKEN: process.env.META_CAPI_ACCESS_TOKEN,
    PREVIEW_JWT_SECRET: process.env.PREVIEW_JWT_SECRET,
    SENTRY_DSN_ADMIN: process.env.SENTRY_DSN_ADMIN,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    FALLBACK_SHIPPING_PRICE_BGN: process.env.FALLBACK_SHIPPING_PRICE_BGN,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
})
```

### `packages/env/src/astro.ts` — Exact Implementation Pattern

```typescript
import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  clientPrefix: 'PUBLIC_',
  server: {
    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string().min(1),
    SENTRY_DSN_STOREFRONT: z.string().url(),
    FALLBACK_SHIPPING_PRICE_BGN: z.coerce.number().positive(),
    TURNSTILE_SITE_KEY: z.string().min(1),
    META_PIXEL_ID: z.string().min(1),
  },
  client: {
    PUBLIC_GTM_CONTAINER_ID: z.string().optional(),
  },
  runtimeEnv: import.meta.env,
})
```

**Cloudflare Workers note:** `import.meta.env` covers build-time Vite env vars. In production SSR on Cloudflare Workers, secrets are injected as bindings — this is addressed in Story 1.6. For Story 1.2, `import.meta.env` is sufficient for local dev and CI builds.

### `packages/env/package.json` — Final State

```json
{
  "name": "@kandles/env",
  "version": "0.0.1",
  "private": true,
  "exports": {
    ".": {
      "import": "./src/index.ts"
    },
    "./nextjs": {
      "import": "./src/nextjs.ts"
    },
    "./astro": {
      "import": "./src/astro.ts"
    }
  },
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@t3-oss/env-nextjs": "^0.11.1",
    "@t3-oss/env-core": "^0.11.1",
    "zod": "^3.24.0",
    "server-only": "^0.0.1"
  },
  "devDependencies": {
    "typescript": "catalog:"
  }
}
```

**Critical:** `@t3-oss/env-*`, `zod`, `server-only` must be `dependencies` NOT `devDependencies` — they run at build time in consuming apps.

### TypeScript Subpath Imports

`moduleResolution: "bundler"` in root `tsconfig.json` respects `exports` in `package.json`. **No additional paths mappings needed** in `tsconfig.json` for `@kandles/env/nextjs` and `@kandles/env/astro`. The existing paths for `@kandles/env` (pointing to `index.ts`) still work.

### How Importing Apps Use These Modules

```typescript
// apps/admin: server actions, API routes, server components
import { env } from '@kandles/env/nextjs'
const db = new SupabaseClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

// apps/storefront: Astro components (.astro files), server-side
import { env } from '@kandles/env/astro'
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)

// Any server-side code (both apps): import server-only secrets
import { env } from '@kandles/env'
```

### `server-only` Package — How AC3 Works

When `packages/env/src/index.ts` has `import 'server-only'` at the top:
- In Next.js: if this module is imported in a Client Component (`'use client'`), the Next.js bundler throws a build error: `"server-only" package was imported in a Client Component`
- TypeScript surface: the error appears at compilation/bundling, not just runtime
- Astro: Astro does not natively enforce `server-only` — AC3 applies specifically to Next.js admin app. For storefront, don't import `@kandles/env` (the root); use `@kandles/env/astro` instead.

### `git-secrets` Setup Script

Create `scripts/setup-git-secrets.sh`:

```bash
#!/bin/bash
set -e

# Install git-secrets hook: https://github.com/awslabs/git-secrets
# Requires git-secrets installed: brew install git-secrets

echo "Installing git-secrets hooks..."
git secrets --install -f

echo "Registering AWS patterns (includes AKIA)..."
git secrets --register-aws

echo "Registering Stripe patterns..."
git secrets --add 'sk_live_[0-9a-zA-Z]+'
git secrets --add 'sk_test_[0-9a-zA-Z]+'

echo "Allowing .env.example (contains placeholder patterns)..."
git secrets --add --allowed '\.env\.example'

echo "Done. git-secrets pre-commit hook installed."
```

Run once after cloning: `bash scripts/setup-git-secrets.sh`

**For CI (Story 1.7):** `git secrets --scan` should be added to the PR workflow.

**git-secrets must be installed first:** `brew install git-secrets` (macOS) or see https://github.com/awslabs/git-secrets#installing-git-secrets.

### `.env.example` Required Comments

`.env.example` already exists from Story 1.1. Add inline comments to ALL vars:

```bash
# Supabase — Postgres DB + Auth + Storage
SUPABASE_URL=               # Project URL, e.g. https://xxx.supabase.co
SUPABASE_ANON_KEY=          # Public anon key — safe in browser via RLS
SUPABASE_SERVICE_ROLE_KEY=  # SERVER ONLY — bypasses RLS, Vercel env only

# Stripe — payments
STRIPE_SECRET_KEY=                      # sk_live_ or sk_test_ — never expose to client
STRIPE_WEBHOOK_SECRET=                  # whsec_ — for constructEvent signature check
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=     # pk_live_ or pk_test_ — safe in browser

# Sentry — error tracking
SENTRY_DSN_ADMIN=        # Admin app DSN from Sentry dashboard
SENTRY_DSN_STOREFRONT=   # Storefront app DSN from Sentry dashboard
SENTRY_AUTH_TOKEN=       # For source map uploads in CI — never expose

# Resend — transactional email
RESEND_API_KEY=   # re_ prefixed key from Resend dashboard

# Admin — single-user config
ADMIN_EMAIL=   # Hardcoded admin login email (Supabase Auth)

# Upstash Redis — rate limiting
UPSTASH_REDIS_REST_URL=    # https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=  # Token from Upstash dashboard

# Cloudflare — Images API for product photos
CLOUDFLARE_IMAGES_TOKEN=   # Images API token (not D1/Pages token)
CLOUDFLARE_ACCOUNT_ID=     # Found in Cloudflare dashboard right sidebar

# GTM — Google Tag Manager (storefront client-side)
PUBLIC_GTM_CONTAINER_ID=   # GTM-XXXXXXX format

# Trigger.dev — async jobs (abandoned cart, birthday)
TRIGGER_SECRET_KEY=   # tr_prod_ or tr_dev_ key

# Viber & WhatsApp — order notifications
VIBER_API_KEY=          # From Viber Business dashboard
VIBER_ADMIN_NUMBER=     # Admin's Viber number (receives order alerts)
VIBER_BUSINESS_NUMBER=  # Business account number that sends messages
WHATSAPP_NUMBER=        # Fallback WhatsApp number for notifications

# Courier — shipping price fallback
FALLBACK_SHIPPING_PRICE_BGN=8   # BGN, used when Econt/Speedy API unavailable

# Cron — scheduled jobs protection
CRON_SECRET=   # Random string; sent as Bearer token to /api/cron/* routes

# Misc
TURNSTILE_SITE_KEY=       # PUBLIC — Cloudflare Turnstile site key (checkout bot protection)
TURNSTILE_SECRET_KEY=     # SERVER ONLY — verify turnstile tokens server-side
META_PIXEL_ID=            # Meta Pixel ID (public, used in GTM)
META_CAPI_ACCESS_TOKEN=   # Server-side Conversions API token
PREVIEW_JWT_SECRET=       # min 32 chars; signs preview photo approval JWTs
```

### Variable Classification Table

| Variable | Module | Zod Schema |
|---|---|---|
| SUPABASE_URL | index.ts, nextjs.ts (server), astro.ts (server) | `z.string().url()` |
| SUPABASE_ANON_KEY | index.ts, astro.ts (server) | `z.string().min(1)` |
| SUPABASE_SERVICE_ROLE_KEY | index.ts, nextjs.ts (server) | `z.string().min(1)` |
| STRIPE_SECRET_KEY | index.ts, nextjs.ts (server) | `z.string().min(1)` |
| STRIPE_WEBHOOK_SECRET | index.ts, nextjs.ts (server) | `z.string().min(1)` |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | nextjs.ts (client) | `z.string().min(1)` |
| RESEND_API_KEY | index.ts, nextjs.ts (server) | `z.string().min(1)` |
| ADMIN_EMAIL | index.ts, nextjs.ts (server) | `z.string().email()` |
| UPSTASH_REDIS_REST_URL | index.ts, nextjs.ts (server) | `z.string().url()` |
| UPSTASH_REDIS_REST_TOKEN | index.ts, nextjs.ts (server) | `z.string().min(1)` |
| CLOUDFLARE_IMAGES_TOKEN | index.ts, nextjs.ts (server) | `z.string().min(1)` |
| CLOUDFLARE_ACCOUNT_ID | index.ts, nextjs.ts (server) | `z.string().min(1)` |
| TRIGGER_SECRET_KEY | index.ts, nextjs.ts (server) | `z.string().min(1)` |
| VIBER_API_KEY | index.ts, nextjs.ts (server) | `z.string().min(1)` |
| VIBER_ADMIN_NUMBER | index.ts, nextjs.ts (server) | `z.string().min(1)` |
| VIBER_BUSINESS_NUMBER | index.ts, nextjs.ts (server) | `z.string().min(1)` |
| WHATSAPP_NUMBER | index.ts, nextjs.ts (server) | `z.string().min(1)` |
| CRON_SECRET | index.ts, nextjs.ts (server) | `z.string().min(1)` |
| TURNSTILE_SECRET_KEY | index.ts, nextjs.ts (server) | `z.string().min(1)` |
| TURNSTILE_SITE_KEY | astro.ts (server) | `z.string().min(1)` |
| META_CAPI_ACCESS_TOKEN | index.ts, nextjs.ts (server) | `z.string().min(1)` |
| META_PIXEL_ID | astro.ts (server) | `z.string().min(1)` |
| PREVIEW_JWT_SECRET | index.ts, nextjs.ts (server) | `z.string().min(32)` |
| SENTRY_DSN_ADMIN | nextjs.ts (server) | `z.string().url()` |
| SENTRY_DSN_STOREFRONT | astro.ts (server) | `z.string().url()` |
| SENTRY_AUTH_TOKEN | index.ts, nextjs.ts (server) | `z.string().min(1)` |
| FALLBACK_SHIPPING_PRICE_BGN | index.ts, nextjs.ts (server), astro.ts (server) | `z.coerce.number().positive()` |
| PUBLIC_GTM_CONTAINER_ID | astro.ts (client) | `z.string().optional()` |

### Learnings from Story 1.1

- **pnpm catalog:** Use `catalog:` protocol for TypeScript in devDeps — already configured. Add `zod` to the catalog in `pnpm-workspace.yaml` if consistent version across packages is desired (recommended). Otherwise pin directly in `packages/env/package.json` dependencies.
- **Package exports:** Only `"import"` condition, no `"require"` (all consumers are bundlers). Confirmed in Story 1.1 review.
- **TypeScript moduleResolution: "bundler":** Subpath exports (`./nextjs`, `./astro`) work without additional tsconfig paths. Verified via node_modules symlinks.
- **`process.env` is forbidden** in app code (architecture anti-pattern). This story CREATES the only allowed access point. All subsequent stories MUST import from `@kandles/env`.

### Anti-Patterns (FORBIDDEN)

```typescript
// ❌ Never in any app code after this story
const url = process.env.SUPABASE_URL

// ❌ Server-only secrets in client components
'use client'
import { env } from '@kandles/env'  // TypeScript error — that's the point

// ❌ Wrong import in storefront (use astro.ts not index.ts)
import { env } from '@kandles/env'  // Use '@kandles/env/astro' in storefront server code

// ❌ Wrong import in admin (use nextjs.ts not index.ts for typed access)
import { env } from '@kandles/env'  // Use '@kandles/env/nextjs' in admin server code
```

### Testing Requirements

Story 1.2 is infrastructure — no business logic unit tests. Verification:

1. `pnpm install` → exit 0
2. `turbo typecheck` → exit 0 (all new files typecheck clean)
3. Manually: set all vars in `.env.local`, run `turbo build` → exit 0
4. Manually: comment out one required var, run `turbo build` → build fails with var name in error
5. git-secrets: attempt `git commit` with `sk_live_abc123` in a test file → rejected

### Project Structure After This Story

```
packages/env/src/
  index.ts    (updated: server-only secrets with 'server-only' guard)
  nextjs.ts   (new: admin Next.js full env)
  astro.ts    (new: storefront Astro full env)
packages/env/package.json (updated: 3 exports, 4 dependencies)
.env.example  (updated: inline comments on all vars)
scripts/
  setup-git-secrets.sh  (new: one-time hook installer)
```

### References

- Architecture secrets management: [Source: architecture.md#Authentication-Security] — `@t3-oss/env-nextjs` + `git-secrets` decision
- Dual export pattern: [Source: architecture.md#Architecture-Validation-Results] — `nextjs.ts` + `astro.ts` + `index.ts` gap addressed
- Anti-patterns: [Source: architecture.md#Enforcement-Guidelines] — `process.env` forbidden
- Story ACs: [Source: epics.md#Story-1.2]
- Previous story: [Source: _bmad-output/implementation-artifacts/1-1-turborepo-monorepo-shared-packages-scaffold.md]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `@t3-oss/env-nextjs` 0.13.11 supports `experimental__runtimeEnv` (Next.js ≥13.4.4): only client-side vars need explicit destructuring, server vars auto-read from process.env. Used this instead of full explicit mapping.
- `packages/env` needed `@types/node` in devDependencies — `process.env` not typed without it even though root catalog has it.
- Added `packages/env/src/global.d.ts` for `ImportMeta.env` declaration (needed for `import.meta.env` in `astro.ts`) and `declare module 'server-only'` (no types in package).
- Installed `git-secrets@1.3.0` via Homebrew. Patterns registered: AWS (AKIA), `sk_live_`, `sk_test_`. `.env.example` allowed.

### Completion Notes List

- `@kandles/env` now has three exports: `.` (server-only secrets), `./nextjs` (admin full env), `./astro` (storefront env)
- `packages/env/src/index.ts` starts with `import 'server-only'` — Next.js build fails if imported in Client Component
- Used `@t3-oss/env-nextjs@0.13.11` + `@t3-oss/env-core@0.13.11` + `zod@3.25.76` (v3) — v3 chosen for consistency with architecture Zod patterns
- `turbo typecheck` → 10 successful, 0 errors
- `git-secrets` pre-commit hook installed; `sk_live_`/`AKIA`/`sk_test_` patterns block commits; `.env.example` allowed
- `pnpm-workspace.yaml` catalog now includes `zod: "^3.24.0"` for sharing across future packages

### File List

- packages/env/package.json
- packages/env/src/index.ts
- packages/env/src/nextjs.ts
- packages/env/src/astro.ts
- packages/env/src/global.d.ts
- pnpm-workspace.yaml
- .env.example
- scripts/setup-git-secrets.sh

## Change Log

- 2026-06-12: Story 1.2 created — Ultimate context engine analysis completed, comprehensive developer guide created
- 2026-06-12: Story 1.2 implemented — @kandles/env три файла (index/nextjs/astro), git-secrets hook, turbo typecheck exit 0

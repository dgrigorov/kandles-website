---
baseline_commit: b8981afcbdae06815a8eb31ab7bf65e33c2d4986
---

# Story 1.9: Sentry + monitoring stack setup

Status: done

## Story

As a developer,
I want Sentry error tracking active in both apps from day 1 with source maps,
So that runtime errors in all subsequent epics are immediately captured with actionable stack traces.

## Acceptance Criteria

1. **Given** `@sentry/nextjs` installed in `apps/admin`
   **Then** `sentry.server.config.ts`, `sentry.client.config.ts`, `sentry.edge.config.ts` exist at `apps/admin/` root
   **And** DSN read from `SENTRY_DSN_ADMIN` env var (never hardcoded)

2. **Given** `@sentry/astro` installed in `apps/storefront`
   **Then** `apps/storefront/src/lib/sentry.ts` initializes Sentry with `SENTRY_DSN_STOREFRONT` from env

3. **Given** thrown uncaught error in admin Server Action or route handler
   **When** it propagates to Sentry
   **Then** error appears in Sentry dashboard with source-mapped file/line (not minified)

4. **Given** thrown uncaught error in storefront Astro page
   **When** it propagates to Sentry
   **Then** error captured with URL + user agent context

5. **Given** CI deploy workflow (`deploy.yml`)
   **Then** source maps uploaded to Sentry via `SENTRY_AUTH_TOKEN` after each successful build

6. **Given** Sentry tunnel configuration
   **Then** admin routes Sentry requests through `/api/sentry-tunnel`
   **And** storefront routes Sentry requests through `/api/sentry-tunnel`
   **So that** ad-blockers do not block error reporting

7. **Given** `apps/admin` uses Pino logger (`apps/admin/src/lib/logger.ts`)
   **Then** all logger calls include `[functionName]` prefix:
   e.g., `logger.info({ orderId }, '[updateOrderStatus] status changed')`
   e.g., `logger.error({ err, orderId }, '[stripeWebhook] payment failed')`

8. **Given** `SENTRY_DSN_ADMIN`, `SENTRY_DSN_STOREFRONT`, `SENTRY_AUTH_TOKEN` vars
   **Then** `SENTRY_DSN_ADMIN` and `SENTRY_AUTH_TOKEN` validated in `packages/env/src/nextjs.ts` (build fails if missing)
   **And** `SENTRY_DSN_STOREFRONT` already validated in `packages/env/src/astro.ts` ✅

## Tasks / Subtasks

- [x] Task 1: Install dependencies (AC: 1, 2, 7)
  - [x] `pnpm --filter @kandles/admin add @sentry/nextjs pino @axiomhq/pino pino-pretty`
  - [x] `pnpm --filter @kandles/storefront add @sentry/astro`

- [x] Task 2: Update `packages/env/src/nextjs.ts` (AC: 8)
  - [x] Add `SENTRY_AUTH_TOKEN: z.string().min(1)` to server block
  - [x] `SENTRY_DSN_ADMIN` already present ✅ — no change needed

- [x] Task 3: Create Sentry config files for admin (AC: 1, 3, 5)
  - [x] Create `apps/admin/sentry.server.config.ts` (exact content in Dev Notes)
  - [x] Create `apps/admin/sentry.client.config.ts` (exact content in Dev Notes)
  - [x] Create `apps/admin/sentry.edge.config.ts` (exact content in Dev Notes)
  - [x] Update `apps/admin/next.config.ts` — wrap default export with `withSentryConfig` (exact content in Dev Notes)

- [x] Task 4: Create admin Sentry tunnel API route (AC: 6)
  - [x] Create `apps/admin/src/app/api/sentry-tunnel/route.ts` (exact content in Dev Notes)

- [x] Task 5: Create Pino logger for admin (AC: 7)
  - [x] Create `apps/admin/src/lib/logger.ts` (exact content in Dev Notes)

- [x] Task 6: Configure `@sentry/astro` for storefront (AC: 2, 4, 5, 6)
  - [x] Create `apps/storefront/src/lib/sentry.ts` (exact content in Dev Notes)
  - [x] Update `apps/storefront/astro.config.ts` — add `sentry()` integration (exact content in Dev Notes)
  - [x] Create `apps/storefront/src/pages/api/sentry-tunnel.ts` (exact content in Dev Notes)

- [x] Task 7: Add new GitHub Secrets to deploy.yml (AC: 5)
  - [x] Add `SENTRY_ORG: ${{ secrets.SENTRY_ORG }}` to build step env block in `.github/workflows/deploy.yml`
  - [x] Add `SENTRY_PROJECT_ADMIN: ${{ secrets.SENTRY_PROJECT_ADMIN }}` to build step env block
  - [x] Add `SENTRY_PROJECT_STOREFRONT: ${{ secrets.SENTRY_PROJECT_STOREFRONT }}` to build step env block
  - [x] Note: `SENTRY_AUTH_TOKEN` already present in deploy.yml ✅

- [x] Task 8: Validate
  - [x] `pnpm turbo typecheck` → 0 errors (storefront astro check skipped — Node.js v20 vs required v22.12, pre-existing; tsc --noEmit clean ✅)
  - [x] `pnpm turbo lint` → 0 errors
  - [x] If all SENTRY env vars available locally: `pnpm turbo build` passes
  - [x] If SENTRY env vars not available locally: typecheck + lint passing is sufficient; CI validates build

### Review Findings

- [x] [Review][Patch] Tunnel routes: missing null guard on `dsn` — if envelope header lacks `dsn` field, `new URL(undefined)` throws unhandled TypeError → 500 [apps/admin/src/app/api/sentry-tunnel/route.ts:12, apps/storefront/src/pages/api/sentry-tunnel.ts:12]
- [x] [Review][Patch] Tunnel routes: fetch upstream not wrapped in try/catch — network errors propagate unhandled → 500 [apps/admin/src/app/api/sentry-tunnel/route.ts:17, apps/storefront/src/pages/api/sentry-tunnel.ts:17]
- [x] [Review][Patch] Tunnel routes: `pathname.replace('/', '')` → use `pathname.slice(1)` — more robust against trailing-slash DSNs [apps/admin/src/app/api/sentry-tunnel/route.ts:15, apps/storefront/src/pages/api/sentry-tunnel.ts:15]
- [x] [Review][Patch] `SENTRY_AUTH_TOKEN: z.string().min(1)` → `.optional()` in nextjs.ts — build-time-only var; required server schema causes Vercel runtime validation failure when not set as runtime env var [packages/env/src/nextjs.ts:27]
- [x] [Review][Patch] `.env.example` line 71: add `SENTRY_ORG`, `SENTRY_PROJECT_ADMIN`, `SENTRY_PROJECT_STOREFRONT`, `NEXT_PUBLIC_SENTRY_DSN_ADMIN` to CI secrets comment [.env.example:71]
- [x] [Review][Defer] `tracesSampleRate: 0.1` hardcoded in storefront astro.config.ts — should be 1.0 in dev; minor dev experience issue; fix in future monitoring hardening story [apps/storefront/astro.config.ts:14] — deferred
- [x] [Review][Defer] `SENTRY_ORG`/`SENTRY_PROJECT_ADMIN` not validated in @kandles/env schema — build-time-only vars, not required by AC8; Sentry SDK surfaces missing vars during source map upload [apps/admin/next.config.ts:9] — deferred

## Dev Notes

### Architecture Discrepancies — Read This First

The `architecture.md` Sentry snippet has two errors; story spec takes precedence:

1. **Wrong DSN var names in architecture**: architecture shows `NEXT_PUBLIC_SENTRY_DSN` (admin) and `PUBLIC_SENTRY_DSN` (storefront). These are wrong — use `SENTRY_DSN_ADMIN` and `SENTRY_DSN_STOREFRONT` (already validated in @kandles/env ✅).

2. **Wrong integration in architecture**: architecture shows `Sentry.prismaIntegration()` — we use Drizzle, not Prisma. Do NOT include `prismaIntegration()`.

3. **DSN access in sentry config files**: sentry config files (`sentry.server.config.ts` etc.) are instrumentation files loaded before Next.js app bootstraps. Do NOT import `@kandles/env/nextjs` in these files — it validates ALL server vars at import time and will throw if any non-Sentry var is missing in the sentry file context. Instead use `process.env.SENTRY_DSN_ADMIN` directly. The env var is still validated by @kandles/env at build time.

### Exact File Content

#### `apps/admin/sentry.server.config.ts` (NEW)
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN_ADMIN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  tunnel: '/api/sentry-tunnel',
})
```

#### `apps/admin/sentry.client.config.ts` (NEW)
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN_ADMIN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  tunnel: '/api/sentry-tunnel',
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
})
```

**NOTE on client config DSN**: The client config runs in the browser. `process.env.SENTRY_DSN_ADMIN` is a server-only var and will be `undefined` client-side. Two valid approaches:
- **Approach A (recommended)**: Add `NEXT_PUBLIC_SENTRY_DSN_ADMIN: z.string().url()` to the `client` block of `packages/env/src/nextjs.ts` and `experimental__runtimeEnv`, then use `process.env.NEXT_PUBLIC_SENTRY_DSN_ADMIN` in client config. The DSN is not a secret (it's safe to expose client-side — Sentry DSNs are always public). Add `NEXT_PUBLIC_SENTRY_DSN_ADMIN` to deploy.yml and GitHub Secrets (same value as `SENTRY_DSN_ADMIN`).
- **Approach B**: Set `dsn: process.env.SENTRY_DSN_ADMIN` and rely on `withSentryConfig` to inline the DSN as a build-time constant in the client bundle. This works with `@sentry/nextjs` but is less explicit.

**Recommended**: Approach A — add `NEXT_PUBLIC_SENTRY_DSN_ADMIN` to nextjs.ts client block and deploy.yml. Then client config uses it explicitly.

#### `apps/admin/sentry.edge.config.ts` (NEW)
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN_ADMIN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  tunnel: '/api/sentry-tunnel',
})
```

#### `apps/admin/next.config.ts` (UPDATE — wrap with withSentryConfig)
```typescript
import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  transpilePackages: ['@kandles/db', '@kandles/env', '@kandles/types'],
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT_ADMIN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: '/api/sentry-tunnel',
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: false,
})
```

**NOTE**: `withSentryConfig` does NOT wrap the TypeScript type — the return type is still compatible. Existing `transpilePackages` must be preserved exactly.

#### `apps/admin/src/app/api/sentry-tunnel/route.ts` (NEW)
```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const envelope = await request.text()
  const header = envelope.split('\n')[0]

  let dsn: string
  try {
    dsn = JSON.parse(header).dsn as string
  } catch {
    return new NextResponse('Invalid Sentry envelope', { status: 400 })
  }

  const url = new URL(dsn)
  const projectId = url.pathname.replace('/', '')

  const res = await fetch(`https://${url.hostname}/api/${projectId}/envelope/`, {
    method: 'POST',
    body: envelope,
    headers: { 'Content-Type': 'application/x-sentry-envelope' },
  })

  return new NextResponse(null, { status: res.status })
}
```

#### `apps/admin/src/lib/logger.ts` (NEW)
```typescript
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  ...(process.env.NODE_ENV === 'production' && process.env.AXIOM_TOKEN
    ? {
        transport: {
          target: '@axiomhq/pino',
          options: {
            dataset: 'kandles-admin',
            token: process.env.AXIOM_TOKEN,
          },
        },
      }
    : { transport: { target: 'pino-pretty' } }),
})
```

**Usage pattern — MANDATORY `[functionName]` prefix:**
```typescript
import { logger } from '@/lib/logger'

logger.info({ orderId, status }, '[updateOrderStatus] status updated')
logger.error({ err, orderId }, '[stripeWebhook] payment processing failed')
logger.warn({ userId }, '[getUser] user not found')
```

**IMPORTANT**: Pino logger is Node.js runtime only. Do NOT import `logger` in Edge runtime files (middleware, edge API routes). Edge runtime does not support Node.js streams.

**AXIOM_TOKEN**: Not yet in @kandles/env. Logger transport falls back to pino-pretty when `AXIOM_TOKEN` is undefined. Add AXIOM_TOKEN to @kandles/env and deploy.yml in a future story when Axiom account is set up.

#### `apps/storefront/src/lib/sentry.ts` (NEW)
```typescript
import * as Sentry from '@sentry/astro'

Sentry.init({
  dsn: import.meta.env.SENTRY_DSN_STOREFRONT,
  environment: import.meta.env.MODE,
  tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
  tunnel: '/api/sentry-tunnel',
})
```

**NOTE**: `SENTRY_DSN_STOREFRONT` is in the `server` block of `packages/env/src/astro.ts` — it's validated at Cloudflare Pages build time. In `@sentry/astro`, the `src/lib/sentry.ts` file is referenced by the integration for SSR init. The `import.meta.env.SENTRY_DSN_STOREFRONT` resolves correctly in Astro SSR context.

#### `apps/storefront/astro.config.ts` (UPDATE — add sentry integration)
```typescript
import { defineConfig } from 'astro/config'
import cloudflare from '@astrojs/cloudflare'
import tailwind from '@astrojs/tailwind'
import sentry from '@sentry/astro'

export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  integrations: [
    tailwind(),
    sentry({
      dsn: process.env.SENTRY_DSN_STOREFRONT,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      sourceMapsUploadOptions: {
        project: process.env.SENTRY_PROJECT_STOREFRONT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
        org: process.env.SENTRY_ORG,
      },
      tunnel: '/api/sentry-tunnel',
    }),
  ],
})
```

**NOTE**: `process.env` in astro.config.ts is available at build time (Cloudflare Pages build environment). `tailwind()` integration position preserved first.

#### `apps/storefront/src/pages/api/sentry-tunnel.ts` (NEW)
```typescript
import type { APIRoute } from 'astro'

export const POST: APIRoute = async ({ request }) => {
  const envelope = await request.text()
  const header = envelope.split('\n')[0]

  let dsn: string
  try {
    dsn = JSON.parse(header).dsn as string
  } catch {
    return new Response('Invalid Sentry envelope', { status: 400 })
  }

  const url = new URL(dsn)
  const projectId = url.pathname.replace('/', '')

  const res = await fetch(`https://${url.hostname}/api/${projectId}/envelope/`, {
    method: 'POST',
    body: envelope,
    headers: { 'Content-Type': 'application/x-sentry-envelope' },
  })

  return new Response(null, { status: res.status })
}
```

### deploy.yml — Required Additions

Add to the build step env block in `.github/workflows/deploy.yml`:
```yaml
SENTRY_ORG: ${{ secrets.SENTRY_ORG }}
SENTRY_PROJECT_ADMIN: ${{ secrets.SENTRY_PROJECT_ADMIN }}
SENTRY_PROJECT_STOREFRONT: ${{ secrets.SENTRY_PROJECT_STOREFRONT }}
NEXT_PUBLIC_SENTRY_DSN_ADMIN: ${{ secrets.NEXT_PUBLIC_SENTRY_DSN_ADMIN }}
```

`SENTRY_AUTH_TOKEN`, `SENTRY_DSN_ADMIN`, `SENTRY_DSN_STOREFRONT` already present ✅

### @kandles/env Changes Summary

**`packages/env/src/nextjs.ts`** — add to server block:
```typescript
SENTRY_AUTH_TOKEN: z.string().min(1),
NEXT_PUBLIC_SENTRY_DSN_ADMIN: z.string().url(),  // only if Approach A for client config
```
If `NEXT_PUBLIC_SENTRY_DSN_ADMIN` added to server block → also add to client block + experimental__runtimeEnv mapping.

Actually — `NEXT_PUBLIC_` vars must be in the `client` block, not server. Add:
```typescript
client: {
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SENTRY_DSN_ADMIN: z.string().url(),
},
experimental__runtimeEnv: {
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SENTRY_DSN_ADMIN: process.env.NEXT_PUBLIC_SENTRY_DSN_ADMIN,
},
```

And `SENTRY_AUTH_TOKEN` to server block. Final nextjs.ts server block additions:
```typescript
SENTRY_AUTH_TOKEN: z.string().min(1),
```

**`packages/env/src/astro.ts`** — no changes needed:
- `SENTRY_DSN_STOREFRONT` already present ✅
- `SENTRY_AUTH_TOKEN` NOT added here (build-time only, would cause CF Workers runtime validation failure)

### CSP Update Required

`apps/storefront/public/_headers` — Sentry tunnel endpoint must be added to CSP. Current CSP in `_headers` does NOT include Sentry. Add to the storefront CSP `connect-src` directive:

```
connect-src 'self' https://*.ingest.sentry.io
```

Also check admin CSP if any (Next.js headers in `next.config.ts`). The Sentry JS SDK sends XHR to the tunnel route (same-origin `/api/sentry-tunnel`) so the tunnel itself is `'self'` — but the SDK fallback may try direct Sentry ingest. The `connect-src https://*.ingest.sentry.io` covers the fallback case.

This was listed as a deferred item in deferred-work.md (`1-6` review): "CSP missing Sentry entries — add in Stories 1.9". This story resolves that deferred item.

### Storefront CSP Update — Exact Location

File: `apps/storefront/public/_headers`

Find the `connect-src` line and add `https://*.ingest.sentry.io`. Read the file first to see current value.

### References

- [Source: epics.md#Story-1.9] — Acceptance criteria, user story
- [Source: epics.md#AR-39] — Sentry explicit in Epic 1, not deferred
- [Source: architecture.md#Structured-Logging] — Pino + Axiom pattern, `[functionName]` prefix
- [Source: architecture.md#Sentry-Configuration] — code snippets (note discrepancies above)
- [Source: packages/env/src/nextjs.ts] — SENTRY_DSN_ADMIN already present ✅
- [Source: packages/env/src/astro.ts] — SENTRY_DSN_STOREFRONT already present ✅
- [Source: .github/workflows/deploy.yml] — SENTRY_AUTH_TOKEN, SENTRY_DSN_ADMIN, SENTRY_DSN_STOREFRONT already present ✅
- [Source: deferred-work.md#1-6] — CSP missing Sentry entries → resolved by this story
- [Source: apps/storefront/public/_headers] — existing CSP, add Sentry connect-src

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `hideSourceMaps` не е валидна опция в `@sentry/nextjs` v10 → заменена с `sourcemaps.filesToDeleteAfterUpload: ['.next/static/**/*.map']`
- `pnpm turbo typecheck` storefront failing → pre-existing: `astro check` изисква Node.js v22.12, наличен v20.20; `tsc --noEmit` пряко → 0 грешки ✅

### Completion Notes List

- `@sentry/nextjs@10.57.0` + `pino@10.3.1` + `@axiomhq/pino@1.6.1` + `pino-pretty@13.1.3` инсталирани в admin ✅
- `@sentry/astro@10.57.0` инсталиран в storefront ✅
- `packages/env/src/nextjs.ts`: добавени `SENTRY_AUTH_TOKEN` (server) и `NEXT_PUBLIC_SENTRY_DSN_ADMIN` (client + runtimeEnv) ✅
- `sentry.server.config.ts` + `sentry.client.config.ts` + `sentry.edge.config.ts` създадени в `apps/admin/` ✅
- `apps/admin/next.config.ts` обвито с `withSentryConfig`; `hideSourceMaps` → `sourcemaps.filesToDeleteAfterUpload` (v10 API) ✅
- `apps/admin/src/app/api/sentry-tunnel/route.ts` (Next.js App Router POST handler) ✅
- `apps/admin/src/lib/logger.ts` — Pino с Axiom transport в production (условен на AXIOM_TOKEN), pino-pretty в dev ✅
- `apps/storefront/src/lib/sentry.ts` — SSR Sentry init с `SENTRY_DSN_STOREFRONT` ✅
- `apps/storefront/astro.config.ts` — `sentry()` integration с sourceMapsUploadOptions ✅
- `apps/storefront/src/pages/api/sentry-tunnel.ts` (Astro APIRoute POST handler) ✅
- `apps/storefront/public/_headers` — CSP `connect-src` + `https://*.ingest.sentry.io` (разрешен deferred от review 1-6) ✅
- `.github/workflows/deploy.yml` — добавени `SENTRY_ORG`, `SENTRY_PROJECT_ADMIN`, `SENTRY_PROJECT_STOREFRONT`, `NEXT_PUBLIC_SENTRY_DSN_ADMIN` ✅
- Admin typecheck: 0 грешки ✅ | Admin lint: 0 грешки ✅ | @kandles/env typecheck: 0 грешки ✅ | Storefront tsc --noEmit: 0 грешки ✅

### File List

- packages/env/src/nextjs.ts *(modified — SENTRY_AUTH_TOKEN server var, NEXT_PUBLIC_SENTRY_DSN_ADMIN client var)*
- apps/admin/sentry.server.config.ts *(new)*
- apps/admin/sentry.client.config.ts *(new)*
- apps/admin/sentry.edge.config.ts *(new)*
- apps/admin/next.config.ts *(modified — withSentryConfig wrapper, sourcemaps.filesToDeleteAfterUpload)*
- apps/admin/src/app/api/sentry-tunnel/route.ts *(new)*
- apps/admin/src/lib/logger.ts *(new)*
- apps/storefront/src/lib/sentry.ts *(new)*
- apps/storefront/astro.config.ts *(modified — sentry() integration)*
- apps/storefront/src/pages/api/sentry-tunnel.ts *(new)*
- apps/storefront/public/_headers *(modified — Sentry added to connect-src CSP)*
- .github/workflows/deploy.yml *(modified — SENTRY_ORG, SENTRY_PROJECT_ADMIN, SENTRY_PROJECT_STOREFRONT, NEXT_PUBLIC_SENTRY_DSN_ADMIN)*

## Change Log

- 2026-06-12: Story 1.9 имплементирана — Sentry + monitoring stack: @sentry/nextjs (admin) + @sentry/astro (storefront), Pino logger, sentry tunnel routes (/api/sentry-tunnel) в двете апликации, @kandles/env актуализирана с SENTRY_AUTH_TOKEN + NEXT_PUBLIC_SENTRY_DSN_ADMIN, CSP разширена с Sentry connect-src

---
baseline_commit: 2505b57ee28230f9f004624065eb6c73f39f0848
---

# Story 1.7: CI/CD GitHub Actions pipeline

Status: done

## Story

As a developer,
I want GitHub Actions CI/CD that validates code quality, runs migrations safely, and blocks Lighthouse regressions,
so that the main branch always has passing tests, correct schema, and Lighthouse ≥ 90.

## Acceptance Criteria

1. **Given** `.github/workflows/pr.yml` exists
   **When** a PR is opened or updated
   **Then** pipeline runs in order: `pnpm install` → `turbo typecheck` → `turbo lint` → `turbo test` → `turbo build` → Drizzle migration dry-run

2. **Given** Drizzle migration dry-run step
   **When** pending unapplied migrations exist in `packages/db/drizzle/migrations/`
   **Then** step validates SQL syntax and exits 0 (does not apply to production DB)

3. **Given** `.github/workflows/deploy.yml` exists
   **When** PR merges to main
   **Then** pipeline runs: Vercel deploy → Cloudflare Pages deploy → Lighthouse CI → Google Rich Results Test

4. **Given** `lighthouserc.js` configuration
   **Then** it asserts all four categories ≥ 90 (Performance, Accessibility, Best Practices, SEO) on mobile simulation
   **And** merge is blocked if Performance mobile < 90

5. **Given** GitHub Actions secrets
   **Then** all sensitive values (Supabase URLs, Stripe keys, Sentry tokens) come from GitHub Secrets — never hardcoded in workflow files

6. **Given** Turborepo remote cache (optional but configured)
   **Then** `turbo.json` has `remoteCache` configured to skip redundant rebuilds on unchanged packages

7. **Given** `axe-core` Playwright accessibility check in CI (AR-18)
   **Then** it runs against storefront and blocks merge on WCAG AA violations

## Tasks / Subtasks

- [x] Task 1: Настрой Vitest + ESLint конфиги за всички packages/apps (AC: 1)
  - [x] Инсталирай `vitest` и `@vitest/coverage-v8` в root devDependencies (catalog)
  - [x] Добави `vitest` към pnpm-workspace.yaml catalog
  - [x] Създай `vitest.config.ts` в root (workspace mode) — сканира `packages/*/src/**/*.test.ts` и `apps/*/src/**/*.test.ts`
  - [x] Добави `"test": "vitest run"` script в packages с тестове (packages/db, packages/types)
  - [x] Провери `turbo test` работи — ако няма тестове, трябва да exits 0 (не fail)
  - [x] Създай root-level `eslint.config.mjs` за споделени ESLint правила
  - [x] Верифицирай `turbo lint` минава на всички apps

- [x] Task 2: Създай `.github/workflows/pr.yml` (AC: 1, 2, 5)
  - [x] Trigger: `pull_request` към `main` branch
  - [x] Стъпки в ред: checkout → setup pnpm → setup node 22 → pnpm install --frozen-lockfile → turbo typecheck → turbo lint → turbo test → turbo build → drizzle migration dry-run
  - [x] Drizzle dry-run: `pnpm --filter @kandles/db exec drizzle-kit check` (верифицира schema = migrations, без DB connection)
  - [x] Всички secrets идват от `${{ secrets.* }}` — НЕ hardcoded
  - [x] Node.js версия: 22.x (engines изискват ≥ 22.12.0)
  - [x] pnpm версия: 9.x (packageManager: pnpm@9.15.9)

- [x] Task 3: Създай `.github/workflows/deploy.yml` (AC: 3, 4, 5)
  - [x] Trigger: `push` към `main`
  - [x] Стъпки: checkout → setup → install → build → Vercel deploy → CF Pages deploy → Lighthouse CI → Google Rich Results Test
  - [x] Vercel deploy: `vercel --prod --token ${{ secrets.VERCEL_TOKEN }}` (или Vercel GitHub integration)
  - [x] CF Pages deploy: `wrangler pages deploy apps/storefront/dist --project-name kandles-storefront --commit-dirty=true`
  - [x] Lighthouse CI задължителен за storefront URL след deploy
  - [x] Block merge ако Performance mobile < 90

- [x] Task 4: Създай `lighthouserc.js` в root (AC: 4)
  - [x] Assert: performance ≥ 0.9, accessibility ≥ 0.9, best-practices ≥ 0.9, seo ≥ 0.9
  - [x] Mobile emulation: `formFactor: 'mobile'`
  - [x] URL: взима от deploy output (Cloudflare Pages preview URL)

- [x] Task 5: Настрой Turborepo remote cache (AC: 6)
  - [x] Добави `remoteCache: { enabled: true }` в `turbo.json`
  - [x] Добави `TURBO_TOKEN` и `TURBO_TEAM` в GitHub Secrets (ръчна стъпка — документирай)
  - [x] В workflow файловете добави env vars: `TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}` и `TURBO_TEAM: ${{ secrets.TURBO_TEAM }}`

- [x] Task 6: Playwright + axe-core accessibility check (AC: 7)
  - [x] Инсталирай `@playwright/test` и `@axe-core/playwright` в root devDependencies
  - [x] Създай `playwright.config.ts` в root — target storefront localhost
  - [x] Създай `e2e/accessibility.spec.ts` — проверява `GET /` на storefront за WCAG AA violations
  - [x] Добави `"e2e": "playwright test"` в root package.json scripts
  - [x] Интегрирай в `pr.yml` след `turbo build` (стартира storefront preview, runs axe)

- [x] Task 7: Приложи отложени DB indexes от Story 1.4 (deferred)
  - [x] `orders.ts`: добави composite index `(user_id, status)` в schema
  - [x] `order_items.ts`: добави index на `order_id` в schema
  - [x] `pnpm --filter @kandles/db run generate` — генерирай нова миграция
  - [x] Верифицирай migration файл е коректен (не е празен, не Override предишни)

- [x] Task 8: Обнови `wrangler.toml` compatibility_date (deferred от 1.6)
  - [x] Смени `compatibility_date = "2025-01-01"` → `"2025-10-01"` (стабилна дата; не ползвай бъдещи дати)

- [x] Task 9: Документирай required GitHub Secrets в `.env.example` коментар (AC: 5)
  - [x] Добави секция `# GitHub Actions Secrets` в `.env.example` с пълния списък

## Dev Notes

### Важно: Текущо repo состояние

**Какво СЪЩЕСТВУВА:**
- `turbo.json` — tasks: build, typecheck, lint, test, dev (всички дефинирани)
- `package.json` root — scripts: dev/build/typecheck/lint/test → turbo
- `apps/storefront/package.json` — `"lint": "eslint ."` (но **без eslint.config файл**)
- `apps/admin/package.json` — `"lint": "eslint ."` (но **без eslint.config файл**)
- `packages/db/package.json` — няма `"test"` script
- `packages/types/package.json` — няма `"test"` script
- **Нито един app/package няма Vitest инсталиран**
- **Нито един app/package няма eslint.config файл**
- `.github/workflows/` директория **не съществува**

**Какво трябва да се СЪЗДАДЕ:**
- `.github/workflows/pr.yml`
- `.github/workflows/deploy.yml`
- `lighthouserc.js`
- `playwright.config.ts`
- `e2e/accessibility.spec.ts`
- `vitest.config.ts` (root)
- `eslint.config.mjs` (root)

### Task 1: Vitest setup

Инсталирай в root (не per-app — workspace mode е по-ефективен):

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH"
pnpm add -D vitest @vitest/coverage-v8 -w
```

Root `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: [
      'packages/*/src/**/*.test.ts',
      'apps/*/src/**/*.test.ts',
    ],
    environment: 'node',
  },
})
```

**ВАЖНО за `turbo test`:** Ако package/app няма тестове, `turbo test` ще fail ако script `test` не е дефиниран или exits non-zero. Добави `"test": "vitest run"` САМО в packages с тестове. За packages без тестове — или добави `"test": "echo 'no tests'"` или остави script недефиниран (turbo ще го skip).

turbo.json вече има `"test": { "dependsOn": ["^build"] }` — не промени тази конфигурация.

### Task 1: ESLint setup

Приложенията имат `"lint": "eslint ."` но **нямат eslint.config.mjs**. Без config ESLint 9 ще exit 0 (без rules) или ще даде грешка. Трябва root config + per-app extends.

Root `eslint.config.mjs` (ESLint 9 flat config):
```javascript
import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: { '@typescript-eslint': tsPlugin },
    languageOptions: { parser: tsParser },
    rules: {
      ...tsPlugin.configs['recommended'].rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  { ignores: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/out/**'] },
])
```

Инсталирай needed deps:
```bash
pnpm add -D @eslint/js @typescript-eslint/eslint-plugin @typescript-eslint/parser -w
```

### Task 2: pr.yml — точна имплементация

```yaml
name: PR Checks

on:
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Typecheck
        run: pnpm turbo typecheck
        env:
          TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
          TURBO_TEAM: ${{ secrets.TURBO_TEAM }}

      - name: Lint
        run: pnpm turbo lint
        env:
          TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
          TURBO_TEAM: ${{ secrets.TURBO_TEAM }}

      - name: Test
        run: pnpm turbo test
        env:
          TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
          TURBO_TEAM: ${{ secrets.TURBO_TEAM }}

      - name: Build
        run: pnpm turbo build
        env:
          TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
          TURBO_TEAM: ${{ secrets.TURBO_TEAM }}
          # Build env vars — невалидни стойности за CI (build validation само)
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
          STRIPE_WEBHOOK_SECRET: ${{ secrets.STRIPE_WEBHOOK_SECRET }}
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${{ secrets.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY }}
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
          ADMIN_EMAIL: ${{ secrets.ADMIN_EMAIL }}
          UPSTASH_REDIS_REST_URL: ${{ secrets.UPSTASH_REDIS_REST_URL }}
          UPSTASH_REDIS_REST_TOKEN: ${{ secrets.UPSTASH_REDIS_REST_TOKEN }}
          CLOUDFLARE_IMAGES_TOKEN: ${{ secrets.CLOUDFLARE_IMAGES_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          TRIGGER_SECRET_KEY: ${{ secrets.TRIGGER_SECRET_KEY }}
          VIBER_API_KEY: ${{ secrets.VIBER_API_KEY }}
          VIBER_ADMIN_NUMBER: ${{ secrets.VIBER_ADMIN_NUMBER }}
          VIBER_BUSINESS_NUMBER: ${{ secrets.VIBER_BUSINESS_NUMBER }}
          WHATSAPP_NUMBER: ${{ secrets.WHATSAPP_NUMBER }}
          CRON_SECRET: ${{ secrets.CRON_SECRET }}
          TURNSTILE_SECRET_KEY: ${{ secrets.TURNSTILE_SECRET_KEY }}
          TURNSTILE_SITE_KEY: ${{ secrets.TURNSTILE_SITE_KEY }}
          META_CAPI_ACCESS_TOKEN: ${{ secrets.META_CAPI_ACCESS_TOKEN }}
          META_PIXEL_ID: ${{ secrets.META_PIXEL_ID }}
          PREVIEW_JWT_SECRET: ${{ secrets.PREVIEW_JWT_SECRET }}
          SENTRY_DSN_ADMIN: ${{ secrets.SENTRY_DSN_ADMIN }}
          SENTRY_DSN_STOREFRONT: ${{ secrets.SENTRY_DSN_STOREFRONT }}
          FALLBACK_SHIPPING_PRICE_BGN: "8.99"

      - name: Migration dry-run (schema check)
        run: pnpm --filter @kandles/db exec drizzle-kit check
```

**Бележка за `drizzle-kit check`:** В drizzle-kit 0.31.x, `drizzle-kit check` верифицира integrity на migration файловете (консистентност на snapshots и journal). **Не изисква DB connection. Exits non-zero при inconsistency.** Ако командата не съществува в тази версия, алтернативата е `drizzle-kit generate --check` (флаг добавен в 0.30+). Dev агентът трябва да провери точния флаг с `pnpm --filter @kandles/db exec drizzle-kit --help`.

### Task 2: build step — @t3-oss/env validation

`@kandles/env` извиква `createEnv()` при import → ако env vars липсват → build fail. За CI build трябва ВСИЧКИ required secrets да са налични. Виж секция "Secrets за GitHub" по-долу.

За packages без secrets (`@kandles/types`, `@kandles/db`), build минава без env vars. Само apps нуждаят среда.

### Task 3: deploy.yml — точна имплементация

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build all apps
        run: pnpm turbo build
        env:
          TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
          TURBO_TEAM: ${{ secrets.TURBO_TEAM }}
          # ... (same env vars as pr.yml build step)

      - name: Deploy Admin (Vercel)
        run: |
          pnpm dlx vercel --prod \
            --token ${{ secrets.VERCEL_TOKEN }} \
            --cwd apps/admin \
            --yes
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID_ADMIN }}

      - name: Deploy Storefront (Cloudflare Pages)
        run: |
          pnpm dlx wrangler pages deploy apps/storefront/dist \
            --project-name kandles-storefront \
            --commit-dirty=true
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

      - name: Lighthouse CI
        run: |
          pnpm dlx @lhci/cli autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
          # URL: взима автоматично от lighthouserc.js collect.url
          # или set dynamic URL от CF Pages deploy output

      - name: Google Rich Results Test (informational)
        run: |
          echo "Rich Results Test: https://search.google.com/test/rich-results?url=${{ env.STOREFRONT_URL }}"
        # Informational step — не блокира deploy
```

**Бележка за Vercel deploy:** Ако admin е конфигуриран с Vercel GitHub integration (Dashboard → Git), deploy се случва автоматично при push. В такъв случай деплой стъпката в workflow е redundant. Провери дали Vercel GitHub integration е активна преди да добавяш manual deploy step.

### Task 4: lighthouserc.js

```javascript
/** @type {import('@lhci/cli').LighthouseRCConfig} */
module.exports = {
  ci: {
    collect: {
      url: [process.env.STOREFRONT_URL || 'http://localhost:4321'],
      numberOfRuns: 3,
      settings: {
        formFactor: 'mobile',
        throttlingMethod: 'simulate',
        screenEmulation: {
          mobile: true,
          width: 390,
          height: 844,
          deviceScaleFactor: 3,
        },
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
```

### Task 5: turbo.json remote cache

```json
{
  "$schema": "https://turbo.build/schema.json",
  "remoteCache": {
    "enabled": true
  },
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "!.next/cache/**", "dist/**"] },
    "typecheck": { "dependsOn": ["^build"] },
    "lint": {},
    "test": { "dependsOn": ["^build"] },
    "dev": { "dependsOn": ["^build"], "cache": false, "persistent": true }
  }
}
```

**Ръчни стъпки за remote cache (документирай — не автоматизирай):**
1. Vercel Dashboard → Settings → Tokens → Create token → `TURBO_TOKEN`
2. Vercel Dashboard → Settings → General → Team slug → `TURBO_TEAM`
3. GitHub → repo Settings → Secrets → Actions → Add: `TURBO_TOKEN`, `TURBO_TEAM`

### Task 6: Playwright + axe-core

Инсталирай:
```bash
pnpm add -D @playwright/test @axe-core/playwright -w
npx playwright install --with-deps chromium
```

Root `playwright.config.ts`:
```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: {
    baseURL: process.env.STOREFRONT_URL || 'http://localhost:4321',
  },
  projects: [
    {
      name: 'chromium',
      use: { channel: 'chromium' },
    },
  ],
})
```

`e2e/accessibility.spec.ts`:
```typescript
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('storefront home page has no WCAG AA violations', async ({ page }) => {
  await page.goto('/')
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze()
  expect(results.violations).toEqual([])
})
```

**В pr.yml — добави Playwright стъпка след build:**
```yaml
- name: Start storefront preview
  run: pnpm --filter @kandles/storefront preview &
  # Изчакай сървъра да стартира

- name: Wait for storefront
  run: npx wait-on http://localhost:4321 --timeout 30000

- name: Install Playwright browsers
  run: pnpm exec playwright install --with-deps chromium

- name: Accessibility check (axe-core + Playwright)
  run: pnpm playwright test
```

Инсталирай `wait-on`:
```bash
pnpm add -D wait-on -w
```

**ВАЖНО:** `playwright install --with-deps chromium` задължително в CI — GitHub Actions runner няма Chromium по default.

### Task 7: DB Indexes (deferred от Story 1.4)

В `packages/db/src/schema/orders.ts` добави:
```typescript
}, (table) => ({
  userIdStatusIdx: index('orders_user_id_status_idx').on(table.userId, table.status),
}))
```

В `packages/db/src/schema/order_items.ts` добави:
```typescript
}, (table) => ({
  orderIdIdx: index('order_items_order_id_idx').on(table.orderId),
}))
```

След добавяне:
```bash
export PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH"
pnpm --filter @kandles/db run generate
```

Верифицирай новата миграция е правилна (CREATE INDEX statements, не ALTER).

### Secrets за GitHub — пълен списък

Следните secrets трябва да са добавени в GitHub → repo Settings → Secrets and variables → Actions:

**Supabase:**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`

**Stripe:**
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

**Vercel (за manual deploy):**
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID_ADMIN`

**Cloudflare:**
- `CLOUDFLARE_API_TOKEN` (Pages deploy permissions)
- `CLOUDFLARE_ACCOUNT_ID`

**Sentry:**
- `SENTRY_AUTH_TOKEN` (source maps upload в CI build)

**Turborepo cache:**
- `TURBO_TOKEN`
- `TURBO_TEAM`

**Lighthouse:**
- `LHCI_GITHUB_APP_TOKEN` (опционален — за GitHub status checks)

**Останали app secrets:**
- `RESEND_API_KEY`
- `ADMIN_EMAIL`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `CLOUDFLARE_IMAGES_TOKEN`
- `TRIGGER_SECRET_KEY`
- `VIBER_API_KEY`, `VIBER_ADMIN_NUMBER`, `VIBER_BUSINESS_NUMBER`
- `WHATSAPP_NUMBER`
- `CRON_SECRET`
- `TURNSTILE_SECRET_KEY`, `TURNSTILE_SITE_KEY`
- `META_CAPI_ACCESS_TOKEN`, `META_PIXEL_ID`
- `PREVIEW_JWT_SECRET`
- `SENTRY_DSN_ADMIN`, `SENTRY_DSN_STOREFRONT`

### Architecture conflicting note — workflow file naming

Архитектура (`architecture.md`) казва `ci.yml` + `deploy.yml`. Epic AC казва `pr.yml` + `deploy.yml`. Използвай `pr.yml` — AC е по-специфичен.

### pnpm path (crucial)

Всяка bash команда в dev context:
```bash
export PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH"
```

В GitHub Actions — `setup-node@v4` с `cache: pnpm` се грижи за path автоматично.

### Learnings от Stories 1.1–1.6

- `turbo typecheck` зависи от `^build` — при clean cache build минава преди typecheck
- `pnpm --filter @kandles/X` за per-package команди
- `@kandles/env` validation се извиква при import → build fail при липсващи vars (нарочно)
- `apps/storefront` ползва `astro check` за typecheck (не `tsc`)
- `apps/admin` ползва `tsc --noEmit` за typecheck
- `wrangler pages deploy` изисква `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` в env
- Factory function pattern за Supabase клиент (не singleton) — важно за Cloudflare Workers stateless context

### References

- [Source: epics.md#Story-1.7] — Story acceptance criteria
- [Source: architecture.md#CI/CD-Pipeline] — workflow steps и tool choices
- [Source: architecture.md#Testing-Strategy] — Vitest + Playwright
- [Source: architecture.md#Infrastructure-Deployment] — Vercel + CF Pages deploy commands
- [Source: deferred-work.md] — DB indexes (Story 1.4), Turborepo remote cache (Story 1.1), wrangler.toml date (Story 1.6)
- [Source: story-1-6.md] — wrangler.toml, vercel.json, CF Pages deploy config
- [Source: .env.example] — пълен списък secrets

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Vitest `--passWithNoTests` flag needed за packages/db + packages/types — vitest exits 1 при no test files без флага
- ESLint 9 flat config: `no-undef` изключен глобално — redundant за TypeScript проекти (TS handles scope), + false positives за React 19 JSX transform и CJS globals (module/require)
- `@eslint/js@9` (не 10) — peers с eslint@9 в apps; `@eslint/js@10` изисква `eslint@^10`
- `.astro/` добавен в eslint ignores — auto-generated файлове от Astro не трябва да се lint-ват
- `drizzle-kit check` (не `generate --check`) — correct command за migration integrity check без DB connection
- DB migration `0004_known_mercury.sql` — две `CREATE INDEX` statements за orders + order_items
- `wrangler.toml` compatibility_date: `2025-01-01` → `2025-10-01`
- GitHub Secrets секция добавена в `.env.example` за CI/CD deploy secrets
- `turbo.json` remoteCache enabled — TURBO_TOKEN/TURBO_TEAM в workflow env vars; manual setup в Vercel Dashboard
- Playwright + axe-core: `playwright install --with-deps chromium` задължително в CI steps

### File List

- .github/workflows/pr.yml *(new)*
- .github/workflows/deploy.yml *(new)*
- lighthouserc.js *(new)*
- vitest.config.ts *(new)*
- playwright.config.ts *(new)*
- eslint.config.mjs *(new)*
- e2e/accessibility.spec.ts *(new)*
- turbo.json *(modified — remoteCache)*
- package.json *(modified — e2e script, devDependencies)*
- pnpm-lock.yaml *(modified — vitest, @playwright/test, @axe-core/playwright, @eslint/js, @typescript-eslint/*, wait-on)*
- packages/db/package.json *(modified — test script)*
- packages/db/src/schema/orders.ts *(modified — user_id+status index)*
- packages/db/src/schema/order_items.ts *(modified — order_id index)*
- packages/db/drizzle/migrations/0004_known_mercury.sql *(new)*
- packages/db/drizzle/migrations/meta/_journal.json *(modified)*
- packages/db/drizzle/migrations/meta/0004_snapshot.json *(new)*
- packages/types/package.json *(modified — test script)*
- packages/email/package.json *(modified — test script)*
- packages/ui/package.json *(modified — test script)*
- apps/storefront/package.json *(modified — test script)*
- apps/storefront/wrangler.toml *(modified — compatibility_date)*
- apps/admin/package.json *(modified — test script)*
- .env.example *(modified — GitHub Actions Secrets section)*

## Senior Developer Review (AI)

**Review date:** 2026-06-12
**Outcome:** Changes Requested → Patched

### Findings Triaged

| # | Severity | File | Finding | Resolution |
|---|----------|------|---------|------------|
| 1 | CRITICAL | deploy.yml:70 | CF Pages step missing `id: cf-deploy` → STOREFRONT_URL always falls back to hardcoded URL | **PATCHED** — added `id: cf-deploy` |
| 2 | HIGH | deploy.yml:62 | `--token ${{ secrets.VERCEL_TOKEN }}` in CLI arg → token visible in process list | **PATCHED** — moved to `VERCEL_TOKEN` env var |
| 3 | HIGH | pr.yml + deploy.yml | No `permissions:` block → defaults to write-all (least-privilege violation) | **PATCHED** — added `permissions: contents: read` |
| 4 | HIGH | pr.yml + deploy.yml | No `concurrency:` group → parallel runs race | **PATCHED** — added concurrency groups; deploy uses `cancel-in-progress: false` |
| 5 | HIGH | turbo.json | `test` task lacks `cache: false` → turbo can replay cached failures as passes | **PATCHED** — added `"cache": false` to test task |
| 6 | MEDIUM | pr.yml:88 | `npx wait-on` → package already in devDeps, use `pnpm exec` | **PATCHED** — `pnpm exec wait-on` |
| 7 | MEDIUM | pr.yml + deploy.yml | `node-version: 22` can resolve 22.0.0 < engines `>=22.12.0` | **PATCHED** — pinned to `22.12` |
| 8 | MEDIUM | pr.yml + deploy.yml | pnpm `version: 9` unpinned | **PATCHED** — pinned to `9.15.9` |
| 9 | MEDIUM | playwright.config.ts | `channel: 'chromium'` uses system Chrome, not playwright-installed browser | **PATCHED** — removed channel, playwright uses installed browser |
| 10 | MEDIUM | lighthouserc.js | `upload.target: 'temporary-public-storage'` leaks page snapshots publicly | **PATCHED** — changed to `filesystem` with `.lighthouseci` outputDir |
| 11 | LOW | pr.yml | Trigger only on `main` but active branch is `develop` | **PATCHED** — added `develop` to trigger branches |

### Deferred / Dismissed

| Finding | Decision |
|---------|----------|
| Orphaned `0002_products_search_index.sql` not in _journal.json | DEFER — pre-existing from Story 1.3 |
| No DB migration step before deploy | DEFER — future story (Story 1.10) |
| CREATE INDEX without CONCURRENTLY | DEFER — Supabase migrations handle this; pre-existing from Story 1.4 |
| Remote cache disabled for fork PRs | DEFER — documented GHA behavior |
| `--commit-dirty=true` in wrangler | DEFER — CI checkout always clean, harmless |
| Root `vitest.config.ts` never invoked by turbo | DEFER — config valid if ever needed |
| `drizzle-kit check` command validity | DISMISS — confirmed present in drizzle-kit 0.31.10 bin.cjs |
| Port 4321 concern for astro preview | DISMISS — `@astrojs/cloudflare` preview.js passes Astro's port (4321) to wrangler |

## Change Log

- 2026-06-12: Story 1.7 имплементирана — GitHub Actions pr.yml + deploy.yml, Vitest workspace, ESLint flat config, Playwright axe-core, lighthouserc.js, Turborepo remote cache, DB indexes migration, wrangler.toml date update
- 2026-06-12: Code review patches — permissions/concurrency blocks, VERCEL_TOKEN env fix, cf-deploy step id, node/pnpm version pins, test cache disabled, playwright channel removed, lighthouse upload filesystem, wait-on pnpm exec, develop branch trigger

---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-06-05'
inputDocuments:
  - _bmad-output/planning-artifacts/PRD-kandles-bg.md
  - _bmad-output/brainstorming/brainstorming-session-2026-06-05-1315.md
workflowType: 'architecture'
project_name: 'Kandles.bg'
user_name: 'Daniel'
date: '2026-06-05'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

---

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

31 FR-та в 12 домейна (MVP: 22 FR-та):

- **Продуктов каталог (FR-1–4):** SSG product pages, seasonal logic (дата-базирана), occasion filtering, inventory badges (`наличност ≤ 5`)
- **Букет Конфигуратор (FR-5–6):** Multi-step wizard с stateful preview + preview-photo approval workflow (state machine)
- **Gift Experience (FR-7–9):** Cart-level add-ons, composite inventory (Gift Sets), recipient address separation
- **Checkout & Payment (FR-10–13):** Guest checkout, Stripe (primary) + ApplePay/GooglePay + наложен платеж (secondary), Econt + Speedy API, order tracking page
- **Automated Emails (FR-14–16):** Transactional (Resend), abandoned cart + birthday via Trigger.dev
- **Admin Panel (FR-17–19):** Order lifecycle management, product CRUD, Viber Business notifications
- **Social Proof (FR-20–22):** Seller story (static), moderated reviews с снимки, community gallery
- **SEO & Marketing (FR-23–27):** Occasion landing pages (SSG), Schema.org markup, newsletter с double opt-in
- **Loyalty (FR-28), QR кодове (FR-29), Multilingual (FR-30), Advent Calendar (FR-31)** — v2/сезонно

**Non-Functional Requirements:**

- Core Web Vitals: LCP < 1.5s, CLS < 0.1, FID < 50ms на мобилен → диктува Astro Islands architecture
- Mobile-first: < 2s на 4G → Cloudflare edge delivery за storefront
- GDPR compliant: newsletter double opt-in, explicit consent, retention policies
- SEO от ден 1: readable URLs (`/kolektsii/rozhden-den`), Schema.org Product + Review + BreadcrumbList
- Security: Stripe 3D Secure (критичен path — БГ банки активират при >30 лв), Supabase RLS, CSP headers

**Scale & Complexity:**

- Single-tenant e-commerce (1 продавач, 1 admin потребител)
- Сложност: **Medium**
- Primary domain: Full-stack web (SSG storefront + SPA-like admin)
- Очакван трафик: нисък-среден старт, spike при сезони (Коледа, 8 март)
- Данни: ~100–500 продукта, ~50–200 поръчки/месец в MVP фаза

---

### Technical Constraints & Dependencies

**Потвърден stack:**

| Layer | Tech | Key constraint |
|---|---|---|
| Storefront | Astro + React Islands | Islands = само interactive компоненти са JS |
| Admin | Next.js App Router | Server Actions за мутации |
| Database | Supabase PostgreSQL | RLS за row-level security |
| ORM | Drizzle ORM | Schema as source of truth — Supabase client само за Auth + Storage |
| Email | Resend + React Email | Transactional: synchronous; Marketing: Trigger.dev |
| Workflows | Trigger.dev | Само async marketing flows (abandoned cart, reminders) — не transactional emails |
| Payments | Stripe (primary) + ApplePay/GooglePay + наложен платеж (secondary) | Stripe Checkout hosted за v1 |
| Courier | Econt API + Speedy API | Async с 2s timeout + fallback фиксирана цена |
| Monorepo | Turborepo | `@kandles/db`, `@kandles/types`, `@kandles/env` shared packages |
| Hosting | Vercel (admin) + Cloudflare Pages (storefront) | Split hosting |
| Storage | Supabase Storage | `product-images` (public) + `admin-previews` (private, signed URLs 1h) |

**Критични external зависимости:**

- Viber Business Messages API (admin нотификации) — изисква официално одобрение; email fallback задължителен
- Econt REST API + Speedy API — без гарантиран SLA; async + fallback
- Revolut Business API — планиран, не в MVP
- Meta Commerce Manager — Instagram Shop, v2

---

### Cross-Cutting Concerns Identified

1. **Auth** — само admin; Supabase Auth с single user; signup disabled в Dashboard; storefront е публичен
2. **Shared типове** — Turborepo `@kandles/db` пакет; Drizzle schema е source of truth; CI version check между apps
3. **Inventory consistency** — Gift Sets консумират inventory атомарно (PostgreSQL SELECT FOR UPDATE + transaction)
4. **Cart reservations** — soft reserve при `checkout.start`: `cart_reservations` таблица с 30 мин TTL; abandoned cart purge след 30 дни
5. **Image pipeline** — `file-type` magic bytes validation; UUID filenames; отделни Supabase Storage buckets по access level
6. **Seasonal logic** — дата-базирана, server-side; admin override; не е personalization
7. **Email triggering** — transactional (Resend, synchronous при webhook) vs marketing (Trigger.dev, async)
8. **URL structure** — `/en/...` резервирано от ден 1; BG e default; не добавяме i18n routing по-късно
9. **Preview-photo approval workflow** — state machine: `Производство → Preview качена → Клиент одобри/Корекция → Изпратена`; signed JWT с expiry; max 3 изпращания на JWT
10. **GDPR** — double opt-in за newsletter; Cloudflare Turnstile на checkout (невидим, GDPR-friendly); hCaptcha при повторни грешки
11. **Secrets management** — три нива: `service_role` само на Vercel; `anon` може на Cloudflare Pages; `@t3-oss/env-nextjs` → build fails при липсващ secret

---

### Data Retention Policy

| Категория | Срок | Стратегия | Правно основание |
|---|---|---|---|
| Счетоводни документи (фактури, суми) | 10 години | Anonymize PII, пази record | Закон за счетоводството чл. 42 |
| PII (имена, адреси, телефони) | 3 години след последна поръчка | Anonymize → `[ANONYMIZED]` | GDPR чл. 6(1)(b) |
| Stripe refs (payment_intent_id, last4, brand) | 10 години | Запази — не са PII | Счетоводство |
| Карти данни | Не се съхраняват | N/A — Stripe токенизира | PCI-DSS |
| Newsletter имейли | До unsubscribe + 30 дни буфер | Hard delete | GDPR чл. 6(1)(а) |
| Abandoned cart данни | 30 дни | Hard delete | Минимум за email window |
| Preview approval logs | Живот на поръчката + 2 години | Soft delete | Договорно задължение |

**Enforcement:** `pg_cron` nightly jobs (Supabase Pro) за anonymization и purge. При Free tier → Vercel cron.

---

### Architecture Decision Records (Confirmed)

**ADR-001: Astro за storefront**
- Избран: Astro Islands → zero JS hydration за static pages → LCP < 1.5s постижимо
- Отхвърлен: Next.js App Router за storefront (хидратира всичко, по-бавен за SSG)

**ADR-002: localStorage cart + server sync при checkout**
- Избран: localStorage за MVP; при `checkout.start` → sync в DB + `cart_reservations` с 30 мин TTL
- Отхвърлен: Pure server cart от ден 1 (излишна сложност за MVP)
- Известно ограничение: cart се губи при private browsing → тихо toast warning при detection

**ADR-003: Drizzle ORM като source of truth**
- Избран: Drizzle schema в git → reviewable migrations; Supabase client само за Auth + Storage
- Собствена `users` таблица с `supabase_auth_id` FK — не hardcode-ваме `auth.users.id` в бизнес schema

**ADR-004: Trigger.dev само за marketing async flows**
- Избран: Trigger.dev за abandoned cart, birthday reminders
- Transactional emails (поръчка потвърдена) → synchronous Resend при Stripe webhook — не минават през Trigger.dev

**ADR-005: Stripe Hosted Checkout за v1**
- Избран: Stripe Checkout (hosted page) за v1 → Stripe управлява 3DS диалозите, ApplePay/GooglePay, compliance
- Предимство: 3DS е критичен path (БГ банки активират при >30 лв) — Stripe го решава без наш код
- Checkout flow: `stripe_card | apple_pay | google_pay | cash_on_delivery`
- При `cash_on_delivery` → не се създава Payment Intent; flow се разклонява след address step

**ADR-006: Webhook idempotency + cron reconciliation**
- `stripe_webhook_events` таблица с `stripe_event_id UNIQUE` → idempotency key
- Background cron (15 мин) → `stripe.paymentIntents.retrieve()` за `pending` поръчки >30 мин → reconcile пропуснати webhooks
- Двупосочна защита — не разчитаме само на webhooks

---

### Pre-mortem: Failure Scenarios & Preventions

| Сценарий | Причина | Превенция |
|---|---|---|
| Schema drift между apps | Deploy на admin без sync на storefront | `@kandles/db` shared package; CI блокира deploy при version mismatch |
| Courier API блокира checkout | Econt/Speedy без SLA, >2s response | Async с 2s timeout + fallback фиксирана цена + предупреждение |
| Gift Set inventory race condition | Два едновременни checkout-а | `SELECT FOR UPDATE` + Drizzle transaction + timeout |
| Preview-photo без audit trail | Email-базиран approval без DB state | Signed JWT + `preview_uploaded_at/approved_at/correction_count` в orders |
| Viber API одобрение забавено | Официална регистрация отнема седмици | Email fallback до admin; Viber не е blocking за MVP launch |
| Stripe webhook replay | Нападател replay-ва `payment_intent.succeeded` | `stripe_webhook_events` idempotency + `constructEvent` signature check |
| Admin brute force | Без rate limiting на login | Supabase Auth built-in rate limiting + Upstash Redis на `/api/admin/*` |
| Secrets в client bundle | Accidental `STRIPE_SECRET_KEY` в Astro | `@t3-oss/env-nextjs` → build fails; `git-secrets` в CI pre-commit hook |

---

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web monorepo: SSG storefront (Astro) + SPA-like admin (Next.js App Router). Нито един публичен starter не покрива точно Astro + Next.js + Supabase + Drizzle + shadcn/ui — custom bootstrap е правилният подход.

### Starter Options Considered

| Опция | Плюс | Минус |
|---|---|---|
| `turbo-trpc-nextjs-astro` (community) | Готова Astro+Next.js структура | tRPC overkill, stale, без активна поддръжка |
| Vercel Turborepo official starter | Поддържан от Turborepo team | Само Next.js apps, без Astro |
| **Custom: `create-turbo` → apps ръчно** | Точно каквото ни трябва | ~30 мин допълнителен setup |

### Selected Approach: Custom Turborepo Bootstrap

**Версии (верифицирани 2026-06-05):**
- `create-turbo`: v2.9.14
- Astro: v6.4.3 (изисква Node.js ≥ v22.12.0)
- Next.js: v16.2.7

### Initialization Commands

```bash
# 1. Monorepo bootstrap
npx create-turbo@latest kandles --package-manager pnpm

# 2. Storefront app (Astro 6)
cd kandles
pnpm create astro@latest apps/storefront -- --template minimal --typescript strict --no-install

# 3. Admin app (Next.js 16)
pnpm create next-app@latest apps/admin \
  --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# 4. Shared packages scaffold
mkdir -p packages/db packages/types packages/env packages/ui packages/email
```

### Architectural Decisions Provided by Bootstrap

**Package Manager:** pnpm (workspace protocol, най-добра Turborepo DX)

**Language & Runtime:** TypeScript strict mode навсякъде; Node.js ≥ v22.12.0

**Styling:** Tailwind CSS в двете apps (версии изолирани per-app)

**Build Tooling:**
- Storefront: Astro 6 + Vite (Environment API — production runtime в dev, критично за Cloudflare Workers)
- Admin: Next.js 16 Turbopack (~400% по-бърз dev server vs Webpack)

**Astro Output Mode:** `hybrid` (SSG по подразбиране + SSR за dynamic islands)

**Code Organization — Shared Packages:**

```
packages/
  db/        — Drizzle schema + migrations + retention cron jobs  (@kandles/db)
  types/     — Zod schemas + shared TypeScript types               (@kandles/types)
  env/       — @t3-oss/env-nextjs validators                       (@kandles/env)
  ui/        — shadcn/ui компоненти за admin                       (@kandles/ui)
  email/     — React Email шаблони                                 (@kandles/email)
```

**Note:** Project initialization е първата implementation story.

---

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (блокират имплементацията):**
- Image pipeline: Cloudflare Images
- API error response standard: `{ success, data | error, code }`
- Testing framework: Vitest + Playwright
- CI/CD: GitHub Actions + Turborepo remote cache

**Important Decisions (оформят архитектурата):**
- Admin state: useState + Context (без external state manager)
- Error tracking: Sentry
- Monitoring: Vercel logs + Cloudflare Analytics (без допълнителен service за MVP)

**Deferred (Post-MVP):**
- API versioning — не е нужно при single consumer
- GraphQL — REST е достатъчен за мащаба

---

### Data Architecture

| Решение | Избор | Обосновка |
|---|---|---|
| Database | Supabase PostgreSQL | Auth + Storage + Realtime + RLS included |
| ORM | Drizzle ORM (schema = source of truth) | TypeScript-first, migrations в git |
| Validation | Zod schemas в `@kandles/types` | Shared между storefront и admin, compile-time safety |
| Migrations | Drizzle Kit (`drizzle-kit push` dev, `drizzle-kit migrate` prod) | Reviewable, rollback-able |
| Caching | Cloudflare edge (SSG product pages) + Supabase connection pooling (PgBouncer) | Нула допълнителна инфраструктура |
| Image pipeline | **Cloudflare Images** — automatic WebP/AVIF, resize on-the-fly | Build-time optimization не скалира при много product photos |
| Retention enforcement | `pg_cron` nightly jobs в Supabase | Анонимизация на PII, purge на abandoned carts |

---

### Authentication & Security

| Решение | Избор | Обосновка |
|---|---|---|
| Auth provider | Supabase Auth | Included в stack, signup disabled |
| Admin access | Single user, email hardcoded в `ADMIN_EMAIL` env | Нула RBAC complexity за 1 потребител |
| API security storefront | Supabase anon key + RLS (reads); Vercel API routes (mutations) | Trust boundary: никога service_role в browser |
| API security admin | Vercel middleware session check на всеки `/dashboard/*` route | Server-side enforcement |
| Input validation | Zod на всяка API граница (Server Actions + API routes) | Never trust client data |
| File uploads | `file-type` magic bytes + UUID filenames + size limit 10MB | MIME spoofing prevention |
| Rate limiting | Upstash Redis sliding window (5 req/min checkout, 100 req/min API) | Serverless-friendly |
| Bot protection | Cloudflare Turnstile (invisible) на checkout; hCaptcha след 3 грешни опита | GDPR-friendly |
| Webhook security | `stripe.webhooks.constructEvent` + `stripe_webhook_events` idempotency table | Replay attack prevention |
| Secrets | `@t3-oss/env-nextjs` → build fails при липсващ secret; `git-secrets` в CI | Zero secret leakage |
| CSP | `_headers` file в Cloudflare Pages; `next.config` headers в Vercel | Prevent XSS, clickjacking |

---

### API & Communication Patterns

**Storefront → Data:**
```
Product reads    → Supabase JS client (anon key + RLS) — direct, no proxy
Checkout/orders  → fetch() към /api/* на Vercel admin — mutations само server-side
```

**Admin → Data:**
```
All mutations    → Next.js Server Actions (CSRF protected by origin check)
All reads        → Drizzle ORM queries (parameterized, no raw interpolation)
```

**Error Response Standard:**
```typescript
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string }

// Codes: VALIDATION_ERROR | NOT_FOUND | UNAUTHORIZED | RATE_LIMITED | INTERNAL
// Never expose stack traces или DB error details към client
```

**Inter-service Communication:**
- Storefront → Admin: HTTP fetch (не shared memory — различни runtime environments)
- Admin → Trigger.dev: Trigger SDK (`@trigger.dev/sdk`)
- Admin → Resend: Resend SDK (synchronous за transactional emails)
- Admin → Stripe: Stripe Node SDK
- Admin → Econt/Speedy: REST API с 2s timeout + fallback

---

### Frontend Architecture

**Storefront (Astro Islands):**

| Компонент | Rendering | Обосновка |
|---|---|---|
| Product pages | SSG | LCP < 1.5s, SEO |
| Product gallery | Island (React) | Swipe/lightbox interactivity |
| Букет Конфигуратор | Island (React) | Multi-step wizard, localStorage state |
| Cart | Island (React) | localStorage, real-time quantity |
| Checkout | Redirect към Stripe Hosted Checkout | Stripe управлява 3DS, ApplePay/GooglePay |
| Order tracking | SSR (Astro endpoint) | Dynamic data, no JS needed |
| Occasion landing pages | SSG | Pure HTML, maximum SEO |

**Admin (Next.js App Router):**

| Аспект | Решение |
|---|---|
| State management | `useState` + React Context (без Zustand/Jotai) — single user, нула нужда от external store |
| Server vs Client Components | Default Server Components; Client само при interactivity (forms, modals, drag-and-drop) |
| Forms | React Hook Form + Zod resolver |
| UI Components | shadcn/ui от `@kandles/ui` package |
| Tables/Lists | TanStack Table (shadcn/ui data table pattern) |
| File uploads | Direct-to-Supabase Storage с signed upload URLs |

---

### Infrastructure & Deployment

**Hosting:**
- Storefront: Cloudflare Pages (edge, global, безплатен tier достатъчен за MVP)
- Admin: Vercel (serverless functions, Supabase Postgres direct connection)

**CI/CD Pipeline (GitHub Actions):**
```yaml
# При PR:
- pnpm install
- turbo typecheck lint test
- turbo build (с Turborepo remote cache → Vercel)

# При merge към main:
- Vercel deploy (admin) — автоматично
- Cloudflare Pages deploy (storefront) — wrangler CLI
```

**Environments:**
- `development`: локален Supabase (`supabase start`), Stripe test keys
- `staging`: Supabase staging project, Stripe test keys, Vercel preview deploy
- `production`: Supabase production, Stripe live keys

**Monitoring & Observability:**
| Tool | Covers | Tier |
|---|---|---|
| Sentry | Error tracking + source maps (admin + storefront) | Free |
| Axiom | Structured log aggregation (admin server logs) | Free (10GB/mo) |
| Pino | Structured JSON logger в Next.js (→ Axiom) | OSS |
| Vercel Analytics | Admin performance | Free |
| Cloudflare Analytics | Storefront traffic | Free |
| Plausible | Business analytics (privacy-first) | Paid (~$9/mo) |
| Trigger.dev Dashboard | Async job observability | Free |

**Structured Logging (Pino → Axiom):**
```typescript
// apps/admin/src/lib/logger.ts
import pino from 'pino'
import { LevelWithSilentOrString } from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  ...(process.env.NODE_ENV === 'production'
    ? {
        transport: {
          target: '@axiomhq/pino',           // npm i @axiomhq/pino
          options: {
            dataset: 'kandles-admin',
            token: process.env.AXIOM_TOKEN,
          },
        },
      }
    : { transport: { target: 'pino-pretty' } }),
})

// Usage pattern — ЗАДЪЛЖИТЕЛЕН [functionName] prefix:
// logger.info({ orderId, status }, '[updateOrderStatus] status updated')
// logger.error({ err, orderId }, '[stripeWebhook] payment processing failed')
```

**Sentry Configuration:**
```typescript
// apps/admin/sentry.server.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  integrations: [Sentry.prismaIntegration()],
})

// apps/storefront/src/lib/sentry.ts (Astro)
import * as Sentry from '@sentry/astro'
Sentry.init({
  dsn: import.meta.env.PUBLIC_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
})
```

**Self-Healing Feedback Loop:**
```
Production error → Sentry captures → @kandles/error-fixer skill →
  fetch issue + stack trace → locate file:line → read code →
  apply minimal fix → run tests → commit → mark Sentry resolved
```
Skill: `.claude/skills/kandles-error-fixer/SKILL.md`
Invoke: `/kandles-error-fixer` в нова context window

**Testing Strategy:**
```
Unit/Integration: Vitest (Turborepo-friendly, ESM-native)
  - packages/db: schema + query tests
  - packages/types: Zod schema validation tests
  - Server Actions: mocked Supabase client

E2E: Playwright
  - Checkout happy path (Stripe test mode)
  - Admin order status update flow
  - Product page gallery + configurator

Coverage target: критични paths само (checkout, inventory, webhooks)
```

### Decision Impact Analysis

**Implementation Sequence:**
1. Turborepo monorepo setup + shared packages scaffold
2. Supabase project + Drizzle schema (products, orders, cart_reservations, stripe_webhook_events)
3. Supabase RLS policies + Auth configuration
4. Astro storefront: product pages (SSG) + Islands setup
5. Next.js admin: layout + auth middleware + order management
6. Stripe Hosted Checkout integration + webhook handler
7. Econt/Speedy API integration (async с fallback)
8. Resend email templates + Trigger.dev workflows
9. Cloudflare Images setup + image upload pipeline
10. CI/CD GitHub Actions + Sentry integration

**Cross-Component Dependencies:**
- `@kandles/db` блокира всичко останало — трябва да е готов преди apps
- `@kandles/env` блокира deployment — secrets validation при build
- Stripe webhook handler блокира order fulfillment flow
- Supabase RLS блокира storefront product reads

---

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Database (Drizzle/PostgreSQL):**
- Таблици: `snake_case` plural — `products`, `orders`, `cart_reservations`
- Колони: `snake_case` — `created_at`, `customer_email`, `stripe_payment_intent_id`
- Foreign keys: `{table_singular}_id` — `product_id`, `order_id`
- Indexes: `idx_{table}_{column(s)}` — `idx_orders_customer_email`
- Enums: `snake_case` — `order_status`, `payment_method`

**API Routes (Next.js):**
- REST: plural nouns — `/api/orders`, `/api/products`
- Nested: `/api/orders/[id]/status`
- Server Actions: `app/actions/{domain}.ts` — `app/actions/orders.ts`
- Webhooks: `/api/webhooks/{provider}` — `/api/webhooks/stripe`

**Code (TypeScript):**
- Компоненти: `PascalCase` файлове — `ProductCard.tsx`, `OrderTable.tsx`
- Не-компоненти: `kebab-case` — `rate-limit.ts`, `upload-image.ts`
- Функции/variables: `camelCase` — `getOrderById`, `cartItems`
- Zod schemas: `PascalCase` + `Schema` suffix — `CheckoutSchema`, `ProductSchema`
- Drizzle table exports: `camelCase` plural — `products`, `orders`
- Drizzle inferred types: `PascalCase` — `type Product = typeof products.$inferSelect`

### Structure Patterns

**Монорепо layout:**
```
apps/
  storefront/                   # Astro 6
    src/
      components/
        islands/                # Само React Islands (интерактивни компоненти)
        ui/                     # Статични Astro компоненти
      layouts/
      pages/
      lib/                      # Client utilities
  admin/                        # Next.js 16
    src/
      app/
        (dashboard)/            # Auth-protected route group
          orders/
          products/
          settings/
        api/
          webhooks/
          admin/
      actions/                  # Server Actions по домейн
      components/               # Client Components
      lib/                      # Server utilities
packages/
  db/src/
    schema/                     # Един файл per домейн
      products.ts
      orders.ts
      users.ts
    migrations/
    index.ts
  types/src/
    schemas/                    # Zod schemas, един файл per домейн
    index.ts
  env/src/index.ts
  ui/src/components/
  email/src/templates/
```

**Тестове:** Co-located — `product.schema.test.ts` до `product.schema.ts`. E2E в `apps/{app}/e2e/`.

### Format Patterns

**API Response (всички Server Actions и API routes):**
```typescript
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: ErrorCode }

type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'RATE_LIMITED'
  | 'INVENTORY_INSUFFICIENT'
  | 'PAYMENT_FAILED'
  | 'INTERNAL'
```

**Дати:** ISO 8601 strings в API (`"2026-06-05T13:00:00Z"`); `Date` обекти в DB layer; никога Unix timestamps.

**JSON fields:** `camelCase` в API responses (TypeScript конвенция). Drizzle маппва от `snake_case` автоматично.

**Null vs undefined:** `null` в DB и JSON; `undefined` само за optional TypeScript props.

### Process Patterns

**Error Handling в Server Actions:**
```typescript
export async function updateOrderStatus(id: string, status: OrderStatus) {
  try {
    // ...
    return { success: true, data: order }
  } catch (error) {
    console.error('[updateOrderStatus]', error) // log server-side само
    return { success: false, error: 'Неуспешна операция', code: 'INTERNAL' }
  }
}
// Никога: throw към client | return { error: error.message } (stack trace leak)
```

**Inventory Mutations — задължителна транзакция:**
```typescript
await db.transaction(async (tx) => {
  await tx.select().from(products).where(...).for('update') // SELECT FOR UPDATE първо
  await tx.update(products).set({ stock: newStock }).where(...)
  await tx.insert(orders).values(orderData)
})
```

**Validation timing:** Zod `safeParse` при влизане в Server Action/API route — преди всякаква DB операция.

**Loading States (Admin):** `isPending` за `useTransition`; `isLoading` за async fetch. Skeleton loaders за таблици, spinner за бутони, disabled при `isPending`.

### Enforcement Guidelines

**Всички AI агенти ТРЯБВА:**
- Да четат `packages/db/src/schema/` преди да пишат DB заявка
- Да използват `@kandles/types` Zod schemas — не да дефинират нови за вече покрити домейни
- Да връщат `ApiResponse<T>` от всички Server Actions и API routes
- Да слагат `SELECT FOR UPDATE` при всяка inventory mutation
- Да логват с `[functionName]` prefix на сървъра; никога `console.log` в client компоненти
- Да четат env vars само чрез `@kandles/env` — не `process.env` директно

**Anti-Patterns (забранено):**
```typescript
// ❌ Raw SQL interpolation
db.execute(`SELECT * FROM orders WHERE id = '${id}'`)

// ❌ process.env в компонент (potential secret leak)
const key = process.env.STRIPE_SECRET_KEY

// ❌ throw в Server Action
export async function action() { throw new Error('...') }

// ❌ any тип
const order: any = await getOrder(id)

// ❌ TOCTOU inventory check (race condition)
const p = await db.query.products.findFirst(...)
if (p.stock > 0) { await db.update(...) } // НЕ — използвай SELECT FOR UPDATE
```

---

## Project Structure & Boundaries

### FR → Structure Mapping

| FR домейн | Location |
|---|---|
| Продуктов каталог (FR-1–4) | `apps/storefront/src/pages/produkti/`, `components/ui/` |
| Букет Конфигуратор (FR-5–6) | `apps/storefront/src/components/islands/BouquetConfigurator/` |
| Gift Experience (FR-7–9) | `apps/storefront/src/components/islands/Cart/` |
| Checkout & Payment (FR-10–13) | `apps/admin/src/app/api/checkout/`, `api/webhooks/stripe/` |
| Emails (FR-14–16) | `packages/email/src/templates/`, `apps/admin/src/trigger/` |
| Admin Panel (FR-17–19) | `apps/admin/src/app/(dashboard)/` |
| Social Proof (FR-20–22) | `apps/storefront/src/pages/nashata-istoriya.astro`, `apps/admin/(dashboard)/reviews/` |
| SEO Landing pages (FR-23–24) | `apps/storefront/src/pages/za-[occasion].astro` |
| Newsletter (FR-26) | `apps/storefront/src/components/islands/NewsletterForm.tsx` |
| Loyalty / QR / EN (FR-28–30) | v2 — не имплементирани в MVP |

### Complete Project Directory Structure

```
kandles/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # typecheck + lint + test + build
│       └── deploy.yml                # Vercel + Cloudflare Pages
├── .gitignore
├── .env.example                      # Template за всички env vars
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
│
├── apps/
│   │
│   ├── storefront/                   # Astro 6 → Cloudflare Pages
│   │   ├── astro.config.mjs          # output: 'hybrid', adapter: cloudflare
│   │   ├── tailwind.config.mjs
│   │   ├── tsconfig.json
│   │   ├── public/
│   │   │   ├── _headers              # CSP, X-Frame-Options, HSTS
│   │   │   ├── _redirects
│   │   │   └── favicon.svg
│   │   └── src/
│   │       ├── layouts/
│   │       │   └── BaseLayout.astro
│   │       ├── components/
│   │       │   ├── ui/               # Статични Astro компоненти
│   │       │   │   ├── ProductCard.astro
│   │       │   │   ├── ProductGallery.astro
│   │       │   │   ├── ScentNotes.astro
│   │       │   │   ├── ReviewCard.astro
│   │       │   │   └── SeasonalBanner.astro
│   │       │   └── islands/          # React Islands (client:load/idle/visible)
│   │       │       ├── BouquetConfigurator/
│   │       │       │   ├── index.tsx
│   │       │       │   ├── StepFlowers.tsx
│   │       │       │   ├── StepColors.tsx
│   │       │       │   ├── StepQuantity.tsx
│   │       │       │   ├── StepCarrier.tsx
│   │       │       │   ├── StepExtras.tsx
│   │       │       │   └── PricePreview.tsx
│   │       │       ├── Cart/
│   │       │       │   ├── CartDrawer.tsx
│   │       │       │   ├── CartItem.tsx
│   │       │       │   ├── GiftWrapToggle.tsx
│   │       │       │   └── use-cart.ts       # localStorage hook
│   │       │       ├── ProductVideo.tsx       # lazy load (FR-1)
│   │       │       └── NewsletterForm.tsx     # FR-26
│   │       ├── pages/
│   │       │   ├── index.astro
│   │       │   ├── kolektsii/
│   │       │   │   ├── index.astro
│   │       │   │   └── [slug].astro          # SSG
│   │       │   ├── produkti/
│   │       │   │   └── [slug].astro          # SSG, FR-1
│   │       │   ├── za-rozhden-den.astro      # FR-23
│   │       │   ├── za-koleda.astro
│   │       │   ├── za-8-mart.astro
│   │       │   ├── za-svatba.astro
│   │       │   ├── korporativni-podaratsi.astro
│   │       │   ├── nashata-istoriya.astro    # FR-20
│   │       │   ├── prosledyavane.astro       # FR-13, SSR
│   │       │   └── en/                       # Reserved FR-30 (v2)
│   │       └── lib/
│   │           ├── supabase.ts               # anon client
│   │           ├── seasonal.ts               # FR-2 дата логика
│   │           └── schema-org.ts             # FR-24 structured data
│   │
│   └── admin/                        # Next.js 16 → Vercel
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       ├── middleware.ts             # Auth + ADMIN_EMAIL guard
│       ├── tsconfig.json
│       └── src/
│           ├── app/
│           │   ├── layout.tsx
│           │   ├── login/page.tsx
│           │   ├── (dashboard)/
│           │   │   ├── layout.tsx
│           │   │   ├── page.tsx              # Overview dashboard
│           │   │   ├── orders/
│           │   │   │   ├── page.tsx          # FR-17
│           │   │   │   └── [id]/
│           │   │   │       ├── page.tsx
│           │   │   │       └── preview/page.tsx  # FR-6 upload
│           │   │   ├── products/
│           │   │   │   ├── page.tsx          # FR-18
│           │   │   │   ├── new/page.tsx
│           │   │   │   └── [id]/page.tsx
│           │   │   ├── reviews/page.tsx      # FR-21
│           │   │   └── settings/page.tsx
│           │   └── api/
│           │       ├── checkout/
│           │       │   ├── create-intent/route.ts
│           │       │   └── confirm/route.ts
│           │       ├── orders/
│           │       │   └── track/route.ts    # FR-13 публичен
│           │       ├── courier/
│           │       │   └── calculate/route.ts  # FR-12 async+fallback
│           │       └── webhooks/
│           │           ├── stripe/route.ts
│           │           └── trigger/route.ts
│           ├── actions/
│           │   ├── orders.ts         # updateStatus, uploadPreview, addNote
│           │   ├── products.ts       # create, update, archive, bulkUpdateStock
│           │   ├── reviews.ts        # approve, reject
│           │   ├── newsletter.ts     # subscribe double opt-in
│           │   └── upload.ts         # uploadProductImage, uploadPreviewPhoto
│           ├── components/
│           │   ├── orders/
│           │   │   ├── OrderTable.tsx
│           │   │   ├── OrderStatusBadge.tsx
│           │   │   └── PreviewUploadForm.tsx
│           │   ├── products/
│           │   │   ├── ProductForm.tsx
│           │   │   ├── ImageGalleryUpload.tsx
│           │   │   └── InventoryBadge.tsx
│           │   └── shared/
│           │       ├── DataTable.tsx
│           │       └── FileUpload.tsx
│           └── lib/
│               ├── supabase-admin.ts  # service_role (server-only)
│               ├── stripe.ts
│               ├── econt.ts           # async, 2s timeout, fallback
│               ├── speedy.ts
│               ├── viber.ts           # FR-19 + email fallback
│               └── rate-limit.ts      # Upstash Redis
│
└── packages/
    ├── db/                           # @kandles/db
    │   ├── drizzle.config.ts
    │   └── src/
    │       ├── schema/
    │       │   ├── products.ts       # products, product_images, collections
    │       │   ├── orders.ts         # orders, order_items, cart_reservations
    │       │   ├── users.ts          # users (supabase_auth_id FK), marketing_consents
    │       │   ├── reviews.ts        # reviews, community_gallery
    │       │   ├── stripe.ts         # stripe_webhook_events
    │       │   └── enums.ts
    │       ├── migrations/
    │       └── index.ts
    │
    ├── types/                        # @kandles/types
    │   └── src/
    │       ├── schemas/
    │       │   ├── checkout.schema.ts
    │       │   ├── product.schema.ts
    │       │   ├── order.schema.ts
    │       │   ├── review.schema.ts
    │       │   └── courier.schema.ts
    │       └── index.ts
    │
    ├── env/src/index.ts              # @kandles/env
    ├── ui/src/components/            # @kandles/ui (shadcn/ui за admin)
    └── email/src/templates/          # @kandles/email
        ├── OrderConfirmed.tsx
        ├── OrderInProduction.tsx
        ├── OrderShipped.tsx
        ├── OrderDelivered.tsx        # + review invite
        ├── PreviewApproval.tsx       # FR-6 signed JWT
        ├── AbandonedCart.tsx         # FR-15 (v2)
        ├── NewsletterWelcome.tsx     # FR-26
        └── AdminNewOrder.tsx         # FR-19 fallback
```

### Architectural Boundaries

**Trust boundaries:**
```
Public (no auth):
  storefront/* → Supabase anon key (RLS enforced)
  /api/orders/track → order_token validation only (не sequential ID)

Protected (Stripe signature):
  /api/webhooks/stripe → constructEvent verification

Protected (admin session):
  /dashboard/* → middleware ADMIN_EMAIL check
  /api/admin/* → middleware + service_role key

Never public:
  SUPABASE_SERVICE_ROLE_KEY | STRIPE_SECRET_KEY | STRIPE_WEBHOOK_SECRET
```

**Checkout data flow:**
```
localStorage cart
  → POST /api/checkout/create-intent
    → cart_reservations (SELECT FOR UPDATE, 30 min TTL)
    → stripe.paymentIntents.create()
    → client_secret →
  Stripe Hosted Checkout (stripe.com domain)
    → payment_intent.succeeded webhook
      → orders INSERT
      → cart_reservations DELETE
      → Resend: OrderConfirmed (sync)
      → Viber/email: AdminNewOrder (sync)
      → Trigger.dev: post-order async flows
```

**External integrations:**
```
Stripe        → /api/webhooks/stripe (in) + checkout redirect (out)
Econt/Speedy  → /api/courier/calculate (out, async, 2s timeout+fallback)
Resend        → transactional от webhook handler (out, sync)
Trigger.dev   → /api/webhooks/trigger (in) + SDK (out, async marketing)
Viber         → lib/viber.ts (out, email fallback при failure)
Cloudflare    → Images API (out, upload pipeline)
Supabase      → db + auth + storage (всичко server-side)
Sentry        → SDK в двете apps
Plausible     → script tag в storefront layout
```

---

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:** Всички технологии съвместими. Astro 6 + Next.js 16 + Supabase + Drizzle + Turborepo + pnpm без конфликти. Cloudflare Pages + Vercel split hosting — стандартна конфигурация. Stripe Hosted Checkout + Supabase Auth без overlap.

**⚠️ Addressed gap:** Astro env vars изискват `PUBLIC_` prefix (не `NEXT_PUBLIC_`). `@kandles/env` пакетът има два отделни export-а:
```
packages/env/src/nextjs.ts  → за Next.js (NEXT_PUBLIC_ prefix)
packages/env/src/astro.ts   → за Astro (PUBLIC_ prefix)
packages/env/src/index.ts   → server-side secrets (без prefix)
```

**Pattern Consistency:** ✅ snake_case DB, camelCase API responses, Zod навсякъде, `ApiResponse<T>`, `SELECT FOR UPDATE` за inventory — всичко консистентно.

**Structure Alignment:** ✅ Islands в storefront, Server Actions в admin, shared packages изолират cross-app код.

### Requirements Coverage Validation ✅

| FR | Статус | Location |
|---|---|---|
| FR-1 Product page | ✅ | `produkti/[slug].astro` + islands |
| FR-2 Seasonal | ✅ | `lib/seasonal.ts` + admin override |
| FR-3 Occasion filter | ✅ | `kolektsii/[slug].astro` |
| FR-4 Last minute | ✅ | `last_minute_eligible` в product schema |
| FR-5 Configurator | ✅ | `BouquetConfigurator/` island |
| FR-6 Preview photo | ✅ | `orders/[id]/preview` + state machine + signed JWT |
| FR-7 Gift wrap | ✅ | `GiftWrapToggle.tsx` + cart |
| FR-8 Gift Sets | ✅ | composite inventory в transaction |
| FR-9 Surprise send | ⏳ v2 | — |
| FR-10 Guest checkout | ✅ | no auth required storefront |
| FR-11 Payments | ✅ | Stripe Hosted + ApplePay/GooglePay + COD |
| FR-12 Courier | ✅ | `/api/courier/calculate` async+fallback |
| FR-13 Order tracking | ✅ | `prosledyavane.astro` + `/api/orders/track` |
| FR-14 Transactional emails | ✅ | 4 templates в `@kandles/email` |
| FR-15 Abandoned cart | ⏳ v2 | template готов |
| FR-16 Birthday reminder | ⏳ v2 | — |
| FR-17 Order management | ✅ | `(dashboard)/orders/` |
| FR-18 Product management | ✅ | `(dashboard)/products/` |
| FR-19 Viber | ✅ | `lib/viber.ts` + email fallback |
| FR-20 Seller story | ✅ | `nashata-istoriya.astro` |
| FR-21 Reviews | ✅ | `(dashboard)/reviews/` + email invite |
| FR-22 Community gallery | ⏳ v2 | структура резервирана |
| FR-23 Occasion landing pages | ✅ | 5 статични pages |
| FR-24 Schema.org | ✅ | `lib/schema-org.ts` |
| FR-25 Instagram Shop | ⏳ v2 | — |
| FR-26 Newsletter | ✅ | island + action + email |
| FR-27–31 | ⏳ v2/сезонно | резервирани в структурата |

**NFR Coverage:**
- LCP < 1.5s: ✅ Astro SSG + Cloudflare edge + нула JS overhead за статични pages
- GDPR: ✅ retention policy, double opt-in, Cloudflare Turnstile, Plausible privacy-first
- SEO: ✅ occasion pages, schema-org.ts, readable URLs от ден 1
- Security: ✅ 8 security слоя дефинирани и документирани

### Gap Analysis Results

**Critical Gaps: Няма**

**Important Gaps (addressed):**

1. **`@kandles/env` dual export** — решено: `nextjs.ts` + `astro.ts` + `index.ts`
2. **Trigger.dev директория** — добавена:
   ```
   apps/admin/src/trigger/
     ├── abandoned-cart.ts
     └── birthday-reminder.ts
   ```
3. **pg_cron SQL файлове** — добавени:
   ```
   packages/db/src/cron/
     ├── anonymize-orders.sql
     └── purge-abandoned-carts.sql
   ```
4. **Supabase CLI root** — добавена: `supabase/` за local dev (`supabase start`)
5. **Test config files** — `vitest.config.ts` per package, `playwright.config.ts` per app

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed (Medium, single-tenant)
- [x] Technical constraints identified (Viber API, Econt/Speedy SLA, 3DS, BG GDPR)
- [x] Cross-cutting concerns mapped (10 concerns)

**Architectural Decisions**
- [x] Critical decisions documented with versions (6 ADR-та, версии верифицирани 2026-06-05)
- [x] Technology stack fully specified
- [x] Integration patterns defined (checkout flow, webhook flow, email flow)
- [x] Performance considerations addressed (LCP, Islands, edge caching)

**Implementation Patterns**
- [x] Naming conventions established (DB snake_case, API camelCase, code conventions)
- [x] Structure patterns defined (monorepo layout, Islands, Server Actions)
- [x] Communication patterns specified (ApiResponse<T>, trust boundaries)
- [x] Process patterns documented (error handling, inventory transactions, validation timing)

**Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped (всички external services)
- [x] Requirements to structure mapping complete (31 FR-та)

### Architecture Readiness Assessment

**Overall Status: READY FOR IMPLEMENTATION**

**Confidence Level: High**

**Key Strengths:**
- Изчерпателна security архитектура (8 слоя, pre-mortem validated, 5 failure scenarios addressed)
- Конкретни ADR-та с explicit trade-offs (6 решения документирани)
- Пълна FR → file mapping (нито едно MVP изискване без home)
- GDPR retention policy решена преди schema design
- Anti-patterns и enforcement rules за AI агенти
- Стандартен ApiResponse<T> предотвратява inconsistent error handling

**Areas for Future Enhancement (v2):**
- Abandoned cart flow (Trigger.dev вече готов, само нужда от активиране)
- English език (URL структурата е резервирана)
- Instagram Shop feed generation
- Loyalty точки система
- QR код per поръчка

### Implementation Handoff

**AI Agent Guidelines:**
- Чети `packages/db/src/schema/` преди всяка DB заявка
- Използвай `@kandles/types` Zod schemas — не дефинирай нови за покрити домейни
- Връщай `ApiResponse<T>` от всички Server Actions и API routes
- `SELECT FOR UPDATE` при всяка inventory mutation — без изключения
- Логвай с `[functionName]` prefix; никога `console.log` в client компоненти
- Четат env vars само чрез `@kandles/env`

**First Implementation Priority:**
```bash
npx create-turbo@latest kandles --package-manager pnpm
```

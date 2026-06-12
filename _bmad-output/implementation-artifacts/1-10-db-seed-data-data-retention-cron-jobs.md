---
status: done
baseline_commit: cb31e4a0c5cc054089595cda8f6977b3e387d079
---

# Story 1.10: DB seed data + data retention cron jobs

Status: done

## Story

As a developer,
I want seed data for local development and automated cron jobs for PII cleanup,
So that local dev starts with realistic data and production DB doesn't accumulate stale personal information.

## Acceptance Criteria

1. **Given** `packages/db/src/seed.ts` exists
   **When** `pnpm --filter @kandles/db seed` runs
   **Then** it inserts: 3 collections (Флорална пролет, Коледна магия, Подаръчни комплекти), 6 products (at least 2 occasion tags each, `stock > 0`, `production_days` set, Bulgarian titles), 1 admin user seeded with `ADMIN_EMAIL` from env, 2 approved reviews with text and rating

2. **Given** seed runs multiple times on same DB
   **Then** it is idempotent (uses upsert / ON CONFLICT DO NOTHING — no duplicate key errors)

3. **Given** all seed products
   **Then** each has at least one `product_images` row with non-null `alt_text`

4. **Given** `packages/db/src/cron/anonymize-orders.sql` exists
   **Then** it executes: `UPDATE orders SET guest_email = NULL, shipping_address = '{}' WHERE created_at < NOW() - INTERVAL '3 years'`

5. **Given** `packages/db/src/cron/purge-abandoned-carts.sql` exists
   **Then** it executes: `DELETE FROM cart_reservations WHERE created_at < NOW() - INTERVAL '30 days' AND order_id IS NULL`

6. **Given** `packages/db/src/cron/cleanup-cart-reservations.sql` exists
   **Then** it executes: `DELETE FROM cart_reservations WHERE expires_at < NOW()`

7. **Given** Vercel cron alternative (for teams without Supabase Pro pg_cron)
   **Then** `apps/admin/src/app/api/cron/cleanup/route.ts` exists, runs all three SQL jobs, is protected by `Authorization: Bearer ${CRON_SECRET}` header check, and is configured in `vercel.json` to run on schedule

## Tasks / Subtasks

- [x] Task 1: Add `seed` script to `packages/db/package.json` (AC: 1)
  - [x] Add `"seed": "tsx src/seed.ts"` to `scripts` block

- [x] Task 2: Create `packages/db/src/seed.ts` (AC: 1, 2, 3)
  - [x] Collections (3): Флорална пролет, Коледна магия, Подаръчни комплекти — fixed UUIDs, `onConflictDoNothing()`
  - [x] Products (6): Bulgarian titles, `stock > 0`, `productionDays` set, `≥2 occasionTags` — fixed UUIDs, `onConflictDoNothing()`
  - [x] Product-collection mappings (products 1-2 → collection 1, products 3-4 → collection 2, products 5-6 → collection 3) — `onConflictDoNothing()`
  - [x] Product images (1 hero per product, non-null `altText`) — fixed UUIDs, `onConflictDoNothing()`
  - [x] Admin user (ADMIN_EMAIL from env, fixed dummy supabaseAuthId) — `onConflictDoNothing()`
  - [x] Reviews (2 approved, text + rating, referencing product IDs) — fixed UUIDs, `onConflictDoNothing()`

- [x] Task 3: Create `packages/db/src/cron/` SQL files (AC: 4, 5, 6)
  - [x] Create `packages/db/src/cron/anonymize-orders.sql`
  - [x] Create `packages/db/src/cron/purge-abandoned-carts.sql`
  - [x] Create `packages/db/src/cron/cleanup-cart-reservations.sql`

- [x] Task 4: Create cron API route (AC: 7)
  - [x] Create `apps/admin/src/app/api/cron/cleanup/route.ts` — auth guard, 3 SQL statements inline, pino logger with `[cron/cleanup]` prefix

- [x] Task 5: Update `apps/admin/vercel.json` (AC: 7)
  - [x] Add `"crons"` array with path `/api/cron/cleanup` and schedule `0 2 * * *`

- [x] Task 6: Typechecks pass
  - [x] `pnpm --filter @kandles/db typecheck` passes
  - [x] `pnpm --filter @kandles/admin typecheck` passes

## Dev Notes

### Architecture Context

- Seed is dev tooling only — run manually, not in CI. Production admin user created via Supabase Auth.
- Three SQL files serve dual purpose: (a) pg_cron setup on Supabase Pro (copy-paste to Supabase SQL editor), (b) referenced conceptually by Vercel cron route.
- Architecture: `packages/db/src/cron/` directory listed in architecture dir structure (anonymize-orders.sql, purge-abandoned-carts.sql + cleanup-cart-reservations.sql from epics AC).
- Vercel cron route inlines SQL as TypeScript string literals (NOT fs.readFileSync) — bundler-safe for Vercel deployment.
- pg_cron on Supabase Pro is the preferred production mechanism. Vercel cron is the free-tier fallback.

### Seed File — `packages/db/src/seed.ts`

**Critical: Load dotenv before anything else** — seed runs standalone via `tsx`, not inside Next.js. Use `import 'dotenv/config'` at top.

**Idempotency via fixed UUIDs + onConflictDoNothing()**
- All seed rows use hardcoded UUIDs as PKs. Re-running insert with same PK triggers PK conflict → skipped silently.
- Collections also have unique `slug` constraint — but PK-based `onConflictDoNothing()` is sufficient.
- `productCollections` table has composite PK `(product_id, collection_id)` — `onConflictDoNothing()` handles re-runs.

**Admin user caveat**: `supabaseAuthId` must be non-null (column: `supabase_auth_id UUID NOT NULL UNIQUE`). Seed uses a fixed dummy UUID. In prod, the real admin user is created via Supabase Auth → `auth.users`, and `users` rows are typically populated via trigger or first login. Seeding a dummy `supabaseAuthId` is safe for local dev only.

**Seed data (exact)**:

```typescript
import 'dotenv/config'
import { db, collections, products, productCollections, productImages, users, reviews } from './index'

const COLLECTION_IDS = {
  spring: 'c0000001-0000-0000-0000-000000000001',
  xmas:   'c0000001-0000-0000-0000-000000000002',
  gifts:  'c0000001-0000-0000-0000-000000000003',
}

const PRODUCT_IDS = [
  'p0000001-0000-0000-0000-000000000001',
  'p0000001-0000-0000-0000-000000000002',
  'p0000001-0000-0000-0000-000000000003',
  'p0000001-0000-0000-0000-000000000004',
  'p0000001-0000-0000-0000-000000000005',
  'p0000001-0000-0000-0000-000000000006',
]

const ADMIN_SEED_USER_ID   = 'a0000001-0000-0000-0000-000000000001'
const ADMIN_SEED_AUTH_UUID = 'a0000001-0000-0000-0000-000000000002'

async function seed() {
  // 1. Collections
  await db.insert(collections).values([
    { id: COLLECTION_IDS.spring, name: 'Флорална пролет',     slug: 'floralna-prolet',      seasonStartMonth: 3,  seasonEndMonth: 5  },
    { id: COLLECTION_IDS.xmas,   name: 'Коледна магия',       slug: 'koledna-magiya',        seasonStartMonth: 11, seasonEndMonth: 12 },
    { id: COLLECTION_IDS.gifts,  name: 'Подаръчни комплекти', slug: 'podarachni-komplekti'                                           },
  ]).onConflictDoNothing()

  // 2. Products
  await db.insert(products).values([
    { id: PRODUCT_IDS[0], title: 'Розова пролет',          price: '45.00', stock: 10, productionDays: 2, occasionTags: ['birthday', 'mothers_day']   },
    { id: PRODUCT_IDS[1], title: 'Слънчоглед и лавандула', price: '55.00', stock: 8,  productionDays: 3, occasionTags: ['birthday', 'anniversary']    },
    { id: PRODUCT_IDS[2], title: 'Коледна звезда',         price: '65.00', stock: 15, productionDays: 2, occasionTags: ['christmas', 'new_year']      },
    { id: PRODUCT_IDS[3], title: 'Зимна приказка',         price: '80.00', stock: 5,  productionDays: 4, occasionTags: ['christmas', 'anniversary']   },
    { id: PRODUCT_IDS[4], title: 'Релакс комплект',        price: '95.00', stock: 7,  productionDays: 3, occasionTags: ['birthday', 'valentines']     },
    { id: PRODUCT_IDS[5], title: 'Нежен момент',           price: '70.00', stock: 6,  productionDays: 3, occasionTags: ['anniversary', 'valentines']  },
  ]).onConflictDoNothing()

  // 3. Product-collection mappings
  await db.insert(productCollections).values([
    { productId: PRODUCT_IDS[0], collectionId: COLLECTION_IDS.spring, sortOrder: 0 },
    { productId: PRODUCT_IDS[1], collectionId: COLLECTION_IDS.spring, sortOrder: 1 },
    { productId: PRODUCT_IDS[2], collectionId: COLLECTION_IDS.xmas,   sortOrder: 0 },
    { productId: PRODUCT_IDS[3], collectionId: COLLECTION_IDS.xmas,   sortOrder: 1 },
    { productId: PRODUCT_IDS[4], collectionId: COLLECTION_IDS.gifts,  sortOrder: 0 },
    { productId: PRODUCT_IDS[5], collectionId: COLLECTION_IDS.gifts,  sortOrder: 1 },
  ]).onConflictDoNothing()

  // 4. Product images (1 hero per product)
  await db.insert(productImages).values([
    { id: 'i0000001-0000-0000-0000-000000000001', productId: PRODUCT_IDS[0], url: 'https://images.kandles.bg/seed/rozova-prolet.jpg',          altText: 'Розова пролет — букет рози и лалета',           sortOrder: 0, isHero: true },
    { id: 'i0000001-0000-0000-0000-000000000002', productId: PRODUCT_IDS[1], url: 'https://images.kandles.bg/seed/slanchogledi-lavandula.jpg', altText: 'Слънчоглед и лавандула — летен букет',           sortOrder: 0, isHero: true },
    { id: 'i0000001-0000-0000-0000-000000000003', productId: PRODUCT_IDS[2], url: 'https://images.kandles.bg/seed/koledna-zvezda.jpg',         altText: 'Коледна звезда — пойнсетия аранжировка',        sortOrder: 0, isHero: true },
    { id: 'i0000001-0000-0000-0000-000000000004', productId: PRODUCT_IDS[3], url: 'https://images.kandles.bg/seed/zimna-prikazka.jpg',         altText: 'Зимна приказка — бяла коледна аранжировка',     sortOrder: 0, isHero: true },
    { id: 'i0000001-0000-0000-0000-000000000005', productId: PRODUCT_IDS[4], url: 'https://images.kandles.bg/seed/relaks-komplet.jpg',         altText: 'Релакс комплект — свещи и ароматни продукти',   sortOrder: 0, isHero: true },
    { id: 'i0000001-0000-0000-0000-000000000006', productId: PRODUCT_IDS[5], url: 'https://images.kandles.bg/seed/nezhen-moment.jpg',          altText: 'Нежен момент — орхидеи и зелени акценти',      sortOrder: 0, isHero: true },
  ]).onConflictDoNothing()

  // 5. Admin user
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) throw new Error('ADMIN_EMAIL env var is required for seed')
  await db.insert(users).values([
    { id: ADMIN_SEED_USER_ID, supabaseAuthId: ADMIN_SEED_AUTH_UUID, email: adminEmail },
  ]).onConflictDoNothing()

  // 6. Reviews (2 approved, reference products 1 and 2)
  await db.insert(reviews).values([
    {
      id: 'r0000001-0000-0000-0000-000000000001',
      productId:  PRODUCT_IDS[0],
      rating:     5,
      text:       'Невероятно красив букет! Получих го за рождения ден и всички бяха възхитени. Свежи цветя и прекрасна аранжировка.',
      isApproved: true,
    },
    {
      id: 'r0000001-0000-0000-0000-000000000002',
      productId:  PRODUCT_IDS[1],
      rating:     4,
      text:       'Много красив и ароматен букет. Цветята издържаха повече от седмица. Определено ще поръчам отново!',
      isApproved: true,
    },
  ]).onConflictDoNothing()

  console.log('Seed complete.')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
```

**`dotenv/config` import**: `dotenv` is already in devDependencies as `"dotenv": "catalog:"` in packages/db — confirmed.

### SQL Cron Files

**`packages/db/src/cron/anonymize-orders.sql`** (exact SQL per AC4):
```sql
UPDATE orders SET guest_email = NULL, shipping_address = '{}' WHERE created_at < NOW() - INTERVAL '3 years';
```

**`packages/db/src/cron/purge-abandoned-carts.sql`** (exact SQL per AC5):
```sql
DELETE FROM cart_reservations WHERE created_at < NOW() - INTERVAL '30 days' AND order_id IS NULL;
```

**`packages/db/src/cron/cleanup-cart-reservations.sql`** (exact SQL per AC6):
```sql
DELETE FROM cart_reservations WHERE expires_at < NOW();
```

### Cron API Route — `apps/admin/src/app/api/cron/cleanup/route.ts`

- Import `env` from `@kandles/env/nextjs` for `CRON_SECRET`
- Import `db` from `@kandles/db`
- Import `sql` from `drizzle-orm`
- Import `logger` from `@/lib/logger`
- Auth check: compare `request.headers.get('authorization')` to `'Bearer ' + env.CRON_SECRET`
- Return 401 if mismatch
- Execute 3 SQL statements in sequence using `db.execute(sql\`...\`)`
- Log start + completion with `[cron/cleanup]` prefix
- Return JSON `{ ok: true }` with 200

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@kandles/db'
import { env } from '@kandles/env/nextjs'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  logger.info('[cron/cleanup] starting data retention jobs')

  await db.execute(sql`
    UPDATE orders
    SET guest_email = NULL, shipping_address = '{}'
    WHERE created_at < NOW() - INTERVAL '3 years'
  `)

  await db.execute(sql`
    DELETE FROM cart_reservations
    WHERE created_at < NOW() - INTERVAL '30 days' AND order_id IS NULL
  `)

  await db.execute(sql`
    DELETE FROM cart_reservations
    WHERE expires_at < NOW()
  `)

  logger.info('[cron/cleanup] data retention jobs complete')
  return NextResponse.json({ ok: true })
}
```

**Note**: Vercel cron invokes via POST (not GET). Route must be POST handler.

### vercel.json Update

Current `apps/admin/vercel.json`:
```json
{
  "framework": "nextjs",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "buildCommand": "cd ../.. && pnpm turbo build --filter=@kandles/admin"
}
```

Add `"crons"` array:
```json
{
  "framework": "nextjs",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "buildCommand": "cd ../.. && pnpm turbo build --filter=@kandles/admin",
  "crons": [
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 2 * * *"
    }
  ]
}
```

Schedule `0 2 * * *` = 2:00am UTC daily. Vercel cron sends POST with `Authorization: Bearer <CRON_SECRET>` header when `CRON_SECRET` is set in Vercel project env.

**Important**: Vercel cron requires Vercel Pro or crons hobby limit. The `vercel.json` crons config only triggers in Vercel deployments, not local dev. For local testing, POST to `/api/cron/cleanup` manually with the correct Bearer token.

### package.json Script

In `packages/db/package.json`, add to `scripts`:
```json
"seed": "tsx src/seed.ts"
```

### Typecheck Notes

- `packages/db` has no `dotenv` type issue — `import 'dotenv/config'` side-effect import, no types needed.
- `productImages.altText` column is `varchar('alt_text', { length: 255 }).notNull()` — seed values must all be non-null strings ✅
- `reviews.orderId` is nullable — seed omits it ✅
- `products.price` is `numeric` — pass as string `'45.00'` per Drizzle convention (Drizzle returns numerics as strings) ✅

### Previous Story Learnings (1-9)

- pnpm not in shell PATH — use `/usr/local/lib/node_modules/corepack/shims/pnpm` for typecheck commands
- `tsc --noEmit` directly in `apps/admin` directory works for typecheck (Astro check requires Node 22)
- Python 3.9 installed — cannot run bmad scripts, resolve TOML manually

## File List

### New Files
- `packages/db/src/seed.ts`
- `packages/db/src/cron/anonymize-orders.sql`
- `packages/db/src/cron/purge-abandoned-carts.sql`
- `packages/db/src/cron/cleanup-cart-reservations.sql`
- `apps/admin/src/app/api/cron/cleanup/route.ts`

### Modified Files
- `packages/db/package.json` — add `seed` script
- `apps/admin/package.json` — add `drizzle-orm` direct dep (required for `sql` tagged template in cron route)
- `apps/admin/vercel.json` — add `crons` config
- `pnpm-lock.yaml` — updated by `pnpm install --no-frozen-lockfile`

## Review Findings

- [x] [Review][Patch] Cron route has no error handling — a DB failure in the first SQL job silently aborts the remaining two jobs [apps/admin/src/app/api/cron/cleanup/route.ts:15-29]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-06-12 | Story created | BMAD |
| 2026-06-12 | Implementation complete — seed script, 3 SQL cron files, Vercel cron route | Dev Agent |

## Dev Agent Record

### Debug Log

- `drizzle-orm` not in `apps/admin` direct deps → TS2307 on `import { sql } from 'drizzle-orm'`. Fixed by adding `"drizzle-orm": "catalog:"` to admin's `dependencies` and running `pnpm install --no-frozen-lockfile`.

### Completion Notes

- `packages/db/src/seed.ts`: idempotent seed via fixed UUIDs + `onConflictDoNothing()`. Inserts 3 collections, 6 products with 2+ occasion tags, product-collection mappings, 6 hero images, 1 admin user, 2 approved reviews.
- `packages/db/src/cron/`: 3 SQL files (anonymize-orders, purge-abandoned-carts, cleanup-cart-reservations) — exact SQL per AC.
- `apps/admin/src/app/api/cron/cleanup/route.ts`: POST handler, Bearer token auth via `env.CRON_SECRET`, runs 3 data retention SQL statements inline via `db.execute(sql\`...\`)`.
- `apps/admin/vercel.json`: `"crons"` array → `/api/cron/cleanup` runs at 02:00 UTC daily.
- Both `@kandles/db typecheck` and `@kandles/admin typecheck` pass clean.

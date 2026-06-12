---
baseline_commit: 2f79ea040353c1571ee562d9f54b611db65d6732
---

# Story 1.5: Users + Auth + Supabase RLS policies

Status: review

## Story

As admin (Стефка),
I want secure Supabase Auth with single-admin access and correct RLS policies,
So that only the admin can write data, while buyers can safely read products and approved reviews.

## Acceptance Criteria

1. **Given** `packages/db/src/schema/users.ts` exists
   **Then** it defines: `id` (uuid, PK), `supabase_auth_id` (uuid, UNIQUE, NOT NULL), `email` (varchar 255, NOT NULL), `created_at`

2. **Given** `packages/db/src/schema/marketing_consents.ts` exists
   **Then** it defines: `id` (uuid, PK), `email` (varchar 255, NOT NULL), `consented_at` (timestamptz, NOT NULL), `source` (varchar 50, nullable), `unsubscribed_at` (timestamptz, nullable)

3. **Given** `packages/db/src/schema/reviews.ts` exists
   **Then** it defines: `id` (uuid, PK), `product_id` (FK → products), `order_id` (FK → orders, nullable), `rating` (smallint 1–5, NOT NULL), `text` (text, nullable), `image_url` (text, nullable), `is_approved` (boolean, NOT NULL DEFAULT false), `created_at`

4. **Given** Supabase Auth configuration *(manual Dashboard step — not code)*
   **Then** new user signup is disabled (Email Provider → "Disable sign ups" = ON)
   **And** `ADMIN_EMAIL` from `@kandles/env` is the only allowed login email

5. **Given** RLS is enabled on `products` table
   **When** anon key executes `SELECT * FROM products WHERE is_archived = false`
   **Then** query returns rows successfully

6. **Given** RLS is enabled on `orders` table
   **When** anon key attempts `INSERT INTO orders`
   **Then** query is rejected with RLS violation (storefront uses service-role via API endpoint only)

7. **Given** RLS on `reviews` table
   **When** anon key reads reviews
   **Then** only rows where `is_approved = true` are returned

8. **Given** service_role key is used in admin (Vercel server environment only)
   **Then** it bypasses RLS and can write to all tables
   **And** service_role key is NEVER present in any client-side bundle (verified via `@t3-oss/env-nextjs` server-only guard)

9. **Given** `orders.user_id` column exists without FK (Story 1.4 intentional omission)
   **When** Story 1.5 migration runs
   **Then** FK constraint `orders_user_id_users_id_fk` is added (REFERENCES users(id))

10. **Given** `packages/db/src/schema/index.ts` is updated
    **Then** re-exports all new tables: `users`, `marketingConsents`, `reviews`

11. **Given** `turbo typecheck` runs
    **Then** completes with 0 errors

## Tasks / Subtasks

- [x] Task 1: Създай `packages/db/src/schema/users.ts` (AC: 1, 9)
  - [x] `supabaseAuthId`: `uuid('supabase_auth_id').notNull().unique()` — НЕ е PostgreSQL FK към `auth.users` (виж Dev Notes)
  - [x] `email`: `varchar('email', { length: 255 }).notNull()`
  - [x] `createdAt`: `timestamp('created_at', { withTimezone: true }).notNull().defaultNow()`
  - [x] Export: `users` table + `User` и `NewUser` inferred types

- [x] Task 2: Създай `packages/db/src/schema/marketing_consents.ts` (AC: 2)
  - [x] `email`: `varchar('email', { length: 255 }).notNull()`
  - [x] `consentedAt`: `timestamp('consented_at', { withTimezone: true }).notNull()`
  - [x] `source`: `varchar('source', { length: 50 })` — nullable (откъде идва: newsletter, checkout, etc.)
  - [x] `unsubscribedAt`: nullable timestamp — записва момента на unsubscribe
  - [x] Export: `marketingConsents` table + `MarketingConsent` и `NewMarketingConsent` types

- [x] Task 3: Създай `packages/db/src/schema/reviews.ts` (AC: 3)
  - [x] `productId`: FK → `products.id` с `onDelete: 'cascade'`
  - [x] `orderId`: FK → `orders.id` без cascade, nullable
  - [x] `rating`: `smallint('rating').notNull()` + CHECK `rating >= 1 AND rating <= 5`
  - [x] `isApproved`: `boolean('is_approved').notNull().default(false)`
  - [x] `createdAt`: timestamptz NOT NULL defaultNow()
  - [x] Export: `reviews` table + `Review` и `NewReview` types

- [x] Task 4: Обнови `packages/db/src/schema/orders.ts` — добави FK (AC: 9)
  - [x] Import `users` от `./users`
  - [x] Промени `userId: uuid('user_id')` → `uuid('user_id').references(() => users.id)`
  - [x] Провери: existing CHECK constraints (от Story 1.4 review) са непокътнати

- [x] Task 5: Обнови `packages/db/src/schema/index.ts` (AC: 10)
  - [x] Добави: `export * from './users'`, `export * from './marketing_consents'`, `export * from './reviews'`
  - [x] Провери: всички Story 1.3 + 1.4 exports са непокътнати

- [x] Task 6: Генерирай migration (AC: 5, 6, 7, 8, 9)
  - [x] `pnpm --filter @kandles/db generate`
  - [x] Провери: migration включва CREATE TABLE users, marketing_consents, reviews
  - [x] Провери: migration включва ALTER TABLE orders ADD CONSTRAINT orders_user_id_users_id_fk
  - [x] Ръчно добави RLS SQL блок в края на migration файла (виж Dev Notes за точен SQL)
  - [x] Провери синтаксис на RLS SQL

- [x] Task 7: Typecheck (AC: 11)
  - [x] `export PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH" && pnpm turbo typecheck`
  - [x] 0 TypeScript грешки

- [x] Task 8: Документирай ръчната Auth стъпка (AC: 4)
  - [x] Добави в Completion Notes: точните Supabase Dashboard стъпки за disable sign ups

## Dev Notes

### КРИТИЧНА ЗАВИСИМОСТ: Stories 1.3 + 1.4 трябва да са done

Story 1.5 зависи от:
- `products` таблица (FK target в reviews.product_id)
- `orders` таблица с `user_id` колона без FK (добавяме FK тук)
- Enums от Story 1.3

### users.ts — точна имплементация

```typescript
import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const users = pgTable('users', {
  id:             uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  supabaseAuthId: uuid('supabase_auth_id').notNull().unique(),
  email:          varchar('email', { length: 255 }).notNull(),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type User    = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
```

**ADR-003 — защо собствена `users` таблица:**
Supabase's `auth.users` е вътрешна инфраструктура — не я hardcode-ваме в бизнес schema. `supabaseAuthId` е unique reference, но НЕ е PostgreSQL FK (Drizzle не може да референцира `auth` schema). Синхронизацията (insert в `users` при sign-in) се прави на приложително ниво (Story 5.1 middleware).

### marketing_consents.ts — точна имплементация

```typescript
import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const marketingConsents = pgTable('marketing_consents', {
  id:             uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  email:          varchar('email', { length: 255 }).notNull(),
  consentedAt:    timestamp('consented_at', { withTimezone: true }).notNull(),
  source:         varchar('source', { length: 50 }),
  unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
})

export type MarketingConsent    = typeof marketingConsents.$inferSelect
export type NewMarketingConsent = typeof marketingConsents.$inferInsert
```

**GDPR note:** `unsubscribedAt` е NULL докато потребителят е абониран. При unsubscribe → set to NOW(). Не изтриваме реда (retention policy — 3 години per AR-15).

### reviews.ts — точна имплементация

```typescript
import { pgTable, uuid, text, smallint, boolean, timestamp, check } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { products } from './products'
import { orders } from './orders'

export const reviews = pgTable('reviews', {
  id:         uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  productId:  uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  orderId:    uuid('order_id').references(() => orders.id),
  rating:     smallint('rating').notNull(),
  text:       text('text'),
  imageUrl:   text('image_url'),
  isApproved: boolean('is_approved').notNull().default(false),
  createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check('reviews_rating_range', sql`${table.rating} >= 1 AND ${table.rating} <= 5`),
])

export type Review    = typeof reviews.$inferSelect
export type NewReview = typeof reviews.$inferInsert
```

**FK decisions:**
- `product_id` ON DELETE CASCADE: Продуктът се архивира (не изтрива) при нормален поток → CASCADE е safety net; при hard delete reviews изчезват заедно
- `order_id` nullable, no cascade: Review може да е без поръчка (admin-created) или поръчката да е почистена — review остава

### orders.ts — добавяне на FK (промяна в Task 4)

```typescript
// Добавяш import на върха:
import { users } from './users'

// Промяна на реда:
userId: uuid('user_id'),
// → Става:
userId: uuid('user_id').references(() => users.id),
```

**Очакван migration резултат:**
```sql
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
  ON DELETE no action ON UPDATE no action;
```

ON DELETE no action е правилно — гост поръчки нямат user_id; при user изтриване поръчките остават за исторически преглед. Ако потребителят се изтрие от Supabase Auth, order.user_id ще стане orphaned FK (FK violation при опит за изтриване от `users` таблицата). Решение: при user cleanup → първо SET user_id = NULL, после DELETE. За MVP с един admin потребител това не е проблем.

### RLS SQL — добавяне в migration файла

След `pnpm --filter @kandles/db generate` (ще се създаде `0003_*.sql`), добави в **края** на файла:

```sql
--> statement-breakpoint
-- ============================================================
-- RLS: Row Level Security (Story 1.5)
-- NOTE: These are not tracked by drizzle-kit snapshots.
-- Future generate runs will not affect these statements.
-- ============================================================

-- Enable RLS on business-sensitive tables
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "marketing_consents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cart_reservations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stripe_webhook_events" ENABLE ROW LEVEL SECURITY;

-- products: anon може да чете неархивирани продукти (storefront Supabase anon queries)
CREATE POLICY "anon_read_products" ON "products"
  AS PERMISSIVE FOR SELECT TO anon
  USING (is_archived = false);

-- reviews: anon вижда само одобрени reviews
CREATE POLICY "anon_read_approved_reviews" ON "reviews"
  AS PERMISSIVE FOR SELECT TO anon
  USING (is_approved = true);

-- orders, order_items, users, marketing_consents, cart_reservations,
-- stripe_webhook_events: НУЛА anon policies = всички anon операции блокирани.
-- service_role заобикаля RLS автоматично (Supabase default).

-- NOTE: collections, product_images, product_collections нямат RLS в Story 1.5.
-- Те ще получат anon SELECT policies в Story 2.1 когато storefront започне да ги чете.
```

**Защо в migration, а не в apply-rls.ts:** За разлика от `CREATE INDEX CONCURRENTLY`, RLS statements могат да се изпълняват в транзакция. Включването им в migration файла е чистото решение. drizzle-kit не проследява RLS и няма да го засегне при бъдещи generate извиквания.

### Auth конфигурация — РЪЧНА СТЪПКА (не е код)

Следните стъпки се правят ръчно в **Supabase Dashboard**:

1. **Authentication → Providers → Email**
   - "Confirm email" → ON
   - "Disable sign ups" → ON (никой не може да се регистрира)

2. **За да създадеш admin потребител:**
   Authentication → Users → "Invite user" → въведи `ADMIN_EMAIL` стойността

3. **Важно:** `ADMIN_EMAIL` env var се ползва от admin middleware (Story 5.1) за application-level проверка. Supabase Auth само ограничава кой може да се регистрира — не проверява email срещу конкретна стойност.

Тази стъпка НЕ може да се автоматизира в код в рамките на Story 1.5. Документирай я в Completion Notes.

### Migration sequence

Текущо: 0000, 0001, 0002 → следващото е `0003_*`

Провери преди generate:
```bash
cat packages/db/drizzle/migrations/meta/_journal.json
```

### Анти-patterns — ЗАБРАНЕНО

```typescript
// ❌ FK към auth.users (не съществува в Drizzle scope)
supabaseAuthId: uuid('supabase_auth_id').references(() => authUsers.id)  // ГРЕШНО

// ❌ Circular import: orders.ts → users.ts → orders.ts
// users.ts НЕ трябва да импортира orders.ts
// orders.ts импортира users.ts (еднопосочна зависимост) ✓

// ❌ rating без CHECK constraint
rating: smallint('rating').notNull()  // ГРЕШНО — позволява 0, 99, -5

// ❌ is_approved nullable (трябва да е NOT NULL с default)
isApproved: boolean('is_approved').default(false)  // ГРЕШНО — без .notNull()
```

### Learnings от Stories 1.3 + 1.4

- **pnpm path**: `~/.nvm/versions/node/v22.22.3/bin/pnpm` (не е в default PATH)
- **turbo**: `export PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH"` преди turbo команди
- **Array syntax**: `(table) => [check(...)]` — НЕ обект
- **check() import**: от `drizzle-orm/pg-core`
- **Numeric columns**: Drizzle ги връща като JS string — `parseFloat()` преди аритметика
- **$onUpdateFn**: само за таблици с `updatedAt`; users/marketing_consents/reviews нямат updatedAt

### References

- [Source: epics.md#Story-1.5] — Story acceptance criteria
- [Source: architecture.md#ADR-003] — Own users table с supabase_auth_id
- [Source: architecture.md#authentication-security] — RLS model, service_role boundaries
- [Source: architecture.md#AR-4] — Single admin, signup disabled
- [Source: story-1-3.md] — products/orders schema (FK targets)
- [Source: story-1-4.md] — orders.user_id без FK (умишлено за Story 1.5)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Няма блокиращи проблеми. Всички зависимости от Stories 1.3+1.4 налични.

### Completion Notes List

- 3 нови schema файла: users.ts, marketing_consents.ts, reviews.ts
- `users.supabase_auth_id` — UNIQUE constraint, не е PostgreSQL FK (ADR-003)
- `reviews.rating` CHECK constraint `>= 1 AND <= 5` генериран коректно
- `orders.user_id` получи FK → users.id (forward reference от Story 1.4 resolved)
- Migration `0003_grey_korvac.sql` — 3 нови таблици + 1 FK ALTER + RLS SQL блок
- RLS: 8 таблици с ENABLE ROW LEVEL SECURITY, 2 anon policies (products + reviews)
- `turbo typecheck → 10/10 successful, 0 грешки`
- Auth "Disable sign ups": РЪЧНА СТЪПКА — Supabase Dashboard → Authentication → Providers → Email → Disable sign ups = ON

## File List

- packages/db/src/schema/users.ts *(new)*
- packages/db/src/schema/marketing_consents.ts *(new)*
- packages/db/src/schema/reviews.ts *(new)*
- packages/db/src/schema/orders.ts *(modified — userId добавя .references(() => users.id))*
- packages/db/src/schema/index.ts *(modified — добавя users, marketing_consents, reviews exports)*
- packages/db/drizzle/migrations/0003_grey_korvac.sql *(generated + RLS SQL appended)*
- packages/db/drizzle/migrations/meta/_journal.json *(updated)*

## Change Log

- 2026-06-12: Story създадена — users + marketing_consents + reviews schema + orders FK + RLS policies
- 2026-06-12: Имплементация завършена — 3 нови таблици, migration 0003, RLS policies, typecheck 0 грешки

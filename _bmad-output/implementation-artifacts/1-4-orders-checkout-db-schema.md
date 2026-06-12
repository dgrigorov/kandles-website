---
baseline_commit: d1050bd30661417a3f93273689eb4f355901ee06
---

# Story 1.4: Orders + Checkout DB schema

Status: done

## Story

As a developer,
I want the orders, order_items, cart_reservations, and stripe_webhook_events Drizzle schema,
So that Epic 4 (checkout) has a complete and correct DB foundation with proper constraints.

## Acceptance Criteria

1. **Given** `packages/db/src/schema/orders.ts` exists
   **Then** it defines: `id` (uuid, PK), `user_id` (uuid, nullable — FK добавено в Story 1.5), `guest_email` (varchar 255), `status` (orderStatusEnum, DEFAULT 'received'), `payment_method` (paymentMethodEnum, NOT NULL), `stripe_payment_intent_id` (varchar, nullable), `tracking_number` (varchar, nullable), `courier` (courierEnum, nullable), `gift_wrap` (boolean, DEFAULT false), `gift_card_text` (varchar 150, nullable), `preview_uploaded_at` (timestamptz, nullable), `approved_at` (timestamptz, nullable), `correction_count` (smallint, NOT NULL DEFAULT 0), `total_price` (numeric 10,2, NOT NULL), `shipping_address` (jsonb, NOT NULL), `created_at`, `updated_at`

2. **Given** `correction_count` column definition
   **Then** CHECK constraint `correction_count <= 1` е присъстващ в migration SQL

3. **Given** `packages/db/src/schema/order_items.ts` съществува
   **Then** дефинира: `id` (uuid, PK), `order_id` (FK → orders ON DELETE CASCADE), `product_id` (FK → products), `quantity` (smallint, NOT NULL), `unit_price` (numeric 10,2, NOT NULL), `snapshot_title` (varchar 255, NOT NULL), `snapshot_image_url` (text, nullable)

4. **Given** `packages/db/src/schema/cart_reservations.ts` съществува
   **Then** дефинира: `id` (uuid, PK), `product_id` (FK → products), `quantity` (smallint, NOT NULL), `session_id` (varchar 255, NOT NULL), `expires_at` (timestamptz, NOT NULL), `order_id` (uuid, nullable FK → orders), `created_at`

5. **Given** `packages/db/src/schema/stripe.ts` съществува
   **Then** дефинира: `stripe_event_id` (varchar, PRIMARY KEY), `processed_at` (timestamptz, DEFAULT NOW())

6. **Given** новите schemas са добавени и `pnpm --filter @kandles/db generate` се стартира
   **When** migration се прилага
   **Then** Supabase показва всички нови таблици с правилни колони и constraints

7. **Given** `packages/db/src/schema/index.ts` е обновен
   **Then** re-exportва всички нови таблици: `orders`, `orderItems`, `cartReservations`, `stripeWebhookEvents`

8. **Given** `turbo typecheck` се стартира
   **Then** завършва с 0 грешки

## Tasks / Subtasks

- [x] Task 1: Създай `packages/db/src/schema/orders.ts` (AC: 1, 2)
  - [x] Import enums от `./enums` — `orderStatusEnum`, `paymentMethodEnum`, `courierEnum` (дефинирани в Story 1.3)
  - [x] Дефинирай `orders` таблица с ВСИЧКИ колони от AC1
  - [x] `userId`: `uuid('user_id')` БЕЗ `.references()` — FK към users добавя Story 1.5 migration
  - [x] `shippingAddress`: `jsonb('shipping_address').notNull()`
  - [x] Добави CHECK constraint за `correction_count <= 1` като третия аргумент на `pgTable` (виж Dev Notes за синтаксис)
  - [x] Export: `orders` table + `Order` и `NewOrder` inferred types

- [x] Task 2: Създай `packages/db/src/schema/order_items.ts` (AC: 3)
  - [x] Import `orders` от `./orders`, `products` от `./products`
  - [x] FK `orderId` → `orders.id` с `onDelete: 'cascade'`
  - [x] FK `productId` → `products.id` (без cascade — запазваме snapshot при архивиране на продукт)
  - [x] `snapshotTitle` (varchar 255, NOT NULL) — snapshot на продукта по времето на поръчката
  - [x] Export: `orderItems` table + `OrderItem` и `NewOrderItem` inferred types

- [x] Task 3: Създай `packages/db/src/schema/cart_reservations.ts` (AC: 4)
  - [x] FK `productId` → `products.id`
  - [x] FK `orderId` → `orders.id` (nullable) — свързва reservation с финализирана поръчка
  - [x] `expiresAt` (timestamptz, NOT NULL) — Story 1.10 cron го използва за cleanup
  - [x] `createdAt` — само created, без updatedAt (reservation не се update-ва)
  - [x] Export: `cartReservations` table + `CartReservation` и `NewCartReservation` inferred types

- [x] Task 4: Създай `packages/db/src/schema/stripe.ts` (AC: 5)
  - [x] `stripe_event_id` като PRIMARY KEY (varchar) — идемпотентност при replay атаки
  - [x] `processedAt` с `.default(sql\`now()\`)`
  - [x] Export: `stripeWebhookEvents` table + `StripeWebhookEvent` inferred type

- [x] Task 5: Обнови `packages/db/src/schema/index.ts` (AC: 7)
  - [x] Добави re-export за: `./orders`, `./order_items`, `./cart_reservations`, `./stripe`
  - [x] Провери: всички съществуващи exports от Story 1.3 са непокътнати

- [x] Task 6: Генерирай migration (AC: 6)
  - [x] `pnpm --filter @kandles/db generate`
  - [x] Провери generated SQL — CHECK constraint за `correction_count <= 1` трябва да е там
  - [x] Провери: `REFERENCES products(id)` е правилно генерирано за order_items и cart_reservations
  - [x] Commit migration файловете в git

- [x] Task 7: Typecheck (AC: 8)
  - [x] `export PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH" && turbo typecheck`
  - [x] 0 TypeScript грешки

### Review Findings

- [x] [Review][Decision] cart_reservations orderId ON DELETE behavior — currently `NO ACTION` blocks order deletion if a reservation row still points to it. Options: (1) keep `NO ACTION` (app must delete reservation before deleting order), (2) `ON DELETE CASCADE` (reservation deleted with order), (3) `ON DELETE SET NULL` (reservation unlinked, eligible for cron cleanup). Decision needed before applying patches.
- [x] [Review][Patch] orders: add CHECK (user_id IS NOT NULL OR guest_email IS NOT NULL) — prevents ownerless orders with no identity [packages/db/src/schema/orders.ts]
- [x] [Review][Patch] orders: fix correctionCount constraint from `<= 1` to `>= 0 AND <= 1` — allows negative values currently [packages/db/src/schema/orders.ts]
- [x] [Review][Patch] orders: add CHECK (total_price >= 0) — negative total price corrupts financial reporting [packages/db/src/schema/orders.ts]
- [x] [Review][Patch] orders: add .unique() on stripePaymentIntentId — two orders can reference same Stripe PI breaking reconciliation [packages/db/src/schema/orders.ts]
- [x] [Review][Patch] orders: cap stripePaymentIntentId to varchar(64) — currently unbounded varchar [packages/db/src/schema/orders.ts]
- [x] [Review][Patch] orders: add CHECK (gift_card_text IS NULL OR gift_wrap = true) — non-gift orders should not store gift text [packages/db/src/schema/orders.ts]
- [x] [Review][Patch] order_items: add CHECK (quantity > 0) — quantity 0 or negative is storable [packages/db/src/schema/order_items.ts]
- [x] [Review][Patch] order_items: add CHECK (unit_price >= 0) — negative unit price corrupts totals [packages/db/src/schema/order_items.ts]
- [x] [Review][Patch] cart_reservations: add CHECK (quantity > 0) — same as order_items [packages/db/src/schema/cart_reservations.ts]
- [x] [Review][Patch] stripe: cap stripeEventId to varchar(64) — unbounded PK, Stripe evt_ IDs are ~31 chars [packages/db/src/schema/stripe.ts]
- [x] [Review][Defer] indexes on orders (user_id, status) — deferred to Story 1.7 per dev notes [packages/db/src/schema/orders.ts] — deferred, pre-existing
- [x] [Review][Defer] index on order_items (order_id) — deferred to Story 1.7 per dev notes [packages/db/src/schema/order_items.ts] — deferred, pre-existing
- [x] [Review][Defer] indexes on cart_reservations (expires_at, product_id, session_id) — deferred to Story 1.10 per dev notes [packages/db/src/schema/cart_reservations.ts] — deferred, pre-existing
- [x] [Review][Defer] overselling race condition (no SELECT FOR UPDATE) — deferred to Story 4.1 [packages/db/src/schema/cart_reservations.ts] — deferred, pre-existing
- [x] [Review][Defer] payment_method vs stripePaymentIntentId consistency constraint — app-layer validation, complex schema rule [packages/db/src/schema/orders.ts] — deferred, pre-existing
- [x] [Review][Defer] (sessionId, productId) unique partial index in cart_reservations — requires raw SQL, deferred to Story 4.1 [packages/db/src/schema/cart_reservations.ts] — deferred, pre-existing
- [x] [Review][Defer] (orderId, productId) unique in order_items — checkout flow decision, deferred to Story 4.2 [packages/db/src/schema/order_items.ts] — deferred, pre-existing
- [x] [Review][Defer] eventType column in stripe_webhook_events — MVP scope, audit enhancement [packages/db/src/schema/stripe.ts] — deferred, pre-existing
- [x] [Review][Defer] CHECK (approved_at >= preview_uploaded_at) ordering — future preview workflow story [packages/db/src/schema/orders.ts] — deferred, pre-existing
- [x] [Review][Defer] tracking_number + courier co-presence constraint — future courier story [packages/db/src/schema/orders.ts] — deferred, pre-existing
- [x] [Review][Defer] CHECK (expires_at > created_at) in cart_reservations — minor, app-layer [packages/db/src/schema/cart_reservations.ts] — deferred, pre-existing
- [x] [Review][Defer] snapshot_price column in order_items — future returns/exchange requirement [packages/db/src/schema/order_items.ts] — deferred, pre-existing
- [x] [Review][Defer] updated_at DB-level trigger (not ORM-only) — Story 1.7 or dedicated DB work [packages/db/src/schema/orders.ts] — deferred, pre-existing
- [x] [Review][Defer] guest_email format validation — app-layer validation standard [packages/db/src/schema/orders.ts] — deferred, pre-existing
- [x] [Review][Defer] totalPrice integrity link to SUM(order_items) — complex trigger, future story [packages/db/src/schema/orders.ts] — deferred, pre-existing

## Dev Notes

### КРИТИЧНА ЗАВИСИМОСТ: Story 1.3 трябва да е завършена първо

Story 1.4 зависи от Story 1.3 защото:
- `orderStatusEnum`, `paymentMethodEnum`, `courierEnum` са дефинирани в `packages/db/src/schema/enums.ts` (Story 1.3)
- `products` таблицата е FK target за `order_items.product_id` и `cart_reservations.product_id`

Ако Story 1.3 не е имплементирана, **не стартирай Story 1.4**.

### orders.ts — точна имплементация с CHECK constraint

```typescript
import { pgTable, uuid, varchar, numeric, smallint, boolean, text, timestamp, jsonb, check } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { orderStatusEnum, paymentMethodEnum, courierEnum } from './enums'

export const orders = pgTable('orders', {
  id:                    uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId:                uuid('user_id'),  // без .references() — FK добавя Story 1.5
  guestEmail:            varchar('guest_email', { length: 255 }),
  status:                orderStatusEnum('status').notNull().default('received'),
  paymentMethod:         paymentMethodEnum('payment_method').notNull(),
  stripePaymentIntentId: varchar('stripe_payment_intent_id'),
  trackingNumber:        varchar('tracking_number'),
  courier:               courierEnum('courier'),
  giftWrap:              boolean('gift_wrap').default(false),
  giftCardText:          varchar('gift_card_text', { length: 150 }),
  previewUploadedAt:     timestamp('preview_uploaded_at', { withTimezone: true }),
  approvedAt:            timestamp('approved_at', { withTimezone: true }),
  correctionCount:       smallint('correction_count').notNull().default(0),
  totalPrice:            numeric('total_price', { precision: 10, scale: 2 }).notNull(),
  shippingAddress:       jsonb('shipping_address').notNull(),
  createdAt:             timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:             timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check('correction_count_check', sql`${table.correctionCount} <= 1`),
])

export type Order    = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert
```

**Важно за `check`:**
- Import `check` от `drizzle-orm/pg-core` (drizzle-orm 0.45+)
- Третият аргумент на `pgTable` е масив `[]` (новият API), НЕ обект `{}`
- Drizzle-kit генерира `CHECK (correction_count <= 1)` правилно в migration SQL

### order_items.ts — точна имплементация

```typescript
import { pgTable, uuid, varchar, text, smallint, numeric } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { orders } from './orders'
import { products } from './products'

export const orderItems = pgTable('order_items', {
  id:               uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orderId:          uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId:        uuid('product_id').notNull().references(() => products.id),  // без cascade
  quantity:         smallint('quantity').notNull(),
  unitPrice:        numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  snapshotTitle:    varchar('snapshot_title', { length: 255 }).notNull(),
  snapshotImageUrl: text('snapshot_image_url'),
})

export type OrderItem    = typeof orderItems.$inferSelect
export type NewOrderItem = typeof orderItems.$inferInsert
```

**Защо без cascade за `product_id`:** Snapshot данните (`snapshot_title`, `snapshot_image_url`) запазват информация за продукта по времето на поръчката. Дори ако продуктът бъде архивиран, историческите поръчки трябва да са четими.

### cart_reservations.ts — точна имплементация

```typescript
import { pgTable, uuid, varchar, smallint, timestamp } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { products } from './products'
import { orders } from './orders'

export const cartReservations = pgTable('cart_reservations', {
  id:        uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  productId: uuid('product_id').notNull().references(() => products.id),
  quantity:  smallint('quantity').notNull(),
  sessionId: varchar('session_id', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  orderId:   uuid('order_id').references(() => orders.id),  // nullable — set при checkout завършване
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type CartReservation    = typeof cartReservations.$inferSelect
export type NewCartReservation = typeof cartReservations.$inferInsert
```

**Lifecycle на cart_reservations:**
1. `checkout.start` → INSERT с `expires_at = NOW() + 30 min`
2. Stripe webhook `payment_intent.succeeded` → UPDATE `order_id = new_order_id`, след което DELETE
3. Story 1.10 cron → `DELETE FROM cart_reservations WHERE expires_at < NOW()` (abandoned cleanup)

### stripe.ts — точна имплементация

```typescript
import { pgTable, varchar, timestamp } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const stripeWebhookEvents = pgTable('stripe_webhook_events', {
  stripeEventId: varchar('stripe_event_id').primaryKey(),
  processedAt:   timestamp('processed_at', { withTimezone: true }).notNull().default(sql`now()`),
})

export type StripeWebhookEvent = typeof stripeWebhookEvents.$inferSelect
```

**Защо тази таблица е критична:**
```
Webhook replay attack protection:
  → POST /api/webhooks/stripe (Stripe изпраща)
  → INSERT INTO stripe_webhook_events (stripe_event_id, ...) ON CONFLICT DO NOTHING
  → Ако rows affected = 0 → event вече обработен → return 200 (idempotent)
  → Ако rows affected = 1 → процесирай бизнес логиката
```
[Source: architecture.md#ADR-006]

### Файлова структура — изяснение на конфликт epic ↔ architecture

Архитектурата (architecture.md) казва: `orders.ts # orders, order_items, cart_reservations` (консолидирани). Epic ACs казват отделни файлове (`order_items.ts`, `cart_reservations.ts`).

**Решение:** Следваме individual файлове (consistent с Story 1.3 pattern — products.ts, collections.ts, product_images.ts са отделни). Architecture grouping е shorthand/intent, НЕ буквален единствен файл.

За `stripe_webhook_events` — архитектурата казва `stripe.ts`, epic AC казва `stripe_webhook_events.ts`. **Следваме `stripe.ts`** (архитектурата е по-нова и по-авторитетна за file naming). Ако в бъдеще добавим `stripe_refunds` или `stripe_customers` таблици, `stripe.ts` ще ги groups правилно.

**Структура след Story 1.4:**
```
packages/db/src/schema/
  enums.ts            ← Story 1.3: season, order_status, payment_method, courier
  products.ts         ← Story 1.3: products + types
  collections.ts      ← Story 1.3: collections + types
  product_images.ts   ← Story 1.3: product_images + types
  orders.ts           ← Story 1.4 (НОВО): orders + types + correction_count CHECK
  order_items.ts      ← Story 1.4 (НОВО): order_items + types
  cart_reservations.ts ← Story 1.4 (НОВО): cart_reservations + types
  stripe.ts           ← Story 1.4 (НОВО): stripe_webhook_events + types
  index.ts            ← Story 1.3 + обновено в Story 1.4
```

### userId без FK — forward reference проблем

`orders.user_id` е nullable FK → `users.id`, НО `users` таблицата се създава в Story 1.5. Ако добавим `references(() => users.id)` сега, drizzle-kit ще генерира `REFERENCES users(id)` в migration — и migration ще FAIL защото таблицата не съществува.

**Правилно:** Дефинирай `userId: uuid('user_id')` без `.references()`. Story 1.5 добавя FK чрез:
```sql
ALTER TABLE orders ADD CONSTRAINT orders_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);
```

### Анти-patterns — ЗАБРАНЕНО

```typescript
// ❌ FK към users сега (таблицата не съществува до Story 1.5)
userId: uuid('user_id').references(() => users.id)  // ГРЕШНО — migration ще fail

// ❌ check() като обект (стар API — deprecating в drizzle 0.45+)
}, (table) => ({
  correctionCountCheck: check(...)  // Може да работи, но масив е препоръчан
}))

// ❌ snapshot_title nullable (нарушава AR — историческата поръчка трябва да е четима)
snapshotTitle: varchar('snapshot_title', { length: 255 })  // ГРЕШНО — без .notNull()

// ❌ stripe_webhook_events.ts вместо stripe.ts
// Следваме архитектурата: stripe.ts group-ва всички Stripe-related таблици

// ❌ SELECT за inventory без transaction (TOCTOU race condition)
const p = await db.query.products.findFirst(...)
if (p.stock > 0) { await db.update(...) }  // НЕ — use SELECT FOR UPDATE (Story 4.1+)
```

### schema/index.ts — обновяване

След Story 1.3, `packages/db/src/schema/index.ts` re-exportва products, collections, product_images, enums. Story 1.4 добавя:

```typescript
// Съществуващи exports от Story 1.3:
export * from './enums'
export * from './products'
export * from './collections'
export * from './product_images'

// Нови exports от Story 1.4:
export * from './orders'
export * from './order_items'
export * from './cart_reservations'
export * from './stripe'
```

### Migration файл — проверка на CHECK constraint

След `pnpm --filter @kandles/db generate`, провери generated SQL:

```sql
-- Трябва да съдържа (точен синтаксис може да варира):
CONSTRAINT "correction_count_check" CHECK ("correction_count" <= 1)
```

Ако drizzle-kit не генерира CHECK constraint автоматично (edge case в по-стари версии), добави ръчно в migration SQL файла.

### Connections и индекси за performance

Не са нужни custom индекси в тази story (базовите PK и FK индекси са достатъчни за MVP). Бъдещите индекси (`idx_orders_customer_email`, `idx_orders_status`) ще бъдат добавени в Story 1.7 или когато load testing покаже нужда.

Изключение: `cart_reservations.expires_at` ще се query-ва от cleanup cron в Story 1.10 — index може да се добави тогава с `CREATE INDEX CONCURRENTLY`.

### Learnings от предишни stories

- **pnpm path**: `~/.nvm/versions/node/v22.22.3/bin/pnpm` — не е в default PATH
- **turbo path**: `export PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH"` преди turbo команди
- **catalog протокол**: нови пакети в `pnpm-workspace.yaml` catalog (Story 1.3 добавя drizzle-orm, drizzle-kit, postgres, dotenv)
- **moduleResolution: "bundler"**: subpath exports работят без допълнителни tsconfig paths
- **migration след Story 1.3**: Story 1.4 migration е `0002_*` или `0003_*` в зависимост от Story 1.3 output — провери `_journal.json` преди generate

### References

- [Source: epics.md#Story-1.4] — Story acceptance criteria
- [Source: architecture.md#database-schema] — file structure (`orders.ts`, `stripe.ts`)
- [Source: architecture.md#ADR-006] — stripe_webhook_events idempotency design
- [Source: architecture.md#inventory-mutations] — SELECT FOR UPDATE pattern (Story 4.1+)
- [Source: architecture.md#checkout-data-flow] — cart_reservations lifecycle
- [Source: story-1-3.md#enums] — orderStatusEnum, paymentMethodEnum, courierEnum definitions

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Няма блокиращи проблеми. Story 1.3 enums (orderStatusEnum, paymentMethodEnum, courierEnum) бяха налични.

### Completion Notes List

- 4 нови schema файла: orders.ts, order_items.ts, cart_reservations.ts, stripe.ts
- `orders.correction_count` CHECK constraint `<= 1` генериран правилно от drizzle-kit
- `order_items.product_id` FK без CASCADE (snapshot preservation при архивиране)
- `orders.user_id` без `.references()` — FK се добавя в Story 1.5
- Migration `0002_famous_monster_badoon.sql` — 4 нови таблици + FK constraints
- turbo typecheck → 10/10 successful, 0 грешки

## File List

- packages/db/src/schema/orders.ts *(new)*
- packages/db/src/schema/order_items.ts *(new)*
- packages/db/src/schema/cart_reservations.ts *(new)*
- packages/db/src/schema/stripe.ts *(new)*
- packages/db/src/schema/index.ts *(modified — added orders, order_items, cart_reservations, stripe exports)*
- packages/db/drizzle/migrations/0002_famous_monster_badoon.sql *(generated)*
- packages/db/drizzle/migrations/meta/_journal.json *(updated)*

## Change Log

- 2026-06-12: Story създадена — orders + checkout DB schema + correction_count CHECK constraint + cart_reservations lifecycle
- 2026-06-12: Имплементация завършена — 4 нови таблици, migration 0002, typecheck 0 грешки

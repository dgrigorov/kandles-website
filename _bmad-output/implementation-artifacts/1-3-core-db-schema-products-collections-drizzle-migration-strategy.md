---
baseline_commit: 6c8a104ecdbc70ab21bf6a6cc883e2bf01dc16c9
---

# Story 1.3: Core DB schema — products + collections + Drizzle migration strategy

Status: done

## Story

As a developer,
I want the products, collections, and product_images Drizzle schema with an explicit migration strategy,
So that Epic 2 (storefront) has a correct DB foundation and the team has a safe, version-controlled migration process.

## Acceptance Criteria

1. **Given** `packages/db/src/schema/products.ts` exists
   **Then** it defines: `id` (uuid, PK), `title` (varchar 255, NOT NULL), `description` (text), `price` (numeric 10,2, NOT NULL), `stock` (integer, NOT NULL DEFAULT 0), `season` (enum: spring|summer|autumn|winter|all), `is_last_minute` (boolean, DEFAULT false), `is_archived` (boolean, DEFAULT false), `production_days` (smallint), `occasion_tags` (text[]), `created_at`, `updated_at`

2. **Given** `packages/db/src/schema/collections.ts` exists
   **Then** it defines: `id` (uuid, PK), `name` (varchar 100, NOT NULL), `slug` (varchar 100, UNIQUE, NOT NULL), `season_start_month` (smallint 1–12), `season_end_month` (smallint 1–12), `is_active` (boolean, DEFAULT true)

3. **Given** `packages/db/src/schema/product_images.ts` exists
   **Then** it defines: `id` (uuid, PK), `product_id` (uuid, FK → products ON DELETE CASCADE), `url` (text, NOT NULL), `alt_text` (varchar 255, NOT NULL — never nullable), `sort_order` (smallint, DEFAULT 0), `is_hero` (boolean, DEFAULT false)

4. **Given** `packages/db/drizzle.config.ts` exists
   **Then** it uses `dialect: 'postgresql'`, `schema: './src/schema'`, `out: './drizzle/migrations'`, and `DATABASE_URL` from `process.env` (direct Supabase connection — not pooled)

5. **Given** `pnpm --filter @kandles/db generate` runs
   **Then** SQL migration files appear in `packages/db/drizzle/migrations/` and are committed to git

6. **Given** migration files exist in git
   **When** `pnpm --filter @kandles/db migrate` runs against Supabase
   **Then** schema is applied idempotently (safe to run multiple times)

7. **Given** GIN index for full-text search (AR-38)
   **Then** the migration SQL contains:
   ```sql
   CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_search
   ON products USING GIN(to_tsvector('bulgarian', title || ' ' || coalesce(description, '')));
   ```

8. **Given** `packages/db/src/index.ts` exists
   **Then** it re-exports: `db` client, all schema tables, all Drizzle inferred types

9. **Given** `DATABASE_URL` added to `.env.example`
   **Then** comment clarifies it is the **direct** (non-pooled) Supabase PostgreSQL connection URL

## Tasks / Subtasks

- [x] Task 1: Установи зависимости в `packages/db` (AC: 4, 5, 6)
  - [x] Добави `drizzle-orm: "^0.45.2"` в `dependencies` на `packages/db/package.json`
  - [x] Добави `drizzle-kit: "^0.31.10"` в `devDependencies` на `packages/db/package.json`
  - [x] Добави `dotenv: "^16.0.0"` в `devDependencies` на `packages/db/package.json`
  - [x] Добави `postgres: "^3.4.5"` (postgres.js драйвер) в `dependencies`
  - [x] Добави scripts: `generate`, `migrate`, `push`, `studio` в package.json
  - [x] Добави `drizzle-orm` и `drizzle-kit` в `pnpm-workspace.yaml` catalog
  - [x] Стартирай `pnpm install` → exit 0

- [x] Task 2: Създай enums файл (AC: 1)
  - [x] Създай `packages/db/src/schema/enums.ts` с `seasonEnum` и `orderStatusEnum` (за бъдещи истории)
  - [x] Използвай `pgEnum` от `drizzle-orm/pg-core`

- [x] Task 3: Имплементирай `packages/db/src/schema/products.ts` (AC: 1)
  - [x] Всички колони точно според AC1 — column по column
  - [x] `season` е `seasonEnum` от `enums.ts`
  - [x] `occasion_tags` е `text('occasion_tags').array()` — PostgreSQL `text[]`
  - [x] `created_at` и `updated_at` с `defaultNow()` и `notNull()`
  - [x] Export: `products` table + `Product` и `NewProduct` inferred types

- [x] Task 4: Имплементирай `packages/db/src/schema/collections.ts` (AC: 2)
  - [x] Всички колони точно според AC2
  - [x] `slug` с `.unique()` constraint
  - [x] Export: `collections` table + inferred types

- [x] Task 5: Имплементирай `packages/db/src/schema/product_images.ts` (AC: 3)
  - [x] `alt_text` е `varchar(255).notNull()` — НИКОГА nullable (AR архитектурно изискване)
  - [x] `product_id` FK с `onDelete: 'cascade'` — изтриването на продукт изтрива снимките
  - [x] Export: `productImages` table + inferred types

- [x] Task 6: Създай `packages/db/drizzle.config.ts` (AC: 4)
  - [x] `import 'dotenv/config'` в началото
  - [x] `process.env.DATABASE_URL!` за connection
  - [x] Провери: файлът е на `packages/db/` ниво, НЕ в `src/`

- [x] Task 7: Обнови `packages/db/src/index.ts` (AC: 8)
  - [x] Re-export `db` Drizzle client (postgres.js + drizzle())
  - [x] Re-export всички таблици: `products`, `collections`, `productImages`
  - [x] Re-export всички inferred types
  - [x] Re-export enums

- [x] Task 8: Добави `DATABASE_URL` в `.env.example` (AC: 9)
  - [x] Добави под Supabase секцията: `DATABASE_URL= # Direct PostgreSQL URL (не pooled): postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres`

- [x] Task 9: Генерирай и прегледай migration файловете (AC: 5, 7)
  - [x] Стартирай `pnpm --filter @kandles/db generate`
  - [x] Провери генерирания SQL в `packages/db/drizzle/migrations/`
  - [x] Редактирай ръчно migration файла: замени `CREATE INDEX` с `CREATE INDEX CONCURRENTLY IF NOT EXISTS` за GIN индекса
  - [x] Потвърди: migration файловете са committed в git

- [x] Task 10: Обнови `packages/db/tsconfig.json` (техническа необходимост)
  - [x] Добави `"include": ["src/**/*", "drizzle.config.ts"]` за да включи config файла
  - [x] Увери се, че TypeScript компилира без грешки

- [x] Task 11: Провери typecheck (AC: всички)
  - [x] `turbo typecheck` → 0 грешки
  - [x] Провери, че inferred types са правилни (`.inferSelect`, `.inferInsert`)

## Dev Notes

### Нулев downtime при деплой — критично за всички бъдещи migrations

Колегата в Viber групата описа точно болката: грешка при migrations в деплой процеса = паднал сайт. За **нашия стек** (Vercel + Cloudflare Pages) сценарият изглежда така:

```
CI/CD pipeline:
  1. pnpm install
  2. turbo typecheck lint
  3. pnpm --filter @kandles/db migrate   ← DB миграцията ПРЕДИ деплоя
  4. vercel deploy --prod                ← После деплоя на новия код
  5. wrangler pages deploy               ← После деплоя на storefront

КРИТИЧНО: Стъпка 3 трябва да е ПРЕДИ стъпки 4 и 5.
```

**Защо е важно:** Vercel и Cloudflare Pages правят атомарен switch (нов deployment e ready → switch → стар deployment пада). По време на тези ~секунди старият код все още работи срещу НОВАТА схема на базата. Ако новата миграция е добавила NOT NULL колона без DEFAULT, старият код ще гърми.

#### Правила за backwards-compatible migrations (за всички бъдещи stories):

| Операция | Правило | Причина |
|----------|---------|---------|
| ADD COLUMN | Задължително `nullable` OR `DEFAULT` value | Старият код не познава колоната |
| DROP COLUMN | В **отделна** миграция, след като новият код е деплойнат | Старият код чете колоната |
| RENAME COLUMN | ЗАБРАНЕНО — третира се като ADD + DROP в отделни деплои | |
| ADD INDEX | Използвай `CREATE INDEX CONCURRENTLY` | Без lock на таблицата |
| ADD CONSTRAINT | Само ако нова колона, или в отделен деплой | |
| ALTER COLUMN type | Само ако backwards-compatible (varchar → text OK) | |

**За Story 1.3 специфично:** Това е **начална** миграция — няма стар код срещу старата схема. Правилата за backwards-compat важат за **Story 1.4 нататък**.

#### Expand/Contract pattern за деструктивни промени:

```
Deploy N:   ADD новата колона (nullable)
Deploy N:   Новият код пише и в двете колони
Deploy N+1: Мигрирай данните: UPDATE table SET new_col = old_col WHERE new_col IS NULL
Deploy N+2: DROP старата колона
```

### Package Setup — точни версии

```
drizzle-orm:  ^0.45.2  (latest stable 2026-06)
drizzle-kit:  ^0.31.10 (latest stable 2026-06)
postgres:     ^3.4.5   (postgres.js — препоръчаният driver за Node.js)
dotenv:       ^16.0.0  (за drizzle.config.ts в dev)
```

### `packages/db/package.json` — финален вид

```json
{
  "name": "@kandles/db",
  "version": "0.0.1",
  "private": true,
  "exports": {
    ".": { "import": "./src/index.ts" }
  },
  "scripts": {
    "build":    "tsc",
    "typecheck":"tsc --noEmit",
    "generate": "drizzle-kit generate",
    "migrate":  "drizzle-kit migrate",
    "push":     "drizzle-kit push",
    "studio":   "drizzle-kit studio"
  },
  "dependencies": {
    "@kandles/env":   "workspace:*",
    "@kandles/types": "workspace:*",
    "drizzle-orm":    "catalog:",
    "postgres":       "^3.4.5"
  },
  "devDependencies": {
    "typescript":  "catalog:",
    "drizzle-kit": "catalog:",
    "dotenv":      "^16.0.0"
  }
}
```

**Важно:** `drizzle-orm` и `drizzle-kit` в `pnpm-workspace.yaml` catalog за консистентност.

### `drizzle.config.ts` — точна имплементация

```typescript
import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema',
  out: './drizzle/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

**КРИТИЧНО:** `DATABASE_URL` е **директната** PostgreSQL connection URL, НЕ pooled (PgBouncer):
- ✅ `postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres`
- ❌ `postgresql://postgres.[ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true`

Причина: `drizzle-kit migrate` използва `SET LOCK_TIMEOUT` и advisory locks — несъвместими с PgBouncer transaction mode.

### `packages/db/src/index.ts` — точна имплементация

```typescript
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const client = postgres(process.env.DATABASE_URL!)
export const db = drizzle(client, { schema })

// Re-export schema tables
export * from './schema'
```

**Забележка:** `db` клиентът в `index.ts` е за **runtime** употреба в app код. `drizzle.config.ts` е само за `drizzle-kit` CLI.

### Schema файлове — точни имплементации

#### `packages/db/src/schema/enums.ts`

```typescript
import { pgEnum } from 'drizzle-orm/pg-core'

export const seasonEnum = pgEnum('season', ['spring', 'summer', 'autumn', 'winter', 'all'])
export const orderStatusEnum = pgEnum('order_status', ['received', 'in_production', 'ready', 'shipped', 'delivered'])
export const paymentMethodEnum = pgEnum('payment_method', ['card', 'cash_on_delivery'])
export const courierEnum = pgEnum('courier', ['econt', 'speedy', 'manual'])
```

*Забележка: `orderStatusEnum`, `paymentMethodEnum`, `courierEnum` са нужни за Story 1.4 (orders). Дефинирай ги сега за да не се налага промяна на migrations файлове.*

#### `packages/db/src/schema/products.ts`

```typescript
import { pgTable, uuid, varchar, text, numeric, integer, boolean, smallint, timestamp } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { seasonEnum } from './enums'

export const products = pgTable('products', {
  id:              uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  title:           varchar('title', { length: 255 }).notNull(),
  description:     text('description'),
  price:           numeric('price', { precision: 10, scale: 2 }).notNull(),
  stock:           integer('stock').notNull().default(0),
  season:          seasonEnum('season'),
  isLastMinute:    boolean('is_last_minute').default(false),
  isArchived:      boolean('is_archived').default(false),
  productionDays:  smallint('production_days'),
  occasionTags:    text('occasion_tags').array(),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Product    = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
```

#### `packages/db/src/schema/collections.ts`

```typescript
import { pgTable, uuid, varchar, smallint, boolean } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const collections = pgTable('collections', {
  id:               uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name:             varchar('name', { length: 100 }).notNull(),
  slug:             varchar('slug', { length: 100 }).notNull().unique(),
  seasonStartMonth: smallint('season_start_month'),
  seasonEndMonth:   smallint('season_end_month'),
  isActive:         boolean('is_active').default(true),
})

export type Collection    = typeof collections.$inferSelect
export type NewCollection = typeof collections.$inferInsert
```

#### `packages/db/src/schema/product_images.ts`

```typescript
import { pgTable, uuid, text, varchar, smallint, boolean } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { products } from './products'

export const productImages = pgTable('product_images', {
  id:        uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  url:       text('url').notNull(),
  altText:   varchar('alt_text', { length: 255 }).notNull(),  // НИКОГА nullable — AR изискване
  sortOrder: smallint('sort_order').default(0),
  isHero:    boolean('is_hero').default(false),
})

export type ProductImage    = typeof productImages.$inferSelect
export type NewProductImage = typeof productImages.$inferInsert
```

### GIN индекс — ръчна редакция на migration SQL

Drizzle-kit **не генерира** `CREATE INDEX CONCURRENTLY`. След `pnpm generate` трябва ръчно да редактираш migration файла:

```sql
-- Намери генерираната CREATE INDEX линия и я замени с:
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_search
ON products USING GIN(to_tsvector('bulgarian', title || ' ' || coalesce(description, '')));
```

**Алтернатива:** Създай отделен custom migration файл за индекса:
```
packages/db/drizzle/migrations/0001_initial_schema.sql   -- генериран от drizzle-kit
packages/db/drizzle/migrations/0002_products_search_index.sql  -- ръчно създаден
```

`0002_products_search_index.sql`:
```sql
-- Full-text search index (v1.1: UI деферирано, индексът е ready)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_search
ON products USING GIN(to_tsvector('bulgarian', title || ' ' || coalesce(description, '')));
```

Drizzle-kit разпознава custom SQL migration файлове ако ги добавиш и в `meta/_journal.json` — използвай `drizzle-kit generate --custom` за да ги include-неш правилно.

**Важно:** `CONCURRENTLY` означава, че `migrate` стъпката ще отнеме малко повече при deploy (индексирането е in background), но **не заключва таблицата** — критично за production с данни.

### Naming conventions (от architecture.md)

```typescript
// Drizzle table exports: camelCase plural
export const products = pgTable(...)
export const productImages = pgTable(...)

// Drizzle inferred types: PascalCase
export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert

// НЕ: ProductsTable, TProduct, IProduct — само Product и NewProduct
```

### Анти-patterns — ЗАБРАНЕНО

```typescript
// ❌ drizzle-kit push в production — деструктивен, не version-controlled
// Само за local Supabase dev: supabase start + drizzle-kit push

// ❌ process.env директно в app код след тази story
// Само drizzle.config.ts може да чете process.env — всичко друго → @kandles/env

// ❌ nullable alt_text
altText: varchar('alt_text', { length: 255 })  // ГРЕШНО — липсва .notNull()

// ❌ Inventory mutation без transaction
await db.update(products).set({ stock: stock - 1 }).where(...)  // ГРЕШНО — AR-22
// Правилно: SELECT FOR UPDATE в транзакция (Story 1.4+)

// ❌ Нова NOT NULL колона без DEFAULT в migration
ALTER TABLE products ADD COLUMN new_field TEXT NOT NULL  // ГРЕШНО — ще счупи old deploys
// Правилно: ADD COLUMN new_field TEXT (nullable), after full deploy → ADD NOT NULL
```

### Learnings от Story 1.2

- **pnpm path**: `~/.nvm/versions/node/v22.22.3/bin/pnpm` — не е в default PATH
- **turbo path**: `export PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH"` преди turbo команди
- **catalog протокол**: добавяй нови пакети в `pnpm-workspace.yaml` catalog → използвай `"catalog:"` в package.json
- **moduleResolution: "bundler"**: subpath exports работят без допълнителни tsconfig paths
- **`@types/node` в devDeps**: ако пакетът използва `process.env`, добави `@types/node: "catalog:"`

### Директорна структура след Story 1.3

```
packages/db/
  drizzle.config.ts
  src/
    index.ts              ← db client + re-exports
    schema/
      enums.ts            ← pgEnum definitions (season, order_status, etc.)
      products.ts         ← products table + types
      collections.ts      ← collections table + types
      product_images.ts   ← product_images table + types
      index.ts            ← re-export всички schema tables (за drizzle.config.ts schema glob)
  drizzle/
    migrations/
      0001_initial_schema.sql    ← генериран от drizzle-kit
      0002_products_search_index.sql  ← ръчно за CONCURRENTLY GIN index
      meta/
        _journal.json
```

### Проверка на migration idempotency

```bash
# Стартирай migrate два пъти — трябва да е безопасно:
pnpm --filter @kandles/db migrate  # 1ви път — прилага
pnpm --filter @kandles/db migrate  # 2ри път — "No migrations to run" или "Already applied"
```

### DATABASE_URL за Supabase local dev

```bash
# local Supabase (след `supabase start`):
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

# staging/production — в Supabase dashboard → Settings → Database → Connection string → URI
```

## Dev Agent Record

### Debug Log

- **tsconfig rootDir конфликт**: `drizzle.config.ts` е на package root ниво, но `rootDir: ./src` — решено чрез отделен `tsconfig.typecheck.json` без `rootDir` ограничение; `typecheck` скриптът ползва него, `build` скриптът ползва оригиналния `tsconfig.json`.
- **GIN index**: `drizzle-kit generate` не поддържа `CREATE INDEX CONCURRENTLY` — създаден ръчно `0001_products_search_index.sql` и регистриран в `_journal.json`.
- **@types/node**: добавен в devDependencies на `@kandles/db` за `process.env` типиране.

### Completion Notes

Имплементирани всички 11 задачи:
- Drizzle ORM + drizzle-kit инсталирани в `@kandles/db`; `drizzle-orm`/`drizzle-kit` добавени в pnpm catalog
- 4 schema файла: `enums.ts` (4 pgEnum-а включително за Story 1.4+), `products.ts`, `collections.ts`, `product_images.ts`
- `schema/index.ts` re-exports всички таблици за drizzle.config schema glob
- `src/index.ts` експортира `db` client + всички схеми и типове
- `drizzle.config.ts` с direct (non-pooled) PostgreSQL URL
- Migration `0000_marvelous_killer_shrike.sql` генериран от drizzle-kit (3 таблици + 4 enum типа)
- `0001_products_search_index.sql` ръчно създаден с `CREATE INDEX CONCURRENTLY IF NOT EXISTS` за Bulgarian full-text search
- `turbo typecheck` → 10/10 successful, 0 грешки

## File List

- packages/db/package.json *(modified)*
- packages/db/drizzle.config.ts *(new)*
- packages/db/src/index.ts *(modified)*
- packages/db/src/schema/enums.ts *(new)*
- packages/db/src/schema/products.ts *(new)*
- packages/db/src/schema/collections.ts *(new)*
- packages/db/src/schema/product_images.ts *(new)*
- packages/db/src/schema/product_collections.ts *(new)*
- packages/db/src/schema/index.ts *(new)*
- packages/db/scripts/apply-indexes.ts *(new)*
- packages/db/tsconfig.json *(modified)*
- packages/db/tsconfig.typecheck.json *(new)*
- packages/db/drizzle/migrations/0000_marvelous_killer_shrike.sql *(generated)*
- packages/db/drizzle/migrations/0001_natural_toxin.sql *(generated — review patches: product_collections, CHECK constraints, indexes, notNull)*
- packages/db/drizzle/migrations/0002_products_search_index.sql *(new — CONCURRENTLY GIN index, applied via apply-indexes script outside drizzle journal)*
- packages/db/drizzle/migrations/meta/_journal.json *(modified)*
- pnpm-workspace.yaml *(modified — drizzle-orm, drizzle-kit, dotenv, tsx added to catalog)*
- pnpm-lock.yaml *(modified)*
- .env.example *(modified — DATABASE_URL added)*

### Review Findings

- [x] [Review][Decision] Липсва product–collection join таблица — РЕШЕНО: добавена `product_collections` join таблица с composite PK (product_id, collection_id) + CASCADE FKs

- [x] [Review][Patch] `CREATE INDEX CONCURRENTLY` в drizzle-kit миграция ще гръмне — РЕШЕНО: 0001 премахнат от `_journal.json`; GIN index се прилага чрез `pnpm apply-indexes` (scripts/apply-indexes.ts) извън транзакция
- [x] [Review][Patch] `process.env.DATABASE_URL!` в `src/index.ts` заобикаля `@kandles/env` — РЕШЕНО: explicit runtime check + `@kandles/env` (`server-only`) и `@kandles/types` (празен) премахнати от deps
- [x] [Review][Patch] `products.updatedAt` никога не се обновява автоматично — РЕШЕНО: добавен `.$onUpdateFn(() => new Date())`
- [x] [Review][Patch] Boolean и smallint колони са nullable в базата без `notNull()` — РЕШЕНО: `notNull()` добавен на `is_last_minute`, `is_archived`, `is_active`, `sort_order`, `is_hero`
- [x] [Review][Patch] `season_start_month` / `season_end_month` нямат CHECK constraint за 1–12 диапазона — РЕШЕНО: CHECK constraints в collections.ts
- [x] [Review][Patch] Няма индекс върху `product_images.product_id` FK — РЕШЕНО: `product_images_product_id_idx` добавен
- [x] [Review][Patch] `price` се маппва като `string` в JavaScript — РЕШЕНО: JSDoc коментар в products.ts предупреждава за parseFloat()
- [x] [Review][Patch] `@kandles/env` е в `dependencies` но не се импортира никъде — РЕШЕНО: премахнат
- [x] [Review][Patch] `@kandles/types` е в `dependencies` но не се импортира никъде — РЕШЕНО: премахнат
- [x] [Review][Patch] `dotenv` не е в pnpm workspace catalog — РЕШЕНО: добавен в catalog; package.json ползва `"catalog:"`
- [x] [Review][Patch] `push` script е нелабелиран (деструктивен) — РЕШЕНО: преименуван на `push:dev`
- [x] [Review][Patch] `seasonStartMonth > seasonEndMonth` не се валидира — РЕШЕНО: `collections_season_order` CHECK constraint
- [x] [Review][Patch] `price` без CHECK `>= 0` — РЕШЕНО: `products_price_non_negative` CHECK
- [x] [Review][Patch] `stock` без CHECK `>= 0` — РЕШЕНО: `products_stock_non_negative` CHECK
- [x] [Review][Patch] `productionDays` без CHECK `> 0` — РЕШЕНО: `products_production_days_positive` CHECK (IS NULL OR > 0)
- [x] [Review][Patch] Няма индекс на `is_archived` — РЕШЕНО: `products_is_archived_idx` добавен
- [x] [Review][Patch] `url` приема empty string — РЕШЕНО: `product_images_url_not_empty` CHECK
- [x] [Review][Patch] `sortOrder` приема negative smallint — РЕШЕНО: `product_images_sort_order_non_negative` CHECK

- [x] [Review][Defer] [packages/db/drizzle/migrations/meta/] Миграция `0001_products_search_index.sql` е извън drizzle journal (CONCURRENTLY ограничение) — прилага се чрез `apply-indexes` script в CI след `migrate` стъпката [packages/db/scripts/apply-indexes.ts]

## Change Log

- 2026-06-12: Story създадена — core DB schema + Drizzle migration strategy + zero-downtime migration patterns
- 2026-06-12: Имплементация завършена — Drizzle schema (products, collections, product_images, enums), migration файлове, typecheck 0 грешки
- 2026-06-12: Code review patches приложени — product_collections join таблица, CHECK constraints, indexes, notNull fixes, CONCURRENTLY fix, dep cleanup; typecheck 10/10

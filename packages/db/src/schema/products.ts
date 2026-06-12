import { pgTable, uuid, varchar, text, numeric, integer, boolean, smallint, timestamp, index, check } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { seasonEnum } from './enums'

export const products = pgTable('products', {
  id:             uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  title:          varchar('title', { length: 255 }).notNull(),
  description:    text('description'),
  // NOTE: Drizzle returns numeric columns as string in JS — always parseFloat() before arithmetic
  price:          numeric('price', { precision: 10, scale: 2 }).notNull(),
  stock:          integer('stock').notNull().default(0),
  season:         seasonEnum('season'),
  isLastMinute:   boolean('is_last_minute').notNull().default(false),
  isArchived:     boolean('is_archived').notNull().default(false),
  productionDays: smallint('production_days'),
  occasionTags:   text('occasion_tags').array(),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdateFn(() => new Date()),
}, (table) => [
  index('products_is_archived_idx').on(table.isArchived),
  check('products_price_non_negative', sql`${table.price} >= 0`),
  check('products_stock_non_negative', sql`${table.stock} >= 0`),
  check('products_production_days_positive', sql`${table.productionDays} IS NULL OR ${table.productionDays} > 0`),
])

export type Product    = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert

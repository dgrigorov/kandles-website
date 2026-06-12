import { pgTable, uuid, varchar, smallint, boolean, check } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const collections = pgTable('collections', {
  id:               uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name:             varchar('name', { length: 100 }).notNull(),
  slug:             varchar('slug', { length: 100 }).notNull().unique(),
  seasonStartMonth: smallint('season_start_month'),
  seasonEndMonth:   smallint('season_end_month'),
  isActive:         boolean('is_active').notNull().default(true),
}, (table) => [
  check('collections_season_start_range', sql`${table.seasonStartMonth} IS NULL OR (${table.seasonStartMonth} >= 1 AND ${table.seasonStartMonth} <= 12)`),
  check('collections_season_end_range', sql`${table.seasonEndMonth} IS NULL OR (${table.seasonEndMonth} >= 1 AND ${table.seasonEndMonth} <= 12)`),
  check('collections_season_order', sql`${table.seasonStartMonth} IS NULL OR ${table.seasonEndMonth} IS NULL OR ${table.seasonStartMonth} <= ${table.seasonEndMonth}`),
])

export type Collection    = typeof collections.$inferSelect
export type NewCollection = typeof collections.$inferInsert

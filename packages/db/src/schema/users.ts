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

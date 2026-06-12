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

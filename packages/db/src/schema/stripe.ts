import { pgTable, varchar, timestamp } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const stripeWebhookEvents = pgTable('stripe_webhook_events', {
  stripeEventId: varchar('stripe_event_id', { length: 64 }).primaryKey(),
  processedAt:   timestamp('processed_at', { withTimezone: true }).notNull().default(sql`now()`),
})

export type StripeWebhookEvent = typeof stripeWebhookEvents.$inferSelect

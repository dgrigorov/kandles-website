import { pgTable, uuid, varchar, numeric, smallint, boolean, timestamp, jsonb, check } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { orderStatusEnum, paymentMethodEnum, courierEnum } from './enums'
import { users } from './users'

export const orders = pgTable('orders', {
  id:                    uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId:                uuid('user_id').references(() => users.id),
  guestEmail:            varchar('guest_email', { length: 255 }),
  status:                orderStatusEnum('status').notNull().default('received'),
  paymentMethod:         paymentMethodEnum('payment_method').notNull(),
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 64 }).unique(),
  trackingNumber:        varchar('tracking_number'),
  courier:               courierEnum('courier'),
  giftWrap:              boolean('gift_wrap').notNull().default(false),
  giftCardText:          varchar('gift_card_text', { length: 150 }),
  previewUploadedAt:     timestamp('preview_uploaded_at', { withTimezone: true }),
  approvedAt:            timestamp('approved_at', { withTimezone: true }),
  correctionCount:       smallint('correction_count').notNull().default(0),
  totalPrice:            numeric('total_price', { precision: 10, scale: 2 }).notNull(),
  shippingAddress:       jsonb('shipping_address').notNull(),
  createdAt:             timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:             timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdateFn(() => new Date()),
}, (table) => [
  check('orders_correction_count_check', sql`${table.correctionCount} >= 0 AND ${table.correctionCount} <= 1`),
  check('orders_identity_check', sql`${table.userId} IS NOT NULL OR ${table.guestEmail} IS NOT NULL`),
  check('orders_total_price_non_negative', sql`${table.totalPrice} >= 0`),
  check('orders_gift_card_text_check', sql`${table.giftCardText} IS NULL OR ${table.giftWrap} = true`),
])

export type Order    = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert

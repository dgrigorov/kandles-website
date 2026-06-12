import { pgTable, uuid, varchar, smallint, timestamp, check } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { products } from './products'
import { orders } from './orders'

export const cartReservations = pgTable('cart_reservations', {
  id:        uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  productId: uuid('product_id').notNull().references(() => products.id),
  quantity:  smallint('quantity').notNull(),
  sessionId: varchar('session_id', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  orderId:   uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check('cart_reservations_quantity_positive', sql`${table.quantity} > 0`),
])

export type CartReservation    = typeof cartReservations.$inferSelect
export type NewCartReservation = typeof cartReservations.$inferInsert

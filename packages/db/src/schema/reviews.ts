import { pgTable, uuid, text, smallint, boolean, timestamp, check } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { products } from './products'
import { orders } from './orders'

export const reviews = pgTable('reviews', {
  id:         uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  productId:  uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  orderId:    uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
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

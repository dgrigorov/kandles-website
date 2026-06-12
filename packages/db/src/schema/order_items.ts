import { pgTable, uuid, varchar, text, smallint, numeric, check, index } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { orders } from './orders'
import { products } from './products'

export const orderItems = pgTable('order_items', {
  id:               uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orderId:          uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId:        uuid('product_id').notNull().references(() => products.id),
  quantity:         smallint('quantity').notNull(),
  unitPrice:        numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  snapshotTitle:    varchar('snapshot_title', { length: 255 }).notNull(),
  snapshotImageUrl: text('snapshot_image_url'),
}, (table) => [
  check('order_items_quantity_positive', sql`${table.quantity} > 0`),
  check('order_items_unit_price_non_negative', sql`${table.unitPrice} >= 0`),
  index('order_items_order_id_idx').on(table.orderId),
])

export type OrderItem    = typeof orderItems.$inferSelect
export type NewOrderItem = typeof orderItems.$inferInsert

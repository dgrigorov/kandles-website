import { pgTable, uuid, text, varchar, smallint, boolean, index, check } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { products } from './products'

export const productImages = pgTable('product_images', {
  id:        uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  url:       text('url').notNull(),
  altText:   varchar('alt_text', { length: 255 }).notNull(),
  sortOrder: smallint('sort_order').notNull().default(0),
  isHero:    boolean('is_hero').notNull().default(false),
}, (table) => [
  index('product_images_product_id_idx').on(table.productId),
  check('product_images_url_not_empty', sql`char_length(${table.url}) > 0`),
  check('product_images_sort_order_non_negative', sql`${table.sortOrder} >= 0`),
])

export type ProductImage    = typeof productImages.$inferSelect
export type NewProductImage = typeof productImages.$inferInsert

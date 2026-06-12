import { pgTable, uuid, smallint, primaryKey } from 'drizzle-orm/pg-core'
import { products } from './products'
import { collections } from './collections'

export const productCollections = pgTable('product_collections', {
  productId:    uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  collectionId: uuid('collection_id').notNull().references(() => collections.id, { onDelete: 'cascade' }),
  sortOrder:    smallint('sort_order').notNull().default(0),
}, (table) => [
  primaryKey({ columns: [table.productId, table.collectionId] }),
])

export type ProductCollection    = typeof productCollections.$inferSelect
export type NewProductCollection = typeof productCollections.$inferInsert

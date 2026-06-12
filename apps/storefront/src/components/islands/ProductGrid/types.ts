export interface ProductImage {
  url: string
  alt_text: string
  is_hero: boolean
  sort_order: number
}

export interface ProductWithImages {
  id: string
  title: string
  price: string  // PostgreSQL numeric → string; parseFloat() before display
  stock: number
  occasion_tags: string[] | null
  product_images: ProductImage[]
}

export const OCCASIONS = [
  'Рожден ден',
  'Коледа',
  '8-ми март',
  'Сватба',
  'Кръщене',
] as const

export type Occasion = typeof OCCASIONS[number]

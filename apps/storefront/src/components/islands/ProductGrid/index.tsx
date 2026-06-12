import { useState } from 'react'
import type { ProductWithImages, Occasion } from './types'
import OccasionFilter from './OccasionFilter'
import ProductCard from './ProductCard'

interface ProductGridProps {
  products: ProductWithImages[]
}

export default function ProductGrid({ products }: ProductGridProps) {
  const [selectedOccasion, setSelectedOccasion] = useState<Occasion | null>(null)

  function handleOccasionSelect(occasion: Occasion) {
    setSelectedOccasion(prev => (prev === occasion ? null : occasion))
  }

  const filtered = selectedOccasion
    ? products.filter(p => p.occasion_tags?.includes(selectedOccasion) ?? false)
    : products

  return (
    <div className="py-16 px-4 md:px-8 max-w-6xl mx-auto">
      <OccasionFilter
        selectedOccasion={selectedOccasion}
        onSelect={handleOccasionSelect}
      />

      <div
        role="region"
        aria-label="Списък с продукти"
        aria-live="polite"
        aria-atomic="false"
      >
        {filtered.length === 0 ? (
          <p
            className="text-center py-16 text-[var(--color-chocolate)] opacity-60"
            style={{ fontFamily: 'var(--font-ui)' }}
          >
            Няма продукти за избрания повод.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            {filtered.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

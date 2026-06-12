import type { ProductWithImages, ProductImage } from './types'
import styles from './ProductCard.module.css'

function getHeroImage(images: ProductImage[]): ProductImage | null {
  return (
    images.find(img => img.is_hero) ??
    [...images].sort((a, b) => a.sort_order - b.sort_order)[0] ??
    null
  )
}

function formatPrice(priceStr: string): string {
  const price = parseFloat(priceStr)
  if (isNaN(price)) return '—'
  return price % 1 === 0
    ? `${price.toFixed(0)} лв.`
    : `${price.toFixed(2)} лв.`
}

interface ProductCardProps {
  product: ProductWithImages
}

export default function ProductCard({ product }: ProductCardProps) {
  const hero = getHeroImage(product.product_images)
  const isOutOfStock = product.stock === 0
  const isLowStock = product.stock > 0 && product.stock <= 5

  return (
    <article
      className={`${styles.card} group relative flex flex-col bg-white hover:[box-shadow:0_0_0_2px_var(--color-amber)] focus-within:[box-shadow:0_0_0_2px_var(--color-amber)] transition-shadow`}
    >
      {/* Hero image */}
      <div className="relative aspect-square overflow-hidden bg-[var(--color-sand)]">
        {hero ? (
          <img
            src={hero.url}
            alt={hero.alt_text}
            className="w-full h-full object-cover"
            loading="eager"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--color-chocolate)] opacity-30">
            <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48" aria-hidden="true">
              <path d="M12 2C12 2 7 8.5 7 13a5 5 0 0010 0C17 8.5 12 2 12 2z" />
            </svg>
          </div>
        )}

        {/* Out-of-stock badge — always visible */}
        {isOutOfStock && (
          <span
            className="absolute top-2 right-2 px-2 py-0.5 text-xs font-medium uppercase tracking-wide rounded bg-[var(--color-copper)] text-[var(--color-cream)]"
            aria-label="Изчерпан продукт"
          >
            Изчерпан
          </span>
        )}

        {/* Low-stock badge — visible only on hover/focus */}
        {isLowStock && (
          <span
            className="absolute top-2 right-2 px-2 py-0.5 text-xs font-medium uppercase tracking-wide rounded bg-[var(--color-amber)] text-[var(--color-cream)] opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
            aria-label={`Само ${product.stock} броя налични`}
          >
            Само {product.stock} броя
          </span>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-1 p-3">
        <h2
          className="text-[18px] leading-snug text-[var(--color-chocolate)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {product.title}
        </h2>
        <p
          className="text-[16px] text-[var(--color-amber)]"
          style={{ fontFamily: 'var(--font-ui)' }}
        >
          {formatPrice(product.price)}
        </p>
      </div>

      {/* Add to cart */}
      <div className="mt-auto p-3 pt-0">
        <button
          type="button"
          disabled={isOutOfStock}
          aria-disabled={isOutOfStock}
          className={`w-full py-2 px-4 text-sm font-medium uppercase tracking-widest rounded transition-opacity
            ${isOutOfStock
              ? 'bg-[var(--color-sand)] text-[var(--color-chocolate)] opacity-50 cursor-not-allowed'
              : 'bg-[var(--color-chocolate)] text-[var(--color-cream)] hover:opacity-90 focus:outline focus:outline-2 focus:outline-[var(--color-amber)] focus:outline-offset-2'
            }`}
          style={{ fontFamily: 'var(--font-ui)' }}
        >
          {isOutOfStock ? 'Изчерпан' : 'Добави'}
        </button>
      </div>
    </article>
  )
}

---
status: done
baseline_commit: 67e105a4e679ad422fc0ff195aaf6283d53c3926
---

# Story 2.3: Product grid + occasion filter React Island

Status: done

## Story

As a buyer,
I want to browse products filtered by occasion without page reload,
So that I quickly find the right gift for my specific event.

## Acceptance Criteria

1. **Given** the product grid section
   **Then** it renders 2 columns on mobile, 3 columns on desktop with `gap: 24px` mobile / `32px` desktop

2. **Given** 5 occasion filter tiles above the grid
   **Then** they form a `role="radiogroup"`, each tile is `role="radio"`, navigable via Space/Enter
   **And** selected tile shows 2px amber border; unselected tiles show no border

3. **Given** an occasion tile is activated
   **When** clicked or Space/Enter pressed
   **Then** product grid filters without page reload (React Island state update — no navigation)

4. **Given** a product card
   **Then** it shows: hero image, product name (Cormorant Garamond 18px), price in BGN (Jost 16px) — no other elements by default

5. **Given** a product with `stock > 0` and `stock ≤ 5`
   **Then** "Само X броя" badge appears only on card hover/focus (amber bg + cream text, `aria-label="Само X броя налични"`)

6. **Given** a product with `stock = 0`
   **Then** "Изчерпан" badge is always visible (copper bg + cream text)
   **And** add-to-cart button is `disabled` with `aria-disabled="true"` and `cursor-not-allowed`

7. **Given** CSS Scroll-Driven Animation (AR-25)
   **Then** product cards use `@keyframes cardReveal` with `animation-timeline: view()` for scroll-based reveal
   **And** `@supports (animation-timeline: view())` guard prevents broken behavior on older browsers
   **And** `@media (prefers-reduced-motion: reduce)` disables animation

8. **Given** card hover interaction
   **Then** `box-shadow: 0 0 0 2px var(--color-amber)` appears (no `width`/`height`/`transform` — zero CLS)

9. **Given** storefront reads products
   **Then** Supabase anon key query filters `is_archived = false` and orders by `created_at DESC`
   **And** each product's hero image is fetched via nested `product_images` select

10. **Given** no products match the selected occasion filter
    **Then** a Bulgarian-language empty state message is shown

## Tasks / Subtasks

- [x] Task 1: Install React integration (AC: all — prerequisite)
  - [x] Add `@astrojs/react`, `react`, `react-dom` to `apps/storefront/package.json` dependencies
  - [x] Add `@types/react`, `@types/react-dom` to devDependencies (catalog: refs)
  - [x] Add `react()` integration to `apps/storefront/astro.config.ts`
  - [x] Run `pnpm install` to update lockfile

- [x] Task 2: Create `ProductCard.tsx` component (AC: 4, 5, 6, 7, 8)
  - [x] Create `apps/storefront/src/components/islands/ProductGrid/types.ts` with shared types
  - [x] Create `apps/storefront/src/components/islands/ProductGrid/ProductCard.module.css` with `@keyframes cardReveal` + `animation-timeline: view()` + `@supports` guard + `prefers-reduced-motion`
  - [x] Create `apps/storefront/src/components/islands/ProductGrid/ProductCard.tsx` (exact content in Dev Notes)

- [x] Task 3: Create `OccasionFilter.tsx` component (AC: 2, 3)
  - [x] Create `apps/storefront/src/components/islands/ProductGrid/OccasionFilter.tsx` (exact content in Dev Notes)
  - [x] 5 occasion tiles: "Рожден ден", "Коледа", "8-ми март", "Сватба", "Кръщене"
  - [x] `role="radiogroup"` + `role="radio"` + `aria-checked` + Space/Enter keyboard handler

- [x] Task 4: Create `ProductGrid/index.tsx` island (AC: 1, 2, 3, 9, 10)
  - [x] Create `apps/storefront/src/components/islands/ProductGrid/index.tsx` (exact content in Dev Notes)
  - [x] State: `selectedOccasion: string | null` — null = show all
  - [x] Filter: `product.occasion_tags?.includes(selectedOccasion)` when occasion selected
  - [x] `aria-live="polite"` on grid container for AT announcement

- [x] Task 5: Wire island in `index.astro` (AC: 1, 9)
  - [x] Fetch products via `createServerSupabaseClient()` in Astro frontmatter
  - [x] Query: `select('id, title, price, stock, occasion_tags, product_images(url, alt_text, is_hero, sort_order)')` `.eq('is_archived', false)` `.order('created_at', { ascending: false })`
  - [x] Replace `<!-- TODO: ProductGrid React Island added in Story 2.3 -->` with `<ProductGrid client:visible products={products ?? []} />`
  - [x] Handle `error` from Supabase (log to console, pass empty array on error)
  - [x] Import `ProductGrid` from `../components/islands/ProductGrid`

- [x] Task 6: Validate (AC: all)
  - [x] `pnpm --filter @kandles/storefront lint` → 0 errors
  - [x] `pnpm --filter @kandles/storefront build` (Node 22) → clean
  - [x] TypeScript: `pnpm --filter @kandles/storefront typecheck` → expected to fail on Node v20; use Node 22 if checking

## Dev Notes

### Architecture Context

**This is the first React island in the storefront.** `@astrojs/react` is NOT yet installed. Installing it is Task 1 — do it before writing any React component.

**Astro output mode**: `astro.config.ts` currently has `output: 'server'` (SSR). The architecture doc says `output: 'hybrid'` but Story 1.6 implemented `'server'` for Cloudflare adapter. Leave as `'server'` — do NOT change.

**Islands directory**: Architecture specifies `src/components/islands/` for React islands. Create the full path: `src/components/islands/ProductGrid/`.

**Data fetching pattern** (CRITICAL):
- Supabase client at `src/lib/supabase.ts` is **server-only** (comment says "Do NOT import this in React islands")
- Fetch products in Astro frontmatter, pass as props to React island
- React island receives `products: ProductWithImages[]` as a prop — no client-side Supabase calls

**`price` is a string** (Drizzle `numeric` → PostgreSQL `numeric` → Supabase JS returns string). Always `parseFloat(product.price)` before arithmetic or display.

**`occasion_tags` is a PostgreSQL `text[]`** → Supabase JS returns `string[] | null`. Filter: `product.occasion_tags?.includes(selectedOccasion) ?? false`.

**5 occasion tiles vs 6 PRD occasions**: Epic AC specifies 5 tiles. PRD FR-3 lists 6 occasions ("Рожден ден, Коледа, 8-ми март, Сватба, Кръщене, Просто така"). Use 5: "Рожден ден", "Коледа", "8-ми март", "Сватба", "Кръщене". Products tagged "Просто така" appear when no filter is active (show all). Note this in constants for easy update.

**Radiogroup no-always-selected**: The epic specifies `role="radiogroup"` but the UX has a deselectable state (no tile selected = show all). Implement `role="radiogroup"` per spec; allow deselection by clicking active tile — `aria-checked="false"` on all tiles is valid and means "no filter active". Screen reader announces "no tile selected" as "none of the options selected".

**Scroll-Driven Animations browser support**: Chrome 115+, Safari 18+, Firefox 110+ (behind flag until 114). Use `@supports (animation-timeline: view())` guard. Cards are VISIBLE without animation in unsupported browsers (no fallback animation, just immediate visibility). Never hide cards in unsupported browsers.

**CSS modules for React**: Use `ProductCard.module.css` for `@keyframes` + `animation-timeline` (can't be done with Tailwind). Import via `import styles from './ProductCard.module.css'`. Vite (Astro's bundler) supports CSS modules natively.

**`client:visible` directive**: Use `<ProductGrid client:visible>` in index.astro — island hydrates when scrolled near viewport. Better for LCP than `client:load`. The pre-rendered HTML output (SSR mode) renders nothing for a `client:visible` island on initial paint — use a server-side rendered placeholder or accept that the grid appears after scroll. Alternatively, `client:load` ensures grid renders immediately after page JS loads. For product grid below the hero, `client:visible` is correct.

**Actually**: In Astro SSR mode (`output: 'server'`), React islands with `client:visible` are NOT server-rendered to HTML — they only hydrate client-side. This means products appear after JS loads. For SEO, this is acceptable because the homepage is primarily a brand landing page, not a product listing page (separate listing pages handled in Story 2.6). Use `client:visible` for lazy loading, but note the grid is JS-dependent.

**Supabase query — Nested select**:

In Supabase JS v2, to get product images via the FK relation, use:
```typescript
const { data: products, error } = await supabase
  .from('products')
  .select(`
    id,
    title,
    price,
    stock,
    occasion_tags,
    product_images (
      url,
      alt_text,
      is_hero,
      sort_order
    )
  `)
  .eq('is_archived', false)
  .order('created_at', { ascending: false })
```
Note: nested select column names are **DB column names** (snake_case): `alt_text`, `is_hero`, `sort_order` — NOT the Drizzle camelCase names.

**Hero image selection**:
```typescript
function getHeroImage(images: ProductImage[]) {
  return images.find(img => img.is_hero)
    ?? images.sort((a, b) => a.sort_order - b.sort_order)[0]
    ?? null
}
```

**Empty product images**: `product.product_images` from Supabase nested select is always `ProductImage[]` (never null) — it's an empty array `[]` if no images. Handle gracefully with a placeholder.

**Color tokens for components** (from `tokens.css`):
- `--color-amber: #B5621E`
- `--color-chocolate: #5A2D0C`
- `--color-cream: #EDE0CC`
- `--color-copper: #C47830`
- Semantic: `--color-bg`, `--color-text`, `--color-accent` (only inside `[data-theme]` blocks)
- Font: `--font-display: 'Cormorant Garamond', serif` | `--font-ui: 'Jost', sans-serif`

### Exact File Content

#### `apps/storefront/package.json` (MODIFY — add react deps)

Add to `dependencies`:
```json
"@astrojs/react": "^4.0.0",
"react": "catalog:",
"react-dom": "catalog:"
```
Add to `devDependencies`:
```json
"@types/react": "catalog:",
"@types/react-dom": "catalog:"
```

#### `apps/storefront/astro.config.ts` (MODIFY — add react integration)

```typescript
import { defineConfig } from 'astro/config'
import cloudflare from '@astrojs/cloudflare'
import tailwind from '@astrojs/tailwind'
import react from '@astrojs/react'
import sentry from '@sentry/astro'

export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  integrations: [
    tailwind(),
    react(),
    sentry({
      dsn: process.env.SENTRY_DSN_STOREFRONT,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      sourceMapsUploadOptions: {
        project: process.env.SENTRY_PROJECT_STOREFRONT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
        org: process.env.SENTRY_ORG,
      },
      tunnel: '/api/sentry-tunnel',
    }),
  ],
})
```

#### `apps/storefront/src/components/islands/ProductGrid/types.ts` (NEW)

```typescript
export interface ProductImage {
  url: string
  alt_text: string
  is_hero: boolean
  sort_order: number
}

export interface ProductWithImages {
  id: string
  title: string
  price: string  // PostgreSQL numeric → string; use parseFloat() before display
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
```

#### `apps/storefront/src/components/islands/ProductGrid/ProductCard.module.css` (NEW)

```css
/* Scroll-Driven Animation — AR-25 Layer 1 */
/* Cards are always visible without @supports — no hidden fallback */

@keyframes cardReveal {
  from {
    opacity: 0;
    transform: translateY(1.5rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@supports (animation-timeline: view()) {
  @media not (prefers-reduced-motion: reduce) {
    .card {
      animation: cardReveal linear both;
      animation-timeline: view();
      animation-range: entry 0% entry 30%;
    }
  }
}
```

#### `apps/storefront/src/components/islands/ProductGrid/ProductCard.tsx` (NEW)

```tsx
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
      className={`${styles.card} group relative flex flex-col bg-white focus-within:[box-shadow:0_0_0_2px_var(--color-amber)] hover:[box-shadow:0_0_0_2px_var(--color-amber)] transition-shadow`}
    >
      {/* Hero image */}
      <div className="relative aspect-square overflow-hidden bg-[var(--color-sand)]">
        {hero ? (
          <img
            src={hero.url}
            alt={hero.alt_text}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--color-chocolate)] opacity-30">
            {/* placeholder until real image */}
            <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48" aria-hidden="true">
              <path d="M12 2C12 2 7 8.5 7 13a5 5 0 0010 0C17 8.5 12 2 12 2z"/>
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

      {/* Add to cart button */}
      <div className="mt-auto p-3 pt-0">
        <button
          type="button"
          disabled={isOutOfStock}
          aria-disabled={isOutOfStock}
          className={`w-full py-2 px-4 text-sm font-medium uppercase tracking-widest rounded transition-opacity
            ${isOutOfStock
              ? 'bg-[var(--color-sand)] text-[var(--color-chocolate)] opacity-50 cursor-not-allowed'
              : 'bg-[var(--color-chocolate)] text-[var(--color-cream)] hover:opacity-90 focus:outline-2 focus:outline-[var(--color-amber)] focus:outline-offset-2'
            }`}
          style={{ fontFamily: 'var(--font-ui)' }}
        >
          {isOutOfStock ? 'Изчерпан' : 'Добави'}
        </button>
      </div>
    </article>
  )
}
```

#### `apps/storefront/src/components/islands/ProductGrid/OccasionFilter.tsx` (NEW)

```tsx
import { OCCASIONS, type Occasion } from './types'

interface OccasionFilterProps {
  selectedOccasion: Occasion | null
  onSelect: (occasion: Occasion) => void
}

export default function OccasionFilter({ selectedOccasion, onSelect }: OccasionFilterProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Филтрирай по повод"
      className="flex flex-wrap gap-3 mb-8"
    >
      {OCCASIONS.map((occasion) => {
        const isSelected = selectedOccasion === occasion
        return (
          <button
            key={occasion}
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(occasion)}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault()
                onSelect(occasion)
              }
            }}
            className={`px-4 py-2 text-sm uppercase tracking-wide rounded transition-colors
              ${isSelected
                ? 'border-2 border-[var(--color-amber)] text-[var(--color-chocolate)] bg-transparent'
                : 'border-2 border-transparent text-[var(--color-chocolate)] bg-[var(--color-sand)] hover:border-[var(--color-amber)] hover:border-opacity-50'
              }`}
            style={{ fontFamily: 'var(--font-ui)' }}
          >
            {occasion}
          </button>
        )
      })}
    </div>
  )
}
```

#### `apps/storefront/src/components/islands/ProductGrid/index.tsx` (NEW)

```tsx
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
    // Toggle: clicking selected occasion deselects (shows all)
    setSelectedOccasion(prev => prev === occasion ? null : occasion)
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
        aria-label="Продукти"
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
```

#### `apps/storefront/src/pages/index.astro` (MODIFY — wire ProductGrid island)

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro'
import HeroSection from '../components/ui/HeroSection.astro'
import ProductGrid from '../components/islands/ProductGrid/index'
import { createServerSupabaseClient } from '../lib/supabase'

const supabase = createServerSupabaseClient()
const { data: products, error } = await supabase
  .from('products')
  .select(`
    id,
    title,
    price,
    stock,
    occasion_tags,
    product_images (
      url,
      alt_text,
      is_hero,
      sort_order
    )
  `)
  .eq('is_archived', false)
  .order('created_at', { ascending: false })

if (error) {
  console.error('[index] products fetch error:', error.message)
}
---

<BaseLayout title="Kandles.bg | Ръчно изработени свещи от Стефка Григорова">
  <!-- Hero image preload — must be in <head> for LCP (UX-DR5) -->
  <link
    slot="head"
    rel="preload"
    as="image"
    fetchpriority="high"
    href="/images/hero-poster.jpg"
  />

  <main id="main-content">
    <HeroSection />

    <section id="produkti" aria-label="Продукти">
      <ProductGrid client:visible products={products ?? []} />
    </section>
  </main>
</BaseLayout>
```

### Key Gotchas

1. **`product_images` nested select returns snake_case** — `alt_text`, `is_hero`, `sort_order` — NOT camelCase. The `types.ts` interface must match: `alt_text: string`, `is_hero: boolean`, `sort_order: number`.

2. **Drizzle `numeric` → Supabase string** — `price` column comes back as `"25.00"` (string). `parseFloat()` required before arithmetic or comparison.

3. **`client:visible` = no SSR HTML** — In Astro SSR mode, `client:visible` islands are NOT rendered to initial HTML. The product grid appears only after JS hydrates. This is intentional (lazy load) and acceptable for the #produkti section below the fold.

4. **`import ProductGrid from '../components/islands/ProductGrid/index'`** — Astro requires the full `index` filename for React components (or add `.tsx` extension). Alternatively: `import ProductGrid from '../components/islands/ProductGrid'` may work via folder resolution — test both.

5. **CSS module + Tailwind coexistence** — `styles.card` class from CSS module coexists with Tailwind classes in `className`. No conflict. The module class applies `@keyframes cardReveal`.

6. **`focus-within` for group hover** — low-stock badge uses `group-focus-within:opacity-100` (card receives focus when button inside is focused). Requires `group` class on `<article>` and `focus-within` variant. Check Tailwind v3 supports this — it does.

7. **`hover:[box-shadow:...]` arbitrary Tailwind value** — Tailwind v3 supports arbitrary values with `[]`. The `box-shadow` on hover must not use `outline` (which would trigger CLS reflow). Box-shadow doesn't affect layout.

8. **`@astrojs/react` version** — Must be compatible with Astro 6.4.3. Use `^4.0.0` (Astro 6 ecosystem). Do NOT use v3.x (Astro 5 era).

9. **`react` and `react-dom` in dependencies** — Unlike `packages/ui` which uses `peerDependencies`, the **storefront application** needs `react` + `react-dom` in `dependencies` directly (app, not library). Use `"catalog:"` ref to resolve `^19.0.0` from workspace catalog.

10. **`@types/react` in devDependencies** — Use `"catalog:"` ref. Already defined in catalog as `^19.0.0`.

### Deferred / Out of Scope

- Add-to-cart functionality (cart state + Supabase write) — Story 4.1
- Product detail page link on card click — Story 2.4
- `<picture>` with WebP for product images — Story 2.4 (product page)
- Occasion landing pages at `/kolektsii/:slug` — Story 2.6
- Scroll-lock-free animations with `will-change: transform` — Story 2.10 (Lenis)
- "Последна минута" section — Story 2.5
- Product count announced to AT after filter — Covered by `aria-live="polite"` on the grid, no extra work
- Keyboard arrow key navigation within radiogroup (ARIA pattern requires it for strict compliance) — defer to Story 2.7 a11y hardening

### Previous Story Learnings (2.1 + 2.2)

- `pnpm turbo typecheck` fails on Node v20 — use `pnpm --filter @kandles/storefront build` with Node 22 for validation
- `pnpm --filter @kandles/storefront lint` → 0 errors expected
- Node 22 path: `PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH"` before pnpm build
- `@sentry/cloudflare` is already installed (fixed in 2.2) — build should be clean
- CSS vars `--color-bg` / `--color-text` / `--color-accent` only defined inside `[data-theme="..."]` blocks — the product grid section is NOT inside a `data-theme` wrapper; use direct CSS vars (`--color-amber`, `--color-chocolate`, etc.) or add `data-theme="light"` to the `#produkti` section
- `src/components/ui/` exists from Story 2.2 — create `src/components/islands/` as a NEW sibling directory

### `data-theme` for product grid section

The `#produkti` section sits outside any `data-theme` wrapper. The hero has `data-theme="dark"` but the product grid should have `data-theme="light"` (sand bg, chocolate text, copper accent) for contrast. Add `data-theme="light"` to `<section id="produkti">` in `index.astro` — the `[data-theme="light"]` CSS rule (from tokens.css Story 2.1) sets `--color-bg: var(--color-sand); --color-text: var(--color-chocolate); --color-accent: var(--color-copper)`. The `ProductGrid` component uses direct CSS vars not semantic ones, so `data-theme` on the section is optional but recommended for visual correctness.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Build clean on first attempt — no issues
- Lint 0 errors — all TSX files pass ESLint
- `@astrojs/react@4.4.2` installed (^4.0.0 resolved to latest 4.x)
- `@astrojs/tailwind` peer dep warning pre-existing from Story 2.1 (in deferred-work.md)

### Completion Notes List

- Installed `@astrojs/react@4.4.2`, `react@19`, `react-dom@19`, `@types/react@19`, `@types/react-dom@19` via catalog refs
- Added `react()` integration to `astro.config.ts` between `tailwind()` and `sentry()`
- Created `src/components/islands/ProductGrid/` directory with 5 files
- `types.ts`: `ProductImage`, `ProductWithImages` interfaces + `OCCASIONS` const (5 tiles) + `Occasion` type
- `ProductCard.module.css`: `@keyframes cardReveal` + `@supports (animation-timeline: view())` guard + `prefers-reduced-motion` guard
- `ProductCard.tsx`: hero image selection, `formatPrice()` (parseFloat + Bulgarian format), out-of-stock badge (always visible), low-stock badge (hover/focus only via CSS group), amber box-shadow on hover (no CLS), disabled add-to-cart for stock=0
- `OccasionFilter.tsx`: 5 tiles, `role="radiogroup"`, each `role="radio"` with `aria-checked`, click + Space/Enter handlers, deselectable (toggle behavior)
- `index.tsx`: `useState<Occasion | null>`, filter logic, `aria-live="polite"` on results, Bulgarian empty state message, 2-col mobile / 3-col desktop grid
- `index.astro`: Supabase nested select query, `client:visible` directive, `data-theme="light"` on `#produkti` section, error logging

### File List

- `apps/storefront/package.json` — modified: added @astrojs/react, react, react-dom, @types/react, @types/react-dom
- `apps/storefront/astro.config.ts` — modified: added react() integration import + usage
- `apps/storefront/src/components/islands/ProductGrid/types.ts` — new
- `apps/storefront/src/components/islands/ProductGrid/ProductCard.module.css` — new
- `apps/storefront/src/components/islands/ProductGrid/ProductCard.tsx` — new
- `apps/storefront/src/components/islands/ProductGrid/OccasionFilter.tsx` — new
- `apps/storefront/src/components/islands/ProductGrid/index.tsx` — new
- `apps/storefront/src/pages/index.astro` — modified: added Supabase fetch + ProductGrid island
- `pnpm-lock.yaml` — modified: lockfile updated with new deps
- `_bmad-output/implementation-artifacts/2-3-product-grid-occasion-filter-react-island.md` — status + tasks updated
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — story status updated

### Review Findings

- [x] [Review][Patch] P1: `focus:outline-2` missing `focus:outline` — focus ring invisible on button [ProductCard.tsx:95] ✅ fixed
- [x] [Review][Patch] P2: Duplicate `"Продукти"` region label on nested landmarks [index.tsx:29] ✅ fixed
- [x] [Review][Patch] P3: `formatPrice` no NaN guard — `""` or null price → `"NaN лв."` [ProductCard.tsx:12] ✅ fixed
- [x] [Review][Patch] P4: `loading="lazy"` inside `client:visible` island — double-deferral [ProductCard.tsx:39] ✅ fixed
- [x] [Review][Defer] D1: Arrow-key navigation missing on `role="radiogroup"` [OccasionFilter.tsx:18] — deferred, Story 2.7 a11y hardening
- [x] [Review][Defer] D2: ARIA radiogroup all `aria-checked=false` simultaneously — deferred, Story 2.7 a11y hardening
- [x] [Review][Defer] D3: Silent Supabase error log — no user-facing error state — deferred, future story

## Change Log

- 2026-06-12: Story 2.3 implemented — React island ProductGrid with occasion filter, Supabase server-side fetch, scroll-driven animation, stock badges, amber hover ring
- 2026-06-12: Code review — 4 patches applied, 3 deferred, 5 dismissed

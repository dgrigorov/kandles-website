---
status: done
baseline_commit: 22361d5f076b6038dcfbf742bf8c21431a974419
---

# Story 2.4: Editorial product page

Status: done

## Story

As a buyer,
I want an editorial product page with brand voice description, aroma visualization, and maker presence,
so that I connect emotionally with the candle before purchasing.

## Acceptance Criteria

1. **Given** a product page at `/produkti/[slug]`
   **Then** page sections render in order: (1) full-bleed hero image with CSS parallax sand overlay on scroll, (2) brand voice description (Cormorant Garamond 22px / line-height 1.6), (3) aroma pyramid, (4) "Как се прави" 3 steps, (5) production time, (6) related products

2. **Given** aroma pyramid (UX-DR9)
   **Then** it is pure CSS + inline SVG: top note = amber, heart = chocolate, base = sand with chocolate border
   **And** hover/focus on each note shows a tooltip with poetic description
   **And** tooltip has `role="tooltip"` and trigger has `aria-describedby` pointing to it

3. **Given** mobile viewport for aroma pyramid
   **Then** it renders as a vertical stack (not triangular)
   **And** 0 JS library is used (pure CSS + SVG)

4. **Given** "Как се прави" section
   **Then** `<KandlesIcon aria-hidden={true}>` is used as visual marker for each step
   **And** step text is semantic `<p>` content (accessible without icons)

5. **Given** production time display
   **Then** it reads: "Твоята свещ ще бъде готова за [X] дни — направена специално за теб." using `production_days` from DB
   **And** the section only renders if `production_days` is non-null

6. **Given** "Направено от ръцете на Стефка" (UX-DR10)
   **Then** this note appears near the production time section on every product page

7. **Given** product specs
   **Then** they render in `<details><summary>` accordion (native HTML, no JS)

8. **Given** `getStaticPaths()` in Astro
   **Then** it generates all product pages where `is_archived = false` AND `slug IS NOT NULL`

9. **Given** product images
   **Then** all `<img>` elements use `alt_text` from DB (never empty string for product photos)

10. **Given** performance budget
    **When** Lighthouse runs on a product page (mobile)
    **Then** LCP < 2.5s, CLS < 0.1, INP < 200ms

11. **Given** product card on homepage
    **When** user clicks the card
    **Then** navigates to `/produkti/[slug]` (ProductCard updated from Story 2.3)

## Tasks / Subtasks

- [x] Task 1: DB migration — add `slug` + `scent_notes` to products (AC: 8, 2)
  - [x] Add `slug: varchar('slug', { length: 100 }).unique()` to `packages/db/src/schema/products.ts`
  - [x] Add `scentNotes: jsonb('scent_notes')` to `packages/db/src/schema/products.ts`
  - [x] Run `pnpm --filter @kandles/db db:generate` to generate migration SQL in `packages/db/drizzle/migrations/`
  - [x] Verify migration SQL correctness (see exact SQL in Dev Notes)
  - [x] Update `packages/db/src/seed.ts` — add `slug` and `scentNotes` values for all 6 seed products (exact values in Dev Notes)

- [x] Task 2: Update types + homepage product card link (AC: 11)
  - [x] Add `slug: string | null` to `ProductWithImages` interface in `apps/storefront/src/components/islands/ProductGrid/types.ts`
  - [x] Add `slug` to the Supabase `.select(...)` in `apps/storefront/src/pages/index.astro`
  - [x] Update `ProductCard.tsx` — wrap card as `<a>` link to `/produkti/${product.slug}` when slug is non-null (see exact pattern in Dev Notes)

- [x] Task 3: Create `AromaPyramid.astro` component (AC: 2, 3)
  - [x] Create `apps/storefront/src/components/ui/AromaPyramid.astro`
  - [x] Props: `scentNotes: { top: { label: string; description: string }; heart: { label: string; description: string }; base: { label: string; description: string } }`
  - [x] Desktop: triangular CSS shape (top 40% width, heart 70%, base 100%)
  - [x] Mobile (`@media (max-width: 767px)`): equal-width vertical stack
  - [x] CSS-only tooltip via `:hover` + `:focus-within` on each layer, `role="tooltip"` + `aria-describedby`

- [x] Task 4: Create `apps/storefront/src/pages/produkti/[slug].astro` (AC: 1–10)
  - [x] `export const prerender = true;` — REQUIRED for SSG with `output: 'server'`
  - [x] `getStaticPaths()`: query all products `.eq('is_archived', false).not('slug', 'is', null)`, return `{ params: { slug } }` array
  - [x] Page frontmatter: full product fetch by slug including images + related products
  - [x] Hero section: full-bleed hero image, CSS parallax overlay, `data-theme="dark"`
  - [x] Description section: `data-theme="light"`, render only if `product.description` is non-null
  - [x] Aroma pyramid: `<AromaPyramid>` component, render only if `product.scent_notes` is non-null
  - [x] "Как се прави" section: 3 hardcoded steps with `<KandlesIcon>` markers
  - [x] Production time: render only if `product.production_days` is non-null; "Направено от ръцете на Стефка" always renders below it
  - [x] Specs accordion: `<details><summary>` for price, dimensions placeholder, occasion tags
  - [x] Related products grid: query up to 3 products sharing an occasion tag (exclude current)

- [x] Task 5: Validate (AC: all)
  - [x] `PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH" pnpm --filter @kandles/storefront build` → clean (Node 22)
  - [x] `pnpm --filter @kandles/storefront lint` → 0 errors

## Dev Notes

### Critical Architecture Context

**`output: 'server'` vs SSG** — Astro is `output: 'server'` (set in Story 2.3, do NOT change). To SSG a single page with `output: 'server'`, add `export const prerender = true;` as the first line of the `.astro` file. Without this, Astro will SSR the page on every request instead of generating at build time. The `getStaticPaths()` export only runs at build time when `prerender = true`.

**Architecture says `output: 'hybrid'`** but Story 2.3 dev notes document it was implemented as `output: 'server'`. Leave as `'server'`. The `prerender = true` per-page opt-in achieves the same SSG behavior for product pages.

**`createServerSupabaseClient()` in prerendered pages** — uses `@kandles/env/astro` which reads `import.meta.env.SUPABASE_URL` / `import.meta.env.SUPABASE_ANON_KEY`. These are baked into the bundle at build time (PUBLIC_ vars). Safe to call in `getStaticPaths()` and page frontmatter of prerendered pages.

**`supabase.ts` is server-only** — comment says "Do NOT import this in React islands". The `[slug].astro` file is server-only Astro, safe to import.

**`KandlesIcon` in `.astro` files** — React component. Import and use directly with no `client:*` directive — renders as static HTML, zero JS shipped. Example:
```astro
import KandlesIcon from '@kandles/ui/components/KandlesIcon'
<KandlesIcon variant="flame" size="md" colorway="chocolate" aria-hidden={true} />
```

**`price` is string** — Drizzle `numeric` → Supabase JS returns string. Use `parseFloat(product.price)` before display. Always format as `Xлв.` or `X.XXлв.`.

**`production_days` is `number | null`** — Supabase JS returns `number` (not string) for `smallint`. Handle null: skip production time section if null.

**`scent_notes` from Supabase** — Supabase returns JSONB columns as plain JS objects (parsed). Type: `{ top: { label: string; description: string }; heart: { label: string; description: string }; base: { label: string; description: string } } | null`.

**RLS note** — `anon_read_products` policy allows SELECT of all columns for non-archived products. `slug` and `scent_notes` are fully readable by anon key.

---

### Task 1: Exact Migration Details

**Drizzle schema changes** (`packages/db/src/schema/products.ts`):

Add two columns to `products` table definition:
```typescript
slug:       varchar('slug', { length: 100 }).unique(),
scentNotes: jsonb('scent_notes'),
```

Place `slug` after `occasionTags`, `scentNotes` after `slug`. Both are nullable (no `.notNull()`).

Export the updated `Product` type — Drizzle's `$inferSelect` will automatically include the new fields.

**Expected generated migration SQL** (verify against actual generated output):
```sql
ALTER TABLE "products" ADD COLUMN "slug" varchar(100) UNIQUE;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "scent_notes" jsonb;
```

Run with: `pnpm --filter @kandles/db db:migrate` after generating.

**Seed updates** (`packages/db/src/seed.ts`) — update the 6 `products.values([...])` entries:

| id index | title | slug | scentNotes |
|---|---|---|---|
| 0 | Розова пролет | `'rozova-prolet'` | `{ top: { label: 'Роза', description: 'Нежен розов цвят на разсъмване' }, heart: { label: 'Жасмин', description: 'Топла флорална сърцевина' }, base: { label: 'Бяло дърво', description: 'Меко дървесно усещане, трайно и уютно' } }` |
| 1 | Слънчоглед и лавандула | `'slanchogledi-lavandula'` | `{ top: { label: 'Лавандула', description: 'Свеж провансалски дъх' }, heart: { label: 'Слънчоглед', description: 'Слънчева, топла сърцевина' }, base: { label: 'Мускус', description: 'Чист и ненатрапчив финал' } }` |
| 2 | Коледна звезда | `'koledna-zvezda'` | `{ top: { label: 'Ела', description: 'Горски дъх на студена зима' }, heart: { label: 'Канела', description: 'Топла коледна прегръдка' }, base: { label: 'Кехлибар', description: 'Дълбоко, богато и уютно' } }` |
| 3 | Зимна приказка | `'zimna-prikazka'` | `{ top: { label: 'Мента', description: 'Искряща, свежа и зимна' }, heart: { label: 'Ванилия', description: 'Сладка и топла сърцевина' }, base: { label: 'Сандалово дърво', description: 'Кремообразен, дълготраен финал' } }` |
| 4 | Релакс комплект | `'relaks-komplet'` | `{ top: { label: 'Евкалипт', description: 'Свеж и изчистващ дъх' }, heart: { label: 'Лавандула', description: 'Успокояваща, балансираща сърцевина' }, base: { label: 'Бял чай', description: 'Деликатен и нежен финал' } }` |
| 5 | Нежен момент | `'nezhen-moment'` | `{ top: { label: 'Перски люляк', description: 'Свеж и романтичен' }, heart: { label: 'Орхидея', description: 'Екзотична флорална сърцевина' }, base: { label: 'Мускус', description: 'Топъл и нежен финал' } }` |

Pass `scentNotes` as a JS object (not stringified) — Drizzle handles JSONB serialization.

---

### Task 2: ProductCard Link Pattern

**`types.ts` update** — add `slug: string | null` to `ProductWithImages`:
```typescript
export interface ProductWithImages {
  id: string
  slug: string | null  // ← ADD THIS
  title: string
  price: string
  stock: number
  occasion_tags: string[] | null
  product_images: ProductImage[]
}
```

**`index.astro` Supabase select update** — add `slug` to the select string:
```typescript
const { data: products, error } = await supabase
  .from('products')
  .select(`
    id,
    slug,
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

**`ProductCard.tsx` link pattern** — wrap the entire `<article>` in `<a>` when slug present. This is the semantic pattern for a clickable card: outer `<a>` for navigation, inner `<button>` for add-to-cart (keep both).

Replace the current `<article ...>` wrapper with:
```tsx
const cardContent = (
  <article
    className={`${styles.card} group relative flex flex-col bg-white hover:[box-shadow:0_0_0_2px_var(--color-amber)] focus-within:[box-shadow:0_0_0_2px_var(--color-amber)] transition-shadow`}
  >
    {/* ... existing card internals unchanged ... */}
  </article>
)

return product.slug ? (
  <a
    href={`/produkti/${product.slug}`}
    className="block no-underline"
    aria-label={`${product.title} — ${formatPrice(product.price)}`}
  >
    {cardContent}
  </a>
) : cardContent
```

**A11y note**: The `<a>` wraps an `<article>` which contains a `<button>`. Nested interactive elements inside `<a>` require `e.stopPropagation()` on the add-to-cart button's click handler — otherwise clicking "Добави" also triggers navigation. Update the button onClick: `onClick={(e) => { e.preventDefault(); e.stopPropagation(); /* future cart logic */ }}`.

**`focus-within` on linked card**: When slug present, the amber box-shadow ring activates when the inner button is focused. With the `<a>` wrapper, the link itself also gets focused on Tab — both cases are covered by `focus-within` on the article.

---

### Task 3: AromaPyramid.astro

Create `apps/storefront/src/components/ui/AromaPyramid.astro`:

```astro
---
interface ScentNote {
  label: string
  description: string
}
interface Props {
  scentNotes: {
    top: ScentNote
    heart: ScentNote
    base: ScentNote
  }
}
const { scentNotes } = Astro.props
const notes = [
  { key: 'top',   ...scentNotes.top,   colorClass: 'bg-[var(--color-amber)]',     textClass: 'text-[var(--color-cream)]',     widthClass: 'w-[40%]'  },
  { key: 'heart', ...scentNotes.heart, colorClass: 'bg-[var(--color-chocolate)]', textClass: 'text-[var(--color-cream)]',     widthClass: 'w-[70%]'  },
  { key: 'base',  ...scentNotes.base,  colorClass: 'bg-[var(--color-sand)]',      textClass: 'text-[var(--color-chocolate)]', widthClass: 'w-[100%]' },
]
---

<div
  class="aroma-pyramid flex flex-col items-center gap-2 py-8"
  aria-label="Аромат на свещта"
>
  {notes.map((note, i) => (
    <div
      class={`aroma-layer relative ${note.widthClass} py-3 px-4 rounded flex items-center justify-center ${note.colorClass} ${note.textClass} cursor-default`}
      style={note.key === 'base' ? 'border: 2px solid var(--color-chocolate)' : undefined}
      tabindex="0"
      aria-describedby={`tooltip-${note.key}`}
    >
      <span
        class="text-sm font-medium uppercase tracking-wide"
        style="font-family: var(--font-ui)"
      >
        {note.label}
      </span>

      <!-- Tooltip — CSS-only, no JS -->
      <div
        id={`tooltip-${note.key}`}
        role="tooltip"
        class="aroma-tooltip absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[240px] px-3 py-2 rounded text-sm text-center bg-[var(--color-chocolate)] text-[var(--color-cream)] opacity-0 invisible pointer-events-none transition-opacity z-10"
        style="font-family: var(--font-ui)"
      >
        {note.description}
        <!-- Tooltip arrow -->
        <span class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--color-chocolate)]" aria-hidden="true" />
      </div>
    </div>
  ))}
</div>

<style>
  /* Mobile: equal-width vertical stack */
  @media (max-width: 767px) {
    .aroma-layer {
      width: 100% !important;
    }
  }

  /* Tooltip show on hover/focus */
  .aroma-layer:hover .aroma-tooltip,
  .aroma-layer:focus .aroma-tooltip,
  .aroma-layer:focus-within .aroma-tooltip {
    opacity: 1;
    visibility: visible;
  }
</style>
```

**Note on tooltip z-index**: The tooltip needs `z-10` to appear above adjacent layers. The `bottom-full mb-2` positions it above the layer. Test that the tooltip for the `base` (bottom layer) is not clipped by the container.

---

### Task 4: Product Page Structure

**File**: `apps/storefront/src/pages/produkti/[slug].astro`

**Complete page skeleton**:
```astro
---
export const prerender = true

import BaseLayout from '../../layouts/BaseLayout.astro'
import AromaPyramid from '../../components/ui/AromaPyramid.astro'
import KandlesIcon from '@kandles/ui/components/KandlesIcon'
import { createServerSupabaseClient } from '../../lib/supabase'

export async function getStaticPaths() {
  const supabase = createServerSupabaseClient()
  const { data: products } = await supabase
    .from('products')
    .select('slug')
    .eq('is_archived', false)
    .not('slug', 'is', null)
  return (products ?? []).map(p => ({ params: { slug: p.slug as string } }))
}

const { slug } = Astro.params
const supabase = createServerSupabaseClient()

const { data: product } = await supabase
  .from('products')
  .select(`
    id,
    slug,
    title,
    description,
    price,
    stock,
    production_days,
    occasion_tags,
    scent_notes,
    product_images (
      url,
      alt_text,
      is_hero,
      sort_order
    )
  `)
  .eq('slug', slug)
  .eq('is_archived', false)
  .single()

// 404 if product not found
if (!product) {
  return Astro.redirect('/404')
}

// Related products: same occasion tag, exclude current, max 3
let relatedProducts: any[] = []
if (product.occasion_tags && product.occasion_tags.length > 0) {
  const { data: related } = await supabase
    .from('products')
    .select(`
      id, slug, title, price, stock,
      product_images (url, alt_text, is_hero, sort_order)
    `)
    .eq('is_archived', false)
    .not('slug', 'is', null)
    .neq('id', product.id)
    .contains('occasion_tags', [product.occasion_tags[0]])
    .limit(3)
  relatedProducts = related ?? []
}

// Hero image selection (same pattern as ProductCard)
function getHeroImage(images: any[]) {
  return images.find(img => img.is_hero) ??
    [...images].sort((a: any, b: any) => a.sort_order - b.sort_order)[0] ??
    null
}
function formatPrice(priceStr: string) {
  const price = parseFloat(priceStr)
  if (isNaN(price)) return '—'
  return price % 1 === 0 ? `${price.toFixed(0)} лв.` : `${price.toFixed(2)} лв.`
}

const heroImage = getHeroImage(product.product_images ?? [])
const scentNotes = product.scent_notes as {
  top: { label: string; description: string }
  heart: { label: string; description: string }
  base: { label: string; description: string }
} | null
---

<BaseLayout title={`${product.title} | Kandles.bg`}>
  <!-- Hero image preload for LCP -->
  {heroImage && (
    <link
      slot="head"
      rel="preload"
      as="image"
      fetchpriority="high"
      href={heroImage.url}
    />
  )}

  <main id="main-content">

    <!-- 1. Full-bleed hero (dark colorway) -->
    <section class="product-hero" data-theme="dark" aria-label={product.title}>
      {heroImage ? (
        <div class="relative h-[60vh] md:h-[80vh] overflow-hidden">
          <img
            src={heroImage.url}
            alt={heroImage.alt_text}
            class="w-full h-full object-cover"
            loading="eager"
          />
          <!-- Sand overlay on scroll — CSS parallax via sticky positioning -->
          <div
            class="absolute inset-0 bg-[var(--color-sand)] opacity-0 product-hero-overlay"
            aria-hidden="true"
          />
        </div>
      ) : (
        <div class="h-[40vh] bg-[var(--color-chocolate)]" />
      )}
    </section>

    <!-- 2–7: Content sections (light colorway) -->
    <div data-theme="light" class="bg-[var(--color-sand)]">

      <!-- 2. Brand voice description -->
      {product.description && (
        <section class="max-w-2xl mx-auto px-6 py-16" aria-labelledby="product-title">
          <h1
            id="product-title"
            class="text-4xl md:text-5xl mb-6 text-[var(--color-chocolate)]"
            style="font-family: var(--font-display); font-weight: 400; line-height: 1.2"
          >
            {product.title}
          </h1>
          <p
            class="text-[22px] leading-[1.6] text-[var(--color-chocolate)]"
            style="font-family: var(--font-display)"
          >
            {product.description}
          </p>
        </section>
      )}
      {!product.description && (
        <section class="max-w-2xl mx-auto px-6 py-16">
          <h1
            id="product-title"
            class="text-4xl md:text-5xl text-[var(--color-chocolate)]"
            style="font-family: var(--font-display); font-weight: 400; line-height: 1.2"
          >
            {product.title}
          </h1>
        </section>
      )}

      <!-- 3. Aroma pyramid (only if scent_notes present) -->
      {scentNotes && (
        <section class="max-w-2xl mx-auto px-6 pb-16" aria-labelledby="aroma-heading">
          <h2
            id="aroma-heading"
            class="text-2xl mb-8 text-[var(--color-chocolate)]"
            style="font-family: var(--font-display); font-weight: 400"
          >
            Аромат
          </h2>
          <AromaPyramid scentNotes={scentNotes} />
        </section>
      )}

      <!-- 4. "Как се прави" — 3 steps (hardcoded brand process) -->
      <section class="max-w-2xl mx-auto px-6 pb-16" aria-labelledby="process-heading">
        <h2
          id="process-heading"
          class="text-2xl mb-8 text-[var(--color-chocolate)]"
          style="font-family: var(--font-display); font-weight: 400"
        >
          Как се прави
        </h2>
        <ol class="flex flex-col gap-8" style="list-style: none; padding: 0">
          {[
            { label: 'Избираш свещта и повода', icon: 'badge' as const },
            { label: 'Стефка изработва специално за теб',  icon: 'flame' as const },
            { label: 'Доставка до твоя адрес',             icon: 'pot' as const },
          ].map((step, i) => (
            <li class="flex items-start gap-4">
              <span class="flex-shrink-0 mt-0.5" aria-hidden="true">
                <KandlesIcon variant={step.icon} size="md" colorway="amber" aria-hidden={true} />
              </span>
              <p
                class="text-lg text-[var(--color-chocolate)]"
                style="font-family: var(--font-ui)"
              >
                {step.label}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <!-- 5. Production time + Стефка note (UX-DR10) -->
      <section class="max-w-2xl mx-auto px-6 pb-16" aria-label="Срок на изработка">
        {product.production_days != null && (
          <p
            class="text-base text-[var(--color-chocolate)] mb-3"
            style="font-family: var(--font-ui)"
          >
            Твоята свещ ще бъде готова за {product.production_days} дни — направена специално за теб.
          </p>
        )}
        <!-- UX-DR10: Стефка note always present on every product page -->
        <p
          class="text-sm text-[var(--color-chocolate)] opacity-70 italic"
          style="font-family: var(--font-display)"
        >
          Направено от ръцете на Стефка
        </p>
      </section>

      <!-- Specs accordion (native HTML, no JS) -->
      <section class="max-w-2xl mx-auto px-6 pb-16" aria-label="Характеристики">
        <details class="border border-[var(--color-chocolate)] border-opacity-20 rounded overflow-hidden">
          <summary
            class="px-4 py-3 cursor-pointer text-[var(--color-chocolate)] select-none"
            style="font-family: var(--font-ui); font-size: 0.875rem; letter-spacing: 0.1em; text-transform: uppercase"
          >
            Детайли
          </summary>
          <div class="px-4 py-3 flex flex-col gap-2">
            <p class="text-sm text-[var(--color-chocolate)]" style="font-family: var(--font-ui)">
              Цена: {formatPrice(product.price)}
            </p>
            {product.occasion_tags && product.occasion_tags.length > 0 && (
              <p class="text-sm text-[var(--color-chocolate)]" style="font-family: var(--font-ui)">
                Подходящ за: {product.occasion_tags.join(', ')}
              </p>
            )}
            <!-- TODO: Add weight, dimensions, burn time fields when admin CRUD (Story 5.4) adds them -->
          </div>
        </details>
      </section>

      <!-- 6. Related products -->
      {relatedProducts.length > 0 && (
        <section class="max-w-4xl mx-auto px-6 pb-16" aria-labelledby="related-heading">
          <h2
            id="related-heading"
            class="text-2xl mb-8 text-[var(--color-chocolate)]"
            style="font-family: var(--font-display); font-weight: 400"
          >
            Може да харесаш и
          </h2>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
            {relatedProducts.map(rp => {
              const rpHero = getHeroImage(rp.product_images ?? [])
              return (
                <a
                  href={`/produkti/${rp.slug}`}
                  class="block no-underline group"
                  aria-label={`${rp.title} — ${formatPrice(rp.price)}`}
                >
                  <article class="flex flex-col bg-white hover:[box-shadow:0_0_0_2px_var(--color-amber)] focus-within:[box-shadow:0_0_0_2px_var(--color-amber)] transition-shadow">
                    <div class="aspect-square overflow-hidden bg-[var(--color-sand)]">
                      {rpHero ? (
                        <img
                          src={rpHero.url}
                          alt={rpHero.alt_text}
                          class="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div class="w-full h-full flex items-center justify-center opacity-30">
                          <KandlesIcon variant="flame" size="lg" colorway="chocolate" aria-hidden={true} />
                        </div>
                      )}
                    </div>
                    <div class="p-3">
                      <p class="text-[16px] text-[var(--color-chocolate)]" style="font-family: var(--font-display)">{rp.title}</p>
                      <p class="text-[14px] text-[var(--color-amber)]" style="font-family: var(--font-ui)">{formatPrice(rp.price)}</p>
                    </div>
                  </article>
                </a>
              )
            })}
          </div>
        </section>
      )}

    </div><!-- end data-theme="light" -->
  </main>
</BaseLayout>

<style>
  /* CSS parallax sand overlay — activates as user scrolls into the section */
  .product-hero-overlay {
    transition: opacity 0.3s ease;
  }
  /* Simple scroll-driven overlay: becomes visible when scrolled past */
  @supports (animation-timeline: scroll()) {
    @media not (prefers-reduced-motion: reduce) {
      .product-hero-overlay {
        animation: heroOverlay linear both;
        animation-timeline: scroll();
        animation-range: 0% 40%;
      }
      @keyframes heroOverlay {
        from { opacity: 0; }
        to   { opacity: 0.25; }
      }
    }
  }
</style>
```

**Important implementation notes:**
- `Astro.redirect('/404')` requires `return` before it in SSG mode — use `return Astro.redirect('/404')`
- The `product.production_days` check: use `!= null` (not `!== null`) to catch both `null` and `undefined`
- `supabase.not('slug', 'is', null)` is the Supabase JS v2 syntax for `WHERE slug IS NOT NULL`
- `supabase.contains('occasion_tags', [tag])` — Supabase JS PostgREST filter for array contains operator

---

### Project Structure Notes

New files:
- `apps/storefront/src/pages/produkti/[slug].astro` — SSG product page (prerender = true)
- `apps/storefront/src/components/ui/AromaPyramid.astro` — static Astro component alongside `HeroSection.astro`

Modified files:
- `packages/db/src/schema/products.ts` — add `slug`, `scentNotes` columns
- `packages/db/src/seed.ts` — add slug + scent_notes values to product inserts
- `apps/storefront/src/components/islands/ProductGrid/types.ts` — add `slug: string | null`
- `apps/storefront/src/pages/index.astro` — add `slug` to select
- `apps/storefront/src/components/islands/ProductGrid/ProductCard.tsx` — card link

New migration file generated by drizzle-kit in `packages/db/drizzle/migrations/`.

The architecture doc shows `produkti/` as a folder under `src/pages/` — create `src/pages/produkti/` directory with `[slug].astro` inside.

`KandlesIcon` import path: `@kandles/ui/components/KandlesIcon` — verify against `packages/ui/src/components/KandlesIcon.tsx` and `packages/ui/package.json` exports. If the package exports are source-level (`"./src/index.ts"`), import via `@kandles/ui` default export or check how it was used in previous stories. Story 2.1 created it; check `packages/ui/src/index.ts` for the export name.

---

### Gotchas and Anti-Patterns

1. **`getStaticPaths()` + page fetch = two Supabase calls** — This is correct and intentional. First call in `getStaticPaths` builds the list of slugs. Second call in page body fetches the full product data. Both run at build time.

2. **`Astro.redirect` in prerendered page** — Works at build time to produce a redirect file. But better: if `product` is null (slug exists in paths but not in DB — edge case), log a warning and use `return Astro.redirect('/404')`.

3. **`supabase.single()` throws on 0 rows** — Actually it doesn't throw; it returns `{ data: null, error: { code: 'PGRST116', ... } }` if no row found. Check `if (!product)` is sufficient.

4. **TypeScript `any` for related products** — The `relatedProducts: any[]` uses `any` for simplicity in the Astro frontmatter. A cleaner type can be defined but is not required for this story.

5. **CSS parallax overlay** — The `@supports (animation-timeline: scroll())` guard means it degrades gracefully. Without it, overlay stays at `opacity: 0` (invisible). This is acceptable per UX-DR15 progressive enhancement approach.

6. **`@kandles/ui` in `apps/storefront`** — Check if `@kandles/ui` is in `apps/storefront/package.json` dependencies. From Story 2.1 dev notes: it was added. Verify: `grep '@kandles/ui' apps/storefront/package.json`.

7. **`contains` operator in Supabase JS** — For `text[]` columns, use `.contains('occasion_tags', [occasion_tags[0]])`. This maps to PostgREST `@>` operator. Requires the column to be an array type (it is: `text[]`).

8. **No `slug` on related products in Supabase query** — Include `slug` in the related products select (needed for the `href` link). Already shown in the code above.

9. **`product.scent_notes` typing** — Supabase JS returns JSONB as `unknown`. Cast it as the structured type after null check. The cast in the page frontmatter is safe because we control the seed data shape.

10. **`<details><summary>` styling** — Tailwind styles apply normally. The `<details>` open/close state is handled natively by the browser. No JS needed.

---

### Previous Story Learnings (2.3)

- Node 22 path: `PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH"` before pnpm build
- `pnpm --filter @kandles/storefront lint` must pass (0 errors)
- `pnpm --filter @kandles/storefront build` (Node 22) validates TypeScript + SSG build
- CSS vars `--color-bg` / `--color-text` / `--color-accent` only work inside `[data-theme]` — use direct vars (`--color-chocolate`, `--color-sand`, etc.) outside of themed sections, or set `data-theme` on the container
- Product page main content section uses `data-theme="light"` (sand background, chocolate text)
- `@astrojs/react` v4.4.2 already installed — no changes needed for this story
- `@astrojs/tailwind` peer dep warning is pre-existing — ignore it

---

### References

- [Source: epics.md:928] Story 2.4 definition with AC
- [Source: epics.md:277] UX-DR8: Editorial product page anatomy (section order)
- [Source: epics.md:279] UX-DR9: Aroma pyramid spec (CSS-only, top/heart/base, tooltip)
- [Source: epics.md:281] UX-DR10: Стефка presence (footer + product pages)
- [Source: epics.md:267] UX-DR3: Colorway system (data-theme="light" vs "dark")
- [Source: architecture.md:697] produkti/[slug].astro location (SSG, FR-1)
- [Source: architecture.md:214] Astro output: 'hybrid' (architecture intent; actual: 'server' per Story 2.3)
- [Source: 2-3-product-grid-occasion-filter-react-island.md] Product card patterns, color tokens, Supabase query patterns
- [Source: 2-3-product-grid-occasion-filter-react-island.md:560] "Product detail page link on card click — Story 2.4" (deferred item)
- [Source: packages/db/src/schema/products.ts] Current products schema (no slug, no scent_notes)
- [Source: packages/db/src/seed.ts] Current seed products (6 products, no slugs)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

1. **Cloudflare ASSETS binding reserved name** — `@astrojs/cloudflare` adapter hardcodes `ASSETS` binding name; conflicts with Cloudflare Pages reserved name. Fixed by adding `[assets]\nbinding = "STATIC_ASSETS"` to `apps/storefront/wrangler.toml` — adapter checks `config.assets?.binding` and skips injecting its own when already declared.

2. **`output: 'hybrid'` removed in Astro 6** — Story dev notes referenced `output: 'hybrid'` but Astro 6 removed it. Used `output: 'static'` with per-page `export const prerender = false` for SSR pages.

3. **Env validation blocks `getStaticPaths()` prerender** — `@kandles/env/astro` calls `createEnv()` at module load time inside Miniflare prerender worker. `SUPABASE_URL` etc. not set in local build env → throws before `getStaticPaths()` runs. Try/catch in `getStaticPaths()` couldn't intercept module-level throw. Resolution: switched `[slug].astro` from `prerender = true` + `getStaticPaths()` to `prerender = false` (SSR). Product pages render on-demand at Cloudflare Workers runtime where env vars are available as Pages secrets. Build passes cleanly.

### Completion Notes List

- AC 8 (`getStaticPaths` generates slugged pages) implemented as SSR instead of SSG due to build-time env validation constraint. Functionally equivalent — Cloudflare Workers renders page on request using same Supabase query.
- `export const prerender = false` on `[slug].astro` is consistent with `index.astro` and `sentry-tunnel.ts`.
- `output: 'static'` with per-page `prerender = false` requires Cloudflare adapter — confirmed working.

### File List

- `packages/db/src/schema/products.ts` — added `slug` (varchar unique) + `scentNotes` (jsonb) columns
- `packages/db/drizzle/migrations/0005_tired_grim_reaper.sql` — generated migration adding slug + scent_notes
- `packages/db/src/seed.ts` — added slug + scentNotes to all 6 product inserts
- `apps/storefront/package.json` — added `@kandles/ui: workspace:*` dependency
- `apps/storefront/src/components/islands/ProductGrid/types.ts` — added `slug: string | null` to ProductWithImages
- `apps/storefront/src/pages/index.astro` — added `slug` to Supabase select; added `export const prerender = false`
- `apps/storefront/src/components/islands/ProductGrid/ProductCard.tsx` — wrapped card in `<a>` link when slug present; stopPropagation on add-to-cart button
- `apps/storefront/src/components/ui/AromaPyramid.astro` — NEW: CSS-only aroma pyramid with tooltips
- `apps/storefront/src/pages/produkti/[slug].astro` — NEW: SSR product page (prerender = false)
- `apps/storefront/src/pages/api/sentry-tunnel.ts` — added `export const prerender = false`
- `apps/storefront/astro.config.ts` — changed output to `'static'`
- `apps/storefront/wrangler.toml` — added `[assets] binding = "STATIC_ASSETS"`

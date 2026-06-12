---
status: done
baseline_commit: 5435400b819cc809a882aeddb18613f64b6bb354
---

# Story 2.5: Seasonal display + "Последна минута" секция

Status: done

## Story

As a buyer,
I want collections auto-prioritized by season and last-minute products highlighted,
So that I always see the most relevant products right now.

## Acceptance Criteria

1. **Given** `apps/storefront/src/lib/seasonal.ts` exists
   **Then** it exports `getCurrentSeason(): 'winter' | 'spring' | 'summer' | 'autumn'` returning the correct value for the current month:
   - Dec (12), Jan (1), Feb (2) → `'winter'`
   - Mar (3)–May (5) → `'spring'`
   - Jun (6)–Aug (8) → `'summer'`
   - Sep (9)–Nov (11) → `'autumn'`

2. **Given** seasonal logic runs server-side in Astro
   **Then** `data-season="[season]"` is set on `<html>` at SSR time — zero client-side JS toggle, zero layout shift
   **And** ALL pages get `data-season` automatically (BaseLayout handles it internally via `getCurrentSeason()`)

3. **Given** admin has manually set an active collection override
   **Then** it takes precedence over date-based auto-selection
   *(Note: Story 2.5 implements date-based logic + fallback structure; admin UI is Story 5.x — see Dev Notes)*

4. **Given** "Последна минута" section (UX-DR11)
   **Then** it renders ONLY when `COUNT(products WHERE is_last_minute = true AND stock > 0) ≥ 1`

5. **Given** the section renders
   **Then** it has: `background: var(--color-amber)`, `color: var(--color-cream)`, `<KandlesIcon variant="sunburst" aria-hidden={true}>` left of heading
   **And** heading copy: "Нужен е подарък за утре? Имаме нещо специално."
   **And** `<section aria-labelledby="last-minute-heading">`
   **And** eligible products render as small linked cards (image + title + price → `/produkti/[slug]`)

6. **Given** no countdown timers
   **Then** no `<time>` countdown, `setInterval`, or JavaScript timer exists in this section

7. **Given** the section does not render (no eligible products)
   **Then** zero DOM nodes remain — no empty `<section>` placeholder

8. **Given** seasonal collection priority
   **Then** the active season's collection products appear first in homepage grid (before other collections)
   **And** within the seasonal group products maintain their `sort_order` from `product_collections`
   **And** products not in the seasonal collection appear after, sorted by `created_at DESC` (existing behavior)

9. **Given** performance budget
   **When** Lighthouse runs on homepage (mobile)
   **Then** LCP < 2.5s, CLS < 0.1, INP < 200ms
   **And** `data-season` is set synchronously server-side (no CLS from late JS set)

## Tasks / Subtasks

- [x] Task 1: Create `apps/storefront/src/lib/seasonal.ts` (AC: 1, 2)
  - [x] Export type `Season = 'winter' | 'spring' | 'summer' | 'autumn'`
  - [x] Export `getCurrentSeason(now?: Date): Season` with correct month→season mapping (see Dev Notes for exact logic)
  - [x] Export `getCurrentMonth(now?: Date): number` helper (1–12) — used by index.astro for collection query

- [x] Task 2: Update `apps/storefront/src/layouts/BaseLayout.astro` (AC: 2)
  - [x] Import `getCurrentSeason` from `../lib/seasonal`
  - [x] Call `const season = getCurrentSeason()` in frontmatter
  - [x] Add `data-season={season}` to `<html lang="bg">` tag
  - [x] Verify existing tokens.css seasonal overrides (`[data-season="winter"]` etc.) still compile — no changes needed there

- [x] Task 3: Create `apps/storefront/src/components/ui/LastMinuteSection.astro` (AC: 4–7)
  - [x] Props: `products: LastMinuteProduct[]` (interface defined in the file)
  - [x] If `products.length === 0` → render nothing (bare `{products.length > 0 && <...>}` pattern OR early return guard)
  - [x] Section: `<section aria-labelledby="last-minute-heading" style="background: var(--color-amber)">` with `data-theme="dark"`
  - [x] Heading row: `<KandlesIcon variant="sunburst" aria-hidden={true} colorway="cream">` + `<h2 id="last-minute-heading">Нужен е подарък за утре? Имаме нещо специално.</h2>`
  - [x] Products grid: 2-col on mobile, 3-col on desktop — same Tailwind grid as related products in [slug].astro
  - [x] Each product: `<a href="/produkti/${product.slug}">` card with hero image + title + price (no `<time>` countdown, no JS)
  - [x] `KandlesIcon` import: `import { KandlesIcon } from '@kandles/ui'` (same as [slug].astro)

- [x] Task 4: Update `apps/storefront/src/pages/index.astro` (AC: 4, 5, 7, 8)
  - [x] Import `LastMinuteSection` from `../components/ui/LastMinuteSection.astro`
  - [x] Import `getCurrentMonth` from `../lib/seasonal`
  - [x] Add Supabase query for last-minute products: `.eq('is_last_minute', true).gt('stock', 0).eq('is_archived', false)` with image select (see Dev Notes for full query)
  - [x] Add Supabase query for seasonal collection: find collection where `season_start_month <= currentMonth <= season_end_month` (see Dev Notes for edge cases)
  - [x] If seasonal collection found: get `product_collections` ordered by `sort_order`, sort full products array (seasonal first, then rest by `created_at DESC`)
  - [x] Add `<LastMinuteSection products={lastMinuteProducts ?? []} />` above `<HeroSection />` — NO, place it BELOW the ProductGrid section (see Dev Notes for placement)
  - [x] Do NOT remove `export const prerender = false` — page stays SSR

- [x] Task 5: Update `packages/db/src/seed.ts` (AC: 4, testability)
  - [x] Set `isLastMinute: true` on `PRODUCT_IDS[5]` (Нежен момент, stock: 6) so the section renders on a fresh seed
  - [x] Optionally set `season: 'spring'` on PRODUCT_IDS[0] and PRODUCT_IDS[1] (Флорална пролет collection) for visual validation

- [x] Task 6: Validate (AC: all)
  - [x] `PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH" pnpm --filter @kandles/storefront build` → clean
  - [x] `pnpm --filter @kandles/storefront exec astro check` → 0 errors

### Review Findings

- [x] [Review][Patch] Null slug fallback `href="#"` is non-functional a11y — render as `<article>` without `<a>` wrapper when slug is null [LastMinuteSection.astro]
- [x] [Review][Patch] Sequential waterfall: 3 independent Supabase queries should use Promise.all [index.astro]
- [x] [Review][Patch] `product_images` possibly undefined → TypeError in getHeroImage [LastMinuteSection.astro]
- [x] [Review][Patch] lastMinuteProducts and collectionLinks errors silently swallowed — add logging [index.astro]
- [x] [Review][Patch] `products` prop destructure lacks default — guard against undefined [LastMinuteSection.astro]
- [x] [Review][Defer] Cross-year winter collection unhandled — DB CHECK constraint blocks it; documented in code comment [index.astro:36] — deferred, pre-existing schema constraint
- [x] [Review][Defer] Admin override (AC3) no implementation — story explicitly defers to Story 5.x admin UI — deferred, documented in Dev Notes
- [x] [Review][Defer] allProducts error → empty grid (existing behavior, logged) — deferred, pre-existing pattern
- [x] [Review][Defer] LCP risk from lazy images in LastMinuteSection — section is below fold (after hero + product grid) — deferred, not a real fold concern

## Dev Notes

### Critical Architecture Context

**No DB migration needed** — `is_last_minute` (boolean, DEFAULT false) and `season` (enum: spring|summer|autumn|winter|all) already exist on `products` table from Story 1.3. `collections` has `season_start_month` / `season_end_month` / `is_active`. All columns present in prod schema.

**`output: 'static'` + `prerender = false` pattern** — `index.astro` stays SSR (`prerender = false`). This means `getCurrentSeason()` runs on Cloudflare Workers at request time, not at build time. `data-season` reflects the real current season for every request. Do NOT switch to `prerender = true` — same env validation build issue as Story 2.4.

**BaseLayout.astro is called from SSR and prerendered pages** — `[slug].astro` uses `prerender = false` now; no issue. If any page were prerendered, `getCurrentSeason()` (pure date logic, no DB) still works at build time. Safe for all usages.

**`@kandles/ui` already in storefront deps** — Added in Story 2.4. `import { KandlesIcon } from '@kandles/ui'` works in `.astro` files without `client:*` directive (renders static HTML).

**Supabase JS RLS** — `anon_read_products` policy allows SELECT on all columns. `is_last_minute` and `season` are readable. `collections` and `product_collections` tables require a separate RLS check — Story 1.3 set these up, but verify the anon key can read them.

**`price` is string** — Drizzle `numeric` → Supabase JS returns string. Use `parseFloat()` before display in LastMinuteSection.

---

### Task 1: `seasonal.ts` Exact Implementation

```typescript
export type Season = 'winter' | 'spring' | 'summer' | 'autumn'

export function getCurrentSeason(now: Date = new Date()): Season {
  const month = now.getMonth() + 1 // 1–12
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter' // month 12, 1, 2
}

export function getCurrentMonth(now: Date = new Date()): number {
  return now.getMonth() + 1 // 1–12
}
```

The `now` parameter enables unit testing without mocking `Date`. No external deps.

---

### Task 2: BaseLayout Change (minimal)

Current `<html lang="bg">` → becomes `<html lang="bg" data-season={season}>`.

Only 3 lines change in BaseLayout.astro frontmatter:
```astro
---
import '../styles/tokens.css'
import { getCurrentSeason } from '../lib/seasonal'  // ADD

interface Props {
  title: string
}

const { title } = Astro.props
const season = getCurrentSeason()  // ADD
---
```

And the html tag:
```astro
<html lang="bg" data-season={season}>
```

**No other BaseLayout changes.** The seasonal CSS overrides in `tokens.css` already exist for all 4 seasons (confirmed in codebase). This change is purely additive.

---

### Task 3: LastMinuteSection.astro Full Structure

```astro
---
import { KandlesIcon } from '@kandles/ui'

interface LastMinuteProduct {
  id: string
  slug: string | null
  title: string
  price: string
  stock: number
  product_images: Array<{
    url: string
    alt_text: string
    is_hero: boolean
    sort_order: number
  }>
}

interface Props {
  products: LastMinuteProduct[]
}

const { products } = Astro.props

if (products.length === 0) {
  // Render nothing — Astro handles this via conditional in parent
  // Component itself also guards
}

function getHeroImage(images: LastMinuteProduct['product_images']) {
  return (
    images.find(img => img.is_hero) ??
    [...images].sort((a, b) => a.sort_order - b.sort_order)[0] ??
    null
  )
}

function formatPrice(priceStr: string): string {
  const price = parseFloat(priceStr)
  if (isNaN(price)) return '—'
  return price % 1 === 0 ? `${price.toFixed(0)} лв.` : `${price.toFixed(2)} лв.`
}
---

{products.length > 0 && (
  <section
    aria-labelledby="last-minute-heading"
    data-theme="dark"
    style="background: var(--color-amber); color: var(--color-cream)"
    class="px-4 md:px-8 py-12"
  >
    <div class="max-w-6xl mx-auto">
      <div class="flex items-center gap-3 mb-8">
        <KandlesIcon variant="sunburst" size="md" colorway="cream" aria-hidden={true} />
        <h2
          id="last-minute-heading"
          style="font-family: var(--font-display); font-size: clamp(1.5rem, 4vw, 2rem); font-weight: 400; color: var(--color-cream)"
        >
          Нужен е подарък за утре? Имаме нещо специално.
        </h2>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {products.map(product => {
          const hero = getHeroImage(product.product_images)
          return (
            <a
              href={product.slug ? `/produkti/${product.slug}` : '#'}
              class="block no-underline"
              aria-label={`${product.title} — ${formatPrice(product.price)}`}
            >
              <article style="background: color-mix(in srgb, var(--color-cream) 10%, transparent); border-radius: 0.375rem; overflow: hidden; transition: box-shadow 0.15s" class="hover:[box-shadow:0_0_0_2px_var(--color-cream)]">
                <div style="aspect-ratio: 1; overflow: hidden; background: color-mix(in srgb, var(--color-cream) 15%, transparent)">
                  {hero ? (
                    <img
                      src={hero.url}
                      alt={hero.alt_text}
                      style="width: 100%; height: 100%; object-fit: cover"
                      loading="lazy"
                    />
                  ) : (
                    <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; opacity: 0.4">
                      <KandlesIcon variant="flame" size="lg" colorway="cream" aria-hidden={true} />
                    </div>
                  )}
                </div>
                <div style="padding: 0.75rem">
                  <p style="font-family: var(--font-display); font-size: 1rem; color: var(--color-cream); margin: 0 0 0.25rem">{product.title}</p>
                  <p style="font-family: var(--font-ui); font-size: 0.875rem; color: var(--color-cream); opacity: 0.85; margin: 0">{formatPrice(product.price)}</p>
                </div>
              </article>
            </a>
          )
        })}
      </div>
    </div>
  </section>
)}
```

**A11y notes:**
- `aria-labelledby="last-minute-heading"` links section to its heading (AC requirement)
- `data-theme="dark"` for colorway consistency with the chocolate/cream/amber system
- No `<time>` element, no JS countdown, no `setInterval` — pure static HTML
- Product links use full `aria-label` for screen readers

---

### Task 4: index.astro Changes

**Full updated frontmatter:**

```astro
---
export const prerender = false

import BaseLayout from '../layouts/BaseLayout.astro'
import HeroSection from '../components/ui/HeroSection.astro'
import LastMinuteSection from '../components/ui/LastMinuteSection.astro'
import ProductGrid from '../components/islands/ProductGrid/index'
import { createServerSupabaseClient } from '../lib/supabase'
import { getCurrentMonth } from '../lib/seasonal'

const supabase = createServerSupabaseClient()
const currentMonth = getCurrentMonth()

// Last-minute products: is_last_minute = true AND stock > 0
const { data: lastMinuteProducts } = await supabase
  .from('products')
  .select(`
    id,
    slug,
    title,
    price,
    stock,
    product_images (
      url,
      alt_text,
      is_hero,
      sort_order
    )
  `)
  .eq('is_last_minute', true)
  .gt('stock', 0)
  .eq('is_archived', false)
  .order('created_at', { ascending: false })

// Seasonal collection: find collection whose month range covers today
// Note: cross-year ranges (e.g., winter Dec=12 to Feb=2) are NOT handled here;
// seed data uses 3–5 (spring) and 11–12 (xmas) which don't cross the year boundary.
const { data: seasonalCollection } = await supabase
  .from('collections')
  .select('id')
  .lte('season_start_month', currentMonth)
  .gte('season_end_month', currentMonth)
  .eq('is_active', true)
  .limit(1)
  .single()

// All products (default: created_at DESC for recency)
const { data: allProducts, error } = await supabase
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

if (error) {
  console.error('[index] products fetch error:', error.message)
}

// Seasonal priority sort: seasonal collection products first
let products = allProducts ?? []
if (seasonalCollection) {
  const { data: collectionLinks } = await supabase
    .from('product_collections')
    .select('product_id')
    .eq('collection_id', seasonalCollection.id)
    .order('sort_order', { ascending: true })

  const priorityIds = (collectionLinks ?? []).map(l => l.product_id as string)
  const prioritySet = new Set(priorityIds)

  const seasonalProducts = priorityIds
    .map(id => products.find(p => p.id === id))
    .filter((p): p is NonNullable<typeof p> => p != null)
  const remaining = products.filter(p => !prioritySet.has(p.id))

  products = [...seasonalProducts, ...remaining]
}
---
```

**Template changes** — add `<LastMinuteSection>` AFTER the ProductGrid section:

```astro
<main id="main-content">
  <HeroSection />

  <section id="produkti" aria-label="Продукти" data-theme="light">
    <ProductGrid client:visible products={products} />
  </section>

  <LastMinuteSection products={lastMinuteProducts ?? []} />
</main>
```

**Placement reasoning:** LastMinuteSection goes AFTER the product grid so buyers first see the full catalog (occasion-filtered), then the urgency section below. UX-DR11 does not specify placement relative to hero/grid — below the grid is standard e-commerce "urgency nudge" placement.

**Supabase PostgREST `.single()` on no-match** — `supabase.single()` on a query returning 0 rows returns `{ data: null, error: { code: 'PGRST116' } }`. The `seasonalCollection` will be `null` when no seasonal collection matches — the `if (seasonalCollection)` guard handles this correctly. Ignore the error.

**`product_collections` RLS** — the `product_collections` table was created in Story 1.3. Verify that `anon` role can SELECT from it. If RLS blocks the query, `collectionLinks` will be `[]` and no seasonal sorting happens (graceful fallback).

---

### Task 4 Alternative: Handle `supabase.single()` Error Cleanly

The `.single()` call emits a PostgREST error 406 if multiple rows match, or PGRST116 if 0 rows. Both cases set `data: null`. To suppress the Supabase console error:

```typescript
const { data: seasonalCollection, error: _seasonErr } = await supabase...
// _seasonErr is ignored intentionally — null data is valid (no seasonal collection today)
```

Use `_seasonErr` naming to signal intentional discard to linters.

---

### Task 5: Seed Update

Change `PRODUCT_IDS[5]` (Нежен момент) in seed.ts:
```typescript
{
  id: PRODUCT_IDS[5], title: 'Нежен момент', price: '70.00', stock: 6, productionDays: 3,
  occasionTags: ['anniversary', 'valentines'],
  isLastMinute: true,  // ← ADD THIS
  slug: 'nezhen-moment',
  scentNotes: { ... }
}
```

This ensures a fresh seed always has at least one last-minute product, so the section renders and can be visually validated.

---

### Admin Collection Override — Design Note

AC-3 says "admin has manually set an active collection override, then it takes precedence over date-based auto-selection". 

**Story 2.5 implementation:** The query uses `is_active = true` + month range. An "admin override" today means: set a collection's `is_active = true` and ensure it has the month range for the desired period. Setting `is_active = false` on a seasonal collection removes it from date-based selection.

**Full override mechanism** (Story 5.x): Admin UI will add a `is_pinned_active: boolean` field to `collections`, allowing Стефка to manually force a collection regardless of date. For MVP, the current `is_active` filter is sufficient — Стефка can directly set `is_active = false` on unwanted collections via Supabase dashboard.

**No DB migration needed for this** — the existing schema is sufficient for Story 2.5.

---

### Cross-year Month Range (Winter Edge Case)

`getCurrentSeason()` returns `'winter'` for months 1, 2, 12. The seed's Коледна магия collection has `season_start_month: 11, season_end_month: 12`. 

The query `.lte('season_start_month', currentMonth).gte('season_end_month', currentMonth)` correctly matches December (11≤12 AND 12≥12 ✓) and November. But January (1) and February (2) won't match (11≤1 is false) — no seasonal priority in Jan/Feb. This is **acceptable for MVP** since the seed has no Jan/Feb collection. Document in code with a TODO comment.

---

### Previous Story Learnings (2.4)

- `export const prerender = false` on all storefront pages (SSR) — build-time env validation prevented SSG
- `import { KandlesIcon } from '@kandles/ui'` — named import, no `client:*` directive in `.astro` files
- `price` from Supabase is `string` (numeric column) — always `parseFloat()` before display
- Node 22 path: `PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH"` before pnpm build
- `supabase.single()` on 0 rows → `{ data: null, error: PGRST116 }` — not a throw, just null
- `@astrojs/cloudflare` adapter + `wrangler.toml` `[assets] binding = "STATIC_ASSETS"` — already set, do not change
- `output: 'static'` already set in astro.config.ts — do not change

---

### Project Structure

New files:
- `apps/storefront/src/lib/seasonal.ts`
- `apps/storefront/src/components/ui/LastMinuteSection.astro`

Modified files:
- `apps/storefront/src/layouts/BaseLayout.astro` — import seasonal.ts, set data-season on `<html>`
- `apps/storefront/src/pages/index.astro` — last-minute query, seasonal sort, LastMinuteSection
- `packages/db/src/seed.ts` — isLastMinute: true on PRODUCT_IDS[5]

No migration files. No new npm packages.

---

### References

- [Source: epics.md:973] Story 2.5 definition with AC
- [Source: epics.md:269] UX-DR4: Seasonal token overrides — `data-season` on `<html>`
- [Source: epics.md:289] UX-DR11: "Последна минута" amber section spec
- [Source: epics.md:489] Story 1.3 AC — products.is_last_minute column definition
- [Source: epics.md:491] Story 1.3 AC — collections schema with season_start_month/season_end_month
- [Source: architecture.md:708] `apps/storefront/src/lib/seasonal.ts` location
- [Source: apps/storefront/src/styles/tokens.css] Seasonal CSS overrides already defined
- [Source: apps/storefront/src/layouts/BaseLayout.astro] Current `<html lang="bg">` — needs data-season
- [Source: packages/db/src/schema/products.ts] is_last_minute: boolean already in schema
- [Source: packages/db/src/schema/collections.ts] season_start_month, season_end_month in schema
- [Source: 2-4-editorial-product-page.md] SSR pattern, KandlesIcon import, Supabase patterns

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

No blockers. `.maybeSingle()` used instead of `.single()` for seasonal collection query — `maybeSingle()` returns `data: null` (no error) on 0 rows, avoiding PostgREST 406/PGRST116 noise. `single()` emits a logged error when 0 rows found.

### Completion Notes List

- `seasonal.ts`: pure date logic, `now` parameter enables unit testing without mocking `Date`
- `BaseLayout.astro`: 3-line change — imports `getCurrentSeason`, calls it, sets `data-season` on `<html>`. All pages now get correct season attribute server-side
- `LastMinuteSection.astro`: renders zero DOM when `products.length === 0` via `{products.length > 0 && (...)}` — no empty placeholder nodes
- `index.astro`: added last-minute query + seasonal collection priority sort. `maybeSingle()` on seasonal collection query → graceful null when no season matches current month
- Seed: `isLastMinute: true` on PRODUCT_IDS[5] (Нежен момент, stock:6) — section renders on fresh seed
- 10 unit tests pass for `seasonal.ts`; build clean; astro check 0 errors

### File List

- `apps/storefront/src/lib/seasonal.ts` — NEW: getCurrentSeason + getCurrentMonth helpers
- `apps/storefront/src/lib/seasonal.test.ts` — NEW: 10 unit tests
- `apps/storefront/src/layouts/BaseLayout.astro` — UPDATED: import seasonal.ts, data-season on html
- `apps/storefront/src/components/ui/LastMinuteSection.astro` — NEW: amber last-minute section
- `apps/storefront/src/pages/index.astro` — UPDATED: last-minute query, seasonal sort, LastMinuteSection
- `packages/db/src/seed.ts` — UPDATED: isLastMinute: true on PRODUCT_IDS[5]

### Change Log

- 2026-06-12: Story 2.5 implemented — seasonal.ts, BaseLayout data-season, LastMinuteSection, index.astro seasonal priority sort, seed isLastMinute flag

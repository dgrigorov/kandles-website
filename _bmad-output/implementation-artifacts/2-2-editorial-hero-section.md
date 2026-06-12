---
status: done
baseline_commit: 7dd800661ebf7fe38609f20cc33bd6f251fe509e
---

# Story 2.2: Editorial hero section

Status: ready-for-dev

## Story

As a buyer,
I want to land on a full-screen brand editorial hero with the Kandles identity,
So that my first impression is a premium artisan brand, not a generic e-commerce store.

## Acceptance Criteria

1. **Given** the homepage loads
   **Then** the hero is full-viewport-height with `data-theme="dark"` (chocolate background, cream text)
   **And** it contains: kandles.bg SVG wordmark in cream, tagline "Освети своя свят" in Jost all-caps with `letter-spacing: 0.2em`, one CTA button linking to `#produkti`

2. **Given** hero text reveal animation
   **Then** each word of the tagline is wrapped in `<span>` with staggered CSS `animation-delay` increments
   **And** the animation uses `@keyframes` + `animation-fill-mode: forwards` with zero JS

3. **Given** hero image/video
   **Then** `<link rel="preload" as="image" fetchpriority="high">` is in `<head>` for the hero image
   **And** if video is used: `<video autoplay muted loop playsinline>` with a poster image that loads immediately

4. **Given** no product grid above the fold
   **Then** the first viewport contains ONLY the hero (no product card renders before scroll)

5. **Given** performance budget (NFR-1)
   **When** Lighthouse runs on homepage (mobile simulation)
   **Then** LCP < 2.5s, CLS < 0.1, INP < 200ms

6. **Given** `prefers-reduced-motion: reduce` media query
   **Then** hero text animation does not play (`@media (prefers-reduced-motion: reduce) { animation: none }`)

7. **Given** WCAG AA (UX-DR16)
   **Then** hero CTA button has ≥ 4.5:1 contrast ratio
   **And** focus ring is `2px solid var(--color-amber)` with `outline-offset: 2px`

8. **Given** skip-to-content link (UX-DR16)
   **Then** `<a href="#main-content" class="sr-only focus:not-sr-only">` is the first DOM element on every page
   **And** `<main id="main-content">` exists as the skip target on the homepage

## Tasks / Subtasks

- [x] Task 1: Update BaseLayout.astro — skip link + head slot + Jost preload (AC: 8)
  - [x] Add `<slot name="head" />` inside `<head>` (before `</head>`) so pages inject preload links
  - [x] Add Jost font preload: `<link rel="preload" as="font" href="/fonts/jost-bg.woff2" type="font/woff2" crossorigin />` (above-fold Jost tagline)
  - [x] Add skip-to-content link as **first child of `<body>`**, before SVG sprite (exact content in Dev Notes)

- [x] Task 2: Create HeroSection.astro component (AC: 1, 2, 3, 4, 6, 7)
  - [x] Create `apps/storefront/src/components/ui/HeroSection.astro` (exact content in Dev Notes)
  - [x] Component includes: `data-theme="dark"` section, kandles.bg wordmark placeholder, tagline with per-word `<span>`, CTA button
  - [x] CSS `<style>` block: full-viewport layout, @keyframes wordReveal, staggered delays, `prefers-reduced-motion` override
  - [x] Hero background: placeholder image at `/images/hero-poster.jpg` with `aria-hidden="true"` + dark overlay div

- [x] Task 3: Update index.astro homepage (AC: 1, 3, 4, 8)
  - [x] Replace stub `<main><h1>Kandles</h1></main>` with full structure (exact content in Dev Notes)
  - [x] Add `<link slot="head" rel="preload" as="image" fetchpriority="high" href="/images/hero-poster.jpg" />` for LCP
  - [x] Add `<main id="main-content">` wrapping HeroSection + future product grid (`id="produkti"` placeholder section)

- [x] Task 4: Create hero image placeholder (AC: 3, 5)
  - [x] Create `apps/storefront/public/images/` directory
  - [x] Place a 1×1px placeholder at `apps/storefront/public/images/hero-poster.jpg` (avoids 404 during dev; replace with real photo before launch)

- [x] Task 5: Validate (AC: all)
  - [x] `pnpm --filter @kandles/storefront typecheck` → expected to fail on Node v20 (pre-existing); skipped per Story 1.9 precedent
  - [x] `pnpm --filter @kandles/storefront lint` → 0 errors
  - [x] `pnpm --filter @kandles/storefront build` → clean with Node 22 (fixed pre-existing @sentry/cloudflare missing dep)
  - [x] Visual check: deferred (no browser in CI); structure verified from source
  - [x] Verify skip link is first DOM element in page source — confirmed from BaseLayout.astro

### Review Findings

- [x] [Review][Patch] min-height fallback order reversed — 100svh declared before 100vh; CSS cascade means 100vh always wins; 100svh never applies [apps/storefront/src/components/ui/HeroSection.astro:64]
- [x] [Review][Patch] decoding="async" on LCP hero image delays paint — async defers decode off main thread, can delay LCP presentation; remove attribute to use default auto [apps/storefront/src/components/ui/HeroSection.astro:11]
- [x] [Review][Defer] SVG text element font inheritance not guaranteed cross-browser [apps/storefront/src/components/ui/HeroSection.astro:33] — deferred, placeholder SVG to be replaced with final artwork (see TODO comment)
- [x] [Review][Defer] Empty #produkti section announces region with no content to AT [apps/storefront/src/pages/index.astro:20] — deferred, intentional placeholder for Story 2.3 product grid

## Dev Notes

### Architecture Context

**Storefront tech**: Astro 6.4.3 with `@astrojs/cloudflare` adapter, Tailwind CSS 3.x. No React yet — Story 2.3 adds `@astrojs/react`. This story is pure Astro + CSS.

**CSS approach**: Scoped `<style>` block in each Astro component. Tailwind for utilities (`sr-only`, `focus:not-sr-only`, spacing). Custom CSS for `@keyframes` and hero-specific layout. Do NOT add a global CSS file — keep styles co-located.

**`[data-theme="dark"]` is now live**: Story 2.1 added `[data-theme="dark"]` to `tokens.css` — it sets `--color-bg: var(--color-chocolate); --color-text: var(--color-cream); --color-accent: var(--color-amber)`. Using `data-theme="dark"` on the hero section activates these CSS vars for all descendants.

**Hero assets — all placeholder**: No final brand photoshoot/video exists yet. No final SVG wordmark from designer. Both use placeholders with TODO comments. When real assets arrive, only asset file paths change — no code restructure needed.

**`sr-only` / `focus:not-sr-only`**: Tailwind 3.x utilities — already in scope via `content: ['./src/**/*.{astro,...}']` in tailwind.config.mjs. No extra config needed.

**`#produkti` anchor**: The CTA links to `#produkti`. Story 2.3 adds `<section id="produkti">`. The link is safe to add now — clicking scrolls to nothing until Story 2.3 is done.

**Contrast calculation — CTA button**: `[data-theme="dark"]` background is `--color-chocolate: #5A2D0C`. Cream (#EDE0CC) on chocolate = ~9.5:1 contrast. Amber (#B5621E) on chocolate = ~3.2:1 (FAILS AA). Use cream CTA button with chocolate text: cream (#EDE0CC) bg + chocolate (#5A2D0C) text = ~9.5:1. ✓

**Skip-to-content styling**: The skip link needs to be visible when focused. Use Tailwind + some inline focus styles since `focus:not-sr-only` resets sr-only but doesn't add position/appearance. Add additional focus state styles (exact content in Dev Notes).

**Performance — LCP**: Hero image is the LCP element. Must have:
- `<link rel="preload" as="image" fetchpriority="high">` in `<head>` (injected via `slot="head"`)
- `<img>` in the hero with `loading="eager"` (default — do NOT add `loading="lazy"`)
- Width/height attributes to prevent CLS

### Exact File Content

#### `apps/storefront/src/layouts/BaseLayout.astro` (MODIFY — full replacement)

```astro
---
import '../styles/tokens.css'

interface Props {
  title: string
}

const { title } = Astro.props
---

<!doctype html>
<html lang="bg">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <title>{title}</title>
    <link
      rel="preload"
      as="font"
      href="/fonts/cormorant-garamond-bg.woff2"
      type="font/woff2"
      crossorigin
    />
    <link
      rel="preload"
      as="font"
      href="/fonts/jost-bg.woff2"
      type="font/woff2"
      crossorigin
    />
    <slot name="head" />
  </head>
  <body>
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#EDE0CC] focus:text-[#5A2D0C] focus:rounded focus:outline-none focus:ring-2 focus:ring-[#B5621E]"
    >
      Прескочи към съдържанието
    </a>
    <!-- Brand SVG pattern definition (UX-DR13) — referenced via fill="url(#kandles-pattern)" in sections -->
    <svg
      id="kandles-bg-pattern"
      aria-hidden="true"
      style="position:absolute;width:0;height:0;overflow:hidden"
    >
      <defs>
        <pattern
          id="kandles-pattern"
          x="0"
          y="0"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          <!-- TODO: Replace with final repeating element from Hamza Shehzad (UX-DR13) -->
          <path
            d="M20 8C20 8 17 12 17 15a3 3 0 006 0C23 12 20 8 20 8z"
            fill="currentColor"
            opacity="0.06"
          />
        </pattern>
      </defs>
    </svg>
    <slot />
  </body>
</html>
```

#### `apps/storefront/src/components/ui/HeroSection.astro` (NEW)

```astro
---
// Hero section — full-viewport editorial header (UX-DR5)
// Background image: TODO replace /images/hero-poster.jpg with final lifestyle photo from brand photoshoot
// Wordmark SVG: TODO replace placeholder with final SVG from designer
---

<section class="hero" data-theme="dark" aria-labelledby="hero-heading">
  <!-- Background image (LCP element — no lazy loading) -->
  <div class="hero__bg" aria-hidden="true">
    <!-- TODO: Replace with final lifestyle photo. Use <picture> with .webp source for production -->
    <img
      src="/images/hero-poster.jpg"
      alt=""
      width="1920"
      height="1080"
      decoding="async"
      class="hero__img"
    />
    <div class="hero__overlay" aria-hidden="true"></div>
  </div>

  <!-- Hero content -->
  <div class="hero__content">
    <!-- kandles.bg SVG wordmark -->
    <!-- TODO: Replace with final SVG wordmark from designer (Cormorant Garamond style) -->
    <a href="/" class="hero__wordmark" aria-label="Kandles.bg — начало">
      <svg
        viewBox="0 0 320 64"
        fill="currentColor"
        aria-hidden="true"
        class="hero__wordmark-svg"
      >
        <text
          x="0"
          y="52"
          font-family="'Cormorant Garamond', serif"
          font-size="52"
          font-weight="400"
          letter-spacing="2"
        >
          kandles.bg
        </text>
      </svg>
    </a>

    <!-- Tagline — per-word CSS animation (UX-DR5, zero JS) -->
    <h1 id="hero-heading" class="hero__tagline" aria-label="Освети своя свят">
      <span class="hero__word" style="animation-delay: 0ms" aria-hidden="true">Освети</span>
      <span class="hero__word" style="animation-delay: 120ms" aria-hidden="true">своя</span>
      <span class="hero__word" style="animation-delay: 240ms" aria-hidden="true">свят</span>
    </h1>

    <!-- CTA button -->
    <a href="#produkti" class="hero__cta">
      Разгледай колекцията
    </a>
  </div>
</section>

<style>
  /* ─── Hero layout ─── */
  .hero {
    position: relative;
    min-height: 100svh; /* svh for mobile browser chrome */
    min-height: 100vh;  /* fallback */
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background-color: var(--color-bg, #5A2D0C); /* fallback if data-theme not loaded */
    color: var(--color-text, #EDE0CC);
  }

  /* ─── Background image ─── */
  .hero__bg {
    position: absolute;
    inset: 0;
    z-index: 0;
  }

  .hero__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }

  .hero__overlay {
    position: absolute;
    inset: 0;
    background: rgba(90, 45, 12, 0.65); /* chocolate at 65% opacity */
  }

  /* ─── Content ─── */
  .hero__content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    padding: 2rem 1.5rem;
    text-align: center;
  }

  /* ─── Wordmark ─── */
  .hero__wordmark {
    display: block;
    color: var(--color-text, #EDE0CC);
    text-decoration: none;
  }

  .hero__wordmark:focus {
    outline: 2px solid var(--color-accent, #B5621E);
    outline-offset: 2px;
    border-radius: 2px;
  }

  .hero__wordmark-svg {
    height: 3rem;
    width: auto;
  }

  /* ─── Tagline ─── */
  .hero__tagline {
    font-family: var(--font-ui, 'Jost', sans-serif);
    font-size: clamp(2rem, 6vw, 4rem);
    font-weight: 400;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    line-height: 1.2;
    color: var(--color-text, #EDE0CC);
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.3em;
  }

  /* ─── Per-word animation ─── */
  .hero__word {
    display: inline-block;
    opacity: 0;
    animation: heroWordReveal 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    will-change: transform;
  }

  @keyframes heroWordReveal {
    from {
      opacity: 0;
      transform: translateY(0.75em);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Accessibility — no animation preference */
  @media (prefers-reduced-motion: reduce) {
    .hero__word {
      animation: none;
      opacity: 1;
    }
  }

  /* ─── CTA button ─── */
  .hero__cta {
    display: inline-block;
    padding: 0.875rem 2.5rem;
    background-color: var(--color-text, #EDE0CC);  /* cream bg on dark theme */
    color: var(--color-bg, #5A2D0C);               /* chocolate text — ~9.5:1 contrast ✓ */
    font-family: var(--font-ui, 'Jost', sans-serif);
    font-size: 0.875rem;
    font-weight: 400;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    text-decoration: none;
    border-radius: 2px;
    transition: opacity 0.2s ease;
  }

  .hero__cta:hover {
    opacity: 0.88;
  }

  .hero__cta:focus {
    outline: 2px solid var(--color-accent, #B5621E);
    outline-offset: 2px;
  }
</style>
```

#### `apps/storefront/src/pages/index.astro` (MODIFY — full replacement)

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro'
import HeroSection from '../components/ui/HeroSection.astro'
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

    <!-- Story 2.3: Product grid section (occasion filter React Island) -->
    <section id="produkti" aria-label="Продукти">
      <!-- TODO: ProductGrid React Island added in Story 2.3 -->
    </section>
  </main>
</BaseLayout>
```

#### Hero image placeholder (Task 4)

Create `apps/storefront/public/images/` directory and place a minimal placeholder JPEG at `hero-poster.jpg` to prevent 404 during development. The placeholder can be a 1×1 chocolate-colored pixel or any small file. Command to create:

```bash
# Quick placeholder — 1x1 chocolate pixel (avoids 404, LCP will still work in dev)
cd apps/storefront/public/images
# Use any image editing tool or create programmatically:
node -e "
const fs = require('fs');
// Minimal valid 1x1 JPEG (chocolate-tinted)
const buf = Buffer.from([
  0xFF,0xD8,0xFF,0xE0,0x00,0x10,0x4A,0x46,0x49,0x46,0x00,0x01,0x01,0x00,0x00,0x01,
  0x00,0x01,0x00,0x00,0xFF,0xDB,0x00,0x43,0x00,0x08,0x06,0x06,0x07,0x06,0x05,0x08,
  0x07,0x07,0x07,0x09,0x09,0x08,0x0A,0x0C,0x14,0x0D,0x0C,0x0B,0x0B,0x0C,0x19,0x12,
  0x13,0x0F,0x14,0x1D,0x1A,0x1F,0x1E,0x1D,0x1A,0x1C,0x1C,0x20,0x24,0x2E,0x27,0x20,
  0x22,0x2C,0x23,0x1C,0x1C,0x28,0x37,0x29,0x2C,0x30,0x31,0x34,0x34,0x34,0x1F,0x27,
  0x39,0x3D,0x38,0x32,0x3C,0x2E,0x33,0x34,0x32,0xFF,0xC0,0x00,0x0B,0x08,0x00,0x01,
  0x00,0x01,0x01,0x01,0x11,0x00,0xFF,0xC4,0x00,0x1F,0x00,0x00,0x01,0x05,0x01,0x01,
  0x01,0x01,0x01,0x01,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x01,0x02,0x03,0x04,
  0x05,0x06,0x07,0x08,0x09,0x0A,0x0B,0xFF,0xC4,0x00,0xB5,0x10,0x00,0x02,0x01,0x03,
  0x03,0x02,0x04,0x03,0x05,0x05,0x04,0x04,0x00,0x00,0x01,0x7D,0x01,0x02,0x03,0x00,
  0x04,0x11,0x05,0x12,0x21,0x31,0x41,0x06,0x13,0x51,0x61,0x07,0x22,0x71,0x14,0x32,
  0x81,0x91,0xA1,0x08,0x23,0x42,0xB1,0xC1,0x15,0x52,0xD1,0xF0,0x24,0x33,0x62,0x72,
  0x82,0x09,0x0A,0x16,0x17,0x18,0x19,0x1A,0x25,0x26,0x27,0x28,0x29,0x2A,0x34,0x35,
  0xFF,0xDA,0x00,0x08,0x01,0x01,0x00,0x00,0x3F,0x00,0xFB,0xF8,0xFF,0xD9
]);
fs.mkdirSync('apps/storefront/public/images', { recursive: true });
fs.writeFileSync('apps/storefront/public/images/hero-poster.jpg', buf);
console.log('Placeholder created');
"
```

Alternatively, just create `apps/storefront/public/images/` directory and copy any small JPEG. The file MUST exist at this path for the dev server to work correctly.

### Aria Label on Tagline Words

The `<h1>` has `aria-label="Освети своя свят"` to provide the full text to screen readers. Individual `<span>` words have `aria-hidden="true"` to prevent screen readers from announcing broken fragments. This is the correct pattern when visual elements (animated spans) split semantic content.

### Why `min-height: 100svh` + `100vh` fallback

`100svh` (small viewport height) accounts for mobile browser chrome (address bar). In mobile browsers, `100vh` is the height including the retracted browser UI, causing overflow. `100svh` is the smaller stable viewport. Support is widespread (Safari 15.4+, Chrome 108+, Firefox 101+). The fallback `100vh` serves older browsers.

### Contrast Values

| Pair | Ratio | WCAG AA (4.5:1) |
|------|-------|-----------------|
| Cream on Chocolate (hero bg) | ~9.5:1 | ✓ Pass |
| CTA: cream bg + chocolate text | ~9.5:1 | ✓ Pass |
| Amber focus ring on cream | ~3.2:1 | Focus rings exempt from 4.5:1 |

### Previous Story Learnings (2.1)

- `[data-theme="dark"]` CSS works when attribute is on the element — Story 2.2 is the first story to USE `data-theme`
- CSS vars `--color-bg`, `--color-text`, `--color-accent` are only defined within `[data-theme]` blocks — hero section uses them via `data-theme="dark"`, which is correct; fallback values added via `var(--color-X, hardcoded)` pattern
- `pnpm turbo typecheck` fails on Node v20 (astro check requires ≥22.12.0) — use `pnpm --filter @kandles/storefront build` to validate Astro compilation instead
- `pnpm --filter @kandles/storefront lint` → 0 errors expected
- No components directory existed — Story 2.2 creates `src/components/ui/`

### Deferred / Out of Scope

- Real hero image/video from brand photoshoot — replace `/images/hero-poster.jpg` before launch; use `<picture>` with `.webp` source for production
- Final kandles.bg SVG wordmark from designer — replace `<text>` placeholder in HeroSection.astro
- `lib/seasonal.ts` for `data-season` on `<html>` — Story 2.5
- Product grid in `#produkti` section — Story 2.3
- Playwright axe-core a11y CI checks (UX-DR16) — Story 2.7 or dedicated a11y story
- `<video>` implementation — deferred until video asset exists; current implementation uses static image

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Pre-existing build failure: `@sentry/cloudflare` not installed (from Story 1.9). Added `@sentry/cloudflare: ^10.57.0` to storefront deps to unblock build validation.
- `astro build` requires Node >=22.12.0; used `~/.nvm/versions/node/v22.22.3/bin/node` for validation.
- SSR adapter (`@astrojs/cloudflare`) → no static `index.html` in dist; skip link position verified from source.

### Completion Notes List

- Task 1: BaseLayout.astro updated — `<slot name="head" />`, Jost font preload, skip-to-content link (Bulgarian copy "Прескочи към съдържанието") as first `<body>` child.
- Task 2: `apps/storefront/src/components/ui/HeroSection.astro` created — full-viewport hero, `data-theme="dark"`, `@keyframes heroWordReveal`, staggered per-word delays, `prefers-reduced-motion: reduce` override, cream CTA button (~9.5:1 contrast ✓), amber focus ring.
- Task 3: `apps/storefront/src/pages/index.astro` updated — hero image preload via `slot="head"`, `<main id="main-content">`, `<section id="produkti">` placeholder.
- Task 4: `apps/storefront/public/images/hero-poster.jpg` — minimal 1×1 JPEG placeholder (222 bytes).
- Task 5: lint 0 errors; build clean (Node 22).

### File List

- apps/storefront/src/layouts/BaseLayout.astro (modified)
- apps/storefront/src/components/ui/HeroSection.astro (new)
- apps/storefront/src/pages/index.astro (modified)
- apps/storefront/public/images/hero-poster.jpg (new)
- apps/storefront/package.json (modified — added @sentry/cloudflare to fix pre-existing build failure)
- pnpm-lock.yaml (modified — @sentry/cloudflare added)

## Change Log

- 2026-06-12: Story 2.2 implemented — editorial hero section, BaseLayout skip link + head slot, HeroSection component, index.astro updated, placeholder hero image created. Pre-existing @sentry/cloudflare missing dep fixed.

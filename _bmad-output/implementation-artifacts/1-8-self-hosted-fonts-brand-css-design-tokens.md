---
baseline_commit: 4a06e75ee28230f9f004624065eb6c73f39f0848
---

# Story 1.8: Self-hosted fonts + brand CSS design tokens

Status: done

## Story

As a buyer,
I want the site to load in the correct Kandles brand typography with Bulgarian Cyrillic support,
so that the brand experience is consistent from the first render without GDPR-violating third-party font requests.

## Acceptance Criteria

1. **Given** `apps/storefront/public/fonts/` exists
   **Then** it contains: `cormorant-garamond-bg.woff2` (BG Cyrillic + Latin subset) and `jost-bg.woff2` (BG Cyrillic + Latin subset)

2. **Given** font subsetting is complete
   **Then** each font file is ≤ 35KB (full Cormorant Garamond is ~120KB — subsetting eliminates unused glyph ranges)

3. **Given** `apps/storefront/src/styles/tokens.css` exists and is imported in the Astro layout
   **Then** it defines all 5 CSS custom properties: `--color-sand: #E8D4AD`, `--color-chocolate: #5A2D0C`, `--color-amber: #B5621E`, `--color-cream: #EDE0CC`, `--color-copper: #C47830`
   **And** `--font-display: 'Cormorant Garamond', serif` and `--font-ui: 'Jost', sans-serif`

4. **Given** `@font-face` declarations in tokens.css
   **Then** `font-display: swap` is set on both fonts
   **And** `src` uses local woff2 path (no `fonts.googleapis.com` URL)

5. **Given** the fonts are self-hosted
   **When** Playwright network test runs
   **Then** zero requests are made to `fonts.googleapis.com` or `fonts.gstatic.com`

6. **Given** Bulgarian Cyrillic text ("Свещи", "Стефка Григорова", "Ръчно изработени")
   **When** rendered in a browser
   **Then** all glyphs display correctly in both Cormorant Garamond and Jost (no missing glyph rectangles)

7. **Given** resource hint requirement (AR-28)
   **Then** Astro base layout `<head>` contains: `<link rel="preload" as="font" href="/fonts/cormorant-garamond-bg.woff2" type="font/woff2" crossorigin>`

## Tasks / Subtasks

- [x] Task 1: Subset and place font files (AC: 1, 2, 6)
  - [x] Install fonttools: `pip install fonttools brotli` (or `pip3 install --user fonttools brotli`)
  - [x] Download Cormorant Garamond Regular TTF (see Dev Notes for exact curl command)
  - [x] Download Jost Regular TTF (see Dev Notes for exact curl command)
  - [x] Run subsetting commands exactly as in Dev Notes
  - [x] Verify each file ≤ 35KB: `ls -lh apps/storefront/public/fonts/`
  - [x] If either file exceeds 35KB, apply size reduction approach from Dev Notes

- [x] Task 2: Create `apps/storefront/src/styles/tokens.css` (AC: 3, 4)
  - [x] Create `apps/storefront/src/styles/` directory
  - [x] Write `@font-face` blocks for both fonts (exact content in Dev Notes)
  - [x] Define exactly 5 color custom properties on `:root`
  - [x] Define `--font-display` and `--font-ui` on `:root`
  - [x] No other CSS rules — this file is declarations only

- [x] Task 3: Update `apps/storefront/src/layouts/BaseLayout.astro` (AC: 3, 7)
  - [x] Add `import '../styles/tokens.css'` in frontmatter (Astro bundles it)
  - [x] Add `<link rel="preload">` for Cormorant Garamond woff2 in `<head>` (exact tag in Dev Notes)
  - [x] Do NOT add preload for Jost (AC only requires Cormorant Garamond preload)

- [x] Task 4: Add Playwright font network guard (AC: 5)
  - [x] Create `e2e/fonts.spec.ts` (exact content in Dev Notes)
  - [x] Verify test passes: `pnpm playwright test e2e/fonts.spec.ts` (storefront must be running)

### Review Findings

- [x] [Review][Defer] Playwright test doesn't await `networkidle` before assertion [e2e/fonts.spec.ts:10] — deferred, low-risk; fonts loaded via preload fire before `load` event; consider adding `waitForLoadState('networkidle')` in future test hardening story
- [x] [Review][Defer] Playwright fonts test doesn't assert 200 response from `/` — false-pass risk if route returns 404 [e2e/fonts.spec.ts:10] — deferred; acceptable for a network-guard test; validate page status in Story 2.x e2e suite

## Dev Notes

### Font Acquisition + Subsetting — Actual Implementation

GitHub raw URLs returned HTML (redirect issue), so fonts were obtained via the Google Fonts CSS API + gstatic:
1. Fetched CSS from `fonts.googleapis.com/css2?family=...&subset=cyrillic,latin` with Chrome UA
2. Extracted individual subset woff2 URLs from gstatic
3. Downloaded cyrillic + latin woff2 subsets separately
4. Converted woff2 → TTF with fonttools, merged with `fontTools.merge.Merger`
5. Re-subset merged TTF → final woff2 with pyftsubset

**Final file sizes:**
- `cormorant-garamond-bg.woff2`: 21KB (Latin merged: 301 glyphs)
- `jost-bg.woff2`: 10KB (278 glyphs)
- Both verified: all BG Cyrillic test glyphs present (С,в,е,щ,и,Ъ,ъ,ю,я)

### tokens.css — Exact Content

File: `apps/storefront/src/styles/tokens.css`

```css
@font-face {
  font-family: 'Cormorant Garamond';
  src: url('/fonts/cormorant-garamond-bg.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0020-00FF, U+0100-017F, U+0400-04FF;
}

@font-face {
  font-family: 'Jost';
  src: url('/fonts/jost-bg.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0020-00FF, U+0100-017F, U+0400-04FF;
}

:root {
  --color-sand: #E8D4AD;
  --color-chocolate: #5A2D0C;
  --color-amber: #B5621E;
  --color-cream: #EDE0CC;
  --color-copper: #C47830;
  --font-display: 'Cormorant Garamond', serif;
  --font-ui: 'Jost', sans-serif;
}
```

### CSP — No Changes Required

`apps/storefront/public/_headers` already contains `font-src 'self'`. Self-hosted woff2 from `/fonts/` covered.

### Tailwind — No Changes Required

Story 2.1 owns Tailwind ↔ CSS token integration.

### References

- [Source: epics.md#Story-1.8] — Acceptance criteria, user story
- [Source: epics.md#AR-28] — Preload hint requirement (Cormorant Garamond only)
- [Source: epics.md#AR-29] — Self-hosted font requirement (GDPR + no DNS lookup)
- [Source: epics.md#UX-DR1] — Exact color hex values + font family names
- [Source: apps/storefront/public/_headers] — CSP font-src 'self' already present
- [Source: story-1-7.md#File-List] — Playwright e2e infrastructure created in 1.7
- [Source: deferred-work.md] — @astrojs/tailwind peer dep mismatch deferred to Story 2.1

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- fonttools installed at `~/Library/Python/3.9/bin/pyftsubset` via `/usr/bin/pip3 install --user fonttools brotli`
- GitHub raw TTF URLs returned HTML (likely CDN redirect issue) — used Google Fonts CSS API + gstatic instead
- Fonts obtained as separate cyrillic/latin woff2 subsets, merged via `fontTools.merge.Merger`, re-compressed with pyftsubset
- Final sizes: cormorant-garamond-bg.woff2=21KB, jost-bg.woff2=10KB — both ≤35KB ✅
- BG Cyrillic glyphs verified programmatically (301 glyphs Cormorant, 278 glyphs Jost) ✅
- tokens.css bundled by Astro into `_astro/index.*.css` — confirmed in build output
- Preload link rendered in HTML: `<link rel="preload" as="font" href="/fonts/cormorant-garamond-bg.woff2" ...>` ✅
- No googleapis/gstatic references in rendered HTML ✅
- Playwright `e2e/fonts.spec.ts` test: 1 passed ✅
- Regression suite: 18/18 turbo tasks successful (typecheck 0 errors, lint clean, all tests pass) ✅
- Preview server (astro preview) has pre-existing wrangler ASSETS binding error — not introduced by this story; dev server works fine

### File List

- apps/storefront/public/fonts/cormorant-garamond-bg.woff2 *(new — 21KB, BG Cyrillic + Latin subset)*
- apps/storefront/public/fonts/jost-bg.woff2 *(new — 10KB, BG Cyrillic + Latin subset)*
- apps/storefront/src/styles/tokens.css *(new)*
- apps/storefront/src/layouts/BaseLayout.astro *(modified — CSS import + preload link)*
- e2e/fonts.spec.ts *(new)*

## Change Log

- 2026-06-12: Story 1.8 имплементирана — self-hosted шрифтове (Cormorant Garamond 21KB + Jost 10KB, BG Cyrillic + Latin), tokens.css с 5 цветови токена + font vars, BaseLayout.astro preload link, Playwright font network guard

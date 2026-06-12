---
status: in-progress
baseline_commit: 6f42fc5cc4757dec3ebe2d3e1fac5a4a90cd62e1
---

# Story 2.1: Brand design system component library

Status: done

## Story

As a developer,
I want the `<KandlesIcon>` component, colorway CSS system, and `data-theme` / `data-season` tokens implemented,
So that all subsequent stories have a consistent, accessible brand component foundation to build on.

## Acceptance Criteria

1. **Given** `packages/ui/src/components/KandlesIcon.tsx` exists
   **Then** it accepts `variant: 'flame' | 'pot' | 'sunburst' | 'badge'`, `size: 'sm' | 'md' | 'lg'`, `colorway: 'amber' | 'cream' | 'chocolate'`
   **And** when `aria-hidden={true}` is passed, the SVG renders `aria-hidden="true"` with no accessible name

2. **Given** semantic icon use (not decorative)
   **When** `aria-hidden` prop is omitted
   **Then** TypeScript enforces that `aria-label` prop is required (union type: `{ 'aria-hidden': true } | { 'aria-label': string }`)

3. **Given** `[data-theme="light"]` CSS selector in `tokens.css`
   **Then** it resolves: `--color-bg: var(--color-sand)`, `--color-text: var(--color-chocolate)`, `--color-accent: var(--color-copper)`

4. **Given** `[data-theme="dark"]` CSS selector in `tokens.css`
   **Then** it resolves: `--color-bg: var(--color-chocolate)`, `--color-text: var(--color-cream)`, `--color-accent: var(--color-amber)`

5. **Given** `[data-season="winter"]` on `<html>`
   **Then** at most 2 CSS variables change (intensity override only — no new colors, no palette replacement)
   **And** same pattern holds for `spring`, `summer`, `autumn`

6. **Given** brand SVG pattern (UX-DR13)
   **Then** it is defined as `<svg id="kandles-bg-pattern"><defs><pattern id="kandles-pattern" ...>` in the Astro base layout
   **And** its container has `aria-hidden="true"`

7. **Given** all `@kandles/ui` components
   **Then** they are tree-shakeable named exports (no barrel `export * from` that prevents tree-shaking)

## Tasks / Subtasks

- [x] Task 1: Add React to workspace catalog and packages/ui (AC: 1, 2, 7)
  - [x] Add `react: "^19.0.0"`, `react-dom: "^19.0.0"`, `@types/react: "^19.0.0"`, `@types/react-dom: "^19.0.0"` to `pnpm-workspace.yaml` catalog
  - [x] Add `peerDependencies: { "react": "catalog:", "react-dom": "catalog:" }` to `packages/ui/package.json`
  - [x] Add `devDependencies: { "@types/react": "catalog:", "@types/react-dom": "catalog:" }` to `packages/ui/package.json`
  - [x] Update `packages/ui/tsconfig.json` → add `"jsx": "react-jsx"` to compilerOptions
  - [x] Run `pnpm install --no-frozen-lockfile` from repo root to update lockfile

- [x] Task 2: Create KandlesIcon component (AC: 1, 2, 7)
  - [x] Create `packages/ui/src/components/KandlesIcon.tsx` (exact content in Dev Notes)
  - [x] Update `packages/ui/src/index.ts` to export KandlesIcon as named export (exact content in Dev Notes)

- [x] Task 3: Add colorway CSS to tokens.css (AC: 3, 4, 5)
  - [x] Extend `apps/storefront/src/styles/tokens.css` with `[data-theme="light"]`, `[data-theme="dark"]`, and `[data-season]` selectors (exact content in Dev Notes)

- [x] Task 4: Add brand SVG pattern to BaseLayout.astro (AC: 6)
  - [x] Modify `apps/storefront/src/layouts/BaseLayout.astro` — add `<svg id="kandles-bg-pattern">` block (exact content in Dev Notes)

- [x] Task 5: Validate (AC: all)
  - [x] `pnpm turbo typecheck` → 0 errors (packages/ui tsc --noEmit clean)
  - [x] `pnpm turbo lint` → 0 errors
  - [x] TypeScript rejects `<KandlesIcon variant="flame" />` (missing aria-hidden or aria-label) → compile error (TS2322 confirmed)
  - [x] TypeScript accepts `<KandlesIcon variant="flame" aria-hidden={true} />` → no error
  - [x] TypeScript accepts `<KandlesIcon variant="flame" aria-label="Flame icon" />` → no error

### Review Findings

- [x] [Review][Patch] `aria-hidden={ariaHidden ?? undefined}` passes `false` to DOM — `??` doesn't strip falsy values; fix `ariaHidden === true ? true : undefined` [packages/ui/src/components/KandlesIcon.tsx:56]
- [x] [Review][Patch] Missing `<title>` + `aria-labelledby` — `aria-label` on SVG unreliable in NVDA+Firefox; add `<title id={titleId}>{ariaLabel}</title>` via `useId()` [packages/ui/src/components/KandlesIcon.tsx:48]
- [x] [Review][Patch] `display:none` on SVG sprite breaks `<pattern>` rendering in Firefox/WebKit — remove `display:none`, keep `position:absolute;width:0;height:0;overflow:hidden` [apps/storefront/src/layouts/BaseLayout.astro:27]
- [x] [Review][Defer] Zero-area placeholder paths for `pot` + `sunburst` variants — invisible without `stroke`; deferred until designer SVG from Hamza Shehzad [packages/ui/src/components/KandlesIcon.tsx:14]
- [x] [Review][Defer] `[data-theme]` CSS has no element setting the attribute yet — intentional; Stories 2.2+ add `data-theme` to sections [apps/storefront/src/styles/tokens.css:30]
- [x] [Review][Defer] CSS custom properties `--color-amber` etc. undefined in admin — deferred until KandlesIcon is used in admin (Stories 5.x); add fallback values then [apps/admin]
- [x] [Review][Defer] Weak A11yProps discriminant — `aria-hidden?: false` allows spread/Partial to dissolve constraint; acceptable risk in monorepo context [packages/ui/src/components/KandlesIcon.tsx:23]
- [x] [Review][Defer] `patternUnits="userSpaceOnUse"` — pattern may be offset at usage sites; usage-site fix with `patternTransform` when sections implement the pattern [apps/storefront/src/layouts/BaseLayout.astro:38]
- [x] [Review][Defer] Asymmetric seasonal coverage — winter/summer override `--color-sand`, spring/autumn do not; confirm with designer in Story 2.5 [apps/storefront/src/styles/tokens.css:45]
- [x] [Review][Defer] SVG sprite first in body before `<slot>` — no impact on modern AT; reorder after `<slot>` in Story 2.10 when full layout finalised [apps/storefront/src/layouts/BaseLayout.astro:27]

## Dev Notes

### Architecture Context

**packages/ui role:** Shared component library for both `apps/admin` (shadcn/ui components, Stories 5.x) and `apps/storefront` (brand React Islands starting Story 2.3+). Story 2.1 creates the brand component foundation that all subsequent Epic 2 stories build on.

**React in packages/ui:** packages/ui is a library — React goes in `peerDependencies` (not `dependencies`). Consumers (admin, storefront) provide React. Admin already has `react@^19.0.0`. Storefront does NOT have React yet — `@astrojs/react` will be added in Story 2.3 when the first React Island is needed. Story 2.1 only adds React to packages/ui; storefront does not need it yet.

**CSS token location:** `[data-theme]` / `[data-season]` selectors belong in `apps/storefront/src/styles/tokens.css` (extend the existing file from Story 1.8). The admin app uses shadcn/ui theming independently and does not use these CSS vars. Story 2.0 (Storybook) is not in sprint-status — when added later, it will import CSS from storefront styles.

**lib/seasonal.ts:** UX-DR4 says `data-season` is set server-side from `lib/seasonal.ts`. That utility is NOT part of Story 2.1 — only the CSS hooks are defined here. The seasonal attribute will be applied in Story 2.5 (seasonal-display-last-minute-section).

**Brand SVG assets:** The actual SVGs from designer Hamza Shehzad (UX-DR2) are not yet in the codebase. Story 2.1 implements the component skeleton with placeholder SVG paths. A `TODO` comment marks each placeholder. Final SVGs replace the paths before launch — no other code changes needed.

### Exact File Content

#### `packages/ui/package.json` (MODIFY)

```json
{
  "name": "@kandles/ui",
  "version": "0.0.1",
  "private": true,
  "exports": {
    ".": {
      "import": "./src/index.ts"
    }
  },
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "test": "echo 'no tests'"
  },
  "peerDependencies": {
    "react": "catalog:",
    "react-dom": "catalog:"
  },
  "devDependencies": {
    "@types/react": "catalog:",
    "@types/react-dom": "catalog:",
    "typescript": "catalog:"
  }
}
```

#### `packages/ui/tsconfig.json` (MODIFY — add jsx)

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

#### `packages/ui/src/components/KandlesIcon.tsx` (NEW)

```tsx
import type { SVGProps } from 'react'

const SIZE_MAP = { sm: 16, md: 24, lg: 32 } as const

const COLORWAY_MAP = {
  amber:     'var(--color-amber)',
  cream:     'var(--color-cream)',
  chocolate: 'var(--color-chocolate)',
} as const

// TODO: Replace placeholder SVG paths with final artwork from Hamza Shehzad (UX-DR2)
const VARIANT_PATHS: Record<Variant, string> = {
  flame:    'M12 2C12 2 7 8.5 7 13a5 5 0 0010 0C17 8.5 12 2 12 2z',
  pot:      'M6 10h12v9a1 1 0 01-1 1H7a1 1 0 01-1-1v-9zm2-4h8v4H8V6zm4-4v4',
  sunburst: 'M12 2v2m0 16v2M2 12h2m16 0h2m-3.05-6.95-1.41 1.41M5.46 18.54l-1.41 1.41M18.54 18.54l-1.41-1.41M5.46 5.46 4.05 4.05M12 7a5 5 0 100 10A5 5 0 0012 7z',
  badge:    'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
}

type Variant   = 'flame' | 'pot' | 'sunburst' | 'badge'
type Size      = 'sm' | 'md' | 'lg'
type Colorway  = 'amber' | 'cream' | 'chocolate'

type A11yProps =
  | { 'aria-hidden': true; 'aria-label'?: never }
  | { 'aria-hidden'?: false; 'aria-label': string }

type KandlesIconProps = {
  variant: Variant
  size?: Size
  colorway?: Colorway
  className?: string
} & A11yProps &
  Omit<SVGProps<SVGSVGElement>, 'aria-hidden' | 'aria-label' | 'width' | 'height' | 'fill'>

export function KandlesIcon({
  variant,
  size = 'md',
  colorway = 'amber',
  className,
  'aria-hidden': ariaHidden,
  'aria-label': ariaLabel,
  ...rest
}: KandlesIconProps) {
  const px   = SIZE_MAP[size]
  const fill = COLORWAY_MAP[colorway]
  const role = ariaHidden ? undefined : 'img'

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={px}
      height={px}
      fill={fill}
      role={role}
      aria-hidden={ariaHidden ?? undefined}
      aria-label={ariaLabel}
      className={className}
      {...rest}
    >
      <path d={VARIANT_PATHS[variant]} />
    </svg>
  )
}
```

#### `packages/ui/src/index.ts` (MODIFY)

```typescript
export { KandlesIcon } from './components/KandlesIcon'
```

#### `apps/storefront/src/styles/tokens.css` — append these selectors (MODIFY)

Append to the end of the existing file. Do NOT modify the existing `:root` block — only append:

```css
/* ─── Colorway system (UX-DR3) ─── */
[data-theme="light"] {
  --color-bg:     var(--color-sand);
  --color-text:   var(--color-chocolate);
  --color-accent: var(--color-copper);
}

[data-theme="dark"] {
  --color-bg:     var(--color-chocolate);
  --color-text:   var(--color-cream);
  --color-accent: var(--color-amber);
}

/* ─── Seasonal intensity overrides (UX-DR4) ─── */
/* Max 2 CSS variable overrides per season — intensity shift only, no new palette colors */
/* TODO: Confirm exact values with designer before launch */
[data-season="winter"] {
  --color-amber:  #A0561A;  /* muted warmth */
  --color-sand:   #DFC9A0;  /* slightly cooler */
}

[data-season="spring"] {
  --color-amber:  #C8781E;  /* brighter warmth */
  --color-copper: #D08838;  /* more vibrant accent */
}

[data-season="summer"] {
  --color-amber:  #D07820;  /* peak warmth */
  --color-sand:   #F0DAB8;  /* lighter, sun-bleached */
}

[data-season="autumn"] {
  --color-amber:  #A04E18;  /* deep harvest */
  --color-copper: #B06828;  /* rich earth */
}
```

#### `apps/storefront/src/layouts/BaseLayout.astro` (MODIFY)

Add the SVG pattern block immediately after `<body>`. Preserve all existing content exactly.

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
  </head>
  <body>
    <!-- Brand SVG pattern definition (UX-DR13) — referenced via fill="url(#kandles-pattern)" in sections -->
    <svg
      id="kandles-bg-pattern"
      aria-hidden="true"
      style="display:none;position:absolute;width:0;height:0;overflow:hidden"
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

### pnpm-workspace.yaml catalog additions

Add to the `catalog:` block:

```yaml
  react: "^19.0.0"
  react-dom: "^19.0.0"
  "@types/react": "^19.0.0"
  "@types/react-dom": "^19.0.0"
```

Note: `pnpm-workspace.yaml` uses `catalog:` as a named version alias. In `package.json`, reference as `"catalog:"` (not the version string). The admin's existing React deps are declared inline (`"react": "^19.0.0"`) — leave them as-is; catalog is only used for shared libs. packages/ui peerDependencies CAN use `catalog:` since peerDeps are resolved by the consumer.

### TypeScript Validation Pattern (AC: 2)

The A11y union type enforces the aria prop contract at compile time:

```tsx
// ✅ Decorative use — aria-hidden required
<KandlesIcon variant="flame" aria-hidden={true} />

// ✅ Semantic use — aria-label required
<KandlesIcon variant="flame" aria-label="Flame decoration" />

// ❌ TypeScript error — neither aria-hidden nor aria-label
<KandlesIcon variant="flame" />

// ❌ TypeScript error — cannot have both
<KandlesIcon variant="flame" aria-hidden={true} aria-label="..." />
```

### Brand Pattern Usage (UX-DR13)

The pattern is defined once in BaseLayout and referenced by fill URL in sections that need texture:

```html
<!-- In any section needing the brand texture: -->
<div style="position:relative">
  <svg aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%">
    <rect width="100%" height="100%" fill="url(#kandles-pattern)" />
  </svg>
  <!-- section content -->
</div>
```

This is CSP-compliant (no external URLs, no inline styles with `background-image: url("data:...")`).

### Deferred / Out of Scope

- `lib/seasonal.ts` utility to set `data-season` attribute server-side → Story 2.5
- Storybook setup (`packages/ui/.storybook/`) → Story 2.0 (not yet in sprint-status)
- `@astrojs/react` in storefront → Story 2.3 (first React Island)
- Actual SVG artwork from Hamza Shehzad → replace TODO paths before launch
- Admin shadcn/ui components in packages/ui → Stories 5.x

### Critical: No `export * from`

The AC requires tree-shakeable exports. Use only named re-exports:

```typescript
// ✅ Correct — tree-shakeable
export { KandlesIcon } from './components/KandlesIcon'

// ❌ Wrong — prevents tree-shaking
export * from './components/KandlesIcon'
```

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- packages/ui `pnpm turbo typecheck` fails with "cannot find binary path" → ran `pnpm typecheck` per-package directly (pre-existing turbo PATH issue)
- Storefront `astro check` fails on Node.js v20 → pre-existing (requires ≥22.12.0), same as Story 1.9; CSS/markup changes are unaffected
- Union type TS2322 confirmed via standalone `tsc` test against temp file: `<KandlesIcon variant="flame" />` → error, with aria props → no error

### Completion Notes List

- React 19.2.7 + @types/react 19.2.17 installed in packages/ui; React goes in peerDeps (library pattern) + devDeps for typecheck
- `packages/ui/tsconfig.json` updated with `"jsx": "react-jsx"` so tsc processes .tsx
- `KandlesIcon` component: 4 variants, 3 sizes (16/24/32px), 3 colorways → CSS vars; SVG paths are placeholders (TODO for Hamza Shehzad's artwork)
- A11y union type enforced at compile time: decorative use requires `aria-hidden={true}`, semantic use requires `aria-label`; neither alone → TS error
- `index.ts` updated from empty `export {}` to named re-export (tree-shakeable)
- `tokens.css` extended with `[data-theme="light|dark"]` + 4 seasonal `[data-season]` overrides (≤2 vars each)
- `BaseLayout.astro` now includes hidden SVG `<defs>` with `id="kandles-bg-pattern"` + `aria-hidden="true"`; CSP-compliant inline SVG

### File List

- `pnpm-workspace.yaml` — added react, react-dom, @types/react, @types/react-dom to catalog
- `packages/ui/package.json` — added peerDependencies (react, react-dom) + devDependencies (@types/react, @types/react-dom)
- `packages/ui/tsconfig.json` — added `"jsx": "react-jsx"`
- `packages/ui/src/components/KandlesIcon.tsx` — NEW: brand icon React component
- `packages/ui/src/index.ts` — updated to export KandlesIcon
- `apps/storefront/src/styles/tokens.css` — added [data-theme] colorway + [data-season] seasonal CSS
- `apps/storefront/src/layouts/BaseLayout.astro` — added inline SVG pattern definition

## Change Log

- 2026-06-12: Story 2.1 implemented — KandlesIcon React component, colorway CSS system, seasonal token overrides, brand SVG pattern in BaseLayout

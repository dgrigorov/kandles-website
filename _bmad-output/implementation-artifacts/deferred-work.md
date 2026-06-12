# Deferred Work

## Deferred from: code review of 1-1-turborepo-monorepo-shared-packages-scaffold (2026-06-12)

- `packages/*/package.json` source exports (`./src/index.ts`) — add `transpilePackages: ['@kandles/db', '@kandles/types', '@kandles/env', '@kandles/ui', '@kandles/email']` to `apps/admin/next.config.ts` when real imports are added (Story 1.2+)
- `packages/*/tsconfig.json` missing `declaration: true` / `declarationMap: true` — add if exports move from source to `dist/`
- `apps/storefront/package.json` missing `@kandles/ui` dependency — add in Story 2.1 when UI components scaffolded
- Root `tsconfig.json` `paths` silently overridden by app-level `paths` (TypeScript does not merge `paths`) — works via pnpm workspace symlinks; document or refactor in Story 2.1
- Root `tsconfig.json` missing `composite: true` / `declarationMap: true` for TypeScript project references — revisit if moving to compiled dist/ exports
- No `vercel.json` for Vercel monorepo deployment — Story 1.6 (split-hosting-setup)
- No Turborepo remote cache config (TURBO_TOKEN/TURBO_TEAM absent) → cold CI builds — Story 1.7 (CI/CD pipeline)
- `@astrojs/tailwind` peer dep mismatch with Astro v6 (declares peer `astro: ^3||^4||^5`, installed with v6) — switch to `@tailwindcss/vite` direct integration in Story 2.1 (brand design system)
- `apps/storefront/dist/server/wrangler.json` SESSION KV binding has no `id` — `@astrojs/cloudflare` injects it by default with `output: 'server'`; supply KV namespace ID or disable in adapter config in Story 1.6 (split-hosting-setup)
- `packages/*/tsconfig.json` `rootDir: "./src"` will cause `tsc` build failure when cross-package imports are added (file outside rootDir); currently masked because all packages are `export {}`— fix with `composite: true` + project references or remove `rootDir` when real code is added

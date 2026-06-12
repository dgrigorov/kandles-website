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

## Deferred from: code review of 1-2-environment-validation-secrets-management (2026-06-12)

- `packages/env/src/astro.ts`: `import.meta.env` not available for CF dashboard secrets at request time in CF Workers SSR — secrets must be threaded via `context.env` worker bindings. Addressed in Story 1.6 (split-hosting-setup). Known, documented in story Dev Notes.
- `packages/env/src/nextjs.ts`: `experimental__runtimeEnv` only maps declared NEXT_PUBLIC_ vars — new client vars added later must be manually added to the mapping or they silently skip validation. Document as team convention when adding new client vars.
- `packages/env/src/index.ts`: `isServer` detection (`typeof window === "undefined"`) may not hold in CF DurableObject/WorkerEntrypoint context. Revisit if DOs or WorkerEntrypoints are introduced.
- `packages/env/src/astro.ts`: `PUBLIC_GTM_CONTAINER_ID` must be a build-time Cloudflare Pages variable (not a runtime secret binding) or it will be `undefined` client-side. Document in Story 6-3 (GTM setup) or CF Pages deployment config.

## Deferred from: code review of 1-3-core-db-schema-products-collections-drizzle-migration-strategy (2026-06-12)

- `packages/db/drizzle/migrations/meta/` — миграция `0001_products_search_index.sql` е регистрирана в `_journal.json` но няма snapshot; drizzle-kit може да я презапише или конфликтира при следващо `generate` в Story 1.4+. Изисква внимание преди пускане на `drizzle-kit generate` за следваща миграция.

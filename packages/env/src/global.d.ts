// Minimal ImportMeta.env for Vite/Astro compatibility in this package
interface ImportMeta {
  readonly env: Record<string, string | boolean | number | undefined>
}

// server-only has no TypeScript declarations
declare module 'server-only'

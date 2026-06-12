import { defineConfig } from 'astro/config'
import cloudflare from '@astrojs/cloudflare'
import tailwind from '@astrojs/tailwind'
import react from '@astrojs/react'
import sentry from '@sentry/astro'

export default defineConfig({
  output: 'static',
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

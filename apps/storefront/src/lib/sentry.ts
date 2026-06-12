import * as Sentry from '@sentry/astro'

Sentry.init({
  dsn: import.meta.env.SENTRY_DSN_STOREFRONT,
  environment: import.meta.env.MODE,
  tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
  tunnel: '/api/sentry-tunnel',
})

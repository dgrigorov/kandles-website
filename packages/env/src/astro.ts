import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  clientPrefix: 'PUBLIC_',
  server: {
    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string().min(1),
    SENTRY_DSN_STOREFRONT: z.string().url(),
    FALLBACK_SHIPPING_PRICE_BGN: z.coerce.number().positive(),
    TURNSTILE_SITE_KEY: z.string().min(1),
    META_PIXEL_ID: z.string().min(1),
  },
  client: {
    PUBLIC_GTM_CONTAINER_ID: z.string().optional(),
  },
  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
})

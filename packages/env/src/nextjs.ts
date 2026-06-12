import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),
    RESEND_API_KEY: z.string().min(1),
    ADMIN_EMAIL: z.string().email(),
    UPSTASH_REDIS_REST_URL: z.string().url(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
    CLOUDFLARE_IMAGES_TOKEN: z.string().min(1),
    CLOUDFLARE_ACCOUNT_ID: z.string().min(1),
    TRIGGER_SECRET_KEY: z.string().min(1),
    VIBER_API_KEY: z.string().min(1),
    VIBER_ADMIN_NUMBER: z.string().min(1),
    VIBER_BUSINESS_NUMBER: z.string().min(1),
    WHATSAPP_NUMBER: z.string().min(1),
    CRON_SECRET: z.string().min(1),
    TURNSTILE_SECRET_KEY: z.string().min(1),
    META_CAPI_ACCESS_TOKEN: z.string().min(1),
    PREVIEW_JWT_SECRET: z.string().min(32),
    SENTRY_DSN_ADMIN: z.string().url(),
    SENTRY_AUTH_TOKEN: z.string().optional(),
    FALLBACK_SHIPPING_PRICE_BGN: z.coerce.number().positive(),
  },
  client: {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_SENTRY_DSN_ADMIN: z.string().url(),
  },
  // Next.js >=13.4.4: only client-side vars need explicit destructuring
  experimental__runtimeEnv: {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SENTRY_DSN_ADMIN: process.env.NEXT_PUBLIC_SENTRY_DSN_ADMIN,
  },
  emptyStringAsUndefined: true,
})

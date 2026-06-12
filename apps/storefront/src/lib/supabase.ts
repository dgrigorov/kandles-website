import { createClient } from '@supabase/supabase-js'
import { env } from '@kandles/env/astro'

// Server-only — used in .astro frontmatter and API routes only.
// Do NOT import this in React islands (client components).
export function createServerSupabaseClient() {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)
}

import { createClient } from '@supabase/supabase-js'

// Server-only — used in .astro frontmatter and API routes only.
// Do NOT import this in React islands (client components).
export function createServerSupabaseClient() {
  return createClient(
    import.meta.env.SUPABASE_URL as string,
    import.meta.env.SUPABASE_ANON_KEY as string,
  )
}

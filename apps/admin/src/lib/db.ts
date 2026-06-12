// Server-only — requires DATABASE_URL in environment.
// All Drizzle queries in admin go through this export.
import { db } from '@kandles/db'

export { db }

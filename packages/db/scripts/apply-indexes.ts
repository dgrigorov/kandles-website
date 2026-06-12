import 'dotenv/config'
import postgres from 'postgres'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required')

const sql = postgres(databaseUrl)

async function main() {
  // CONCURRENTLY cannot run inside a transaction block — must be applied separately from drizzle-kit migrate
  await sql.unsafe(`
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_search
    ON products USING GIN(to_tsvector('bulgarian', title || ' ' || coalesce(description, '')));
  `)
  console.log('✅ Search index applied')
  await sql.end()
}

main().catch((err) => {
  console.error('❌ Failed to apply indexes:', err)
  process.exit(1)
})

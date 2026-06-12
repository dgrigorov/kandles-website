import { NextRequest, NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@kandles/db'
import { env } from '@kandles/env/nextjs'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  logger.info('[cron/cleanup] starting data retention jobs')

  const results: { job: string; ok: boolean; error?: string }[] = []

  for (const [job, query] of [
    ['anonymize-orders', sql`UPDATE orders SET guest_email = NULL, shipping_address = '{}' WHERE created_at < NOW() - INTERVAL '3 years' AND user_id IS NOT NULL`],
    ['purge-abandoned-carts', sql`DELETE FROM cart_reservations WHERE created_at < NOW() - INTERVAL '30 days' AND order_id IS NULL`],
    ['cleanup-cart-reservations', sql`DELETE FROM cart_reservations WHERE expires_at < NOW()`],
  ] as const) {
    try {
      await db.execute(query)
      results.push({ job, ok: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      logger.error({ job, err: message }, `[cron/cleanup] job failed: ${job}`)
      results.push({ job, ok: false, error: message })
    }
  }

  const failed = results.filter((r) => !r.ok)
  if (failed.length > 0) {
    logger.error({ failed }, '[cron/cleanup] one or more jobs failed')
    return NextResponse.json({ ok: false, results }, { status: 500 })
  }

  logger.info('[cron/cleanup] data retention jobs complete')
  return NextResponse.json({ ok: true, results })
}

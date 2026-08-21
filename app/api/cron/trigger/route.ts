/**
 * POST /api/cron/trigger
 *
 * Manual cache refresh — useful for:
 *   1. Immediately after a new deploy (before the first scheduled cron runs)
 *   2. Debugging / testing the data pipeline
 *   3. Forcing a refresh after adding a new data source
 *
 * In development (no CRON_SECRET): open, no auth required.
 * In production: requires Authorization: Bearer <CRON_SECRET>
 *
 * Usage:
 *   curl -X POST https://freeshelf.vercel.app/api/cron/trigger \
 *        -H "Authorization: Bearer YOUR_CRON_SECRET"
 */
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function handler(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization') ?? ''
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const start = Date.now()

  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

    // Run refresh and notify in sequence — refresh first so notify sees fresh data
    const refreshRes = await fetch(`${base}/api/cron/refresh`, {
      method:  'POST',
      headers: secret ? { authorization: `Bearer ${secret}` } : {},
      signal:  AbortSignal.timeout(55_000),
    })

    const refreshData = await refreshRes.json()

    return NextResponse.json({
      ok:       true,
      ms:       Date.now() - start,
      refresh:  refreshData,
    })
  } catch (err) {
    console.error('[cron/trigger]', err)
    return NextResponse.json(
      { error: 'Trigger failed', detail: String(err) },
      { status: 500 },
    )
  }
}

export const GET  = handler
export const POST = handler

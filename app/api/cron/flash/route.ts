/**
 * GET/POST /api/cron/flash
 *
 * Flash deals are now computed as part of /api/cron/refresh (any free deal
 * with hoursLeft ≤ 24, or isFresh if no expiry date). A separate flash cron
 * is no longer needed.
 *
 * This route is kept as a backward-compatible pass-through so any existing
 * Vercel cron config or external triggers targeting /api/cron/flash still work.
 * It simply delegates to the main refresh handler.
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

  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    const res  = await fetch(`${base}/api/cron/refresh`, {
      method:  'POST',
      headers: secret ? { authorization: `Bearer ${secret}` } : {},
      signal:  AbortSignal.timeout(55_000),
    })
    const data = await res.json()
    return NextResponse.json({ delegated: true, ...data })
  } catch (err) {
    console.error('[cron/flash] Delegation error:', err)
    return NextResponse.json({ error: 'Refresh delegation failed' }, { status: 500 })
  }
}

export const GET  = handler
export const POST = handler

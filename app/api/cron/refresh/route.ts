/**
 * GET|POST /api/cron/refresh
 *
 * Runs hourly. Two fetchers: Epic (direct) + CheapShark (everything else).
 * Writes three KV keys: free deals, flash deals (≤24h), sale deals (≥70% off).
 *
 * No auth in dev (CRON_SECRET not set). Secret required in production.
 */
import { NextRequest, NextResponse }    from 'next/server'
import { fetchEpicDeals }               from '@/lib/fetchers/epic'
import {
  fetchCheapSharkFreeDeals,
  fetchCheapSharkHeavySaleDeals,
}                                       from '@/lib/fetchers/cheapshark'
import { mergeAndNormalizeDeals }       from '@/lib/fetchers/normalize'
import {
  invalidateCache,
  setFreeDeals,
  setFlashDeals,
  setSaleDeals,
  setLastFetched,
}                                       from '@/lib/kv'

export const dynamic     = 'force-dynamic'
export const maxDuration = 60

function isAuthorised(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  return req.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(req: NextRequest)  { return handler(req) }
export async function POST(req: NextRequest) { return handler(req) }

async function handler(req: NextRequest) {
  if (!isAuthorised(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const start = Date.now()
  console.log('[cron/refresh] Starting…')

  // ── Fetch all sources in parallel ────────────────────────────────
  const [epicResult, csFreeResult, csSaleResult] = await Promise.allSettled([
    fetchEpicDeals(),
    fetchCheapSharkFreeDeals(),
    fetchCheapSharkHeavySaleDeals(),
  ])

  const ok = <T,>(r: PromiseSettledResult<T>, fb: T): T =>
    r.status === 'fulfilled' ? r.value : fb

  // ── Free deals: Epic + CheapShark free ───────────────────────────
  const freeDeals = mergeAndNormalizeDeals([
    ok(epicResult,   []),
    ok(csFreeResult, []),
  ])

  // ── Flash: free deals expiring ≤24h ──────────────────────────────
  const flashDeals = freeDeals.filter(
    d => (d.hoursLeft !== null && d.hoursLeft <= 24) ||
         (d.hoursLeft === null && d.isFresh),
  )

  // ── Sale: ≥70% off from CheapShark ───────────────────────────────
  // mergeAndNormalizeDeals deduplicates against free deals by title,
  // so a game that's free won't also appear in the sale section.
  const rawSale  = ok(csSaleResult, [])
  const saleDeals = mergeAndNormalizeDeals([rawSale])
    .filter(d => d.currentPrice > 0) // exclude anything that went free
    .slice(0, 20)                     // cap at 20 — curated, not exhaustive

  console.log(
    `[cron/refresh] ${freeDeals.length} free | ` +
    `${flashDeals.length} flash | ${saleDeals.length} sale — ${Date.now() - start}ms`,
  )

  // ── Write to KV ───────────────────────────────────────────────────
  await invalidateCache()
  await Promise.all([
    setFreeDeals(freeDeals),
    setFlashDeals(flashDeals),
    setSaleDeals(saleDeals),
    setLastFetched(),
  ])

  return NextResponse.json({
    ok:    true,
    free:  freeDeals.length,
    flash: flashDeals.length,
    sale:  saleDeals.length,
    ms:    Date.now() - start,
  })
}

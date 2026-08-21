import { NextResponse } from 'next/server'
import { getFreeDeals, getFlashDeals, getSaleDeals, getLastFetched } from '@/lib/kv'

export const dynamic = 'force-dynamic'

export async function GET() {
  const [free, flash, sale, lastFetched] = await Promise.all([
    getFreeDeals(),
    getFlashDeals(),
    getSaleDeals(),
    getLastFetched(),
  ])

  return NextResponse.json({
    lastFetched,
    free:  free?.length  ?? 0,
    flash: flash?.length ?? 0,
    sale:  sale?.length  ?? 0,
    redis: !!process.env.UPSTASH_REDIS_REST_URL,
    env:   process.env.NODE_ENV,
  })
}

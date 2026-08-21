import { NextRequest, NextResponse } from 'next/server'
import { getFreeDeals, getFlashDeals, getSaleDeals, getLastFetched } from '@/lib/kv'
import { filterDeals, sortDeals } from '@/lib/utils'
import type { FilterState } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const search   = searchParams.get('q')        ?? ''
  const platform = searchParams.get('platform')?.split(',').filter(Boolean) ?? []
  const sort     = (searchParams.get('sort') ?? 'expiry') as FilterState['sort']

  const filters: FilterState = {
    platforms: platform as FilterState['platforms'],
    genres:    [],
    dealTypes: [],
    sort,
    search,
  }

  try {
    const [freeRaw, flashRaw, saleRaw, lastFetched] = await Promise.all([
      getFreeDeals(), getFlashDeals(), getSaleDeals(), getLastFetched(),
    ])

    if (!freeRaw) {
      return NextResponse.json(
        { error: 'Cache cold', free: [], flash: [], sale: [], lastFetched: null },
        { status: 503 },
      )
    }

    const now   = new Date()
    const alive = (d: typeof freeRaw[0]) => !d.endDate || new Date(d.endDate) > now

    const flashFilters: FilterState = {
      platforms: filters.platforms, genres: [], dealTypes: [], sort: 'expiry', search,
    }

    const free  = sortDeals(filterDeals((freeRaw  ?? []).filter(alive), filters), sort)
    const flash = sortDeals(filterDeals((flashRaw ?? []).filter(alive), flashFilters), 'expiry')
    const sale  = (saleRaw ?? []).filter(d => d.currentPrice > 0)

    return NextResponse.json(
      { free, flash, sale, lastFetched, meta: { freeCount: free.length, saleCount: sale.length } },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } },
    )
  } catch {
    return NextResponse.json(
      { error: 'Cache error', free: [], flash: [], sale: [], lastFetched: null },
      { status: 503 },
    )
  }
}

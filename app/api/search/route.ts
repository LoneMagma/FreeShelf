import { NextRequest, NextResponse } from 'next/server'
import { searchGames, getGamePrices } from '@/lib/fetchers/search'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const q      = searchParams.get('q')?.trim()  ?? ''
  const gameId = searchParams.get('id')?.trim() ?? ''

  if (gameId) {
    const prices = await getGamePrices(gameId)
    if (!prices) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(prices)
  }

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const results = await searchGames(q)
  return NextResponse.json({ results })
}

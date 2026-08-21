/**
 * itch.io free games fetcher.
 *
 * STATUS: itch.io removed their public JSON browse API endpoints in 2024.
 * The paths /games.json, /games/new-and-popular.json etc. all return 404.
 *
 * What still works:
 *   /games/new-and-popular → returns HTML, not JSON (useless for us)
 *   No public JSON endpoint for filtering by price is currently available.
 *
 * Strategy:
 *   - Try the one remaining semi-documented path with a generous timeout
 *   - Return [] gracefully on any failure
 *   - CheapShark's free deal endpoint picks up itch.io games that are
 *     listed on CheapShark (many popular itch games are tracked there)
 *
 * When/if itch.io restores a JSON API this fetcher can be re-enabled
 * by adding working endpoint paths back to the `endpoints` array.
 */
import type { Deal } from '@/types'

const ITCH = 'https://itch.io'

function fixUrl(url: string | null | undefined): string {
  if (!url) return ''
  return url.startsWith('//') ? `https:${url}` : url
}

interface ItchGame {
  id:              number
  title:           string
  url:             string
  cover_url:       string | null
  short_text?:     string
  classification?: string
  min_price:       number
  sale?: { rate: number; end_date?: string }
}

interface ItchResponse {
  games?: ItchGame[]
}

const HEADERS = {
  Accept:          'application/json, */*',
  'User-Agent':    'FreeShelf/1.0 (https://freeshelf.app; game deals aggregator)',
  'Cache-Control': 'no-cache',
}

async function tryEndpoint(path: string): Promise<ItchGame[]> {
  try {
    const res = await fetch(`${ITCH}${path}`, {
      cache:   'no-store',
      headers: HEADERS,
      signal:  AbortSignal.timeout(6_000),
    })

    if (res.status === 404) {
      // Endpoint removed — don't warn, this is expected
      return []
    }
    if (res.status === 429) {
      console.warn('[itch.io] Rate limited (429)')
      return []
    }
    if (!res.ok) {
      console.warn(`[itch.io] HTTP ${res.status} on ${path}`)
      return []
    }

    const ct = res.headers.get('content-type') ?? ''
    if (!ct.includes('json')) {
      // HTML response — endpoint probably changed to HTML-only
      return []
    }

    const data: ItchResponse = await res.json()
    return data?.games ?? []
  } catch {
    return []
  }
}

function toItchDeal(game: ItchGame): Deal {
  const origCents = game.sale?.rate
    ? Math.round(game.min_price / (1 - game.sale.rate / 100))
    : game.min_price

  return {
    id:              `itch-${game.id}`,
    title:           game.title,
    platform:        'itch',
    originalPrice:   origCents / 100,
    currentPrice:    0,
    discountPercent: 100,
    currency:        'USD',
    coverImage:      fixUrl(game.cover_url),
    claimUrl:        game.url,
    startDate:       new Date().toISOString(),
    endDate:         game.sale?.end_date ?? null,
    dealType:        game.sale?.end_date ? 'timed-free' : 'permanent-free',
    genres:          ['indie'],
    description:     game.short_text,
    fetchedAt:       new Date().toISOString(),
  }
}

export async function fetchItchFreeDeals(): Promise<Deal[]> {
  /**
   * Known-working JSON endpoints as of 2024:
   *   /games.json?*     → 404 (removed)
   *   /games/*.json     → 404 (removed)
   *
   * The only path that might still work is a format=json param on some pages.
   * We try it once; any failure returns [] silently.
   * CheapShark is the reliable source for itch games.
   */
  const candidates = [
    '/games/newest.json?type=game&price=free',
    '/games.json?price=free&type=game&sort=new',
  ]

  for (const path of candidates) {
    const games = await tryEndpoint(path)
    if (games.length === 0) continue

    const free = games
      .filter(g => (g.classification ?? 'game') === 'game' && g.min_price === 0)
      .slice(0, 20)

    if (free.length > 0) {
      console.log(`[itch.io] ${free.length} free games via ${path}`)
      return free.map(toItchDeal)
    }
  }

  // Expected — itch.io API is effectively gone. CheapShark covers the gap.
  console.log('[itch.io] No JSON API available — relying on CheapShark')
  return []
}

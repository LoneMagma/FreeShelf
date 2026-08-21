/**
 * Prime Gaming free games fetcher.
 *
 * Prime Gaming publishes ~15-20 free games per month for Amazon Prime members.
 * The gaming.amazon.com/home page is publicly accessible and embeds game data
 * in its __NEXT_DATA__ JSON. We parse that without any auth.
 *
 * Claiming still requires a Prime account — we just surface that these games
 * are available, same as we do for Epic/GOG.
 *
 * If Amazon changes their page structure this returns [] gracefully.
 * No API key required.
 */
import type { Deal } from '@/types'

const PRIME_HOME = 'https://gaming.amazon.com/home'

// These headers make us look like a real browser to avoid soft-blocks
const HEADERS = {
  'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control':   'no-cache',
  'Pragma':          'no-cache',
}

// ── Raw shapes from Prime's embedded JSON ─────────────────────────────

interface PrimeOffer {
  id?:          string
  offerType?:   string   // 'FGWP_FULL' = full game, 'IN_GAME_LOOT' = loot
  title?:       string
  startTime?:   string
  endTime?:     string
  game?: {
    id?:    string
    title?: string
    assets?: { type: string; purpose: string; url: string }[]
  }
  content?: {
    publisher?:   string
    developer?:   string
    categories?:  string[]
    externalClaim?: {
      claimUrl?: string
    }
    media?: { type: string; src: string }[]
  }
  grantsCode?: boolean
  // Sometimes the offer itself carries asset data
  assets?: { type: string; purpose: string; url: string }[]
}

// ── Image extraction ──────────────────────────────────────────────────

function extractImage(offer: PrimeOffer): string {
  // Try game assets first
  const gameAssets = offer.game?.assets ?? offer.assets ?? []
  const preferred  = ['Hero192', 'Hero256', 'Hero320', 'BoxArt', 'Thumbnail']
  for (const purpose of preferred) {
    const asset = gameAssets.find(a => a.purpose === purpose)
    if (asset?.url) return asset.url
  }
  // Fall back to content media
  const media = offer.content?.media ?? []
  const img   = media.find(m => m.type === 'image')
  return img?.src ?? ''
}

// ── Claim URL ─────────────────────────────────────────────────────────

function extractClaimUrl(offer: PrimeOffer): string {
  const external = offer.content?.externalClaim?.claimUrl
  if (external) return external
  const offerId = offer.id ?? offer.game?.id
  if (offerId) return `https://gaming.amazon.com/offer/${offerId}`
  return 'https://gaming.amazon.com/home'
}

// ── Deep-search offers from any shape of state object ─────────────────

function findOffers(obj: unknown, depth = 0): PrimeOffer[] {
  if (depth > 8 || !obj || typeof obj !== 'object') return []
  const o = obj as Record<string, unknown>

  // Direct offers array at this level
  if (Array.isArray(o.offers)) {
    const candidates = (o.offers as unknown[]).filter(
      x => x && typeof x === 'object' && ('title' in (x as object) || 'game' in (x as object)),
    )
    if (candidates.length > 0) return candidates as PrimeOffer[]
  }

  // Recurse into object values
  const results: PrimeOffer[] = []
  for (const val of Object.values(o)) {
    if (val && typeof val === 'object') {
      results.push(...findOffers(val, depth + 1))
      if (results.length > 0) return results   // stop at first match
    }
  }
  return results
}

// ── Main fetcher ──────────────────────────────────────────────────────

export async function fetchPrimeGamingDeals(): Promise<Deal[]> {
  try {
    const res = await fetch(PRIME_HOME, {
      cache:   'no-store',
      headers: HEADERS,
      signal:  AbortSignal.timeout(12_000),
    })

    if (!res.ok) {
      console.warn(`[Prime] HTTP ${res.status}`)
      return []
    }

    const html = await res.text()

    // Extract __NEXT_DATA__ — Amazon uses Next.js for this page
    const match = html.match(
      /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
    )
    if (!match?.[1]) {
      console.warn('[Prime] __NEXT_DATA__ not found — page structure may have changed')
      return []
    }

    let pageData: unknown
    try {
      pageData = JSON.parse(match[1])
    } catch {
      console.warn('[Prime] Failed to parse __NEXT_DATA__ JSON')
      return []
    }

    // Prime Gaming's data lives in different paths depending on their deploy
    const root   = (pageData as Record<string, unknown>)?.props ?? pageData
    const offers = findOffers(root)

    if (offers.length === 0) {
      console.warn('[Prime] No offers found in page data')
      return []
    }

    const now = new Date().toISOString()
    const deals: Deal[] = []

    for (const offer of offers) {
      // Only full free games — skip in-game loot
      const type = offer.offerType ?? ''
      if (type && !type.includes('FGWP') && !type.includes('FREE')) continue

      const title = offer.game?.title ?? offer.title
      if (!title) continue

      // Skip DLC / loot if we can tell from the title/type
      if (type === 'IN_GAME_LOOT') continue

      const coverImage = extractImage(offer)
      const claimUrl   = extractClaimUrl(offer)
      const endDate    = offer.endTime ?? null

      deals.push({
        id:            `prime-${offer.id ?? offer.game?.id ?? title.replace(/\s+/g, '-').toLowerCase()}`,
        title,
        platform:      'prime',
        originalPrice: 0,    // Prime doesn't publish original prices
        currentPrice:  0,
        discountPercent: 100,
        currency:      'USD',
        coverImage,
        claimUrl,
        startDate:     offer.startTime ?? now,
        endDate,
        dealType:      endDate ? 'timed-free' : 'permanent-free',
        genres:        ['other'],
        developer:     offer.content?.developer,
        publisher:     offer.content?.publisher,
        fetchedAt:     now,
      })
    }

    console.log(`[Prime] ${offers.length} offers found → ${deals.length} free games`)
    return deals
  } catch (err) {
    console.error('[Prime] Fetch error:', err)
    return []
  }
}

import type { Deal } from '@/types'

// GOG public endpoints — no API key required
const GOG_GIVEAWAY_URL    = 'https://www.gog.com/api/v1/giveaway/item'
const GOG_FREE_GAMES_URL  = 'https://www.gog.com/games/ajax/filtered?mediaType=game&price=free&sort=popularity&page=1'

interface GOGGiveaway {
  id: string
  title: string
  image: string
  url: string
  slug?: string
  endDate: string
  originalPrice?: number
  currency?: string
}

interface GOGProduct {
  id: number
  title: string
  slug: string
  url: string
  image: string          // CDN path like "//images-1.gog-statics.com/..."
  price: {
    baseAmount: string   // "29.99"
    finalAmount: string  // "0.00"
    isDiscounted: boolean
    discountPercentage: number
    originalPrice: number  // sometimes 0
  }
  genres: { id: string; name: string; slug: string }[]
  developers: string[]
  publishers: string[]
}

interface GOGFilteredResponse {
  products: GOGProduct[]
  totalPages: number
  totalGamesFound: number
}

const GENRE_MAP: Record<string, Deal['genres'][number]> = {
  'role-playing':    'rpg',
  'role playing':    'rpg',
  'rpg':             'rpg',
  'action':          'action',
  'adventure':       'adventure',
  'strategy':        'strategy',
  'simulation':      'simulation',
  'puzzle':          'puzzle',
  'platformer':      'platformer',
  'shooter':         'shooter',
  'horror':          'horror',
  'sports':          'sports',
  'racing':          'racing',
  'indie':           'indie',
}

function mapGOGGenres(genres: { name: string }[]): Deal['genres'] {
  const result = new Set<Deal['genres'][number]>()
  for (const g of genres) {
    const key = g.name.toLowerCase()
    for (const [match, genre] of Object.entries(GENRE_MAP)) {
      if (key.includes(match)) result.add(genre)
    }
  }
  return result.size > 0 ? Array.from(result) : ['other']
}

function fixGOGImage(raw: string): string {
  if (!raw) return ''
  // GOG images come as "//images-1.gog-statics.com/..." — add https:
  let url = raw.startsWith('//') ? `https:${raw}` : raw
  // Append .jpg if it's just a CDN hash path with no extension
  if (!url.match(/\.(jpg|jpeg|png|webp)(\?|$)/i)) url += '.jpg'
  return url
}

function parseGOGPrice(product: GOGProduct): number {
  // Try baseAmount string first ("29.99"), fall back to originalPrice
  const parsed = parseFloat(product.price?.baseAmount ?? '')
  if (!isNaN(parsed) && parsed > 0) return parsed
  return product.price?.originalPrice ?? 0
}

export async function fetchGOGDeals(): Promise<Deal[]> {
  const deals: Deal[] = []
  const fetchOpts: RequestInit = {
    cache: 'no-store',
    headers: { 'Accept': 'application/json', 'User-Agent': 'FreeShelf/1.0' },
    signal: AbortSignal.timeout(5_000),
  }

  // ── 1. Check active giveaway ─────────────────────────────────────
  try {
    const res = await fetch(GOG_GIVEAWAY_URL, fetchOpts)
    if (res.ok) {
      const giveaway: GOGGiveaway = await res.json()
      if (giveaway?.id && giveaway?.endDate) {
        // Only include if end date is in the future
        if (new Date(giveaway.endDate) > new Date()) {
          const slug = giveaway.slug ?? giveaway.url?.split('/').pop() ?? giveaway.id
          deals.push({
            id: `gog-giveaway-${giveaway.id}`,
            title: giveaway.title,
            platform: 'gog',
            originalPrice: giveaway.originalPrice ?? 0,
            currentPrice: 0,
            currency: giveaway.currency ?? 'USD',
            coverImage: fixGOGImage(giveaway.image),
            claimUrl: `https://www.gog.com/en/game/${slug}`,
            startDate: new Date().toISOString(),
            endDate: giveaway.endDate,
            dealType: 'timed-free',
            genres: ['other'],
            fetchedAt: new Date().toISOString(),
          })
          console.log(`[GOG] Active giveaway: ${giveaway.title}`)
        }
      }
    }
  } catch (err) {
    console.error('[GOG] Giveaway error:', err)
  }

  // ── 2. Scrape free games catalog ─────────────────────────────────
  try {
    const res = await fetch(GOG_FREE_GAMES_URL, fetchOpts)
    if (res.ok) {
      const data: GOGFilteredResponse = await res.json()
      const products = data?.products ?? []

      for (const product of products.slice(0, 15)) {
        const originalPrice = parseGOGPrice(product)
        // Skip F2P games that were always free
        if (originalPrice === 0) continue
        // Skip if we already have it from giveaway
        if (deals.some(d => d.title.toLowerCase() === product.title.toLowerCase())) continue

        deals.push({
          id: `gog-${product.id}`,
          title: product.title,
          platform: 'gog',
          originalPrice,
          currentPrice: 0,
          currency: 'USD',
          coverImage: fixGOGImage(product.image),
          claimUrl: `https://www.gog.com/en/game/${product.slug}`,
          startDate: new Date().toISOString(),
          endDate: null,   // catalog free games rarely have an explicit expiry
          dealType: 'timed-free',
          genres: mapGOGGenres(product.genres ?? []),
          developer: product.developers?.[0],
          publisher: product.publishers?.[0],
          fetchedAt: new Date().toISOString(),
        })
      }
    }
  } catch (err) {
    console.error('[GOG] Catalog error:', err)
  }

  console.log(`[GOG] ${deals.length} deals found`)
  return deals
}

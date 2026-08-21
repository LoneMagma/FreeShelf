import type { Deal } from '@/types'

// Epic's public promotions endpoint — no API key required
const EPIC_URL = 'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions'

interface EpicOffer {
  startDate: string
  endDate: string
  discountSetting: { discountType: string; discountValue: number }
}

interface EpicGame {
  title: string
  id: string
  description: string
  keyImages: { type: string; url: string }[]
  seller: { name: string }
  price: {
    totalPrice: {
      originalPrice: number  // in cents
      discountPrice: number
      currencyCode: string
    }
  } | null
  promotions: {
    promotionalOffers: { promotionalOffers: EpicOffer[] }[]
    upcomingPromotionalOffers: { promotionalOffers: EpicOffer[] }[]
  } | null
  categories: { path: string }[]
  productSlug: string | null
  urlSlug: string | null
  offerMappings: { pageSlug: string; pageType: string }[] | null
}

const GENRE_MAP: Record<string, Deal['genres'][number]> = {
  rpg: 'rpg', action: 'action', adventure: 'adventure',
  strategy: 'strategy', simulation: 'simulation', puzzle: 'puzzle',
  platformer: 'platformer', shooter: 'shooter', horror: 'horror',
  sports: 'sports', racing: 'racing', indie: 'indie',
}

function mapGenres(categories: EpicGame['categories']): Deal['genres'] {
  const result = new Set<Deal['genres'][number]>()
  for (const cat of categories) {
    const path = cat.path.toLowerCase()
    for (const [key, genre] of Object.entries(GENRE_MAP)) {
      if (path.includes(key)) result.add(genre)
    }
  }
  return result.size > 0 ? Array.from(result) : ['other']
}

function getCoverImage(keyImages: EpicGame['keyImages']): string {
  // Priority order for image types
  const priority = [
    'OfferImageWide',
    'DieselStoreFrontWide',
    'Thumbnail',
    'DieselGameBoxWide',
    'VaultClosed',
  ]
  for (const type of priority) {
    const img = keyImages.find(i => i.type === type)
    if (img?.url) return img.url
  }
  return keyImages[0]?.url ?? ''
}

function getClaimUrl(game: EpicGame): string {
  // Try offerMappings first (most reliable for correct store URL)
  const mapping = game.offerMappings?.find(m => m.pageType === 'productHome')
  if (mapping?.pageSlug) return `https://store.epicgames.com/en-US/p/${mapping.pageSlug}`
  const slug = game.productSlug ?? game.urlSlug ?? game.id
  // Remove any trailing path like /home
  const cleanSlug = slug.replace(/\/home$/, '').replace(/^\//, '')
  return `https://store.epicgames.com/en-US/p/${cleanSlug}`
}

export async function fetchEpicDeals(): Promise<Deal[]> {
  try {
    const res = await fetch(
      `${EPIC_URL}?locale=en-US&country=US&allowCountries=US`,
      {
        // In cron context we always want fresh data, not Next.js cache
        cache: 'no-store',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5_000),
      }
    )

    if (!res.ok) {
      console.error(`[Epic] HTTP ${res.status}`)
      return []
    }

    const data = await res.json()
    const games: EpicGame[] = data?.data?.Catalog?.searchStore?.elements ?? []
    console.log(`[Epic] ${games.length} games in response, ${games.filter(g => g.promotions).length} with promotions`)

    const deals: Deal[] = []

    for (const game of games) {
      if (!game.promotions) continue

      // Find any currently active promotional offer (between startDate and endDate)
      const activeOffers = game.promotions.promotionalOffers
        .flatMap(p => p.promotionalOffers)
        .filter(o => {
          const start = new Date(o.startDate)
          const end   = new Date(o.endDate)
          const now   = new Date()
          if (isNaN(start.getTime()) || isNaN(end.getTime())) return false
          return start <= now && end > now
        })

      if (activeOffers.length === 0) continue

      // Primary check: is discountPrice actually 0 right now?
      // Don't rely on discountSetting.discountValue — Epic uses it inconsistently.
      // Some free games: discountValue=0 (price reduced TO 0)
      // Others:          discountValue=100 (100% OFF)
      // The only reliable signal is totalPrice.discountPrice === 0
      const discountPrice     = game.price?.totalPrice?.discountPrice ?? -1
      const originalPriceCents = game.price?.totalPrice?.originalPrice ?? 0
      const originalPrice      = originalPriceCents / 100

      if (discountPrice !== 0)    continue   // not actually $0 right now
      if (originalPrice === 0)    continue   // always free (F2P — skip)

      const offer = activeOffers[0]

      deals.push({
        id: `epic-${game.id}`,
        title: game.title,
        platform: 'epic',
        originalPrice,
        currentPrice: 0,
        currency: game.price?.totalPrice?.currencyCode ?? 'USD',
        coverImage: getCoverImage(game.keyImages),
        claimUrl: getClaimUrl(game),
        startDate: offer.startDate,
        endDate: offer.endDate,
        dealType: 'timed-free',
        genres: mapGenres(game.categories),
        description: game.description,
        developer: game.seller?.name,
        publisher: game.seller?.name,
        fetchedAt: new Date().toISOString(),
      })
    }

    console.log(`[Epic] ${deals.length} free deals found`)
    return deals
  } catch (err) {
    console.error('[Epic] Fetch error:', err)
    return []
  }
}

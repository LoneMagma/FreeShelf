import type { Deal } from '@/types'

const STEAM_BASE   = 'https://store.steampowered.com'
const MIN_DISCOUNT = 30    // minimum % off
const MIN_ORIGINAL_CENTS = 499  // $4.99

interface SteamFeaturedItem {
  id: number
  name: string
  discounted: boolean
  discount_percent: number
  original_price: number   // cents
  final_price: number      // cents
  currency: string
  large_capsule_image?: string
  header_image?: string
}

interface SteamSearchItem {
  name: string
  logo: string
  app_id: number
  type: string
  original_price?: number   // cents
  final_price?: number      // cents
  discount_percent?: number
}

// Fetch Steam app details (genres) for a batch of AppIDs
async function fetchSteamAppDetails(
  appIds: number[]
): Promise<Map<number, Deal['genres']>> {
  const result = new Map<number, Deal['genres']>()
  if (appIds.length === 0) return result

  const GENRE_MAP: Record<string, Deal['genres'][number]> = {
    'rpg': 'rpg', 'role-playing': 'rpg',
    'action': 'action', 'adventure': 'adventure',
    'strategy': 'strategy', 'simulation': 'simulation',
    'puzzle': 'puzzle', 'platformer': 'platformer',
    'shooter': 'shooter', 'first-person': 'shooter',
    'horror': 'horror', 'sports': 'sports',
    'racing': 'racing', 'indie': 'indie',
  }

  const BATCH = 20
  for (let i = 0; i < appIds.length; i += BATCH) {
    const batch = appIds.slice(i, i + BATCH)
    try {
      const url = new URL(`${STEAM_BASE}/api/appdetails`)
      url.searchParams.set('appids', batch.join(','))
      url.searchParams.set('filters', 'genres')
      url.searchParams.set('cc', 'US')
      url.searchParams.set('l', 'en')

      const res = await fetch(url.toString(), {
        cache: 'no-store',
        // FIX: raised timeout from 6s → 10s — genre enrichment was timing out
        // causing all Steam deals to land in genres:['other'], breaking genre filter
        signal: AbortSignal.timeout(10_000),
      })
      if (!res.ok) continue

      const data = await res.json()
      for (const appid of batch) {
        const appData = data?.[String(appid)]
        if (!appData?.success) continue

        const steamGenres: { id: string; description: string }[] = appData.data?.genres ?? []
        const genres = new Set<Deal['genres'][number]>()

        for (const g of steamGenres) {
          const desc = g.description.toLowerCase()
          for (const [key, genre] of Object.entries(GENRE_MAP)) {
            if (desc.includes(key)) genres.add(genre)
          }
        }
        result.set(appid, genres.size > 0 ? Array.from(genres) : ['other'])
      }
    } catch { /* ignore per-batch errors — genres stay as 'other' */ }
  }
  return result
}

async function fetchFeaturedSpecials(): Promise<SteamFeaturedItem[]> {
  try {
    const res = await fetch(
      `${STEAM_BASE}/api/featuredcategories/?cc=US&l=en`,
      { cache: 'no-store', signal: AbortSignal.timeout(8_000) }
    )
    if (!res.ok) return []
    const data = await res.json()
    const items: SteamFeaturedItem[] = []
    for (const section of Object.values(data as Record<string, unknown>)) {
      if (!section || typeof section !== 'object') continue
      const s = section as { items?: SteamFeaturedItem[] }
      if (!Array.isArray(s.items)) continue
      for (const item of s.items) {
        if (item.id && item.name && item.discounted && item.discount_percent >= MIN_DISCOUNT) {
          items.push(item)
        }
      }
    }
    return items
  } catch { return [] }
}

async function fetchSearchSpecials(): Promise<SteamSearchItem[]> {
  try {
    const url = new URL(`${STEAM_BASE}/search/results/`)
    url.searchParams.set('specials', '1')
    url.searchParams.set('json', '1')
    url.searchParams.set('count', '100')
    url.searchParams.set('sort_by', 'Discount_DESC')
    url.searchParams.set('cc', 'US')
    url.searchParams.set('l', 'en')

    const res = await fetch(url.toString(), {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8_000),
    })
    if (!res.ok) return []
    const data = await res.json()
    return data?.items ?? []
  } catch { return [] }
}

function getSteamCover(appId: number, fallback?: string): string {
  if (fallback) return fallback
  return `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/capsule_616x353.jpg`
}

export async function fetchSteamSaleDeals(): Promise<Deal[]> {
  const [featured, search] = await Promise.allSettled([
    fetchFeaturedSpecials(),
    fetchSearchSpecials(),
  ])

  const deals = new Map<number, Deal>()
  const now   = new Date().toISOString()

  // Featured items — integer cents
  for (const item of (featured.status === 'fulfilled' ? featured.value : [])) {
    if (!item.id || !item.name) continue
    if (item.original_price < MIN_ORIGINAL_CENTS) continue
    if (item.discount_percent < MIN_DISCOUNT) continue

    const isFree = item.final_price === 0
    deals.set(item.id, {
      id: `steam-${item.id}`, title: item.name, platform: 'steam',
      originalPrice: item.original_price / 100,
      currentPrice:  item.final_price / 100,
      discountPercent: item.discount_percent,
      currency: item.currency ?? 'USD',
      coverImage: getSteamCover(item.id, item.large_capsule_image ?? item.header_image),
      claimUrl: `${STEAM_BASE}/app/${item.id}`,
      startDate: now, endDate: null,
      // FIX: sale deals are 'sale', not 'timed-free' — prevents "Always free" label
      dealType: isFree ? 'timed-free' : 'sale',
      genres: ['other'],
      fetchedAt: now,
    })
  }

  // Search items — integer cents
  for (const item of (search.status === 'fulfilled' ? search.value : [])) {
    if (!item.app_id || !item.name || item.type === 'sub') continue
    if (deals.has(item.app_id)) continue
    const discount = item.discount_percent ?? 0
    const origCents = item.original_price ?? 0
    if (discount < MIN_DISCOUNT || origCents < MIN_ORIGINAL_CENTS) continue

    const finalCents = item.final_price ?? 0
    const isFree = finalCents === 0
    deals.set(item.app_id, {
      id: `steam-${item.app_id}`, title: item.name, platform: 'steam',
      originalPrice: origCents / 100,
      currentPrice:  finalCents / 100,
      discountPercent: discount,
      currency: 'USD',
      coverImage: getSteamCover(item.app_id, item.logo),
      claimUrl: `${STEAM_BASE}/app/${item.app_id}`,
      startDate: now, endDate: null,
      dealType: isFree ? 'timed-free' : 'sale',
      genres: ['other'],
      fetchedAt: now,
    })
  }

  const all    = [...deals.values()]
  const appIds = [...deals.keys()]

  // Enrich with genres (best-effort)
  try {
    const genreMap = await fetchSteamAppDetails(appIds)
    for (const [appId, genres] of genreMap.entries()) {
      const deal = deals.get(appId)
      if (deal) deal.genres = genres
    }
  } catch { /* genres stay as 'other' */ }

  const freeDeals = all.filter(d => d.currentPrice === 0)
  const saleDeals = all.filter(d => d.currentPrice > 0)
  console.log(`[Steam] ${all.length} deals (${freeDeals.length} free, ${saleDeals.length} sale), genres enriched`)

  return all
}

export async function fetchSteamFreeDeals():     Promise<Deal[]> { return (await fetchSteamSaleDeals()).filter(d => d.currentPrice === 0) }
export async function fetchSteamDiscountDeals(): Promise<Deal[]> { return (await fetchSteamSaleDeals()).filter(d => d.currentPrice > 0 && (d.discountPercent ?? 0) >= 70) }
export async function fetchSteamMidSaleDeals():  Promise<Deal[]> { return (await fetchSteamSaleDeals()).filter(d => d.currentPrice > 0 && (d.discountPercent ?? 0) >= 30 && (d.discountPercent ?? 0) < 70) }

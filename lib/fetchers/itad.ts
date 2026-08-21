import type { Deal } from '@/types'
import type { Platform } from '@/types'

const ITAD_BASE = 'https://api.isthereanydeal.com'

const TRUSTED_IDS = new Set([
  '61',  // Steam
  '16',  // Epic Game Store
  '35',  // GOG
  '11',  // Humble Bundle
  '38',  // itch.io
  '27',  // Fanatical
])

const TRUSTED_NAMES = ['steam', 'gog', 'epic', 'humble', 'itch', 'fanatical', 'prime', 'amazon games']

const RESELLER_NAMES: [string, Platform][] = [
  ['gamesplanet',    'gamesplanet'],
  ['dlgamer',        'dlgamer'],
  ['green man',      'gmg'],
  ['greenmangaming', 'gmg'],
  ['gamesload',      'gamesload'],
  ['newegg',         'newegg'],
]

// Key resellers excluded entirely — stolen keys / chargebacks
const EXCLUDED_NAMES = ['g2a', 'cdkeys', 'kinguin', 'g2play', 'gamivo', 'eneba', 'allkeyshop']

interface ITADDeal {
  id: string
  slug: string
  title: string
  type: string
  assets: { boxart?: string; banner145?: string; banner300?: string; banner400?: string; banner600?: string }
  reviews?: { steam?: { text: string; score: number; count: number } }
  genres: { id: string; name: string }[]
  tags: string[]
  deal: {
    shop: { id: unknown; name: string }
    price: { amount: number; currency: string }
    regular: { amount: number; currency: string }
    cut: number
    flag: string
    timestamp: string
    expiry: string | null
    url: string
  }
}

const GENRE_MAP: Record<string, Deal['genres'][number]> = {
  'role-playing': 'rpg', 'rpg': 'rpg', 'action': 'action', 'adventure': 'adventure',
  'strategy': 'strategy', 'simulation': 'simulation', 'puzzle': 'puzzle',
  'platformer': 'platformer', 'shooter': 'shooter', 'horror': 'horror',
  'sports': 'sports', 'racing': 'racing', 'indie': 'indie',
}

function mapShop(id: unknown, name?: string): Platform {
  const key = String(id ?? '').toLowerCase()
  const numMap: Record<string, Platform> = {
    '61': 'steam', '16': 'epic', '35': 'gog', '11': 'humble',
    '38': 'itch', '27': 'fanatical',
  }
  if (numMap[key]) return numMap[key]
  const n = (name ?? '').toLowerCase()
  if (n.includes('steam'))     return 'steam'
  if (n.includes('epic'))      return 'epic'
  if (n.includes('gog'))       return 'gog'
  if (n.includes('humble'))    return 'humble'
  if (n.includes('itch'))      return 'itch'
  if (n.includes('fanatical')) return 'fanatical'
  if (n.includes('prime') || n.includes('amazon')) return 'prime'
  for (const [match, platform] of RESELLER_NAMES) {
    if (n.includes(match)) return platform
  }
  return 'other'
}

function isTrusted(id: unknown, name?: string): boolean {
  const key = String(id ?? '').toLowerCase()
  if (TRUSTED_IDS.has(key)) return true
  const n = (name ?? '').toLowerCase()
  return TRUSTED_NAMES.some(t => n.includes(t))
}

function isExcluded(name?: string): boolean {
  const n = (name ?? '').toLowerCase()
  return EXCLUDED_NAMES.some(e => n.includes(e))
}

function isReseller(id: unknown, name?: string): boolean {
  if (isTrusted(id, name)) return false
  if (isExcluded(name)) return false
  const n = (name ?? '').toLowerCase()
  return RESELLER_NAMES.some(([match]) => n.includes(match))
}

function normalizeCut(cut: number): number {
  return cut <= 1 ? Math.round(cut * 100) : Math.round(cut)
}

function mapGenres(genres: { id: string; name: string }[], tags: string[]): Deal['genres'] {
  const result = new Set<Deal['genres'][number]>()
  const terms = [...genres.map(g => g.name), ...tags].map(s => s.toLowerCase())
  for (const term of terms)
    for (const [key, genre] of Object.entries(GENRE_MAP))
      if (term.includes(key)) result.add(genre)
  return result.size > 0 ? Array.from(result) : ['other']
}

function getBestImage(assets: ITADDeal['assets']): string {
  return assets.banner300 ?? assets.banner400 ?? assets.banner145 ?? assets.boxart ?? ''
}

/**
 * Core fetch wrapper.
 *
 * FIX: `country` is now optional. Free-deal queries pass country=US because
 * free = $0 in any currency. Sale/reseller queries OMIT country entirely so
 * ITAD returns native currency (EUR/GBP) for European stores.
 *
 * Root cause of 0 results: country=US caused ITAD to return price.amount=0
 * for DLGamer, GamesPlanet UK/DE/FR (no USD pricing), which then failed the
 * price.amount > 0 check, killing all 40 items every time.
 */
async function fetchDeals(
  params: Record<string, string>,
  label: string,
  includeCountry = false,   // false = omit country, let ITAD return native currency
): Promise<ITADDeal[]> {
  const apiKey = process.env.ITAD_API_KEY
  if (!apiKey) { console.warn('[ITAD] ITAD_API_KEY not set'); return [] }

  const url = new URL(`${ITAD_BASE}/deals/v2`)
  url.searchParams.set('key', apiKey)
  // Only add country for free-deal queries (where USD=0 is meaningful)
  if (includeCountry) url.searchParams.set('country', 'US')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)

  const res = await fetch(url.toString(), {
    cache: 'no-store',
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(8_000),
  })

  if (!res.ok) { console.error(`[ITAD/${label}] HTTP ${res.status}`); return [] }

  const data = await res.json()
  const items: ITADDeal[] = data?.list ?? []

  if (items.length > 0) {
    const shops = [...new Map(items.map(i => [String(i.deal.shop.id), i.deal.shop.name]))]
      .slice(0, 8).map(([id, name]) => `${id}="${name}"`).join(', ')
    console.log(`[ITAD/${label}] ${items.length} items. Shops: ${shops}`)
    // Debug: log first item's price data to verify amounts are non-zero
    const first = items[0]
    console.log(`[ITAD/${label}] sample: "${first.title}" cut=${normalizeCut(first.deal.cut)}% price=${first.deal.price.amount} ${first.deal.price.currency} reg=${first.deal.regular.amount}`)
  }

  return items
}

// ── Free deals ────────────────────────────────────────────────────────
// Trusted stores only. country=US included — free means price=0 in USD.
export async function fetchITADDeals(flashOnly = false): Promise<Deal[]> {
  try {
    const params: Record<string, string> = {
      limit: '60', price_max: '0', cut_min: '100', sort: 'expiry',
    }
    if (flashOnly) {
      params.limit = '20'
      params.expiry_max = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }

    // includeCountry=true for free deals — USD pricing is correct here
    const items = await fetchDeals(params, 'free', true)

    const valid = items.filter(i =>
      isTrusted(i.deal.shop.id, i.deal.shop.name) &&
      i.deal.regular.amount > 0 &&
      i.deal.price.amount === 0
    )

    console.log(`[ITAD/free] ${items.length} raw → ${valid.length} genuine paid→free on trusted stores`)
    return valid.map(item => ({
      id: `itad-${item.id}`, title: item.title,
      platform: mapShop(item.deal.shop.id, item.deal.shop.name),
      originalPrice: item.deal.regular.amount, currentPrice: 0, discountPercent: 100,
      currency: item.deal.price.currency, coverImage: getBestImage(item.assets),
      claimUrl: item.deal.url, startDate: item.deal.timestamp, endDate: item.deal.expiry,
      dealType: item.deal.expiry ? 'timed-free' : 'permanent-free',
      genres: mapGenres(item.genres ?? [], item.tags ?? []),
      igdbRating: item.reviews?.steam?.score ? Math.round(item.reviews.steam.score * 10) / 10 : undefined,
      fetchedAt: new Date().toISOString(),
    }))
  } catch (err) { console.error('[ITAD/free]', err); return [] }
}

// ── Heavy sale deals (70%+) ───────────────────────────────────────────
// No country filter — DLGamer/GamesPlanet are European, need native currency prices.
export async function fetchITADSaleDeals(): Promise<Deal[]> {
  try {
    // includeCountry=false — omit country so European stores return real prices
    const items = await fetchDeals({
      limit: '40', cut_min: '70', cut_max: '99', sort: 'cut',
    }, 'sale', false)

    const valid = items.filter(i => {
      if (isExcluded(i.deal.shop.name))          return false
      if (!i.deal.price?.amount)                  return false  // null/zero price
      if (i.deal.price.amount <= 0)               return false
      if ((i.deal.regular?.amount ?? 0) < 1)      return false  // no original price data
      if (normalizeCut(i.deal.cut) < 70)          return false
      return true
    })

    if (items.length > 0 && valid.length === 0) {
      console.log(`[ITAD/sale] all rejected — first item: price=${items[0].deal.price?.amount} reg=${items[0].deal.regular?.amount} cut=${items[0].deal.cut} excluded=${isExcluded(items[0].deal.shop.name)}`)
    }
    console.log(`[ITAD/sale] ${items.length} raw → ${valid.length} 70%+ deals`)

    return valid.map(item => {
      const cut = normalizeCut(item.deal.cut)
      return {
        id: `sale-${item.id}`, title: item.title,
        platform: mapShop(item.deal.shop.id, item.deal.shop.name),
        originalPrice: item.deal.regular.amount, currentPrice: item.deal.price.amount,
        discountPercent: cut, currency: item.deal.price.currency,
        coverImage: getBestImage(item.assets), claimUrl: item.deal.url,
        startDate: item.deal.timestamp, endDate: item.deal.expiry,
        dealType: 'sale' as const,
        genres: mapGenres(item.genres ?? [], item.tags ?? []),
        igdbRating: item.reviews?.steam?.score ? Math.round(item.reviews.steam.score * 10) / 10 : undefined,
        fetchedAt: new Date().toISOString(),
      }
    })
  } catch (err) { console.error('[ITAD/sale]', err); return [] }
}

// ── Mid-tier sale deals (30-69%) ──────────────────────────────────────
// No country filter for same reason.
export async function fetchITADMidSaleDeals(): Promise<Deal[]> {
  try {
    const items = await fetchDeals({
      limit: '40', cut_min: '30', cut_max: '69', sort: 'cut',
    }, 'mid-sale', false)

    const valid = items.filter(i => {
      if (isExcluded(i.deal.shop.name))     return false
      if (!i.deal.price?.amount)             return false
      if (i.deal.price.amount <= 0)          return false
      if ((i.deal.regular?.amount ?? 0) < 1) return false
      if (normalizeCut(i.deal.cut) < 30)    return false
      return true
    })

    console.log(`[ITAD/mid-sale] ${items.length} raw → ${valid.length} 30-69% deals`)

    return valid.map(item => {
      const cut = normalizeCut(item.deal.cut)
      return {
        id: `mid-${item.id}`, title: item.title,
        platform: mapShop(item.deal.shop.id, item.deal.shop.name),
        originalPrice: item.deal.regular.amount, currentPrice: item.deal.price.amount,
        discountPercent: cut, currency: item.deal.price.currency,
        coverImage: getBestImage(item.assets), claimUrl: item.deal.url,
        startDate: item.deal.timestamp, endDate: item.deal.expiry,
        dealType: 'sale' as const,
        genres: mapGenres(item.genres ?? [], item.tags ?? []),
        igdbRating: item.reviews?.steam?.score ? Math.round(item.reviews.steam.score * 10) / 10 : undefined,
        fetchedAt: new Date().toISOString(),
      }
    })
  } catch (err) { console.error('[ITAD/mid-sale]', err); return [] }
}

// ── Reseller deals (30%+) ─────────────────────────────────────────────
// GamesPlanet, DLGamer, GMG, Gamesload, Newegg.
// No country filter — all are European/international storefronts.
export async function fetchITADResellerDeals(): Promise<Deal[]> {
  try {
    const items = await fetchDeals({
      limit: '60', cut_min: '30', cut_max: '99', sort: 'cut',
    }, 'reseller', false)

    const valid = items.filter(i => {
      if (!isReseller(i.deal.shop.id, i.deal.shop.name)) return false
      if (!i.deal.price?.amount)                          return false
      if (i.deal.price.amount <= 0)                       return false
      if ((i.deal.regular?.amount ?? 0) < 1)              return false
      if (normalizeCut(i.deal.cut) < 30)                 return false
      return true
    })

    console.log(`[ITAD/reseller] ${items.length} raw → ${valid.length} reseller 30%+ deals`)

    return valid.map(item => {
      const cut = normalizeCut(item.deal.cut)
      return {
        id: `reseller-${item.id}`, title: item.title,
        platform: mapShop(item.deal.shop.id, item.deal.shop.name),
        originalPrice: item.deal.regular.amount, currentPrice: item.deal.price.amount,
        discountPercent: cut, currency: item.deal.price.currency,
        coverImage: getBestImage(item.assets), claimUrl: item.deal.url,
        startDate: item.deal.timestamp, endDate: item.deal.expiry,
        dealType: 'sale' as const,
        genres: mapGenres(item.genres ?? [], item.tags ?? []),
        igdbRating: item.reviews?.steam?.score ? Math.round(item.reviews.steam.score * 10) / 10 : undefined,
        fetchedAt: new Date().toISOString(),
      }
    })
  } catch (err) { console.error('[ITAD/reseller]', err); return [] }
}

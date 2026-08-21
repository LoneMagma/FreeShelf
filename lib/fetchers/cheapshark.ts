/**
 * CheapShark — free public API, no key required.
 * https://apidocs.cheapshark.com
 */
import type { Deal, Platform } from '@/types'

const CS = 'https://www.cheapshark.com/api/1.0'

const STORE_PLATFORM: Record<string, Platform> = {
  '1':  'steam',   '3':  'gmg',    '7':  'gog',
  '11': 'humble',  '15': 'fanatical', '25': 'epic',
  '28': 'gamesplanet', '29': 'gamesload', '34': 'dlgamer',
}

export const CS_STORE_NAMES: Record<string, string> = {
  '1':  'Steam',         '2':  'GamersGate',      '3':  'Green Man Gaming',
  '4':  'Amazon',        '6':  'Direct2Drive',     '7':  'GOG',
  '8':  'EA App',        '11': 'Humble Store',     '13': 'Ubisoft Connect',
  '15': 'Fanatical',     '21': 'WinGameStore',     '23': 'GameBillet',
  '24': 'Voidu',         '25': 'Epic Games Store', '28': 'GamesPlanet',
  '29': 'GamesLoad',     '30': '2Game',            '31': 'IndieGala Store',
  '33': 'AllYouPlay',    '34': 'DLGamer',          '37': 'DreamGame',
}

interface CSDeal {
  title: string; dealID: string; storeID: string; gameID: string
  salePrice: string; normalPrice: string; isOnSale: string; savings: string
  metacriticScore: string; steamRatingPercent: string; steamRatingCount: string
  steamAppID: string; lastChange: number; dealRating: string; thumb: string
  internalName: string
}

export interface CSGameInfo {
  info: { title: string; steamAppID: string; thumb: string }
  cheapestPriceEver: { price: string; date: number }
  deals: { storeID: string; dealID: string; price: string; retailPrice: string; savings: string }[]
}

export interface CSSearchResult {
  gameID: string; steamAppID: string; external: string; cheapest: string; thumb: string
}

// ── Helpers ───────────────────────────────────────────────────────────

function mapPlatform(id: string): Platform { return STORE_PLATFORM[id] ?? 'other' }

function bestCover(steamAppID: string, thumb: string): string {
  if (steamAppID && steamAppID !== '0')
    return `https://cdn.akamai.steamstatic.com/steam/apps/${steamAppID}/capsule_616x353.jpg`
    if (thumb && thumb.startsWith('http') && !thumb.includes('placehold')) return thumb
      return ''
}

function claimUrl(storeID: string, dealID: string, steamAppID: string): string {
  if (storeID === '1' && steamAppID && steamAppID !== '0')
    return `https://store.steampowered.com/app/${steamAppID}/`
    return `https://www.cheapshark.com/redirect?dealID=${dealID}`
}

function parseMeta(s: string): number | undefined { const n = parseInt(s,10); return n>0?n:undefined }

function popScore(item: CSDeal): number {
  const pct = parseInt(item.steamRatingPercent, 10)
  const cnt = parseInt(item.steamRatingCount, 10)
  if (pct > 0 && cnt > 0) {
    const p=pct/100, z=1.96, n=cnt
    return (p+z*z/(2*n)-z*Math.sqrt((p*(1-p)+z*z/(4*n))/n))/(1+z*z/n)
  }
  const dr = parseFloat(item.dealRating)
  return isNaN(dr) ? 0 : dr/10
}

async function csGet<T>(path: string, params: Record<string,string>, label: string): Promise<T|null> {
  try {
    const url = new URL(`${CS}${path}`)
    for (const [k,v] of Object.entries(params)) url.searchParams.set(k,v)
      const res = await fetch(url.toString(), {
        cache: 'no-store',
        headers: { Accept: 'application/json', 'User-Agent': 'FreeShelf/1.0' },
        signal: AbortSignal.timeout(8_000),
      })
      if (!res.ok) { console.error(`[CheapShark/${label}] HTTP ${res.status}`); return null }
      return (await res.json()) as T
  } catch(err) { console.error(`[CheapShark/${label}] Error:`, err); return null }
}

// Helper to safely extract CSDeal[] from PromiseSettledResult
const extractDeals = (result: PromiseSettledResult<CSDeal[] | null>): CSDeal[] => {
  if (result.status !== 'fulfilled' || !result.value) return [];
  return Array.isArray(result.value) ? result.value : [];
};

// ── Free deals ────────────────────────────────────────────────────────

export async function fetchCheapSharkFreeDeals(): Promise<Deal[]> {
  const items = await csGet<CSDeal[]>('/deals',
                                      { upperPrice: '0', pageSize: '60', sortBy: 'Recent' }, 'free')
  if (!items) return []
    const now = new Date().toISOString()
    const deals: Deal[] = []
    for (const i of items) {
      const sale = parseFloat(i.salePrice), normal = parseFloat(i.normalPrice)
      if (sale !== 0 || normal < 0.5) continue
        deals.push({
          id: `cs-${i.gameID}`, title: i.title, platform: mapPlatform(i.storeID),
                   originalPrice: normal, currentPrice: 0, discountPercent: 100, currency: 'USD',
                   coverImage: bestCover(i.steamAppID, i.thumb),
                   claimUrl: claimUrl(i.storeID, i.dealID, i.steamAppID),
                   startDate: new Date(i.lastChange*1000).toISOString(), endDate: null,
                   dealType: 'timed-free', genres: ['other'],
                   metacriticScore: parseMeta(i.metacriticScore), fetchedAt: now,
        })
    }
    console.log(`[CheapShark/free] ${items.length} raw → ${deals.length} free deals`)
    return deals
}

// ── Heavy sale (≥70% off) ─────────────────────────────────────────────

export async function fetchCheapSharkHeavySaleDeals(): Promise<Deal[]> {
  const items = await csGet<CSDeal[]>('/deals',
                                      { lowerPrice: '0.01', upperPrice: '60', sortBy: 'DealRating', pageSize: '60', onSale: '1' },
                                      'heavy-sale')
  if (!items) return []
    const now = new Date().toISOString()
    const valid = items.filter(i => {
      const sale=parseFloat(i.salePrice), normal=parseFloat(i.normalPrice), savings=parseFloat(i.savings)
      return sale>0 && normal>=5 && savings>=70
    }).sort((a,b) => popScore(b)-popScore(a))

    const seen = new Map<string,CSDeal>()
    for (const i of valid) {
      const ex = seen.get(i.gameID)
      if (!ex || parseFloat(i.salePrice)<parseFloat(ex.salePrice)) seen.set(i.gameID, i)
    }

    const deals: Deal[] = []
    for (const i of seen.values()) {
      const sale=parseFloat(i.salePrice), normal=parseFloat(i.normalPrice), savings=parseFloat(i.savings)
      deals.push({
        id: `cs-heavy-${i.gameID}`, title: i.title, platform: mapPlatform(i.storeID),
                 originalPrice: normal, currentPrice: sale, discountPercent: Math.round(savings), currency: 'USD',
                 coverImage: bestCover(i.steamAppID, i.thumb),
                 claimUrl: claimUrl(i.storeID, i.dealID, i.steamAppID),
                 startDate: new Date(i.lastChange*1000).toISOString(), endDate: null,
                 dealType: 'sale', genres: ['other'],
                 metacriticScore: parseMeta(i.metacriticScore), fetchedAt: now,
      })
    }
    console.log(`[CheapShark/heavy-sale] ${items.length} raw → ${deals.length} deals (≥70% off)`)
    return deals
}

// ── Regular sale (30–69% off) ─────────────────────────────────────────
/**
 * Root cause of 0-results bug:
 * CheapShark sorted by DealRating returns 60 results that are ALL ≥70% off —
 * the filter savings<70 kills every single item.
 *
 * Fix: run TWO parallel calls with different sort keys (Metacritic, Reviews).
 * These return different slices of the catalogue, many of which sit in the
 * 30-69% range. Merge, dedup by gameID, keep only 30-69% items.
 */
export async function fetchCheapSharkSaleDeals(): Promise<Deal[]> {
  const baseParams = { lowerPrice: '0.01', upperPrice: '50', pageSize: '60', onSale: '1' }

  const [metaResult, reviewResult, recentResult] = await Promise.allSettled([
    csGet<CSDeal[]>('/deals', { ...baseParams, sortBy: 'Metacritic' }, 'sale-meta'),
                                                                            csGet<CSDeal[]>('/deals', { ...baseParams, sortBy: 'Reviews'   }, 'sale-reviews'),
                                                                            csGet<CSDeal[]>('/deals', { ...baseParams, sortBy: 'Recent'    }, 'sale-recent'),
  ])

  // Merge all three pools, dedup by gameID keeping first occurrence
  const merged = new Map<string, CSDeal>()
  for (const item of [
    ...extractDeals(metaResult),
       ...extractDeals(reviewResult),
       ...extractDeals(recentResult)
  ]) {
    if (!merged.has(item.gameID)) merged.set(item.gameID, item)
  }

  const now = new Date().toISOString()
  const valid = [...merged.values()].filter(i => {
    const sale=parseFloat(i.salePrice), normal=parseFloat(i.normalPrice), savings=parseFloat(i.savings)
    return sale>0 && normal>=5 && savings>=30 && savings<70
  }).sort((a,b) => popScore(b)-popScore(a))

  const deals: Deal[] = []
  for (const i of valid) {
    const sale=parseFloat(i.salePrice), normal=parseFloat(i.normalPrice), savings=parseFloat(i.savings)
    deals.push({
      id: `cs-sale-${i.gameID}`, title: i.title, platform: mapPlatform(i.storeID),
               originalPrice: normal, currentPrice: sale, discountPercent: Math.round(savings), currency: 'USD',
               coverImage: bestCover(i.steamAppID, i.thumb),
               claimUrl: claimUrl(i.storeID, i.dealID, i.steamAppID),
               startDate: new Date(i.lastChange*1000).toISOString(), endDate: null,
               dealType: 'sale', genres: ['other'],
               metacriticScore: parseMeta(i.metacriticScore), fetchedAt: now,
    })
  }
  console.log(`[CheapShark/sale] ${merged.size} merged → ${deals.length} deals (30-69% off)`)
  return deals
}

// ── Search ────────────────────────────────────────────────────────────

export async function searchCheapSharkGames(query: string): Promise<CSSearchResult[]> {
  if (!query.trim() || query.trim().length<2) return []
    return (await csGet<CSSearchResult[]>('/games', { title: query.trim(), limit: '15', exact: '0' }, 'search')) ?? []
}

// ── Price lookup ──────────────────────────────────────────────────────

export async function getCheapSharkGamePrices(gameID: string): Promise<CSGameInfo|null> {
  if (!gameID) return null
    return csGet<CSGameInfo>('/games', { id: gameID }, `prices:${gameID}`)
}

// ── Game detail ───────────────────────────────────────────────────────

export interface GameDetailStore {
  storeID: string; storeName: string; platform: Platform; dealID: string
  price: number; retailPrice: number; savings: number; url: string
  isFree: boolean; isEpicFreeGame: boolean
}

export interface GameDetailData {
  gameID: string; title: string; steamAppID: string; coverImage: string
  cheapestEver: { price: number; date: number } | null
  metacriticScore: number|undefined; steamRatingPercent: number|undefined; steamRatingCount: number|undefined
  stores: GameDetailStore[]
}

export async function fetchGameDetailData(gameID: string): Promise<GameDetailData|null> {
  if (!gameID || !/^\d+$/.test(gameID)) return null

    const [infoR, dealsR] = await Promise.allSettled([
      csGet<CSGameInfo>('/games', { id: gameID }, `detail:${gameID}`),
                                                     csGet<CSDeal[]>('/deals', { gameID, sortBy: 'Price', pageSize: '60' }, `detail-deals:${gameID}`),
    ])

    const info  = infoR.status  === 'fulfilled' ? infoR.value  : null
    const deals = dealsR.status === 'fulfilled' ? dealsR.value : null
    if (!info && (!deals||deals.length===0)) return null

      const title      = info?.info?.title      ?? deals?.[0]?.title      ?? 'Unknown Game'
      const steamAppID = info?.info?.steamAppID ?? deals?.[0]?.steamAppID ?? '0'
      const coverImage = bestCover(steamAppID, info?.info?.thumb ?? deals?.[0]?.thumb ?? '')
      const ratingSource = deals?.find(d => parseInt(d.metacriticScore,10)>0) ?? deals?.[0]
      const metacriticScore    = ratingSource ? parseInt(ratingSource.metacriticScore,10)||undefined    : undefined
      const steamRatingPercent = ratingSource ? parseInt(ratingSource.steamRatingPercent,10)||undefined : undefined
      const steamRatingCount   = ratingSource ? parseInt(ratingSource.steamRatingCount,10)||undefined   : undefined

      const stores: GameDetailStore[] = []
      const src = deals && deals.length>0 ? deals : null
      if (src) {
        const sm = new Map<string,CSDeal>()
        for (const d of src) {
          const ex=sm.get(d.storeID)
          if (!ex||parseFloat(d.salePrice)<parseFloat(ex.salePrice)) sm.set(d.storeID,d)
        }
        for (const d of sm.values()) {
          const price=parseFloat(d.salePrice), retail=parseFloat(d.normalPrice), savings=parseFloat(d.savings)
          stores.push({
            storeID: d.storeID, storeName: CS_STORE_NAMES[d.storeID]??`Store ${d.storeID}`,
            platform: mapPlatform(d.storeID), dealID: d.dealID,
                      price: isNaN(price)?0:price, retailPrice: isNaN(retail)?0:retail, savings: isNaN(savings)?0:Math.round(savings),
                      url: claimUrl(d.storeID, d.dealID, d.steamAppID),
                      isFree: price===0, isEpicFreeGame: d.storeID==='25'&&price===0,
          })
        }
      } else if (info?.deals) {
        for (const d of info.deals) {
          const price=parseFloat(d.price), retail=parseFloat(d.retailPrice), savings=parseFloat(d.savings)
          const sp=isNaN(savings)?0:savings<=1?Math.round(savings*100):Math.round(savings)
          stores.push({
            storeID: d.storeID, storeName: CS_STORE_NAMES[d.storeID]??`Store ${d.storeID}`,
            platform: mapPlatform(d.storeID), dealID: d.dealID,
                      price: isNaN(price)?0:price, retailPrice: isNaN(retail)?0:retail, savings: sp,
                      url: `https://www.cheapshark.com/redirect?dealID=${d.dealID}`,
                      isFree: price===0, isEpicFreeGame: d.storeID==='25'&&price===0,
          })
        }
      }

      stores.sort((a,b) => { if(a.isFree&&!b.isFree)return -1; if(!a.isFree&&b.isFree)return 1; return a.price-b.price })

      return {
        gameID, title, steamAppID, coverImage,
        cheapestEver: info?.cheapestPriceEver
        ? { price: parseFloat(info.cheapestPriceEver.price), date: info.cheapestPriceEver.date }
        : null,
        metacriticScore, steamRatingPercent, steamRatingCount, stores,
      }
}

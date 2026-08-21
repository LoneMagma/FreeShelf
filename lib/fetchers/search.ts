/**
 * Game search + price lookup — backed by CheapShark.
 *
 * Fix: Epic Games links for free games.
 * When a game is free on Epic, CheapShark's redirect points to
 * store.epicgames.com/en-US/free-games (Epic's generic hub) because
 * Epic redirects all free-game claim URLs there. This is Epic's behaviour,
 * not a bug in our code. We surface this clearly in the UI via isEpicFreeGame.
 */

import {
  searchCheapSharkGames,
  getCheapSharkGamePrices,
  CS_STORE_NAMES,
} from './cheapshark'
import type { Platform } from '@/types'

// ── Public interfaces (same shape as before — SearchClient unchanged) ──

export interface SearchResult {
  id:    string
  slug:  string   // alias for id — backward compat
  title: string
  type:  string
  assets?: { boxart?: string; banner300?: string }
}

export interface StorePriceEntry {
  shopId:          string
  shopName:        string
  platform:        string
  price:           number
  regularPrice:    number
  discountPercent: number
  currency:        string
  url:             string
  expiry:          string | null
  isFree:          boolean
  isHistoricalLow: boolean
  isEpicFreeGame:  boolean   // NEW — Epic free redirect warning flag
}

export interface GamePriceData {
  id:                string
  title:             string
  coverImage:        string
  stores:            StorePriceEntry[]
  historicalLow:     number | null
  bestCurrentPrice:  number | null
  bestCurrentStore:  string | null
  isCurrentlyFree:   boolean
  nearHistoricalLow: boolean
}

// ── Internals ─────────────────────────────────────────────────────────

const CS_STORE_PLATFORM: Record<string, Platform> = {
  '1':  'steam',  '3': 'gmg',  '7': 'gog', '11': 'humble',
  '15': 'fanatical', '25': 'epic', '28': 'gamesplanet',
  '29': 'gamesload', '34': 'dlgamer',
}

function mapPlatform(storeID: string): Platform {
  return CS_STORE_PLATFORM[storeID] ?? 'other'
}

function storeName(storeID: string): string {
  return CS_STORE_NAMES[storeID] ?? `Store ${storeID}`
}

function steamBanner(steamAppID: string): string {
  if (!steamAppID || steamAppID === '0') return ''
  return `https://cdn.akamai.steamstatic.com/steam/apps/${steamAppID}/capsule_616x353.jpg`
}

/**
 * Builds the best available URL for a deal.
 *
 * For Steam: direct app page (reliable, permanent).
 * For Epic free games: the CheapShark redirect goes to Epic's /free-games page —
 *   this is unavoidable but we flag it so the UI can warn the user.
 * For everything else: CheapShark redirect (tracks the user to the correct store).
 */
function storeUrl(storeID: string, dealID: string, steamAppID?: string): string {
  if (storeID === '1' && steamAppID && steamAppID !== '0') {
    return `https://store.steampowered.com/app/${steamAppID}/`
  }
  // CheapShark redirect is correct — for Epic free games it ends up at
  // the free-games hub, but that's Epic's redirect, not ours.
  return `https://www.cheapshark.com/redirect?dealID=${dealID}`
}

// ── Search ────────────────────────────────────────────────────────────

export async function searchGames(query: string): Promise<SearchResult[]> {
  const results = await searchCheapSharkGames(query)
  return results.map(r => ({
    id:    r.gameID,
    slug:  r.gameID,
    title: r.external,
    type:  'game',
    assets: {
      boxart:    r.thumb,
      banner300: steamBanner(r.steamAppID) || r.thumb,
    },
  }))
}

// ── Price lookup ──────────────────────────────────────────────────────

export async function getGamePrices(
  gameID:  string,
  _title?: string,
  _slug?:  string,
): Promise<GamePriceData | null> {
  if (!gameID) return null

  const data = await getCheapSharkGamePrices(gameID)
  if (!data) return null

  const { info, cheapestPriceEver, deals } = data
  const coverImage  = steamBanner(info.steamAppID) || info.thumb || ''
  const historicalLow = cheapestPriceEver?.price
    ? parseFloat(cheapestPriceEver.price)
    : null

  if (!deals || deals.length === 0) {
    return {
      id: gameID, title: info.title, coverImage,
      stores: [], historicalLow,
      bestCurrentPrice: null, bestCurrentStore: null,
      isCurrentlyFree: false, nearHistoricalLow: false,
    }
  }

  // Dedup: one entry per store, keep cheapest
  const shopMap = new Map<string, typeof deals[0]>()
  for (const d of deals) {
    const existing = shopMap.get(d.storeID)
    if (!existing || parseFloat(d.price) < parseFloat(existing.price)) {
      shopMap.set(d.storeID, d)
    }
  }

  const stores: StorePriceEntry[] = [...shopMap.values()]
    .map(d => {
      const price      = parseFloat(d.price)
      const retail     = parseFloat(d.retailPrice)
      const savings    = parseFloat(d.savings)
      const discountPct = !isNaN(savings)
        ? (savings <= 1 ? Math.round(savings * 100) : Math.round(savings))
        : retail > 0 ? Math.round((1 - price / retail) * 100) : 0
      const isEpicFree = d.storeID === '25' && price === 0

      return {
        shopId:          d.storeID,
        shopName:        storeName(d.storeID),
        platform:        mapPlatform(d.storeID),
        price:           isNaN(price)  ? 0 : price,
        regularPrice:    isNaN(retail) ? 0 : retail,
        discountPercent: discountPct,
        currency:        'USD',
        url:             storeUrl(d.storeID, d.dealID, info.steamAppID),
        expiry:          null,
        isFree:          price === 0,
        isHistoricalLow: historicalLow !== null && price <= historicalLow * 1.05 && price > 0,
        isEpicFreeGame:  isEpicFree,
      } satisfies StorePriceEntry
    })
    .filter(s => !isNaN(s.price) && s.price >= 0 && s.url)
    .sort((a, b) => a.price - b.price)

  const bestCurrentPrice = stores[0]?.price ?? null
  const bestCurrentStore = stores[0]?.shopName ?? null
  const isCurrentlyFree  = stores.some(s => s.isFree)
  const nearHistoricalLow = historicalLow !== null && bestCurrentPrice !== null
    && bestCurrentPrice > 0 && bestCurrentPrice <= historicalLow * 1.15

  return {
    id: gameID, title: info.title, coverImage, stores,
    historicalLow, bestCurrentPrice, bestCurrentStore,
    isCurrentlyFree, nearHistoricalLow,
  }
}

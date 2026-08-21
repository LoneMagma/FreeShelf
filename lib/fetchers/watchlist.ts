import type { Deal } from '@/types'

/**
 * Watchlist: surfaces popular games that are on sale/free.
 *
 * ITAD /games/prices/v3 returns HTTP 405 on the free tier for both GET and POST.
 * This endpoint requires a paid ITAD plan.
 *
 * Strategy: return empty — the homepage fetches deals from Steam/Epic/GOG/ITAD
 * directly. The watchlist page itself uses useWishlist() + /api/wishlist which
 * cross-references the KV cache. No ITAD price lookup needed here.
 *
 * If you upgrade to ITAD paid tier in the future, re-enable the lookup below.
 */

export async function fetchWatchlistDeals(): Promise<{ freeDeals: Deal[]; saleDeals: Deal[] }> {
  // ITAD /games/prices/v3 is a paid-tier endpoint (405 on free key).
  // Returning empty — homepage deals come from other fetchers.
  console.log('[Watchlist] Skipped — ITAD prices/v3 requires paid tier')
  return { freeDeals: [], saleDeals: [] }
}

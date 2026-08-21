import type { Deal, NormalizedDeal } from '@/types'
import { normalizeDeal } from '@/lib/utils'

/**
 * Merges deals from all sources:
 * — removes expired deals
 * — deduplicates by normalized title
 * — when duplicate found, keeps the one with more metadata
 * — returns NormalizedDeal[] with derived fields (hoursLeft, isExpiringSoon, isFresh)
 */
export function mergeAndNormalizeDeals(allDeals: Deal[][]): NormalizedDeal[] {
  const flat = allDeals.flat()
  const now  = new Date()

  // Strip expired (keep permanent = null endDate)
  const active = flat.filter(d => !d.endDate || new Date(d.endDate) > now)

  // Deduplicate by normalized title
  const seen = new Map<string, Deal>()

  for (const deal of active) {
    const key = deal.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '')
      .replace(/edition$/, '')  // treat "X Edition" and "X" as same game

    if (seen.has(key)) {
      const existing = seen.get(key)!
      if (scoreMetadata(deal) > scoreMetadata(existing)) {
        seen.set(key, { ...deal, id: existing.id })
      }
    } else {
      seen.set(key, deal)
    }
  }

  return Array.from(seen.values()).map(normalizeDeal)
}

function scoreMetadata(deal: Deal): number {
  let score = 0
  if (deal.coverImage)  score += 3
  if (deal.description) score += 2
  if (deal.igdbRating)  score += 2
  if (deal.metacriticScore) score += 1
  if (deal.genres.length > 0 && deal.genres[0] !== 'other') score += 1
  if (deal.developer)   score += 1
  if (deal.endDate)     score += 1  // prefer deals with known expiry
  return score
}

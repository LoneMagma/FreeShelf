import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { differenceInHours, differenceInMinutes, differenceInSeconds, formatDistanceToNow } from 'date-fns'
import type { NormalizedDeal, Deal } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number, currency = 'USD'): string {
  if (price === 0) return 'Free'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price)
}

export function getHoursLeft(endDate: string | null): number | null {
  if (!endDate) return null
  const end = new Date(endDate)
  const now = new Date()
  const hours = differenceInHours(end, now)
  return Math.max(0, hours)
}

export function getTimeLeftLabel(endDate: string | null): string {
  if (!endDate) return 'Permanent'
  const end = new Date(endDate)
  const now = new Date()
  if (end <= now) return 'Expired'

  const hours = differenceInHours(end, now)
  const minutes = differenceInMinutes(end, now)

  if (hours > 48) {
    const days = Math.floor(hours / 24)
    return `${days}d ${hours % 24}h`
  }
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  return `${minutes}m`
}

export type UrgencyLevel = 'safe' | 'warning' | 'danger' | 'permanent'

export function getUrgencyLevel(endDate: string | null): UrgencyLevel {
  if (!endDate) return 'permanent'
  const hours = getHoursLeft(endDate)
  if (hours === null) return 'permanent'
  if (hours <= 6) return 'danger'
  if (hours <= 24) return 'warning'
  return 'safe'
}

export function normalizeDeal(deal: Deal): NormalizedDeal {
  const hoursLeft = getHoursLeft(deal.endDate)
  return {
    ...deal,
    hoursLeft,
    // FIX: threshold raised from 24h → 72h (3 days) so games expiring in ~3 days
    // show up in the "Expiring Soon" tab instead of being invisible.
    isExpiringSoon: hoursLeft !== null && hoursLeft <= 72,
    isFresh: differenceInHours(new Date(), new Date(deal.fetchedAt)) < 6,
  }
}

export function sortDeals(deals: NormalizedDeal[], sort: string): NormalizedDeal[] {
  return [...deals].sort((a, b) => {
    switch (sort) {
      case 'expiry':
        if (a.endDate === null) return 1
        if (b.endDate === null) return -1
        return new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
      case 'value':
        return b.originalPrice - a.originalPrice
      case 'newest':
        return new Date(b.fetchedAt).getTime() - new Date(a.fetchedAt).getTime()
      case 'rating': {
        const ratingA = a.igdbRating ?? a.metacriticScore ?? 0
        const ratingB = b.igdbRating ?? b.metacriticScore ?? 0
        return ratingB - ratingA
      }
      default:
        return 0
    }
  })
}

export function filterDeals(
  deals: NormalizedDeal[],
  filters: {
    platforms: string[]
    genres: string[]
    dealTypes: string[]
    search: string
  }
): NormalizedDeal[] {
  if (!deals || !Array.isArray(deals)) return []
  return deals.filter((deal) => {
    if (filters.platforms.length > 0 && !filters.platforms.includes(deal.platform)) return false

    if (filters.genres.length > 0) {
      // FIX: When a genre filter is active, exclude unclassified ('other') deals entirely.
      // Previously they always passed through, making the genre filter feel broken
      // (clicking "Action" showed everything because most Steam deals have genres:['other']).
      const hasRealGenres = deal.genres.some(g => g !== 'other')
      if (!hasRealGenres) return false
      if (!deal.genres.some(g => filters.genres.includes(g))) return false
    }

    if (filters.dealTypes.length > 0 && !filters.dealTypes.includes(deal.dealType)) return false

    if (filters.search) {
      const q = filters.search.toLowerCase()
      if (!deal.title.toLowerCase().includes(q)) return false
    }

    return true
  })
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export function timeAgo(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

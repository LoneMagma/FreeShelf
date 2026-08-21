export type Platform =
  | 'epic'
  | 'gog'
  | 'steam'
  | 'prime'
  | 'humble'
  | 'itch'
  | 'fanatical'
  | 'gamesplanet'
  | 'dlgamer'
  | 'gmg'
  | 'gamesload'
  | 'newegg'
  | 'other'

export type DealType = 'timed-free' | 'permanent-free' | 'free-weekend' | 'sale'

export type Genre =
  | 'action'
  | 'adventure'
  | 'rpg'
  | 'strategy'
  | 'simulation'
  | 'puzzle'
  | 'platformer'
  | 'shooter'
  | 'horror'
  | 'sports'
  | 'racing'
  | 'indie'
  | 'other'

export type SortOption = 'expiry' | 'value' | 'newest' | 'rating'

export interface Deal {
  id: string
  title: string
  platform: Platform
  originalPrice: number
  currentPrice: number
  discountPercent?: number
  currency: string
  coverImage: string
  blurImage?: string
  claimUrl: string
  startDate: string
  endDate: string | null
  dealType: DealType
  genres: Genre[]
  description?: string
  metacriticScore?: number
  igdbRating?: number
  developer?: string
  publisher?: string
  fetchedAt: string
}

export interface NormalizedDeal extends Deal {
  hoursLeft: number | null
  isExpiringSoon: boolean   // < 72h
  isFresh: boolean          // added < 6h ago
}

export interface FilterState {
  platforms: Platform[]
  genres: Genre[]
  dealTypes: DealType[]
  sort: SortOption
  search: string
}

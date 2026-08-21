import type { Genre } from '@/types'

export interface GenreMeta {
  label: string
  slug: string
  icon: string
}

export const GENRES: Record<Genre, GenreMeta> = {
  action: { label: 'Action', slug: 'action', icon: '⚔️' },
  adventure: { label: 'Adventure', slug: 'adventure', icon: '🗺️' },
  rpg: { label: 'RPG', slug: 'rpg', icon: '🧙' },
  strategy: { label: 'Strategy', slug: 'strategy', icon: '♟️' },
  simulation: { label: 'Simulation', slug: 'simulation', icon: '🏗️' },
  puzzle: { label: 'Puzzle', slug: 'puzzle', icon: '🧩' },
  platformer: { label: 'Platformer', slug: 'platformer', icon: '🏃' },
  shooter: { label: 'Shooter', slug: 'shooter', icon: '🎯' },
  horror: { label: 'Horror', slug: 'horror', icon: '👻' },
  sports: { label: 'Sports', slug: 'sports', icon: '⚽' },
  racing: { label: 'Racing', slug: 'racing', icon: '🏎️' },
  indie: { label: 'Indie', slug: 'indie', icon: '💡' },
  other: { label: 'Other', slug: 'other', icon: '🎲' },
}

export const GENRE_LIST = Object.entries(GENRES).map(([key, val]) => ({
  value: key as Genre,
  ...val,
}))

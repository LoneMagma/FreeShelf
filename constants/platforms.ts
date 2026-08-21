import type { Platform } from '@/types'

export interface PlatformMeta {
  label: string
  color: string
  bgClass: string
  textClass: string
  borderClass: string
  icon: string
  url: string
  isReseller?: boolean   // true = shown in reseller section, excluded from filter bar
  showInFilter?: boolean // false = hidden from platform filter tabs
}

export const PLATFORMS: Record<Platform, PlatformMeta> = {
  // ── Trusted first-party ─────────────────────────────────────────────
  epic: {
    label: 'Epic Games', color: '#2563EB',
    bgClass: 'bg-blue-600/15', textClass: 'text-blue-400', borderClass: 'border-blue-500/30',
    icon: '⚡', url: 'https://store.epicgames.com', showInFilter: true,
  },
  gog: {
    label: 'GOG', color: '#8B5CF6',
    bgClass: 'bg-violet-600/15', textClass: 'text-violet-400', borderClass: 'border-violet-500/30',
    icon: '🌌', url: 'https://www.gog.com', showInFilter: true,
  },
  steam: {
    label: 'Steam', color: '#0EA5E9',
    bgClass: 'bg-sky-600/15', textClass: 'text-sky-400', borderClass: 'border-sky-500/30',
    icon: '♨️', url: 'https://store.steampowered.com', showInFilter: true,
  },
  prime: {
    label: 'Prime Gaming', color: '#F59E0B',
    bgClass: 'bg-amber-500/15', textClass: 'text-amber-400', borderClass: 'border-amber-500/30',
    icon: '👑', url: 'https://gaming.amazon.com', showInFilter: true,
  },
  humble: {
    label: 'Humble Bundle', color: '#EF4444',
    bgClass: 'bg-red-500/15', textClass: 'text-red-400', borderClass: 'border-red-500/30',
    icon: '🎁', url: 'https://www.humblebundle.com', showInFilter: true,
  },
  itch: {
    label: 'itch.io', color: '#EC4899',
    bgClass: 'bg-pink-600/15', textClass: 'text-pink-400', borderClass: 'border-pink-500/30',
    icon: '🎮', url: 'https://itch.io', showInFilter: true,
  },
  fanatical: {
    label: 'Fanatical', color: '#10B981',
    bgClass: 'bg-emerald-600/15', textClass: 'text-emerald-400', borderClass: 'border-emerald-500/30',
    icon: '🔥', url: 'https://www.fanatical.com', showInFilter: true,
  },

  // ── Reseller storefronts ─────────────────────────────────────────────
  // Legitimate but third-party. showInFilter: false keeps them out of the
  // platform filter bar so they don't sit next to Steam/Epic as equals.
  gamesplanet: {
    label: 'GamesPlanet', color: '#D97706',
    bgClass: 'bg-amber-600/15', textClass: 'text-amber-400', borderClass: 'border-amber-500/40',
    icon: '🪐', url: 'https://www.gamesplanet.com',
    isReseller: true, showInFilter: false,
  },
  dlgamer: {
    label: 'DLGamer', color: '#D97706',
    bgClass: 'bg-amber-600/15', textClass: 'text-amber-400', borderClass: 'border-amber-500/40',
    icon: '📥', url: 'https://www.dlgamer.com',
    isReseller: true, showInFilter: false,
  },
  gmg: {
    label: 'Green Man Gaming', color: '#16A34A',
    bgClass: 'bg-green-700/15', textClass: 'text-green-400', borderClass: 'border-green-600/40',
    icon: '♟', url: 'https://www.greenmangaming.com',
    isReseller: true, showInFilter: false,
  },
  gamesload: {
    label: 'Gamesload', color: '#D97706',
    bgClass: 'bg-amber-600/15', textClass: 'text-amber-400', borderClass: 'border-amber-500/40',
    icon: '📦', url: 'https://www.gamesload.com',
    isReseller: true, showInFilter: false,
  },
  newegg: {
    label: 'Newegg', color: '#EA580C',
    bgClass: 'bg-orange-600/15', textClass: 'text-orange-400', borderClass: 'border-orange-500/40',
    icon: '🥚', url: 'https://www.newegg.com',
    isReseller: true, showInFilter: false,
  },

  other: {
    label: 'Other', color: '#6B7280',
    bgClass: 'bg-gray-600/15', textClass: 'text-gray-400', borderClass: 'border-gray-500/30',
    icon: '🎯', url: '#', showInFilter: false,
  },
}

export function isResellerPlatform(platform: Platform): boolean {
  return !!PLATFORMS[platform]?.isReseller
}

'use client'

import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PLATFORMS } from '@/constants/platforms'
import type { FilterState, Platform } from '@/types'

interface FilterBarProps {
  filters:   FilterState
  onChange:  (filters: FilterState) => void
  freeCount: number
  saleCount: number
}

export default function FilterBar({ filters, onChange, freeCount, saleCount }: FilterBarProps) {
  const hasActivePlatform = filters.platforms.length > 0
  const hasSearch         = filters.search.length > 0
  const hasAnyFilter      = hasActivePlatform || hasSearch

  const filterablePlatforms = (
    Object.entries(PLATFORMS) as [Platform, typeof PLATFORMS[Platform]][]
  ).filter(([key, meta]) => key !== 'other' && meta.showInFilter === true)

  function togglePlatform(p: Platform) {
    const next = filters.platforms.includes(p)
      ? filters.platforms.filter(x => x !== p)
      : [...filters.platforms, p]
    onChange({ ...filters, platforms: next })
  }

  function clearAll() {
    onChange({ ...filters, platforms: [], genres: [], dealTypes: [], search: '' })
  }

  return (
    <div className="border-b border-theme" style={{ backgroundColor: 'var(--surface)', position: 'relative', zIndex: 40 }}>

      {/* Platform tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-1 pt-2 overflow-x-auto scrollbar-hide" style={{ msOverflowStyle: 'none' }}>
          <button
            onClick={() => onChange({ ...filters, platforms: [] })}
            className={cn(
              'px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-all duration-150 whitespace-nowrap',
              filters.platforms.length === 0
                ? 'border-[var(--accent)] text-accent'
                : 'border-transparent text-muted hover:text-primary',
            )}
          >
            All Platforms
          </button>

          {filterablePlatforms.map(([key, meta]) => {
            const isActive = filters.platforms.includes(key)
            return (
              <button
                key={key}
                onClick={() => togglePlatform(key)}
                className={cn(
                  'px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-all duration-150 whitespace-nowrap',
                  isActive
                    ? 'border-[var(--accent)] text-primary'
                    : 'border-transparent text-muted hover:text-primary hover:border-[var(--border-hover)]',
                )}
                style={isActive ? { borderColor: meta.color, color: meta.color } : {}}
              >
                {meta.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Status bar */}
      <div className="border-t border-theme" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {hasSearch && (
              <span className="text-[11px] text-muted">
                Searching: <span className="font-semibold text-primary">"{filters.search}"</span>
              </span>
            )}
            {!hasSearch && hasActivePlatform && (
              <span className="text-[11px] text-muted">Platform filtered</span>
            )}
            {!hasAnyFilter && (
              <span className="text-[11px] text-muted hidden sm:block">All stores · Updated hourly</span>
            )}
            {hasAnyFilter && (
              <button
                onClick={clearAll}
                className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-primary transition-colors"
              >
                <X size={11} /> Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {freeCount > 0 && (
              <span className="flex items-center gap-1.5 text-[11px] font-semibold">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: 'var(--free-color)' }} />
                <span style={{ color: 'var(--free-color)' }}>{freeCount} free</span>
              </span>
            )}
            {freeCount > 0 && saleCount > 0 && <span className="text-muted text-[11px]">·</span>}
            {saleCount > 0 && (
              <span className="flex items-center gap-1.5 text-[11px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                <span className="text-orange-400">{saleCount} on sale</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

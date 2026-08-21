'use client'

import { useState, useMemo } from 'react'
import Header            from '@/components/layout/Header'
import Footer            from '@/components/layout/Footer'
import FilterBar         from '@/components/filters/FilterBar'
import DealGrid          from '@/components/deals/DealGrid'
import SectionTabs, { type SectionTab } from '@/components/deals/SectionTabs'
import NextDropCountdown from '@/components/deals/NextDropCountdown'
import { useWishlist }   from '@/hooks/useWishlist'
import { sortDeals, filterDeals } from '@/lib/utils'
import type { FilterState, NormalizedDeal } from '@/types'
import { Gift, Flame, Search } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────

interface HomeClientProps {
  free:         NormalizedDeal[]
  flash:        NormalizedDeal[]
  sale:         NormalizedDeal[]
  lastFetched:  string | null
}

const DEFAULT_FILTERS: FilterState = {
  platforms: [], genres: [], dealTypes: [], sort: 'expiry', search: '',
}

// ── Main ──────────────────────────────────────────────────────────────

export default function HomeClient({
  free = [], flash = [], sale = [], lastFetched,
}: HomeClientProps) {
  const [filters,   setFilters]   = useState<FilterState>(DEFAULT_FILTERS)
  const [activeTab, setActiveTab] = useState<SectionTab>('all')
  const { wishlistedIds, toggle: toggleWishlist } = useWishlist()

  const isSearching = filters.search.length > 0
  const noFreeGames = free.length === 0

  // Format last updated for header
  const lastUpdated = lastFetched
    ? `updated ${new Date(lastFetched).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    : undefined

  // ── Free deals ────────────────────────────────────────────────────

  const filteredFree = useMemo(
    () => sortDeals(filterDeals(free, filters), filters.sort),
    [free, filters],
  )

  const expiringSoon = useMemo(
    () => filteredFree.filter(d => d.isExpiringSoon && d.endDate !== null),
    [filteredFree],
  )

  const newThisWeek = useMemo(
    () => filteredFree.filter(d => d.isFresh),
    [filteredFree],
  )

  const tabCounts = {
    expiring: expiringSoon.length,
    hot:      newThisWeek.length,   // repurposed: "New" tab uses the hot slot
    trending: 0,
    all:      filteredFree.length,
  }

  // Auto-redirect to all if selected tab is empty
  const safeTab: SectionTab =
    tabCounts[activeTab] === 0 && tabCounts.all > 0 ? 'all' : activeTab

  const visibleFreeDeals = useMemo(() => {
    switch (safeTab) {
      case 'expiring': return expiringSoon
      case 'hot':      return newThisWeek
      default:         return filteredFree
    }
  }, [safeTab, expiringSoon, newThisWeek, filteredFree])

  // ── Sale deals ────────────────────────────────────────────────────
  // Platform filter applies; search applies; no sort (already curated by cron)

  const filteredSale = useMemo(() => {
    if (!filters.platforms.length && !filters.search) return sale
    return sale.filter(d => {
      if (filters.platforms.length && !filters.platforms.includes(d.platform)) return false
      if (filters.search && !d.title.toLowerCase().includes(filters.search.toLowerCase())) return false
      return true
    })
  }, [sale, filters.platforms, filters.search])

  const totalVisible = filteredFree.length + filteredSale.length

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        onSearch={q => setFilters(f => ({ ...f, search: q }))}
        lastUpdated={lastUpdated}
      />

      <FilterBar
        filters={filters}
        onChange={setFilters}
        freeCount={filteredFree.length}
        saleCount={filteredSale.length}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6">

        {/* ── Hero ── */}
        <section className="text-center py-10 sm:py-12">
          <h1 className="font-display font-bold tracking-tight mb-3">
            <span className="block text-4xl sm:text-5xl text-primary leading-tight">Free Games</span>
            <span className="block text-3xl sm:text-4xl leading-tight mt-1" style={{ color: 'var(--free-color)' }}>
              Click · Claim · Play
            </span>
          </h1>
          <p className="text-secondary text-sm max-w-sm mx-auto mt-3">
            {noFreeGames
              ? 'No free games at the moment — check back soon.'
              : `${free.length} paid title${free.length !== 1 ? 's' : ''} free right now across Epic, GOG, Steam, Prime & more.`}
          </p>
        </section>

        {/* ── Search result status ── */}
        {isSearching && totalVisible === 0 && (
          <div className="flex items-center gap-3 mb-8 px-4 py-3 rounded-xl border border-theme bg-surface">
            <Search size={14} className="text-muted shrink-0" />
            <p className="text-sm text-secondary">
              No results for <span className="text-primary font-semibold">"{filters.search}"</span> — try a different title.
            </p>
          </div>
        )}
        {isSearching && totalVisible > 0 && (
          <div className="flex items-center gap-2 mb-6 text-xs text-muted">
            <Search size={11} className="shrink-0" />
            <span>
              {totalVisible} result{totalVisible !== 1 ? 's' : ''} for{' '}
              <span className="text-primary font-medium">"{filters.search}"</span>
            </span>
          </div>
        )}

        {/* ── Free Right Now ── */}
        {noFreeGames ? (
          <div className="pb-10"><NextDropCountdown /></div>
        ) : (
          <section className="pb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg border border-theme bg-surface flex items-center justify-center">
                <Gift size={14} className="text-free" />
              </div>
              <div>
                <h2 className="font-display font-bold text-xl text-primary">Free Right Now</h2>
                <p className="text-xs text-muted mt-0.5">Claim before they expire — no purchase required</p>
              </div>
            </div>

            <SectionTabs active={safeTab} onChange={setActiveTab} counts={tabCounts} />

            <div className="py-8">
              <DealGrid
                deals={visibleFreeDeals}
                wishlistedIds={wishlistedIds}
                onWishlistToggle={toggleWishlist}
                animKey={safeTab}
              />
            </div>
          </section>
        )}

        {/* ── On Sale ── */}
        {filteredSale.length > 0 && (
          <section className="pb-16 border-t border-theme pt-10">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg border border-theme bg-surface flex items-center justify-center">
                  <Flame size={14} className="text-orange-400" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-xl text-primary">On Sale</h2>
                  <p className="text-xs text-muted mt-0.5">Handpicked deals — 70% off or more</p>
                </div>
              </div>
              <span className="text-[11px] border border-orange-500/30 bg-orange-500/10 text-orange-400 px-2.5 py-1 rounded-full font-medium shrink-0">
                {filteredSale.length} deals
              </span>
            </div>

            <DealGrid
              deals={filteredSale}
              wishlistedIds={wishlistedIds}
              onWishlistToggle={toggleWishlist}
            />
          </section>
        )}

      </main>

      <Footer />
    </div>
  )
}

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Image from 'next/image'
import {
  Search, ExternalLink, TrendingDown, AlertCircle,
  Heart, ChevronDown, ChevronUp, Loader2, ShieldAlert,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWishlist } from '@/hooks/useWishlist'
import type { SearchResult, GamePriceData, StorePriceEntry } from '@/lib/fetchers/search'
import PlatformBadge from '@/components/deals/PlatformBadge'
import { isResellerPlatform, PLATFORMS } from '@/constants/platforms'
import type { Platform } from '@/types'

function formatPrice(amount: number, currency = 'USD'): string {
  if (amount === 0) return 'FREE'
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
  } catch {
    return `$${amount.toFixed(2)}`
  }
}

function useDebounce<T extends (...args: Parameters<T>) => void>(fn: T, delay: number): T {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const fnRef  = useRef(fn)
  fnRef.current = fn
  return useCallback((...args: Parameters<T>) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => fnRef.current(...args), delay)
  }, [delay]) as T
}

// ── Search autocomplete box ────────────────────────────────────────────

function SearchBox({ onSelect }: { onSelect: (r: SearchResult) => void }) {
  const [query, setQuery]      = useState('')
  const [suggestions, setSugs] = useState<SearchResult[]>([])
  const [loading, setLoading]  = useState(false)
  const [open, setOpen]        = useState(false)
  const containerRef           = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setSugs([]); setOpen(false); return }
    setLoading(true)
    try {
      const res  = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      const results: SearchResult[] = (data.results ?? []).filter(
        (r: SearchResult) => r.type !== 'dlc',
      )
      setSugs(results)
      setOpen(results.length > 0)
    } catch {
      setSugs([])
    } finally {
      setLoading(false)
    }
  }, [])

  const debouncedSearch = useDebounce(doSearch, 350)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setQuery(v)
    debouncedSearch(v)
  }

  function handleSelect(r: SearchResult) {
    setQuery(r.title)
    setOpen(false)
    setSugs([])
    onSelect(r)
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        {loading && (
          <Loader2 size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted animate-spin pointer-events-none" />
        )}
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="Search any game — Hollow Knight, GTA V, Elden Ring…"
          autoFocus
          className={cn(
            'w-full h-12 pl-11 pr-12 rounded-xl text-sm',
            'bg-surface border border-theme',
            'text-primary placeholder:text-muted',
            'focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15',
            'transition-all duration-150',
          )}
        />
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute top-full left-0 right-0 mt-1.5 rounded-xl border border-theme bg-surface shadow-2xl z-50 overflow-hidden">
          {suggestions.map(r => (
            <li key={r.id}>
              <button
                onMouseDown={e => { e.preventDefault(); handleSelect(r) }}
                className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-surface-hover transition-colors"
              >
                {r.assets?.boxart ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.assets.boxart} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded bg-surface-hover shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-primary truncate">{r.title}</p>
                  <p className="text-[11px] text-muted capitalize">{r.type}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Single store row in the price panel ───────────────────────────────

function StoreRow({ store }: { store: StorePriceEntry }) {
  const platform   = (store.platform || 'other') as Platform
  const isReseller = isResellerPlatform(platform)

  return (
    <a
      href={store.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl border transition-all group',
        store.isFree
          ? 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10'
          : store.isHistoricalLow
          ? 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10'
          : isReseller
          ? 'border-amber-500/20 bg-amber-500/3 hover:bg-amber-500/8'
          : 'border-theme bg-surface hover:bg-surface-hover',
      )}
    >
      <div className="shrink-0">
        <PlatformBadge platform={platform} showLabel={false} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-primary truncate">{store.shopName}</p>
          {isReseller && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-amber-400/70 border border-amber-500/30 rounded px-1 py-px shrink-0">
              <ShieldAlert size={7} />
              3rd party
            </span>
          )}
        </div>
        {store.expiry && (
          <p className="text-[11px] text-muted">
            Ends {new Date(store.expiry).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {store.isHistoricalLow && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500">
            <TrendingDown size={9} /> HIST LOW
          </span>
        )}
        {store.isFree && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500">
            FREE
          </span>
        )}
        {store.discountPercent > 0 && !store.isFree && (
          <span className={cn(
            'text-[11px] font-bold',
            isReseller ? 'text-amber-400' : 'text-emerald-400',
          )}>
            -{store.discountPercent}%
          </span>
        )}
      </div>

      <div className="text-right shrink-0 min-w-[64px]">
        <p className={cn('text-sm font-bold', store.isFree ? 'text-emerald-400' : 'text-primary')}>
          {formatPrice(store.price, store.currency)}
        </p>
        {store.regularPrice > 0 && store.regularPrice !== store.price && (
          <p className="text-[11px] text-muted line-through">
            {formatPrice(store.regularPrice, store.currency)}
          </p>
        )}
      </div>

      <ExternalLink
        size={13}
        className="text-muted shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </a>
  )
}

// ── Game price panel ──────────────────────────────────────────────────
// Accepts only gameId (CheapShark gameID integer string).
// Title and cover image come back in the API response.

function GamePricePanel({ gameId }: { gameId: string }) {
  const [data, setData]       = useState<GamePriceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)
  const [showAll, setShowAll] = useState(false)
  const { toggle, wishlistedIds } = useWishlist()

  useEffect(() => {
    setLoading(true)
    setError(false)
    setData(null)
    setShowAll(false)

    fetch(`/api/search?id=${encodeURIComponent(gameId)}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(d => {
        if (d?.error) throw new Error(d.error)
        setData(d)
      })
      .catch(err => {
        console.error('[GamePricePanel]', err)
        setError(true)
      })
      .finally(() => setLoading(false))
  }, [gameId])

  const wishId = `search-${gameId}`

  if (loading) {
    return (
      <div className="rounded-2xl border border-theme bg-surface p-8 flex items-center justify-center gap-3 text-muted">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">Looking up prices across all stores…</span>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-theme bg-surface p-6">
        <div className="flex items-center gap-3 text-muted mb-3">
          <AlertCircle size={16} className="text-amber-400" />
          <span className="text-sm font-medium text-primary">Could not load price data</span>
        </div>
        <p className="text-xs text-muted ml-7">
          CheapShark may not track this game yet.
          Try on{' '}
          <a
            href="https://www.cheapshark.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            cheapshark.com
          </a>{' '}
          directly.
        </p>
      </div>
    )
  }

  const topStores    = showAll ? data.stores : data.stores.slice(0, 6)
  const hasMore      = data.stores.length > 6
  const hasResellers = data.stores.some(s => isResellerPlatform(s.platform as Platform))

  return (
    <div className="rounded-2xl border border-theme bg-surface overflow-visible">
      {/* Game header */}
      <div className="flex gap-4 p-5 border-b border-theme">
        {data.coverImage && (
          <div className="relative w-28 h-16 rounded-lg overflow-hidden bg-surface-hover shrink-0">
            <Image
              src={data.coverImage}
              alt={data.title}
              fill
              className="object-cover"
              unoptimized
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h2 className="font-display font-bold text-lg text-primary leading-tight">
              {data.title}
            </h2>
            <button
              onClick={() => toggle(wishId)}
              title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
              className={cn(
                'p-1.5 rounded-lg border transition-all shrink-0',
                wishlistedIds.has(wishId)
                  ? 'border-red-500/40 bg-red-500/10 text-red-400'
                  : 'border-theme text-muted hover:text-primary',
              )}
            >
              <Heart size={14} className={wishlistedIds.has(wishId) ? 'fill-current' : ''} />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {data.isCurrentlyFree && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500">
                FREE NOW
              </span>
            )}
            {data.nearHistoricalLow && !data.isCurrentlyFree && (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500">
                <TrendingDown size={10} /> Near Historical Low
              </span>
            )}
            {data.bestCurrentPrice !== null && (
              <span className="text-xs text-muted">
                Best:{' '}
                <strong className="text-primary">{formatPrice(data.bestCurrentPrice)}</strong>
                {data.bestCurrentStore && <span> on {data.bestCurrentStore}</span>}
              </span>
            )}
            {data.historicalLow !== null && data.historicalLow > 0 && (
              <span className="text-xs text-muted">
                All-time low: <strong>{formatPrice(data.historicalLow)}</strong>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Store list */}
      <div className="p-4 space-y-2">
        {data.stores.length === 0 ? (
          <p className="text-sm text-muted text-center py-6">
            No current deals found for this game.
          </p>
        ) : (
          <>
            <p className="text-xs text-muted mb-3">
              {data.stores.length} store{data.stores.length !== 1 ? 's' : ''} — sorted by price
            </p>
            {topStores.map(store => (
              <StoreRow key={`${store.shopId}-${store.url}`} store={store} />
            ))}
            {hasMore && (
              <button
                onClick={() => setShowAll(v => !v)}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-xs text-muted hover:text-primary transition-colors border-t border-theme mt-2 pt-3"
              >
                {showAll ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                {showAll ? 'Show fewer' : `Show ${data.stores.length - 6} more stores`}
              </button>
            )}
            {hasResellers && (
              <div className="flex items-start gap-2 pt-3 mt-2 border-t border-theme">
                <ShieldAlert size={11} className="text-amber-400/60 shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted/60 leading-relaxed">
                  Stores marked{' '}
                  <span className="text-amber-400/70">3rd party</span> are legitimate reseller
                  storefronts, not publisher-direct. G2A and key-resellers are excluded.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Page root ─────────────────────────────────────────────────────────

export default function SearchClient() {
  const [selected, setSelected] = useState<SearchResult | null>(null)

  return (
    <div className="space-y-6">
      <SearchBox onSelect={setSelected} />

      {!selected && (
        <div className="text-center py-16">
          <Search size={32} className="mx-auto mb-4 text-muted opacity-30" />
          <p className="text-sm text-muted">Type a game title to compare prices across all stores</p>
          <p className="text-xs text-muted mt-1 opacity-70">
            Powered by CheapShark — 30+ stores tracked including Steam, GOG, Epic, Humble, Fanatical
          </p>
        </div>
      )}

      {selected && <GamePricePanel gameId={selected.id} />}
    </div>
  )
}

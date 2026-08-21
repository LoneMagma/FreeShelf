'use client'

import { useState }        from 'react'
import Image               from 'next/image'
import {
  ExternalLink, Heart, Star, TrendingDown,
  ChevronDown, ChevronUp, ShieldAlert, Infinity,
} from 'lucide-react'
import { cn }              from '@/lib/utils'
import { useWishlist }     from '@/hooks/useWishlist'
import { isResellerPlatform, PLATFORMS } from '@/constants/platforms'
import PlatformBadge       from '@/components/deals/PlatformBadge'
import type { GameDetailData, GameDetailStore } from '@/lib/fetchers/cheapshark'
import type { Platform }   from '@/types'

// ── Formatting helpers ────────────────────────────────────────────────

function fmt(price: number): string {
  if (price === 0) return 'FREE'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
}

function fmtDate(unix: number): string {
  return new Date(unix * 1000).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function steamRatingLabel(pct: number): { label: string; color: string } {
  if (pct >= 95) return { label: 'Overwhelmingly Positive', color: 'text-emerald-400' }
  if (pct >= 85) return { label: 'Very Positive',           color: 'text-emerald-400' }
  if (pct >= 80) return { label: 'Mostly Positive',         color: 'text-emerald-400' }
  if (pct >= 70) return { label: 'Mixed',                   color: 'text-amber-400'   }
  if (pct >= 40) return { label: 'Mostly Negative',         color: 'text-red-400'     }
  return              { label: 'Overwhelmingly Negative',   color: 'text-red-400'     }
}

// ── Price comparison bar chart ─────────────────────────────────────────
// Pure CSS — no chart library needed. Bars are proportional to price.

function PriceChart({ stores }: { stores: GameDetailStore[] }) {
  // Use the highest retail price as the 100% baseline so we show both
  // the bar (current price) and implicitly how much has been cut.
  const priceStores   = stores.filter(s => !s.isFree)
  const maxRetail     = Math.max(...priceStores.map(s => s.retailPrice), 0)
  const maxBar        = maxRetail > 0 ? maxRetail : Math.max(...priceStores.map(s => s.price), 1)

  if (stores.length === 0) return null

  return (
    <div className="space-y-2.5">
      {stores.map((store, i) => {
        const isFirst    = i === 0 && !store.isFree
        const barPct     = store.isFree ? 0 : maxBar > 0 ? (store.price / maxBar) * 100 : 0
        const retailPct  = maxBar > 0 ? (store.retailPrice / maxBar) * 100 : 100
        const isReseller = isResellerPlatform(store.platform as Platform)

        return (
          <div key={store.storeID} className="flex items-center gap-3 group">
            {/* Store label */}
            <div className="w-28 shrink-0 text-right">
              <span className={cn(
                'text-[11px] font-medium truncate block',
                isFirst ? 'text-primary' : 'text-muted',
              )}>
                {store.storeName}
              </span>
            </div>

            {/* Bar track */}
            <div className="flex-1 h-5 bg-surface-hover rounded-full overflow-hidden relative">
              {store.isFree ? (
                /* Free — full green bar */
                <div className="absolute inset-0 rounded-full bg-emerald-500/30 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-emerald-400">FREE</span>
                </div>
              ) : (
                <>
                  {/* Retail-price ghost bar */}
                  <div
                    className="absolute left-0 top-0 h-full rounded-full bg-surface"
                    style={{ width: `${retailPct}%` }}
                  />
                  {/* Current-price bar */}
                  <div
                    className={cn(
                      'absolute left-0 top-0 h-full rounded-full transition-all duration-500',
                      isFirst
                        ? 'bg-accent'
                        : isReseller
                        ? 'bg-amber-500/50'
                        : 'bg-surface-elevated',
                    )}
                    style={{ width: `${barPct}%` }}
                  />
                </>
              )}
            </div>

            {/* Price + discount */}
            <div className="w-24 shrink-0 flex items-center justify-end gap-1.5">
              {!store.isFree && store.savings > 0 && (
                <span className={cn(
                  'text-[10px] font-bold',
                  isReseller ? 'text-amber-400' : 'text-emerald-400',
                )}>
                  -{store.savings}%
                </span>
              )}
              <span className={cn(
                'text-xs font-bold tabular-nums',
                store.isFree ? 'text-emerald-400' : isFirst ? 'text-primary' : 'text-secondary',
              )}>
                {fmt(store.price)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Individual store row ───────────────────────────────────────────────

function StoreRow({ store, cheapestEverPrice }: { store: GameDetailStore; cheapestEverPrice: number | null }) {
  const isReseller     = isResellerPlatform(store.platform as Platform)
  const isHistLow      = cheapestEverPrice !== null && store.price <= cheapestEverPrice * 1.05 && !store.isFree

  return (
    <a
      href={store.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl border transition-all group',
        store.isFree
          ? 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10'
          : isHistLow
          ? 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10'
          : isReseller
          ? 'border-amber-500/20 hover:bg-amber-500/5'
          : 'border-theme bg-surface hover:bg-surface-hover',
      )}
    >
      <div className="shrink-0">
        <PlatformBadge platform={store.platform as Platform} showLabel={false} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-primary truncate">{store.storeName}</p>
          {isReseller && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-amber-400/70 border border-amber-500/30 rounded px-1 py-px shrink-0">
              <ShieldAlert size={7} />
              3rd party
            </span>
          )}
        </div>
        {store.retailPrice > 0 && store.retailPrice !== store.price && (
          <p className="text-[11px] text-muted">
            Was{' '}
            <span className="line-through">{fmt(store.retailPrice)}</span>
          </p>
        )}
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 shrink-0">
        {isHistLow && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500">
            <TrendingDown size={9} /> HIST LOW
          </span>
        )}
        {store.isFree && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500">
            FREE
          </span>
        )}
        {store.savings > 0 && !store.isFree && (
          <span className={cn(
            'text-[11px] font-bold',
            isReseller ? 'text-amber-400' : 'text-emerald-400',
          )}>
            -{store.savings}%
          </span>
        )}
      </div>

      {/* Price */}
      <div className="text-right shrink-0 min-w-[64px]">
        <p className={cn(
          'text-sm font-bold',
          store.isFree ? 'text-emerald-400' : 'text-primary',
        )}>
          {fmt(store.price)}
        </p>
      </div>

      <ExternalLink
        size={13}
        className="text-muted shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </a>
  )
}

// ── Main client component ─────────────────────────────────────────────

interface Props { data: GameDetailData }

export default function GameDetailClient({ data }: Props) {
  const [showAllStores, setShowAllStores] = useState(false)
  const { toggle, wishlistedIds } = useWishlist()

  const wishId     = `game-${data.gameID}`
  const isWishlisted = wishlistedIds.has(wishId)
  const isFreeAnywhere = data.stores.some(s => s.isFree)
  const bestStore  = data.stores[0]  // already sorted cheapest first
  const cheapestEverPrice = data.cheapestEver?.price ?? null

  // Reseller disclaimer only if resellers are present
  const hasResellers = data.stores.some(s => isResellerPlatform(s.platform as Platform))

  // Near all-time low: best current price ≤ 115% of historical low
  const nearHistoricalLow =
    cheapestEverPrice !== null &&
    bestStore &&
    !bestStore.isFree &&
    bestStore.price <= cheapestEverPrice * 1.15

  // Chart shows first 8 stores (all unique stores up to 8)
  const chartStores = data.stores.slice(0, 8)

  // Store list: show 5 collapsed, all expanded
  const COLLAPSE_AT   = 5
  const visibleStores = showAllStores ? data.stores : data.stores.slice(0, COLLAPSE_AT)
  const hasMore       = data.stores.length > COLLAPSE_AT

  return (
    <div className="space-y-6">

      {/* ── Hero card ────────────────────────────────────────────── */}
      <div className="relative rounded-2xl border border-theme overflow-hidden bg-surface">

        {/* Blurred cover wash */}
        {data.coverImage && (
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:    `url(${data.coverImage})`,
              backgroundSize:     'cover',
              backgroundPosition: 'center',
              filter:             'blur(24px) saturate(1.5)',
            }}
          />
        )}

        <div className="relative z-10 flex flex-col sm:flex-row gap-6 p-6">

          {/* Cover image */}
          {data.coverImage && (
            <div className="relative shrink-0 w-full sm:w-52 aspect-video sm:aspect-auto sm:h-32 rounded-xl overflow-hidden bg-surface-hover">
              <Image
                src={data.coverImage}
                alt={data.title}
                fill
                className="object-cover"
                priority
                unoptimized
              />
            </div>
          )}

          {/* Title + metadata */}
          <div className="flex-1 min-w-0 flex flex-col justify-between gap-4">
            <div>
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary leading-tight mb-2">
                {data.title}
              </h1>

              {/* Rating badges */}
              <div className="flex flex-wrap items-center gap-2">
                {data.metacriticScore !== undefined && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400">
                    <Star size={10} className="fill-current" />
                    {data.metacriticScore} Metacritic
                  </span>
                )}
                {data.steamRatingPercent !== undefined && (() => {
                  const { label, color } = steamRatingLabel(data.steamRatingPercent)
                  return (
                    <span className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-md border border-theme bg-surface',
                      color,
                    )}>
                      {label}
                      {data.steamRatingCount !== undefined && data.steamRatingCount > 0 && (
                        <span className="text-muted font-normal ml-1">
                          ({data.steamRatingCount.toLocaleString()})
                        </span>
                      )}
                    </span>
                  )
                })()}
              </div>
            </div>

            {/* Price summary + wishlist */}
            <div className="flex items-end justify-between gap-4">
              <div className="space-y-1">
                {/* Current best price */}
                {isFreeAnywhere ? (
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-2xl text-emerald-400">FREE</span>
                    <span className="text-xs text-muted">on {data.stores.filter(s => s.isFree).length} store{data.stores.filter(s => s.isFree).length !== 1 ? 's' : ''}</span>
                  </div>
                ) : bestStore ? (
                  <div className="flex items-baseline gap-2">
                    <span className="font-display font-bold text-2xl text-primary">
                      {fmt(bestStore.price)}
                    </span>
                    <span className="text-xs text-muted">best on {bestStore.storeName}</span>
                  </div>
                ) : null}

                {/* Historical low */}
                <div className="flex items-center gap-3 flex-wrap">
                  {nearHistoricalLow && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-500">
                      <TrendingDown size={11} /> Near all-time low
                    </span>
                  )}
                  {cheapestEverPrice !== null && cheapestEverPrice > 0 && (
                    <span className="text-[11px] text-muted">
                      All-time low:{' '}
                      <strong className="text-secondary">{fmt(cheapestEverPrice)}</strong>
                      {data.cheapestEver?.date && (
                        <span className="ml-1">({fmtDate(data.cheapestEver.date)})</span>
                      )}
                    </span>
                  )}
                  {cheapestEverPrice === 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                      <Infinity size={11} />
                      Has been free before
                    </span>
                  )}
                </div>
              </div>

              {/* Wishlist button */}
              <button
                onClick={() => toggle(wishId)}
                title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all shrink-0',
                  isWishlisted
                    ? 'border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                    : 'border-theme bg-surface text-muted hover:text-primary hover:border-theme-hover',
                )}
              >
                <Heart size={14} className={isWishlisted ? 'fill-current' : ''} />
                {isWishlisted ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Price chart ───────────────────────────────────────────── */}
      {data.stores.length > 1 && (
        <div className="rounded-2xl border border-theme bg-surface p-6">
          <h2 className="font-display font-semibold text-base text-primary mb-1">
            Price Comparison
          </h2>
          <p className="text-xs text-muted mb-5">
            {data.stores.length} store{data.stores.length !== 1 ? 's' : ''} — sorted cheapest first
          </p>
          <PriceChart stores={chartStores} />
        </div>
      )}

      {/* ── Store list ────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-theme bg-surface overflow-hidden">
        <div className="px-5 py-4 border-b border-theme">
          <h2 className="font-display font-semibold text-base text-primary">All Stores</h2>
        </div>

        <div className="p-4 space-y-2">
          {visibleStores.map(store => (
            <StoreRow
              key={`${store.storeID}-${store.dealID}`}
              store={store}
              cheapestEverPrice={cheapestEverPrice}
            />
          ))}

          {hasMore && (
            <button
              onClick={() => setShowAllStores(v => !v)}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs text-muted hover:text-primary transition-colors border-t border-theme mt-2 pt-3"
            >
              {showAllStores ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {showAllStores
                ? 'Show fewer stores'
                : `Show ${data.stores.length - COLLAPSE_AT} more store${data.stores.length - COLLAPSE_AT !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>

        {/* Reseller disclaimer */}
        {hasResellers && (
          <div className="px-5 pb-4 border-t border-theme pt-4 mx-4">
            <div className="flex items-start gap-2">
              <ShieldAlert size={11} className="text-amber-400/60 shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted/60 leading-relaxed">
                Stores marked{' '}
                <span className="text-amber-400/70">3rd party</span>{' '}
                are legitimate resellers, not publisher-direct stores. G2A and key-resellers are excluded.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Powered-by attribution ────────────────────────────────── */}
      <p className="text-center text-[11px] text-muted pb-2">
        Price data via{' '}
        <a
          href="https://www.cheapshark.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary transition-colors underline underline-offset-2"
        >
          CheapShark
        </a>
        {data.steamAppID !== '0' && (
          <>
            {' · '}
            <a
              href={`https://store.steampowered.com/app/${data.steamAppID}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors underline underline-offset-2"
            >
              View on Steam
            </a>
          </>
        )}
      </p>
    </div>
  )
}

'use client'

import { useState }   from 'react'
import Image          from 'next/image'
import Link           from 'next/link'
import { ExternalLink, Heart, Star, Zap } from 'lucide-react'
import { cn, formatPrice, getUrgencyLevel } from '@/lib/utils'
import type { NormalizedDeal } from '@/types'
import CountdownTimer from './CountdownTimer'
import PlatformBadge  from './PlatformBadge'
import { GENRES }     from '@/constants/genres'
import { isResellerPlatform, PLATFORMS } from '@/constants/platforms'

interface DealCardProps {
  deal:              NormalizedDeal
  isWishlisted?:     boolean
  onWishlistToggle?: (dealId: string) => void
  style?:            React.CSSProperties
}

function extractCsGameId(dealId: string): string | null {
  const m = dealId.match(/^cs-(?:heavy-|sale-)?(\d+)/)
  return m ? m[1] : null
}

function sanitiseCover(url: string | null | undefined): string | null {
  if (!url || !url.startsWith('http')) return null
  if (url.includes('placehold.co')) return null
  return url
}

function steamFallback(deal: NormalizedDeal): string | null {
  if (deal.claimUrl?.includes('store.steampowered.com/app/')) {
    const m = deal.claimUrl.match(/\/app\/(\d+)/)
    if (m) return `https://cdn.akamai.steamstatic.com/steam/apps/${m[1]}/capsule_616x353.jpg`
  }
  return null
}

const PLATFORM_BG: Record<string, string> = {
  epic:      '#0078F2', gog:    '#7B2FBE', steam:    '#1B2838',
  prime:     '#F59E0B', humble: '#EF4444', itch:     '#FA5C5C',
  fanatical: '#10B981', gmg:    '#16A34A', gamesplanet: '#D97706',
}

export default function DealCard({ deal, isWishlisted = false, onWishlistToggle, style }: DealCardProps) {
  const [imgSrc,        setImgSrc]        = useState<string | null>(sanitiseCover(deal.coverImage))
  const [triedFallback, setTriedFallback] = useState(false)
  const [wishlisted,    setWishlisted]    = useState(isWishlisted)

  const urgency    = getUrgencyLevel(deal.endDate)
  const isFree     = deal.currentPrice === 0
  const isReseller = isResellerPlatform(deal.platform)
  const storeName  = PLATFORMS[deal.platform]?.label ?? deal.platform
  const discount   = deal.discountPercent ??
    (deal.originalPrice > 0 ? Math.round((1 - deal.currentPrice / deal.originalPrice) * 100) : 0)
  const rating     = deal.igdbRating ?? deal.metacriticScore
  const csGameId   = extractCsGameId(deal.id)
  const gameHref   = csGameId ? `/game/${csGameId}` : null

  function handleImgError() {
    if (!triedFallback) {
      const fb = steamFallback(deal)
      if (fb) { setImgSrc(fb); setTriedFallback(true); return }
    }
    setImgSrc(null)
  }

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    setWishlisted(v => !v)
    onWishlistToggle?.(deal.id)
  }

  return (
    <article
      suppressHydrationWarning
      className="deal-card rounded-xl overflow-hidden group relative animate-card-in"
      style={style}
    >
      {imgSrc && <div className="card-cover-wash" style={{ backgroundImage: `url(${imgSrc})` }} />}

      {gameHref && (
        <Link href={gameHref} className="absolute inset-0 z-0"
          aria-label={`View prices for ${deal.title}`} tabIndex={-1} />
      )}

      {!isFree && discount >= 30 && (
        <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden z-20 pointer-events-none">
          <div className="deal-sale-ribbon">-{discount}%</div>
        </div>
      )}

      <div className="relative z-10">
        <div className="relative w-full aspect-[16/9] overflow-hidden bg-surface">
          {imgSrc ? (
            <Image
              src={imgSrc}
              alt={deal.title}
              fill
              sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              onError={handleImgError}
              unoptimized
            />
          ) : (
            <div
              className="absolute inset-0 flex flex-col items-start justify-end p-3 gap-1"
              style={{
                background: `linear-gradient(135deg, ${PLATFORM_BG[deal.platform] ?? '#1A1A25'} 0%, var(--surface) 100%)`,
              }}
            >
              <PlatformBadge platform={deal.platform} showLabel={false} />
              <span className="text-xs font-semibold text-white/80 line-clamp-2 leading-snug">
                {deal.title}
              </span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] via-transparent to-transparent opacity-60" />

          <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
            <PlatformBadge platform={deal.platform} />
            <button
              onClick={handleWishlist}
              aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
              className={cn(
                'p-1.5 rounded-full border transition-all duration-200 backdrop-blur-sm shrink-0',
                wishlisted
                  ? 'bg-red-500/20 border-red-500/40 text-red-400'
                  : 'bg-black/30 border-white/10 text-white/60 hover:text-white/90 hover:bg-black/50',
              )}
            >
              <Heart size={13} className={cn(wishlisted && 'fill-current')} />
            </button>
          </div>

          {deal.isFresh && (
            <div className="absolute bottom-3 left-3">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 backdrop-blur-sm">
                <Zap size={9} className="fill-current" /> NEW
              </span>
            </div>
          )}
        </div>

        <div className="p-4 pt-3 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display font-semibold text-sm leading-snug text-primary line-clamp-2 flex-1">
              {deal.title}
            </h3>
            {rating != null && (
              <span className="inline-flex items-center gap-1 shrink-0 text-[11px] font-medium text-amber-400">
                <Star size={10} className="fill-current" />
                <span suppressHydrationWarning>{rating}</span>
              </span>
            )}
          </div>

          {deal.genres.length > 0 && deal.genres[0] !== 'other' && (
            <div className="flex flex-wrap gap-1">
              {deal.genres.slice(0, 3).map(g => (
                <span key={g} className="text-[10px] px-1.5 py-0.5 rounded bg-surface-hover text-muted border border-theme">
                  {GENRES[g]?.label ?? g}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-1 border-t border-theme">
            <div className="flex items-baseline gap-2">
              {deal.originalPrice > 0 && (
                <span className="text-[11px] text-muted line-through">
                  {formatPrice(deal.originalPrice, deal.currency)}
                </span>
              )}
              {isFree ? (
                <span className="text-sm font-bold text-free bg-free-muted px-2 py-0.5 rounded-full">FREE</span>
              ) : (
                <>
                  <span className="text-sm font-bold text-primary" suppressHydrationWarning>
                    {formatPrice(deal.currentPrice, deal.currency)}
                  </span>
                  {discount > 0 && (
                    <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full border text-emerald-400 bg-emerald-500/10 border-emerald-500/30">
                      -{discount}%
                    </span>
                  )}
                </>
              )}
            </div>
            <CountdownTimer
              endDate={deal.endDate}
              dealType={deal.dealType}
              currentPrice={deal.currentPrice}
              compact
            />
          </div>

          <a
            href={deal.claimUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className={cn(
              'flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg',
              'text-sm font-semibold transition-all duration-200 border group/btn',
              isFree
                ? urgency === 'danger'  ? 'bg-red-500/10 border-red-500/40 text-red-400 hover:bg-red-500/20'
                : urgency === 'warning' ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20'
                :                        'bg-accent-muted border-[var(--accent)] text-accent hover:opacity-80'
                : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20',
            )}
          >
            {isFree ? 'Claim Free' : isReseller ? `View on ${storeName}` : 'View Deal'}
            <ExternalLink size={13} className="transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
          </a>

          {gameHref && !isFree && (
            <Link
              href={gameHref}
              onClick={e => e.stopPropagation()}
              className="text-center text-[10px] text-muted hover:text-accent transition-colors -mt-1"
            >
              Compare prices across all stores →
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}

'use client'

import { useState }  from 'react'
import Image         from 'next/image'
import Link          from 'next/link'
import { ExternalLink, Heart, Star } from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'
import { isResellerPlatform, PLATFORMS } from '@/constants/platforms'
import PlatformBadge from './PlatformBadge'
import type { NormalizedDeal } from '@/types'

export type SaleDealRowVariant = 'official' | 'reseller'

interface SaleDealRowProps {
  deal:              NormalizedDeal
  rank:              number
  variant?:          SaleDealRowVariant   // official = taller, reseller = compact
  isWishlisted?:     boolean
  onWishlistToggle?: (id: string, title: string, platform: string) => void
}

function extractCsGameId(id: string): string | null {
  const m = id.match(/^cs-(?:heavy-|sale-)?(\d+)/)
  return m ? m[1] : null
}

export default function SaleDealRow({
  deal, rank, variant = 'official', isWishlisted = false, onWishlistToggle,
}: SaleDealRowProps) {
  const [wishlisted, setWishlisted] = useState(isWishlisted)
  const [imgError,   setImgError]   = useState(false)

  const csGameId   = extractCsGameId(deal.id)
  const gameHref   = csGameId ? `/game/${csGameId}` : null
  const isReseller = isResellerPlatform(deal.platform)
  const discount   = deal.discountPercent ?? 0
  const rating     = deal.metacriticScore ?? deal.igdbRating
  const isOfficial = variant === 'official'

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    setWishlisted(v => !v)
    onWishlistToggle?.(deal.id, deal.title, deal.platform)
  }

  // Discount colour — richer for official, muted for reseller
  const discountPill = discount >= 80
    ? isOfficial ? 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30'
                 : 'text-emerald-400/80 bg-emerald-500/10 border-emerald-500/20'
    : discount >= 70
    ? isOfficial ? 'text-sky-300 bg-sky-500/15 border-sky-500/30'
                 : 'text-sky-400/80 bg-sky-500/10 border-sky-500/20'
    : isOfficial ? 'text-secondary bg-surface-elevated border-theme'
                 : 'text-muted bg-surface border-theme'

  // Thumbnail dimensions
  const thumbW = isOfficial ? 'w-20 h-12' : 'w-14 h-9'

  // Row padding
  const rowPad = isOfficial ? 'px-5 py-4' : 'px-4 py-3'

  return (
    <div
      className={cn(
        'group relative flex items-center gap-4 rounded-xl border transition-all duration-150',
        rowPad,
        isOfficial
          ? 'border-theme bg-surface hover:bg-surface-hover hover:border-theme-hover'
          : 'border-theme/60 bg-surface/60 hover:bg-surface hover:border-theme',
      )}
    >
      {/* Rank */}
      <span className={cn(
        'shrink-0 w-6 text-center font-display font-bold select-none',
        isOfficial ? 'text-sm text-muted' : 'text-xs text-muted/60',
      )}>
        {rank}
      </span>

      {/* Thumbnail */}
      <div className={cn('relative shrink-0 rounded-lg overflow-hidden bg-surface-hover', thumbW)}>
        {deal.coverImage && !imgError ? (
          <Image
            src={deal.coverImage} alt="" fill sizes="80px"
            className="object-cover"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg,
                ${deal.platform==='steam'?'#1B2838':deal.platform==='gog'?'#7B2FBE':
                  deal.platform==='epic'?'#0078F2':deal.platform==='humble'?'#CC2929':'#1A1A25'} 0%, var(--surface) 100%)`,
            }}
          >
            <PlatformBadge platform={deal.platform} showLabel={false} />
          </div>
        )}
      </div>

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        {/* Title row */}
        <div className="flex items-center gap-2 min-w-0">
          {gameHref ? (
            <Link
              href={gameHref}
              className={cn(
                'truncate font-semibold hover:text-accent transition-colors',
                isOfficial ? 'text-sm text-primary' : 'text-[13px] text-primary/90',
              )}
            >
              {deal.title}
            </Link>
          ) : (
            <span className={cn('truncate font-semibold',
              isOfficial ? 'text-sm text-primary' : 'text-[13px] text-primary/90',
            )}>
              {deal.title}
            </span>
          )}
          {rating != null && (
            <span className="hidden sm:inline-flex items-center gap-0.5 shrink-0 text-[10px] text-amber-400">
              <Star size={9} className="fill-current" />
              {rating}
            </span>
          )}
        </div>

        {/* Sub-row: platform + store name */}
        <div className="flex items-center gap-2 mt-1">
          <PlatformBadge platform={deal.platform} showLabel={false} />
          <span className={cn('text-muted', isOfficial ? 'text-[11px]' : 'text-[10px]')}>
            {PLATFORMS[deal.platform]?.label ?? deal.platform}
          </span>
          {isReseller && (
            <span className="text-[9px] text-amber-400/60 border border-amber-500/25 rounded px-1 py-px">
              retailer
            </span>
          )}
        </div>

        {/* Official variant: show price inline on mobile too */}
        {isOfficial && (
          <div className="flex items-baseline gap-2 mt-1 sm:hidden">
            {deal.originalPrice > 0 && (
              <span className="text-[11px] text-muted line-through">
                {formatPrice(deal.originalPrice, deal.currency)}
              </span>
            )}
            <span className="text-sm font-bold text-primary">
              {formatPrice(deal.currentPrice, deal.currency)}
            </span>
          </div>
        )}
      </div>

      {/* Prices — desktop */}
      <div className="shrink-0 text-right hidden sm:block">
        {deal.originalPrice > 0 && (
          <p className={cn('text-muted line-through leading-none',
            isOfficial ? 'text-[12px]' : 'text-[11px]',
          )}>
            {formatPrice(deal.originalPrice, deal.currency)}
          </p>
        )}
        <p className={cn('font-bold text-primary leading-tight',
          isOfficial ? 'text-[15px]' : 'text-sm',
        )}>
          {formatPrice(deal.currentPrice, deal.currency)}
        </p>
      </div>

      {/* Discount badge */}
      <span className={cn(
        'shrink-0 font-bold rounded-lg border tabular-nums',
        isOfficial ? 'text-sm px-2.5 py-1.5' : 'text-xs px-2 py-1',
        discountPill,
      )}>
        -{discount}%
      </span>

      {/* Wishlist — fades in on hover */}
      <button
        onClick={handleWishlist}
        aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        className={cn(
          'shrink-0 p-1.5 rounded-lg border transition-all',
          wishlisted
            ? 'border-red-500/40 bg-red-500/10 text-red-400'
            : 'border-theme text-muted hover:text-primary opacity-0 group-hover:opacity-100',
        )}
      >
        <Heart size={isOfficial ? 13 : 12} className={cn(wishlisted && 'fill-current')} />
      </button>

      {/* CTA */}
      <a
        href={deal.claimUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'shrink-0 hidden sm:inline-flex items-center gap-1.5 rounded-lg border font-semibold transition-all',
          isOfficial
            ? 'px-4 py-2 text-sm bg-surface-elevated border-theme text-secondary hover:text-primary hover:border-theme-hover'
            : 'px-3 py-1.5 text-xs bg-surface border-theme/60 text-muted hover:text-primary hover:border-theme',
        )}
      >
        View
        <ExternalLink size={isOfficial ? 12 : 11} />
      </a>
    </div>
  )
}

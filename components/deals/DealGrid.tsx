import type { NormalizedDeal } from '@/types'
import DealCard from './DealCard'
import DealCardSkeleton from './DealCardSkeleton'
import { PackageOpen } from 'lucide-react'

interface DealGridProps {
  deals:             NormalizedDeal[]
  wishlistedIds?:    Set<string>
  onWishlistToggle?: (dealId: string) => void   // simplified: id only
  loading?:          boolean
  skeletonCount?:    number
  animKey?:          string
}

export default function DealGrid({
  deals,
  wishlistedIds    = new Set(),
  onWishlistToggle,
  loading          = false,
  skeletonCount    = 8,
  animKey,
}: DealGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <DealCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (deals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 rounded-xl border border-theme bg-surface flex items-center justify-center mb-4">
          <PackageOpen size={20} className="text-muted" />
        </div>
        <p className="font-display font-semibold text-lg text-primary mb-1">No deals found</p>
        <p className="text-secondary text-sm">Try adjusting your filters or check back soon.</p>
      </div>
    )
  }

  return (
    <div key={animKey} className={animKey ? 'tab-panel-enter' : undefined}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {deals.map((deal, i) => (
          <DealCard
            key={deal.id}
            deal={deal}
            isWishlisted={wishlistedIds.has(deal.id)}
            onWishlistToggle={onWishlistToggle}
            style={{
              animationDelay:    `${i * 30}ms`,
              opacity:           0,
              animationFillMode: 'forwards',
            }}
          />
        ))}
      </div>
    </div>
  )
}

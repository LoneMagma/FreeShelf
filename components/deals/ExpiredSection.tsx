import type { NormalizedDeal } from '@/types'
import { formatPrice, timeAgo } from '@/lib/utils'
import PlatformBadge from './PlatformBadge'
import { ExternalLink } from 'lucide-react'

interface ExpiredSectionProps {
  deals: NormalizedDeal[]
}

export default function ExpiredSection({ deals }: ExpiredSectionProps) {
  if (deals.length === 0) return null

  return (
    <section className="mt-12">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="font-display font-semibold text-sm text-muted uppercase tracking-wider">
          Recently Expired
        </h2>
        <span className="text-xs text-muted border border-theme rounded-full px-2 py-0.5">
          Last 24 hours
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 opacity-40">
        {deals.map((deal) => (
          <div
            key={deal.id}
            className="rounded-xl border border-theme bg-surface p-3 flex items-center gap-3"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-primary truncate">{deal.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <PlatformBadge platform={deal.platform} showLabel={false} />
                <span className="text-xs text-muted line-through">
                  {formatPrice(deal.originalPrice)}
                </span>
                <span className="text-xs text-muted">
                  {deal.endDate ? timeAgo(deal.endDate) : ''}
                </span>
              </div>
            </div>
            <a
              href={deal.claimUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-muted hover:text-primary transition-colors"
            >
              <ExternalLink size={14} />
            </a>
          </div>
        ))}
      </div>
    </section>
  )
}

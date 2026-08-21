import { cn } from '@/lib/utils'
import { PLATFORMS } from '@/constants/platforms'
import type { Platform } from '@/types'

interface PlatformBadgeProps {
  platform: Platform
  className?: string
  showLabel?: boolean
}

export default function PlatformBadge({
  platform,
  className,
  showLabel = true,
}: PlatformBadgeProps) {
  const meta = PLATFORMS[platform] ?? PLATFORMS.other

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border',
        meta.bgClass,
        meta.textClass,
        meta.borderClass,
        className
      )}
    >
      {/* Colored dot — no emoji */}
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: meta.color }}
      />
      {showLabel && <span>{meta.label}</span>}
    </span>
  )
}

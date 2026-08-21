'use client'

import { cn } from '@/lib/utils'
import { Clock, Sparkles, LayoutGrid } from 'lucide-react'

export type SectionTab = 'expiring' | 'hot' | 'trending' | 'all'

interface SectionTabsProps {
  active:   SectionTab
  onChange: (tab: SectionTab) => void
  counts: {
    expiring: number
    hot:      number   // "New This Week" in v2
    trending: number   // unused in v2, kept for type compat
    all:      number
  }
}

export default function SectionTabs({ active, onChange, counts }: SectionTabsProps) {
  const allTabs = [
    { id: 'expiring' as SectionTab, label: 'Expiring Soon', icon: Clock,      count: counts.expiring, urgent: true },
    { id: 'hot'      as SectionTab, label: 'New',           icon: Sparkles,   count: counts.hot },
    { id: 'all'      as SectionTab, label: 'All Deals',     icon: LayoutGrid, count: counts.all },
  ]

  const tabs = allTabs.filter(tab => {
    if (tab.id === 'expiring') return tab.count > 0
    if (tab.id === 'hot')      return tab.count > 0
    return true
  })

  return (
    <div className="flex items-center gap-1 border-b border-theme overflow-x-auto scrollbar-hide">
      {tabs.map(tab => {
        const Icon     = tab.icon
        const isActive = active === tab.id

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative flex items-center gap-2 px-4 py-3 text-sm font-medium',
              'border-b-2 -mb-px transition-all duration-200 whitespace-nowrap',
              'focus:outline-none',
              isActive
                ? 'border-[var(--accent)] text-primary'
                : 'border-transparent text-muted hover:text-primary hover:border-[var(--border-hover)]',
            )}
          >
            <Icon size={14} className={cn('transition-colors', isActive ? 'text-accent' : 'text-muted')} />
            {tab.label}

            {tab.count > 0 && (
              <span className={cn(
                'text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center transition-colors',
                isActive
                  ? 'bg-accent-muted text-accent'
                  : 'bg-surface text-muted border border-theme',
              )}>
                {tab.count}
              </span>
            )}

            {tab.urgent && tab.count > 0 && !isActive && (
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-400" />
            )}
          </button>
        )
      })}
    </div>
  )
}

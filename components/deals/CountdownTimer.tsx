'use client'

import { useEffect, useState } from 'react'
import { differenceInSeconds } from 'date-fns'
import { cn } from '@/lib/utils'
import { Clock, Infinity } from 'lucide-react'

interface CountdownTimerProps {
  endDate:      string | null
  dealType:     string
  currentPrice?: number          // NEW: needed to distinguish free vs sale with no expiry
  className?:   string
  compact?:     boolean
}

interface TimeLeft {
  days: number; hours: number; minutes: number; seconds: number; total: number
}

function calcTimeLeft(endDate: string): TimeLeft {
  const total = Math.max(0, differenceInSeconds(new Date(endDate), new Date()))
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    total,
  }
}

export default function CountdownTimer({
  endDate, dealType, currentPrice = 0, className, compact = false,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)
  const [mounted, setMounted]   = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!endDate) return
    setTimeLeft(calcTimeLeft(endDate))
    const id = setInterval(() => setTimeLeft(calcTimeLeft(endDate)), 1000)
    return () => clearInterval(id)
  }, [endDate])

  // FIX: No end date — determine label from dealType + currentPrice
  if (!endDate) {
    // Only truly "Always free" when it's a permanent-free deal that costs $0
    if (dealType === 'permanent-free' && currentPrice === 0) {
      return (
        <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium text-free', className)}>
          <Infinity size={11} />
          Always free
        </span>
      )
    }
    // Sale deal or timed-free with no known expiry — don't claim "always free"
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium text-muted', className)}>
        <Clock size={11} />
        No expiry listed
      </span>
    )
  }

  if (!mounted || !timeLeft) {
    return <span className={cn('text-xs text-muted', className)}>...</span>
  }

  if (timeLeft.total <= 0) {
    return <span className={cn('text-xs font-medium text-muted', className)}>Expired</span>
  }

  const hoursLeft   = timeLeft.days * 24 + timeLeft.hours
  const urgencyClass = hoursLeft <= 6 ? 'urgency-danger' : hoursLeft <= 24 ? 'urgency-warning' : 'urgency-safe'
  const pad = (n: number) => String(n).padStart(2, '0')

  if (compact) {
    const label = timeLeft.days > 0
      ? `${timeLeft.days}d ${pad(timeLeft.hours)}h`
      : timeLeft.hours > 0
      ? `${pad(timeLeft.hours)}h ${pad(timeLeft.minutes)}m`
      : `${pad(timeLeft.minutes)}m ${pad(timeLeft.seconds)}s`

    return (
      <span
        suppressHydrationWarning
        className={cn('inline-flex items-center gap-1 text-xs font-semibold tabular-nums', urgencyClass, className)}
      >
        <Clock size={11} />
        {label}
      </span>
    )
  }

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <Clock size={12} className={urgencyClass} />
      {timeLeft.days > 0 && <Seg value={timeLeft.days} label="d" cls={urgencyClass} />}
      <Seg value={timeLeft.hours} label="h" cls={urgencyClass} />
      <Seg value={timeLeft.minutes} label="m" cls={urgencyClass} />
      {timeLeft.days === 0 && <Seg value={timeLeft.seconds} label="s" cls={urgencyClass} pulse />}
    </div>
  )
}

function Seg({ value, label, cls, pulse }: { value: number; label: string; cls: string; pulse?: boolean }) {
  return (
    <span suppressHydrationWarning className={cn('inline-flex items-baseline gap-0.5 font-display font-semibold text-sm tabular-nums', cls, pulse && 'animate-pulse')}>
      {String(value).padStart(2, '0')}
      <span className="text-[10px] opacity-70">{label}</span>
    </span>
  )
}

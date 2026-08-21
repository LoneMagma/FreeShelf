'use client'

import { useEffect, useState } from 'react'
import { Clock, RefreshCw } from 'lucide-react'

// Known drop schedules
const DROP_SCHEDULES = [
  {
    platform: 'Epic Games',
    schedule: 'Every Thursday at 4:00 PM IST',
    color: '#3b82f6',
    getNext: () => {
      const now = new Date()
      const day = now.getUTCDay()
      let daysUntil = (4 - day + 7) % 7
      if (daysUntil === 0) {
        // Today is Thursday
        const hours = now.getUTCHours()
        const mins = now.getUTCMinutes()
        if (hours > 10 || (hours === 10 && mins >= 30)) daysUntil = 7 // already dropped today
      }
      return new Date(Date.UTC(
        now.getUTCFullYear(), now.getUTCMonth(),
        now.getUTCDate() + daysUntil, 10, 30, 0
      ))
    },
  },
  {
    platform: 'GOG',
    schedule: 'Irregular — usually weekends',
    color: '#8b5cf6',
    getNext: null,  // unpredictable
  },
  {
    platform: 'Prime Gaming',
    schedule: 'Monthly, first week',
    color: '#f59e0b',
    getNext: null,
  },
  {
    platform: 'Humble Bundle',
    schedule: 'Irregular giveaways',
    color: '#ef4444',
    getNext: null,
  },
]

interface TimeLeft { days: number; hours: number; minutes: number; seconds: number }

function calcTimeLeft(target: Date): TimeLeft {
  const diff = Math.max(0, target.getTime() - Date.now())
  return {
    days:    Math.floor(diff / 86400000),
    hours:   Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  }
}

export default function NextDropCountdown() {
  // Start with null — only set on client to avoid hydration mismatch
  const [epicTarget] = useState(() => DROP_SCHEDULES[0].getNext!())
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)

  useEffect(() => {
    // Set initial value after mount (client-only)
    setTimeLeft(calcTimeLeft(epicTarget))
    const id = setInterval(() => setTimeLeft(calcTimeLeft(epicTarget)), 1000)
    return () => clearInterval(id)
  }, [epicTarget])

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* Epic countdown card */}
      <div className="rounded-2xl border border-theme bg-surface p-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-5">
          <Clock size={14} className="text-muted" />
          <span className="text-xs font-semibold text-muted uppercase tracking-wider">
            Next Epic Free Games Drop
          </span>
        </div>

        {/* Countdown — only render when client-side (avoids hydration mismatch) */}
        {timeLeft ? (
          <div className="flex items-end justify-center gap-4 mb-5">
            {timeLeft.days > 0 && <TimeUnit value={timeLeft.days} label="days" />}
            <TimeUnit value={timeLeft.hours} label="hrs" />
            <TimeUnit value={timeLeft.minutes} label="min" />
            <TimeUnit value={timeLeft.seconds} label="sec" />
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 h-16 mb-5 text-muted">
            <RefreshCw size={14} className="animate-spin" />
            <span className="text-sm">Calculating...</span>
          </div>
        )}

        <p className="text-xs text-muted">
          Epic releases 1–2 paid games for free every{' '}
          <span className="font-semibold text-secondary">Thursday at 4:00 PM IST</span>.
        </p>
      </div>

      {/* Other platforms info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {DROP_SCHEDULES.slice(1).map(p => (
          <div key={p.platform} className="rounded-xl border border-theme bg-surface px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="text-xs font-semibold text-primary">{p.platform}</span>
            </div>
            <p className="text-[11px] text-muted">{p.schedule}</p>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-muted pt-1">
        We check all platforms every hour. You'll see deals here the moment they go live.
      </p>
    </div>
  )
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center min-w-[48px]">
      <span
        className="font-display font-bold text-4xl text-primary tabular-nums leading-none"
        suppressHydrationWarning
      >
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[10px] text-muted uppercase tracking-wider mt-1">{label}</span>
    </div>
  )
}

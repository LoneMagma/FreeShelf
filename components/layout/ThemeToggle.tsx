'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return <div className="w-8 h-8 rounded-lg skeleton" />
  }

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Toggle theme"
      className={cn(
        'relative w-8 h-8 rounded-lg flex items-center justify-center',
        'border border-theme bg-surface hover:bg-surface-hover',
        'transition-all duration-200 group overflow-hidden',
        className
      )}
    >
      <span
        className={cn(
          'absolute transition-all duration-300',
          isDark
            ? 'opacity-100 rotate-0 scale-100'
            : 'opacity-0 rotate-90 scale-75'
        )}
      >
        <Moon size={15} className="text-indigo-400" />
      </span>
      <span
        className={cn(
          'absolute transition-all duration-300',
          !isDark
            ? 'opacity-100 rotate-0 scale-100'
            : 'opacity-0 -rotate-90 scale-75'
        )}
      >
        <Sun size={15} className="text-amber-500" />
      </span>
    </button>
  )
}

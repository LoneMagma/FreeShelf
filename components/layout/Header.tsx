'use client'

import Link    from 'next/link'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, BarChart2 } from 'lucide-react'
import { cn }        from '@/lib/utils'
import ThemeToggle   from './ThemeToggle'

interface HeaderProps {
  onSearch?:    (q: string) => void
  lastUpdated?: string
}

export default function Header({ onSearch, lastUpdated }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [query,      setQuery]      = useState('')
  const [focused,    setFocused]    = useState(false)
  const desktopRef = useRef<HTMLInputElement>(null)
  const mobileRef  = useRef<HTMLInputElement>(null)

  const focusSearch = useCallback(() => {
    if (desktopRef.current && window.innerWidth >= 768) {
      desktopRef.current.focus()
      desktopRef.current.select()
    } else {
      setSearchOpen(true)
      setTimeout(() => mobileRef.current?.focus(), 80)
    }
  }, [])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag    = (e.target as HTMLElement).tagName
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
      if (e.key === 'Escape') {
        desktopRef.current?.blur()
        mobileRef.current?.blur()
        if (query) { setQuery(''); onSearch?.('') }
        return
      }
      if (typing) return
      if (e.key === '/') { e.preventDefault(); focusSearch(); return }
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); focusSearch() }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [focusSearch, query, onSearch])

  function handleChange(val: string) { setQuery(val); onSearch?.(val) }

  const showSlashHint = !query && !focused

  return (
    <header className="sticky top-0 z-50 w-full border-b border-theme bg-surface/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          {/* Logo mark — exact match to favicon.svg */}
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" aria-hidden="true">
            <rect x="3" y="21" width="26" height="3.5" rx="1.75" fill="var(--accent)" />
            <rect x="3" y="13.5" width="20" height="2.5" rx="1.25" fill="var(--accent)" opacity="0.55" />
            <rect x="3" y="7" width="14" height="2" rx="1" fill="var(--accent)" opacity="0.28" />
            <circle cx="26" cy="14.75" r="3.75" fill="#10B981" />
            <path d="M24.7 14.75L26 16.1L27.8 13.9" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-display font-bold text-lg tracking-tight text-primary group-hover:text-accent transition-colors">
            FreeShelf
          </span>
          {lastUpdated && (
            <span className="hidden sm:inline-block text-[10px] text-muted border border-theme rounded-full px-2 py-0.5 ml-1">
              {lastUpdated}
            </span>
          )}
        </Link>

        {/* Desktop search */}
        <div className="hidden md:flex flex-1 max-w-sm">
          <div className="relative w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              ref={desktopRef}
              type="text"
              value={query}
              placeholder="Search games…"
              onChange={e => handleChange(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className={cn(
                'w-full h-8 pl-9 rounded-lg text-sm',
                'bg-[var(--bg)] border border-theme',
                'text-primary placeholder:text-muted',
                'focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20',
                'transition-all duration-150',
                showSlashHint ? 'pr-7' : 'pr-3',
              )}
            />
            <span
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2',
                'text-[13px] font-mono leading-none select-none pointer-events-none',
                'text-muted/25 transition-opacity duration-150',
                showSlashHint ? 'opacity-100' : 'opacity-0',
              )}
              aria-hidden
            >/</span>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button
            className="md:hidden p-1.5 rounded-lg border border-theme text-muted hover:text-primary transition-colors"
            onClick={() => { setSearchOpen(v => !v); if (!searchOpen) setTimeout(() => mobileRef.current?.focus(), 80) }}
            aria-label="Search"
          >
            <Search size={15} />
          </button>

          <ThemeToggle />

          <Link href="/search"
            className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium border border-theme text-muted hover:text-primary hover:border-[var(--accent)] transition-all">
            <BarChart2 size={12} />
            Price Check
          </Link>
        </div>
      </div>

      {/* Mobile search */}
      {searchOpen && (
        <div className="md:hidden px-4 pb-3 border-t border-theme pt-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              ref={mobileRef} autoFocus type="text" value={query}
              placeholder="Search free games and deals…"
              onChange={e => handleChange(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg text-sm bg-[var(--bg)] border border-theme text-primary placeholder:text-muted focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>
      )}
    </header>
  )
}

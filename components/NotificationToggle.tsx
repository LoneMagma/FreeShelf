'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { cn } from '@/lib/utils'

export default function NotificationToggle() {
  const { isSignedIn, isLoaded } = useUser()
  const [enabled, setEnabled]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [fetched, setFetched]   = useState(false)

  useEffect(() => {
    if (!isLoaded || !isSignedIn || fetched) return
    fetch('/api/preferences')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.prefs?.notifyEmail !== undefined) setEnabled(d.prefs.notifyEmail) })
      .catch(() => {})
      .finally(() => setFetched(true))
  }, [isLoaded, isSignedIn, fetched])

  if (!isLoaded || !isSignedIn) return null

  async function toggle() {
    setLoading(true)
    const next = !enabled
    try {
      await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifyEmail: next }),
      })
      setEnabled(next)
    } catch { /* ignore */ }
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={enabled ? 'Turn off email alerts' : 'Get email when wishlisted games go free'}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all',
        enabled
          ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20'
          : 'border-theme bg-surface text-muted hover:text-primary'
      )}
    >
      {loading
        ? <Loader2 size={14} className="animate-spin" />
        : enabled
        ? <Bell size={14} className="fill-current" />
        : <BellOff size={14} />
      }
      {enabled ? 'Email alerts on' : 'Email alerts off'}
    </button>
  )
}

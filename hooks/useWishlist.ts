'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'freeshelf:wishlist'

function readStorage(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return new Set<string>(parsed)
  } catch { /* corrupted — reset */ }
  return new Set()
}

function writeStorage(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
  } catch { /* quota exceeded — ignore */ }
}

export function useWishlist() {
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set())
  const [hydrated, setHydrated] = useState(false)

  // Read from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    setWishlistedIds(readStorage())
    setHydrated(true)
  }, [])

  const toggle = useCallback((dealId: string) => {
    setWishlistedIds(prev => {
      const next = new Set(prev)
      next.has(dealId) ? next.delete(dealId) : next.add(dealId)
      writeStorage(next)
      return next
    })
  }, [])

  return {
    wishlistedIds,
    hydrated,
    toggle,
    isWishlisted: (id: string) => wishlistedIds.has(id),
  }
}

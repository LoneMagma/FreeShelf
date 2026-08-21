'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import type { FilterState, Platform, Genre, DealType, SortOption } from '@/types'

const DEFAULT_FILTERS: FilterState = {
  platforms: [],
  genres: [],
  dealTypes: [],
  sort: 'expiry',
  search: '',
}

function parseSearchParams(searchParams: URLSearchParams): FilterState {
  return {
    platforms: (searchParams.get('platform')?.split(',').filter(Boolean) as Platform[]) ?? [],
    genres: (searchParams.get('genre')?.split(',').filter(Boolean) as Genre[]) ?? [],
    dealTypes: (searchParams.get('type')?.split(',').filter(Boolean) as DealType[]) ?? [],
    sort: (searchParams.get('sort') as SortOption) ?? 'expiry',
    search: searchParams.get('q') ?? '',
  }
}

function buildSearchParams(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.platforms.length > 0) params.set('platform', filters.platforms.join(','))
  if (filters.genres.length > 0) params.set('genre', filters.genres.join(','))
  if (filters.dealTypes.length > 0) params.set('type', filters.dealTypes.join(','))
  if (filters.sort !== 'expiry') params.set('sort', filters.sort)
  if (filters.search) params.set('q', filters.search)
  return params
}

export function useFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [filters, setFiltersState] = useState<FilterState>(() =>
    parseSearchParams(searchParams)
  )

  // Sync URL → state when params change
  useEffect(() => {
    setFiltersState(parseSearchParams(searchParams))
  }, [searchParams])

  const setFilters = useCallback(
    (next: FilterState) => {
      setFiltersState(next)
      const params = buildSearchParams(next)
      const query = params.toString()
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [router, pathname]
  )

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [setFilters])

  const hasActiveFilters =
    filters.platforms.length > 0 ||
    filters.genres.length > 0 ||
    filters.dealTypes.length > 0 ||
    filters.search !== ''

  return { filters, setFilters, resetFilters, hasActiveFilters }
}

import { Suspense } from 'react'
import HomeClient   from './_components/HomeClient'
import HomeSkeleton from './_components/HomeSkeleton'
import {
  getFreeDeals,
  getFlashDeals,
  getSaleDeals,
  getLastFetched,
} from '@/lib/kv'

export const dynamic    = 'force-dynamic'
export const revalidate = 0

async function getData() {
  let [free, flash, sale, lastFetched] = await Promise.all([
    getFreeDeals(),
    getFlashDeals(),
    getSaleDeals(),
    getLastFetched(),
  ])

  // Cold cache: auto-warm inline.
  // Passes CRON_SECRET so the request isn't rejected in production.
  if (!free || free.length === 0) {
    try {
      const port   = process.env.PORT ?? '3001'
      const base   = process.env.NEXT_PUBLIC_APP_URL ?? `http://localhost:${port}`
      const secret = process.env.CRON_SECRET

      await fetch(`${base}/api/cron/refresh`, {
        cache:   'no-store',
        headers: secret ? { Authorization: `Bearer ${secret}` } : {},
        signal:  AbortSignal.timeout(30_000),
      })

      ;[free, flash, sale, lastFetched] = await Promise.all([
        getFreeDeals(),
        getFlashDeals(),
        getSaleDeals(),
        getLastFetched(),
      ])
    } catch {
      // cron unreachable — show whatever is in cache
    }
  }

  return {
    free:        free        ?? [],
    flash:       flash       ?? [],
    sale:        sale        ?? [],
    lastFetched: lastFetched ?? null,
  }
}

export default async function Page() {
  const data = await getData()
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeClient
        free={data.free}
        flash={data.flash}
        sale={data.sale}
        lastFetched={data.lastFetched}
      />
    </Suspense>
  )
}

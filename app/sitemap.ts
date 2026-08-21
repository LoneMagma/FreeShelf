import type { MetadataRoute } from 'next'
import { PLATFORMS } from '@/constants/platforms'
import { GENRES } from '@/constants/genres'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://freeshelf.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'hourly' as const, priority: 1 },
    { url: `${SITE_URL}/search`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.5 },
  ]

  const platformRoutes = Object.keys(PLATFORMS)
    .filter(p => p !== 'other')
    .map(p => ({
      url: `${SITE_URL}/platform/${p}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }))

  const genreRoutes = Object.keys(GENRES).map(g => ({
    url: `${SITE_URL}/genre/${g}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }))

  return [...staticRoutes, ...platformRoutes, ...genreRoutes]
}

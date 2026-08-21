import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://freeshelf.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/game/',    // game detail pages — explicitly allow for clarity
          '/platform/',
          '/genre/',
          '/search',
        ],
        disallow: [
          '/api/',
          '/sign-in',
          '/sign-up',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}

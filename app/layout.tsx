import type { Metadata, Viewport } from 'next'
import { ThemeProvider } from 'next-themes'
import './globals.css'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://freeshelf.app'

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)',  color: '#0A0A0F' },
    { media: '(prefers-color-scheme: light)', color: '#F8F8FF' },
  ],
}

export const metadata: Metadata = {
  title:       'FreeShelf — Free PC Games Right Now',
  description: 'Track free PC games across Epic, GOG, Steam, Prime Gaming, and more. Updated hourly.',
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title:       'FreeShelf — Free PC Games Right Now',
    description: 'Track free PC games across Epic, GOG, Steam, Prime Gaming, and more.',
    type:        'website',
    images:      [{ url: '/api/og', width: 1200, height: 630 }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'FreeShelf — Free PC Games Right Now',
    description: 'Track free PC games across Epic, GOG, Steam, Prime Gaming, and more.',
    images:      ['/api/og'],
  },
  icons: {
    icon: [
      { url: '/favicon.svg',       type: 'image/svg+xml'  },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon.ico',       sizes: 'any' },
    ],
    apple:    '/apple-touch-icon.png',
    shortcut: '/favicon.ico',
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

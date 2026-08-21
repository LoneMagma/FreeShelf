import Link from 'next/link'
import { PLATFORMS } from '@/constants/platforms'

const FREE_PLATFORMS = ['epic', 'gog', 'steam', 'prime', 'humble', 'itch'] as const

const FEATURED_GENRES = [
  { slug: 'action',    label: 'Action'    },
  { slug: 'rpg',       label: 'RPG'       },
  { slug: 'adventure', label: 'Adventure' },
  { slug: 'strategy',  label: 'Strategy'  },
  { slug: 'indie',     label: 'Indie'     },
  { slug: 'shooter',   label: 'Shooter'   },
]

const FEATURES = [
  { href: '/',       label: 'Free Games'  },
  { href: '/search', label: 'Price Check' },
]

const POWERED_BY = [
  { name: 'CheapShark', url: 'https://www.cheapshark.com',     desc: 'Game price aggregator — free, no key required', badge: 'Free API',    color: '#10B981' },
  { name: 'Epic Games',  url: 'https://store.epicgames.com',    desc: 'Direct free games API',                         badge: 'Official',    color: '#0078F2' },
  { name: 'Next.js',     url: 'https://nextjs.org',             desc: 'Open-source React framework by Vercel',         badge: 'Open Source', color: '#FFFFFF' },
  { name: 'Upstash',     url: 'https://upstash.com',            desc: 'Serverless Redis — deal cache',                 badge: 'Free Tier',   color: '#00E9A3' },
]

function FooterHeading({ children }: { children: React.ReactNode }) {
  return <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted mb-4">{children}</h4>
}

function FooterLink({ href, children, external }: { href: string; children: React.ReactNode; external?: boolean }) {
  if (external) return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="block text-sm text-secondary hover:text-primary transition-colors py-0.5">{children}</a>
  )
  return (
    <Link href={href} className="block text-sm text-secondary hover:text-primary transition-colors py-0.5">{children}</Link>
  )
}

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-theme mt-16">

      {/* ── Top band ── */}
      <div className="border-b border-theme" style={{ backgroundColor: 'var(--surface)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Logo mark */}
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="3" y="21" width="26" height="3.5" rx="1.75" fill="var(--accent)" />
              <rect x="3" y="13.5" width="20" height="2.5" rx="1.25" fill="var(--accent)" opacity="0.55" />
              <rect x="3" y="7" width="14" height="2" rx="1" fill="var(--accent)" opacity="0.28" />
              <circle cx="26" cy="14.75" r="3.75" fill="#10B981" />
              <path d="M24.7 14.75L26 16.1L27.8 13.9" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <span className="font-display font-bold text-xl text-primary tracking-tight">FreeShelf</span>
              <p className="text-sm text-muted mt-0.5 max-w-xs">Never miss a free game. Every platform. Updated hourly.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {FREE_PLATFORMS.map(p => {
              const meta = PLATFORMS[p]
              return (
                <Link key={p} href={`/platform/${p}`} title={meta.label}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border border-theme bg-surface hover:border-theme-hover hover:text-primary text-muted transition-all">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
                  {meta.label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">

          <div>
            <FooterHeading>Platforms</FooterHeading>
            <nav className="space-y-0.5">
              {FREE_PLATFORMS.map(p => (
                <FooterLink key={p} href={`/platform/${p}`}>{PLATFORMS[p].label}</FooterLink>
              ))}
            </nav>
          </div>

          <div>
            <FooterHeading>Browse</FooterHeading>
            <nav className="space-y-0.5">
              {FEATURED_GENRES.map(g => (
                <FooterLink key={g.slug} href={`/genre/${g.slug}`}>{g.label}</FooterLink>
              ))}
            </nav>
            <div className="mt-4 pt-4 border-t border-theme space-y-0.5">
              {FEATURES.map(l => (
                <FooterLink key={l.href} href={l.href}>{l.label}</FooterLink>
              ))}
            </div>
          </div>

          <div className="col-span-2">
            <FooterHeading>Powered By</FooterHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              {POWERED_BY.map(svc => (
                <a key={svc.name} href={svc.url} target="_blank" rel="noopener noreferrer"
                  className="group flex items-start gap-2.5 hover:opacity-80 transition-opacity">
                  <span className="mt-1 shrink-0 w-2 h-2 rounded-full" style={{ backgroundColor: svc.color }} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-primary group-hover:text-accent transition-colors">{svc.name}</span>
                      <span className="text-[9px] font-bold px-1 py-0.5 rounded border leading-none"
                        style={{ color: svc.color, borderColor: svc.color + '40', backgroundColor: svc.color + '12' }}>
                        {svc.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted leading-snug mt-0.5">{svc.desc}</p>
                  </div>
                </a>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[11px] text-muted">All systems live · Updated hourly</span>
            </div>
          </div>

        </div>
      </div>

      {/* ── Bottom strip ── */}
      <div className="border-t border-theme" style={{ backgroundColor: 'var(--surface)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted text-center sm:text-left">
            © {year} FreeShelf — Not affiliated with any game platform.
          </p>
          <p className="text-xs text-muted text-center sm:text-right">
            Built by{' '}
            <a href="https://instagram.com/lonemagma" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">@lonemagma</a>
            {' '}·{' '}
            <a href="https://pacify.site" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">pacify.site</a>
          </p>
        </div>
      </div>
    </footer>
  )
}

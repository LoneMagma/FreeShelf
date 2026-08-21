import { auth }            from '@clerk/nextjs/server'
import { clerkClient }    from '@clerk/nextjs/server'
import { getUserWishlist } from '@/lib/supabase'
import { getCachedDeals }  from '@/lib/kv'
import { fetchEpicDeals }  from '@/lib/fetchers/epic'
import { fetchGOGDeals }   from '@/lib/fetchers/gog'
import { fetchCheapSharkFreeDeals } from '@/lib/fetchers/cheapshark'
import { mergeAndNormalizeDeals }   from '@/lib/fetchers/normalize'
import Header              from '@/components/layout/Header'
import Footer              from '@/components/layout/Footer'
import DealGrid            from '@/components/deals/DealGrid'
import NotificationToggle  from '@/components/NotificationToggle'
import IcofyAvatar         from '@/components/layout/IcofyAvatar'
import type { NormalizedDeal } from '@/types'
import { Heart, Clock, LogIn } from 'lucide-react'
import Link                from 'next/link'

export default async function WishlistPage() {
  const { userId } = await auth()

  if (!userId) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl border border-theme bg-surface flex items-center justify-center mx-auto mb-5">
              <Heart size={24} className="text-muted" />
            </div>
            <h1 className="font-display font-bold text-2xl text-primary mb-2">Your Wishlist</h1>
            <p className="text-secondary text-sm mb-8">
              Sign in to save deals and never miss a free game.
            </p>
            <Link
              href="/sign-in?redirect_url=/wishlist"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold bg-accent-muted border border-[var(--accent)] text-accent hover:opacity-80 transition-opacity"
            >
              <LogIn size={15} />
              Sign in to view wishlist
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Resolve display name for personalised header
  const clerk = await clerkClient()
  let displayName = 'Your'
  try {
    const user = await clerk.users.getUser(userId)
    const name = user.firstName ?? user.emailAddresses[0]?.emailAddress?.split('@')[0]
    if (name) displayName = name
  } catch { /* fallback to 'Your' */ }

  const [wishlist, allDeals] = await Promise.all([
    getUserWishlist(userId),
    (async (): Promise<NormalizedDeal[]> => {
      try {
        // KV cache is warm in production — this is the fast path (always hit)
        const cached = await getCachedDeals()
        if (cached && cached.length > 0) return cached

        // Cold-start fallback: Epic + GOG + CheapShark free deals.
        // ITAD is deliberately NOT used here — /games/prices/v3 is a paid endpoint.
        const [epic, gog, cs] = await Promise.allSettled([
          fetchEpicDeals(),
          fetchGOGDeals(),
          fetchCheapSharkFreeDeals(),
        ])
        const v = <T,>(r: PromiseSettledResult<T>, fb: T): T =>
          r.status === 'fulfilled' ? r.value : fb
        return mergeAndNormalizeDeals([v(epic, []), v(gog, []), v(cs, [])])
      } catch {
        return []
      }
    })(),
  ])

  const now = new Date()
  const pool = allDeals ?? []

  const wishlistedDeals = wishlist
    .map(item => pool.find(d => d.id === item.dealId))
    .filter((d): d is NormalizedDeal => !!d && (!d.endDate || new Date(d.endDate) > now))

  const wishlistedIds = new Set(wishlist.map(i => i.dealId))
  const expiringSoon  = wishlistedDeals.filter(d => d.isExpiringSoon)
  const otherDeals    = wishlistedDeals.filter(d => !d.isExpiringSoon)
  const expiredCount  = wishlist.length - wishlistedDeals.length

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <IcofyAvatar userId={userId} size={40} />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl border border-theme bg-surface flex items-center justify-center">
                <Heart size={16} className="text-red-400 fill-current" />
              </div>
              <div>
                <h1 className="font-display font-bold text-2xl text-primary">
                  {displayName}&apos;s Wishlist
                </h1>
                <p className="text-muted text-sm mt-0.5">
                  {wishlistedDeals.length} active deal{wishlistedDeals.length !== 1 ? 's' : ''} saved
                </p>
              </div>
            </div>
          </div>
          <NotificationToggle />
        </div>

        {wishlistedDeals.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl border border-theme bg-surface flex items-center justify-center mx-auto mb-5">
              <Heart size={24} className="text-muted" />
            </div>
            <h2 className="font-display font-semibold text-xl text-primary mb-2">Nothing saved yet</h2>
            <p className="text-secondary text-sm mb-6">
              Hit the heart on any deal card to save it here.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent-muted border border-[var(--accent)] text-accent font-semibold text-sm hover:opacity-80 transition-opacity"
            >
              Browse Free Games
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            {expiringSoon.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-5">
                  <Clock size={14} className="text-red-400" />
                  <h2 className="font-display font-semibold text-base text-primary">
                    Expiring Soon — Claim Now
                  </h2>
                </div>
                <DealGrid deals={expiringSoon} wishlistedIds={wishlistedIds} />
              </section>
            )}
            {otherDeals.length > 0 && (
              <section>
                {expiringSoon.length > 0 && (
                  <h2 className="font-display font-semibold text-base text-primary mb-5">
                    Saved Deals
                  </h2>
                )}
                <DealGrid deals={otherDeals} wishlistedIds={wishlistedIds} />
              </section>
            )}
            {expiredCount > 0 && (
              <p className="text-sm text-muted text-center pt-4 border-t border-theme">
                {expiredCount} saved deal{expiredCount !== 1 ? 's have' : ' has'} expired.
              </p>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

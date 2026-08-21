/**
 * Email notifications via Resend.
 * Free tier: 3,000 emails/month, 100/day — more than enough.
 * Sign up at resend.com, verify your domain, get an API key.
 */

import { Resend } from 'resend'
import { render } from '@react-email/components'
import { createElement } from 'react'
import WishlistAlert from '@/emails/WishlistAlert'
import type { NormalizedDeal } from '@/types'

// ── Resend client (lazy init) ─────────────────────────────────────────
let _resend: Resend | null = null
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

// ── Unsubscribe token helpers ─────────────────────────────────────────
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function getOrCreateUnsubToken(userId: string): Promise<string> {
  const db = getDb()
  const { data } = await db
    .from('unsubscribe_tokens')
    .select('token')
    .eq('user_id', userId)
    .single()

  if (data?.token) return data.token

  const token = crypto.randomBytes(32).toString('hex')
  await db.from('unsubscribe_tokens').upsert({ token, user_id: userId })
  return token
}

// ── Check which deals have already been notified ──────────────────────
export async function getAlreadyNotifiedDealIds(userId: string): Promise<Set<string>> {
  const db = getDb()
  const { data } = await db
    .from('email_notifications_sent')
    .select('deal_id')
    .eq('user_id', userId)

  return new Set((data ?? []).map(r => r.deal_id))
}

export async function markDealsNotified(userId: string, dealIds: string[]): Promise<void> {
  if (dealIds.length === 0) return
  const db = getDb()
  await db.from('email_notifications_sent').upsert(
    dealIds.map(deal_id => ({ user_id: userId, deal_id })),
    { onConflict: 'user_id,deal_id' }
  )
}

// ── Main send function ────────────────────────────────────────────────
export interface UserToNotify {
  userId:     string
  email:      string
  firstName:  string | null
  dealIds:    string[]   // wishlist deal IDs for this user
}

export async function sendWishlistAlerts(
  usersToNotify: UserToNotify[],
  currentFreeDeals: NormalizedDeal[],
): Promise<{ sent: number; skipped: number; errors: number }> {
  const resend = getResend()
  if (!resend) {
    console.warn('[Email] RESEND_API_KEY not set — skipping notifications')
    return { sent: 0, skipped: 0, errors: 0 }
  }

  const siteUrl   = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://freeshelf.app'
  const fromEmail = process.env.RESEND_FROM_EMAIL    ?? 'FreeShelf <alerts@freeshelf.app>'

  // Index free deals by ID for quick lookup
  const freeById = new Map(currentFreeDeals.map(d => [d.id, d]))

  let sent = 0, skipped = 0, errors = 0

  for (const user of usersToNotify) {
    try {
      // Find which of this user's wishlist items are currently free
      const alreadySent    = await getAlreadyNotifiedDealIds(user.userId)
      const newFreeDeals   = user.dealIds
        .map(id => freeById.get(id))
        .filter((d): d is NormalizedDeal => !!d && !alreadySent.has(d.id))

      if (newFreeDeals.length === 0) {
        skipped++
        continue
      }

      // Generate unsubscribe URL
      const token        = await getOrCreateUnsubToken(user.userId)
      const unsubUrl     = `${siteUrl}/api/unsubscribe?token=${token}`

      // Render email
      const dealItems = newFreeDeals.map(d => ({
        title:         d.title,
        platform:      d.platform,
        originalPrice: d.originalPrice,
        currency:      d.currency,
        coverImage:    d.coverImage,
        claimUrl:      d.claimUrl,
        endDate:       d.endDate,
        hoursLeft:     d.hoursLeft,
      }))

      const html = await render(
        createElement(WishlistAlert, {
          userName:       user.firstName ?? user.email.split('@')[0],
          deals:          dealItems,
          unsubscribeUrl: unsubUrl,
          siteUrl,
        })
      )

      const subject = newFreeDeals.length === 1
        ? `🎮 ${newFreeDeals[0].title} is now free — claim it`
        : `🎮 ${newFreeDeals.length} wishlisted games just went free`

      const { error } = await resend.emails.send({
        from:    fromEmail,
        to:      user.email,
        subject,
        html,
      })

      if (error) {
        console.error(`[Email] Failed to send to ${user.email}:`, error)
        errors++
      } else {
        await markDealsNotified(user.userId, newFreeDeals.map(d => d.id))
        console.log(`[Email] Sent to ${user.email}: ${newFreeDeals.map(d => d.title).join(', ')}`)
        sent++
      }
    } catch (err) {
      console.error(`[Email] Error for user ${user.userId}:`, err)
      errors++
    }
  }

  return { sent, skipped, errors }
}

/**
 * POST /api/cron/notify
 *
 * Runs every 2 hours (see vercel.json).
 * For every user with notify_email=true, checks if any of their wishlisted
 * games are currently free and sends an email if so.
 *
 * Deduplication: Supabase `email_notifications_sent` prevents re-sending
 * the same deal to the same user.
 *
 * ID normalisation:
 *   Wishlist entries can use several ID prefixes depending on where the user
 *   clicked the heart button:
 *     cs-12345          → from DealCard (homepage/sale section)
 *     cs-sale-12345-1   → from DealCard (sale section, includes storeID)
 *     game-12345        → from GameDetailClient
 *     search-12345      → from SearchClient
 *   All of these map to CheapShark gameID 12345.
 *   Non-CheapShark deals (epic-*, gog-*, itch-*) match by exact deal ID
 *   against the KV-cached free deal list.
 *
 * Security: requires CRON_SECRET header in production.
 */

import { NextRequest, NextResponse } from 'next/server'
import { clerkClient }               from '@clerk/nextjs/server'
import { createClient }              from '@supabase/supabase-js'
import { getCachedDeals }            from '@/lib/kv'
import { fetchCheapSharkFreeDeals }  from '@/lib/fetchers/cheapshark'
import { mergeAndNormalizeDeals }    from '@/lib/fetchers/normalize'
import { sendWishlistAlerts }        from '@/lib/email'
import type { NormalizedDeal }       from '@/types'

export const dynamic     = 'force-dynamic'
export const maxDuration = 60

// ── Auth ──────────────────────────────────────────────────────────────

function isAuthorised(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  const header = req.headers.get('authorization') ?? ''
  return header === `Bearer ${secret}`
}

// ── Supabase helpers ──────────────────────────────────────────────────

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

interface WishlistRow {
  user_id:    string
  deal_id:    string
  deal_title: string
}

async function getNotifyUsers(): Promise<string[]> {
  const db = getDb()
  const { data, error } = await db
    .from('user_preferences')
    .select('user_id')
    .eq('notify_email', true)

  if (error) {
    console.error('[cron/notify] getNotifyUsers error:', error.message)
    return []
  }
  return (data ?? []).map((r: { user_id: string }) => r.user_id)
}

async function getWishlistForUsers(
  userIds: string[],
): Promise<Map<string, WishlistRow[]>> {
  if (userIds.length === 0) return new Map()
  const db = getDb()

  const { data, error } = await db
    .from('wishlist')
    .select('user_id, deal_id, deal_title')
    .in('user_id', userIds)

  if (error) {
    console.error('[cron/notify] getWishlistForUsers error:', error.message)
    return new Map()
  }

  const map = new Map<string, WishlistRow[]>()
  for (const row of (data ?? []) as WishlistRow[]) {
    const list = map.get(row.user_id) ?? []
    list.push(row)
    map.set(row.user_id, list)
  }
  return map
}

// ── ID normalisation ──────────────────────────────────────────────────

/**
 * Extracts the CheapShark integer gameID from any of our wishlist ID formats.
 * Returns null for non-CheapShark IDs (epic-*, gog-*, itch-* etc.)
 */
function extractCsGameId(dealId: string): string | null {
  // Handles: cs-12345, cs-sale-12345-1, game-12345, search-12345
  const m = dealId.match(/^(?:cs-(?:sale-)?|game-|search-)(\d+)/)
  return m ? m[1] : null
}

/**
 * Resolves a user's wishlist deal IDs to canonical deal IDs that exist in
 * `freeDeals`. This handles the mismatch between wishlist ID prefixes and
 * the IDs stored in the free-deal cache.
 *
 * Returns only IDs that have a matching free deal right now.
 */
function resolveToFreeDeals(
  wishlistIds: string[],
  freeDeals: NormalizedDeal[],
): string[] {
  // Exact-match index
  const byId = new Map(freeDeals.map(d => [d.id, d]))

  // CheapShark gameID → deal (for cross-prefix matching)
  const byGameId = new Map<string, NormalizedDeal>()
  for (const d of freeDeals) {
    const m = d.id.match(/^cs-(?:sale-)?(\d+)/)
    if (m) byGameId.set(m[1], d)
  }

  const resolved = new Set<string>()

  for (const wid of wishlistIds) {
    // 1. Direct match (e.g. user wishlisted from DealCard, ID is identical)
    if (byId.has(wid)) {
      resolved.add(wid)
      continue
    }

    // 2. Cross-prefix match via CheapShark gameID
    const csId = extractCsGameId(wid)
    if (csId) {
      const d = byGameId.get(csId)
      if (d) resolved.add(d.id)
    }
    // Non-CheapShark IDs (epic-*, gog-*, itch-*) that didn't direct-match
    // mean the deal is no longer in the free cache → no notification.
  }

  return Array.from(resolved)
}

// ── Main handler ──────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isAuthorised(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Guard: skip silently if email is not configured
  if (!process.env.RESEND_API_KEY) {
    console.warn('[cron/notify] RESEND_API_KEY not set — skipping')
    return NextResponse.json({ ok: true, skipped: 'no_resend_key' })
  }

  const start = Date.now()
  console.log('[cron/notify] Starting notification run…')

  // ── 1. Get current free deals ─────────────────────────────────────
  // Try KV first (populated by the refresh cron). If cold, fetch live.
  let freeDeals: NormalizedDeal[] = []
  try {
    const cached = await getCachedDeals()
    if (cached && cached.length > 0) {
      freeDeals = cached
      console.log(`[cron/notify] Using KV cache: ${freeDeals.length} free deals`)
    } else {
      console.log('[cron/notify] KV cold — fetching live from CheapShark')
      const live = await fetchCheapSharkFreeDeals()
      freeDeals  = mergeAndNormalizeDeals([live])
      console.log(`[cron/notify] Live fetch: ${freeDeals.length} free deals`)
    }
  } catch (err) {
    console.error('[cron/notify] Failed to get free deals:', err)
    return NextResponse.json({ error: 'Failed to get deals' }, { status: 500 })
  }

  if (freeDeals.length === 0) {
    console.log('[cron/notify] No free deals — nothing to notify')
    return NextResponse.json({ ok: true, sent: 0, skipped: 0, errors: 0, ms: Date.now() - start })
  }

  // ── 2. Get users who want notifications ───────────────────────────
  const userIds = await getNotifyUsers()
  if (userIds.length === 0) {
    console.log('[cron/notify] No users with notify_email=true')
    return NextResponse.json({ ok: true, sent: 0, skipped: 0, errors: 0, ms: Date.now() - start })
  }
  console.log(`[cron/notify] ${userIds.length} users with notifications enabled`)

  // ── 3. Get all their wishlists in one query ───────────────────────
  const wishlistMap = await getWishlistForUsers(userIds)

  // ── 4. Build UserToNotify[] ───────────────────────────────────────
  // Requires email + firstName from Clerk (one API call per user).
  const clerk = await clerkClient()

  const usersToNotify: {
    userId:    string
    email:     string
    firstName: string | null
    dealIds:   string[]
  }[] = []

  for (const userId of userIds) {
    const wishlistRows = wishlistMap.get(userId) ?? []
    if (wishlistRows.length === 0) continue

    // Resolve wishlist IDs to canonical free-deal IDs
    const rawIds     = wishlistRows.map(r => r.deal_id)
    const resolvedIds = resolveToFreeDeals(rawIds, freeDeals)

    // No wishlisted games are currently free — skip this user
    if (resolvedIds.length === 0) continue

    // Get user email from Clerk
    try {
      const clerkUser = await clerk.users.getUser(userId)
      const email     = clerkUser.emailAddresses[0]?.emailAddress
      if (!email) {
        console.warn(`[cron/notify] No email for user ${userId} — skipping`)
        continue
      }
      usersToNotify.push({
        userId,
        email,
        firstName: clerkUser.firstName ?? null,
        dealIds:   resolvedIds,
      })
    } catch (err) {
      console.error(`[cron/notify] Clerk lookup failed for ${userId}:`, err)
    }
  }

  console.log(`[cron/notify] ${usersToNotify.length} users with free wishlisted games`)

  // ── 5. Send emails ────────────────────────────────────────────────
  // sendWishlistAlerts handles dedup via email_notifications_sent table
  // and marks deals as notified after sending.
  const { sent, skipped, errors } = await sendWishlistAlerts(
    usersToNotify,
    freeDeals,
  )

  const ms = Date.now() - start
  console.log(`[cron/notify] Done — sent=${sent} skipped=${skipped} errors=${errors} ms=${ms}`)

  return NextResponse.json({ ok: true, sent, skipped, errors, ms })
}

export async function GET(req: NextRequest) {
  return POST(req)
}

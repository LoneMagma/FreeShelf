import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { WishlistItem, UserPreferences } from '@/types'

// ─── Client factories ─────────────────────────────────────────────────

function isConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

function serverClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

let _browserClient: SupabaseClient | null = null
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null
  }
  if (!_browserClient) {
    _browserClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  }
  return _browserClient
}

// ─── Wishlist ─────────────────────────────────────────────────────────

export async function getUserWishlist(userId: string): Promise<WishlistItem[]> {
  if (!isConfigured()) return []
  const db = serverClient()
  const { data, error } = await db
    .from('wishlist')
    .select('*')
    .eq('user_id', userId)
    .order('added_at', { ascending: false })

  if (error) { console.error('[Supabase] getUserWishlist:', error.message); return [] }
  return (data ?? []).map(rowToWishlistItem)
}

export async function addToWishlist(
  userId: string,
  dealId: string,
  dealTitle: string,
  platform: string
): Promise<WishlistItem | null> {
  if (!isConfigured()) return null
  const db = serverClient()
  const { data, error } = await db
    .from('wishlist')
    .upsert(
      { user_id: userId, deal_id: dealId, deal_title: dealTitle, platform, added_at: new Date().toISOString() },
      { onConflict: 'user_id,deal_id' }
    )
    .select()
    .single()

  if (error) { console.error('[Supabase] addToWishlist:', error.message); return null }
  return rowToWishlistItem(data)
}

export async function removeFromWishlist(userId: string, dealId: string): Promise<boolean> {
  if (!isConfigured()) return false
  const db = serverClient()
  const { error } = await db
    .from('wishlist')
    .delete()
    .eq('user_id', userId)
    .eq('deal_id', dealId)

  if (error) { console.error('[Supabase] removeFromWishlist:', error.message); return false }
  return true
}

export async function getWishlistIds(userId: string): Promise<Set<string>> {
  const items = await getUserWishlist(userId)
  return new Set(items.map(i => i.dealId))
}

// ─── User Preferences ─────────────────────────────────────────────────

export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  if (!isConfigured()) return null
  const db = serverClient()
  const { data, error } = await db
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) return null
  return {
    userId: data.user_id,
    favoriteGenres: data.favorite_genres ?? [],
    favoritePlatforms: data.favorite_platforms ?? [],
    notifyEmail: data.notify_email ?? false,
    theme: data.theme ?? 'dark',
  }
}

export async function upsertUserPreferences(prefs: UserPreferences): Promise<boolean> {
  if (!isConfigured()) return false
  const db = serverClient()
  const { error } = await db.from('user_preferences').upsert({
    user_id: prefs.userId,
    favorite_genres: prefs.favoriteGenres,
    favorite_platforms: prefs.favoritePlatforms,
    notify_email: prefs.notifyEmail,
    theme: prefs.theme,
    updated_at: new Date().toISOString(),
  })
  if (error) { console.error('[Supabase] upsertUserPreferences:', error.message); return false }
  return true
}

// ─── Deal History ─────────────────────────────────────────────────────

export async function recordDealSnapshot(
  deals: { id: string; title: string; platform: string; originalPrice: number; endDate: string | null }[]
) {
  if (!isConfigured() || deals.length === 0) return
  const db = serverClient()
  const rows = deals.map(d => ({
    deal_id: d.id,
    title: d.title,
    platform: d.platform,
    original_price: d.originalPrice,
    end_date: d.endDate,
    seen_at: new Date().toISOString(),
  }))
  const { error } = await db.from('deal_history').upsert(rows, { onConflict: 'deal_id,seen_at' })
  if (error) console.error('[Supabase] recordDealSnapshot:', error.message)
}

// ─── Helper ───────────────────────────────────────────────────────────

function rowToWishlistItem(row: Record<string, unknown>): WishlistItem {
  return {
    id:        String(row.id),
    userId:    String(row.user_id),
    dealId:    String(row.deal_id),
    dealTitle: String(row.deal_title),
    platform:  row.platform as WishlistItem['platform'],
    addedAt:   String(row.added_at),
  }
}

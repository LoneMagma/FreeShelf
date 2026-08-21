import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// GET /api/unsubscribe?token=xxx — one-click unsubscribe
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.redirect(new URL('/?unsub=invalid', request.url))
  }

  const db = getDb()

  // Find user from token
  const { data: tokenRow } = await db
    .from('unsubscribe_tokens')
    .select('user_id')
    .eq('token', token)
    .single()

  if (!tokenRow) {
    return NextResponse.redirect(new URL('/?unsub=invalid', request.url))
  }

  // Disable notifications
  await db
    .from('user_preferences')
    .upsert({
      user_id:      tokenRow.user_id,
      notify_email: false,
      updated_at:   new Date().toISOString(),
    })

  return NextResponse.redirect(new URL('/?unsub=success', request.url))
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserPreferences, upsertUserPreferences } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const prefs = await getUserPreferences(userId)
  return NextResponse.json({ prefs: prefs ?? { userId, notifyEmail: false } })
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const ok = await upsertUserPreferences({
    userId,
    favoriteGenres:    [],
    favoritePlatforms: [],
    notifyEmail:       !!body.notifyEmail,
    theme:             'dark',
  })
  return NextResponse.json({ ok })
}

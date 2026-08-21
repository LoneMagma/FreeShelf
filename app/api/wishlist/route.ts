import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserWishlist, addToWishlist } from '@/lib/supabase'

export async function GET() {
  // FIX: await auth() — Clerk v5 made this async. Without await, userId is always
  // undefined, causing every wishlist request to return 401 even when logged in.
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const wishlist = await getUserWishlist(userId)
  return NextResponse.json({ wishlist })
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { dealId, dealTitle, platform } = body

  if (!dealId || !dealTitle || !platform) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const item = await addToWishlist(userId, dealId, dealTitle, platform)

  if (!item) {
    return NextResponse.json({ error: 'Failed to add to wishlist' }, { status: 500 })
  }

  return NextResponse.json({ item }, { status: 201 })
}

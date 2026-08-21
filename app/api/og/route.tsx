import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const title = searchParams.get('title') ?? 'Free PC Games Right Now'
  const count = searchParams.get('count') ?? ''

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px', height: '630px',
          background: '#0A0A0F',
          display: 'flex', flexDirection: 'column',
          alignItems: 'flex-start', justifyContent: 'center',
          padding: '80px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Grid texture suggestion */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 70% 50%, rgba(99,102,241,0.12) 0%, transparent 60%)',
        }} />

        {/* Logo mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '40px' }}>
          <div style={{
            width: '48px', height: '48px',
            background: '#111118',
            border: '1px solid #1E1E2E',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <rect x="3" y="21" width="26" height="3.5" rx="1.75" fill="#6366F1"/>
              <rect x="3" y="13.5" width="20" height="2.5" rx="1.25" fill="#6366F1" opacity="0.55"/>
              <rect x="3" y="7" width="14" height="2" rx="1" fill="#6366F1" opacity="0.28"/>
              <circle cx="26" cy="14.75" r="3.75" fill="#10B981"/>
            </svg>
          </div>
          <span style={{ color: '#F0F0FF', fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em' }}>
            FreeShelf
          </span>
        </div>

        <div style={{ color: '#F0F0FF', fontSize: '64px', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, maxWidth: '800px' }}>
          {title}
        </div>

        {count && (
          <div style={{
            marginTop: '28px',
            background: 'rgba(16,185,129,0.12)',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: '100px',
            padding: '8px 20px',
            color: '#10B981',
            fontSize: '20px',
            fontWeight: 700,
          }}>
            {count} free right now
          </div>
        )}

        <div style={{ position: 'absolute', bottom: '40px', right: '80px', color: '#6B6B85', fontSize: '16px' }}>
          freeshelf.app
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}

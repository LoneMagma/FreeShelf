'use client'

import { getIcofyUrl } from '@/lib/icofy'

interface IcofyAvatarProps {
  userId:     string
  size?:      number
  className?: string
}

/**
 * Renders the user's deterministic Icofy pixel-art identicon.
 *
 * No API key required — icofy.vercel.app is a public, no-auth API.
 * The userId is used as the seed so each user gets a unique, consistent icon.
 *
 * Renders nothing if userId is empty or the image fails to load.
 */
export default function IcofyAvatar({ userId, size = 28, className }: IcofyAvatarProps) {
  // Build URL at render time — deterministic, no useEffect needed
  const src = getIcofyUrl(userId, { size: size * 2, grid: 5 })  // 2× for retina

  if (!src) return null

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Your identicon"
      width={size}
      height={size}
      className={className}
      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
      style={{
        width:           size,
        height:          size,
        borderRadius:    '50%',
        border:          '1.5px solid var(--border)',
        display:         'block',
        flexShrink:      0,
        imageRendering:  'pixelated',   // keeps pixel art crisp at small sizes
      }}
    />
  )
}

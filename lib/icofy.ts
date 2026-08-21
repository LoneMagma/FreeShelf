/**
 * Icofy — deterministic pixel-art identicon generator.
 * https://icofy.vercel.app
 *
 * PUBLIC API — no API key, no auth, no account required.
 * Format: https://icofy.vercel.app/api/icon/{input}?size={px}
 *
 * Same input always produces the same icon — deterministic by design.
 * Images are PNG, rendered on demand, cached at edge for 1 year.
 *
 * We use the Clerk userId as the input so each user gets a unique,
 * consistent identicon that's "theirs" from the moment they sign up.
 */

const ICOFY_BASE = 'https://icofy.vercel.app/api/icon'

interface IcofyOptions {
  size?:  number   // px, default 80, max 512
  bg?:    string   // background hex without #, omit for transparent
  grid?:  4 | 5 | 6 | 7   // pixel density, default 5
  style?: 0 | 1 | 2 | 3   // 0=Classic 1=Dense 2=Sparse 3=Border
}

/**
 * Returns the URL for a user's Icofy identicon.
 * Use directly as an <img> src — no fetching needed.
 *
 * @param seed  Any string — we use Clerk userId
 * @param opts  Optional size/bg/grid/style overrides
 */
export function getIcofyUrl(seed: string, opts: IcofyOptions = {}): string | null {
  if (!seed) return null

  const params = new URLSearchParams()
  if (opts.size)  params.set('size',  String(opts.size))
  if (opts.bg)    params.set('bg',    opts.bg)
  if (opts.grid)  params.set('grid',  String(opts.grid))
  if (opts.style !== undefined) params.set('style', String(opts.style))

  const qs = params.toString()
  return `${ICOFY_BASE}/${encodeURIComponent(seed)}${qs ? `?${qs}` : ''}`
}

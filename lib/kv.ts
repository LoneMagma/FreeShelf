/**
 * KV Cache
 * - Local dev (no env vars): pure in-memory Map, zero setup
 * - Production: Upstash Redis singleton (no reconnect per call)
 *
 * Supports both Vercel KV env var names and Upstash direct names.
 */
import type { NormalizedDeal } from '@/types'

// ─── In-memory fallback ───────────────────────────────────────────────
const mem = new Map<string, { v: unknown; exp: number }>()

const memory = {
  get<T>(key: string): T | null {
    const e = mem.get(key)
    if (!e) return null
    if (Date.now() > e.exp) { mem.delete(key); return null }
    return e.v as T
  },
  set(key: string, value: unknown, ttl: number) {
    mem.set(key, { v: value, exp: Date.now() + ttl * 1000 })
  },
  del(key: string) { mem.delete(key) },
}

// ─── Upstash Redis singleton ─────────────────────────────────────────
let _redis: import('@upstash/redis').Redis | null = null

async function getRedis() {
  // Vercel KV uses KV_REST_API_URL / KV_REST_API_TOKEN
  // Direct Upstash uses UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
  const url =
    process.env.KV_REST_API_URL ??
    process.env.freeshelf_KV_REST_API_URL ??
    process.env.UPSTASH_REDIS_REST_URL

  const token =
    process.env.KV_REST_API_TOKEN ??
    process.env.freeshelf_KV_REST_API_TOKEN ??
    process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) return null
  if (_redis) return _redis

  try {
    const { Redis } = await import('@upstash/redis')
    _redis = new Redis({ url, token })
    return _redis
  } catch {
    return null
  }
}

// ─── Unified get / set / del ─────────────────────────────────────────
async function kvGet<T>(key: string): Promise<T | null> {
  const redis = await getRedis()
  if (redis) {
    try { return await redis.get<T>(key) } catch { /* fall through */ }
  }
  return memory.get<T>(key)
}

async function kvSet(key: string, value: unknown, ttl: number) {
  const redis = await getRedis()
  if (redis) {
    try { await redis.set(key, value, { ex: ttl }); return } catch { /* fall through */ }
  }
  memory.set(key, value, ttl)
}

async function kvDel(key: string) {
  const redis = await getRedis()
  if (redis) {
    try { await redis.del(key); return } catch { /* fall through */ }
  }
  memory.del(key)
}

// ─── TTLs (25h — survives daily cron gaps even if one run fails) ─────
const TTL = { DEALS: 90000, FLASH: 3600, META: 90000 }

const KEYS = {
  FREE:    'v2:deals:free',
  FLASH:   'v2:deals:flash',
  SALE:    'v2:deals:sale',
  FETCHED: 'v2:meta:lastFetched',
}

// ─── Public API ──────────────────────────────────────────────────────
export const getFreeDeals   = () => kvGet<NormalizedDeal[]>(KEYS.FREE)
export const setFreeDeals   = (d: NormalizedDeal[]) => kvSet(KEYS.FREE, d, TTL.DEALS)

export const getFlashDeals  = () => kvGet<NormalizedDeal[]>(KEYS.FLASH)
export const setFlashDeals  = (d: NormalizedDeal[]) => kvSet(KEYS.FLASH, d, TTL.FLASH)

export const getSaleDeals   = () => kvGet<NormalizedDeal[]>(KEYS.SALE)
export const setSaleDeals   = (d: NormalizedDeal[]) => kvSet(KEYS.SALE, d, TTL.DEALS)

export const getLastFetched = () => kvGet<string>(KEYS.FETCHED)
export const setLastFetched = () => kvSet(KEYS.FETCHED, new Date().toISOString(), TTL.META)

export const invalidateCache = async () => {
  await Promise.all([
    kvDel(KEYS.FREE),
    kvDel(KEYS.FLASH),
    kvDel(KEYS.SALE),
    kvDel(KEYS.FETCHED),
  ])
}

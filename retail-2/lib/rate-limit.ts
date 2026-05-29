/**
 * lib/rate-limit.ts
 *
 * Lightweight in-memory rate limiter for auth endpoints.
 * Uses a sliding-window counter keyed by IP address.
 *
 * ⚠️  AWS MULTI-INSTANCE WARNING
 * This store is process-local. With multiple ECS tasks or App Runner
 * instances, each replica has its own counter — an attacker can bypass
 * the limit by round-robining across instances.
 *
 * For production multi-instance deployments, swap this for a Redis-backed
 * implementation using AWS ElastiCache (Redis OSS). Drop-in replacement:
 *
 *   npm install @upstash/ratelimit @upstash/redis
 *   # or use ioredis pointing at your ElastiCache endpoint
 *
 * Add to .env:
 *   REDIS_URL=rediss://:token@your-cluster.cache.amazonaws.com:6379
 *
 * Single-instance deployments (one App Runner instance, one ECS task)
 * are safe with this in-memory implementation.
 *
 * Usage:
 *   const result = rateLimit('login', ip, { limit: 10, windowMs: 60_000 })
 *   if (!result.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
 */

interface Window {
  count: number
  resetAt: number
}

const store = new Map<string, Window>()

// Clean up expired entries every 5 minutes to prevent unbounded memory growth.
// .unref() ensures this timer does not prevent Node.js from exiting on SIGTERM
// (important for graceful container shutdown in ECS / App Runner).
setInterval(() => {
  const now = Date.now()
  for (const [key, win] of store) {
    if (now > win.resetAt) store.delete(key)
  }
}, 5 * 60_000).unref()

export interface RateLimitOptions {
  /** Max requests allowed in the window. */
  limit: number
  /** Window duration in milliseconds. */
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

/**
 * Check whether a given IP is within the rate limit for a named action.
 * The key is `action:ip` so different endpoints have independent counters.
 */
export function rateLimit(
  action: string,
  ip: string,
  options: RateLimitOptions,
): RateLimitResult {
  const key = `${action}:${ip}`
  const now = Date.now()

  let win = store.get(key)

  // Start a fresh window if none exists or the previous one has expired.
  if (!win || now > win.resetAt) {
    win = { count: 0, resetAt: now + options.windowMs }
    store.set(key, win)
  }

  win.count += 1
  const allowed = win.count <= options.limit
  const remaining = Math.max(0, options.limit - win.count)

  return { allowed, remaining, resetAt: win.resetAt }
}

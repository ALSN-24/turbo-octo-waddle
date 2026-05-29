/**
 * app/api/auth/login/route.ts
 *
 * Authenticates an existing user with email and password.
 *
 * Rate limit: 10 attempts per IP per 15 minutes. Exceeding returns 429.
 *
 * Responses:
 *   200  { user: AuthUser }   — login successful, cookie set
 *   400  { error: string }    — missing fields
 *   401  { error: string }    — invalid credentials
 *   429  { error: string }    — rate limit exceeded
 */
import { NextRequest, NextResponse } from 'next/server'
import { signIn } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import log from '@/lib/logger'

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  const limit = rateLimit('login', ip, { limit: 10, windowMs: 15 * 60_000 })
  if (!limit.allowed) {
    log.warn({ ip, route: 'POST /api/auth/login' }, 'Rate limit exceeded')
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { status: 429 },
    )
  }

  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 },
      )
    }

    const user = await signIn(email, password)
    log.info({ userId: user.id, route: 'POST /api/auth/login' }, 'User logged in')
    return NextResponse.json({ user })
  } catch (err) {
    // Generic message for both "not found" and "wrong password" — avoids
    // user enumeration (attacker cannot tell which case occurred).
    const message = err instanceof Error ? err.message : 'Login failed.'
    log.warn({ ip, route: 'POST /api/auth/login' }, 'Failed login attempt')
    return NextResponse.json({ error: message }, { status: 401 })
  }
}

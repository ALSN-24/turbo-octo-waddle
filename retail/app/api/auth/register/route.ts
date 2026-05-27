/**
 * app/api/auth/register/route.ts
 *
 * Creates a new user account and immediately signs them in.
 *
 * Gate: Requires ALLOW_REGISTRATION=true (default) in environment.
 *       Set ALLOW_REGISTRATION=false to disable public sign-up for
 *       internal deployments where accounts are provisioned by admins.
 *
 * Rate limit: 5 registrations per IP per 10 minutes.
 *
 * Responses:
 *   201  { user: AuthUser }   — account created, cookie set
 *   400  { error: string }    — validation failure or duplicate email
 *   403  { error: string }    — registration disabled
 *   429  { error: string }    — rate limit exceeded
 */
import { NextRequest, NextResponse } from 'next/server'
import { createUser, createSession } from '@/lib/auth'
import { ALLOW_REGISTRATION } from '@/lib/env'
import { rateLimit } from '@/lib/rate-limit'
import log from '@/lib/logger'

export async function POST(request: NextRequest) {
  // Block registration entirely when the feature flag is off.
  if (!ALLOW_REGISTRATION) {
    return NextResponse.json(
      { error: 'Registration is disabled. Contact an administrator.' },
      { status: 403 },
    )
  }

  // Rate limit: 5 attempts per IP per 10 minutes.
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  const limit = rateLimit('register', ip, { limit: 5, windowMs: 10 * 60_000 })
  if (!limit.allowed) {
    log.warn({ ip, route: 'POST /api/auth/register' }, 'Rate limit exceeded')
    return NextResponse.json(
      { error: 'Too many registration attempts. Please try again later.' },
      { status: 429 },
    )
  }

  try {
    const { email, password, name } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 },
      )
    }

    // Minimum length check before bcrypt (cost 12) to avoid slow hashing
    // on obviously invalid inputs.
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 },
      )
    }

    const user = await createUser(email, password, name)
    await createSession(user)

    log.info({ userId: user.id, route: 'POST /api/auth/register' }, 'User registered')
    return NextResponse.json({ user }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Registration failed.'
    log.error({ err, route: 'POST /api/auth/register' }, message)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

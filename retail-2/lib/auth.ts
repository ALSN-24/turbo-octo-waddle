/**
 * lib/auth.ts
 *
 * Credential-based authentication backed by MySQL.
 * Passwords are hashed with bcryptjs.
 * Sessions are signed JWT cookies (via jose).
 */

import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { query, queryOne } from './mysql/db'
import '@/lib/env'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: string
  email: string
  name: string | null
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COOKIE_NAME = 'crm_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

function getSecret(): Uint8Array {
  return new TextEncoder().encode(process.env.JWT_SECRET!)
}

// ---------------------------------------------------------------------------
// Password helpers  (dynamic import so bcryptjs is server-only)
// ---------------------------------------------------------------------------

async function hashPassword(plain: string): Promise<string> {
  const bcrypt = await import('bcryptjs')
  return bcrypt.hash(plain, 12)
}

async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs')
  return bcrypt.compare(plain, hash)
}

// ---------------------------------------------------------------------------
// User operations
// ---------------------------------------------------------------------------

export async function getUserByEmail(email: string): Promise<(AuthUser & { password_hash: string }) | null> {
  return queryOne<AuthUser & { password_hash: string }>(
    'SELECT id, email, name, password_hash FROM users WHERE email = ?',
    [email],
  )
}

export async function createUser(email: string, password: string, name?: string): Promise<AuthUser> {
  const id = crypto.randomUUID()
  const password_hash = await hashPassword(password)

  try {
    await query(
      'INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)',
      [id, email, password_hash, name ?? null],
    )
  } catch (err) {
    // MySQL error 1062 = duplicate entry (unique constraint violation)
    if (err instanceof Error && err.message.includes('Duplicate entry')) {
      throw new Error('A user with that email already exists.')
    }
    throw err
  }

  return { id, email, name: name ?? null }
}

// ---------------------------------------------------------------------------
// Session — sign & persist
// ---------------------------------------------------------------------------

export async function signIn(email: string, password: string): Promise<AuthUser> {
  const user = await getUserByEmail(email)
  if (!user) throw new Error('Invalid email or password.')

  const valid = await verifyPassword(password, user.password_hash)
  if (!valid) throw new Error('Invalid email or password.')

  await createSession({ id: user.id, email: user.email, name: user.name })
  return { id: user.id, email: user.email, name: user.name }
}

export async function createSession(user: AuthUser): Promise<void> {
  const token = await new SignJWT({ sub: user.id, email: user.email, name: user.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
}

export async function getSession(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return null

    const { payload } = await jwtVerify(token, getSecret())
    return {
      id: payload.sub as string,
      email: payload.email as string,
      name: (payload.name as string) ?? null,
    }
  } catch {
    return null
  }
}

export async function signOut(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
}

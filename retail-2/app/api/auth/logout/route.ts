/**
 * app/api/auth/logout/route.ts
 *
 * Ends the current user session by expiring the crm_session cookie.
 *
 * The cookie is "expired" by setting it to an empty string with MaxAge=0
 * and an explicit Path=/. Using MaxAge=0 (rather than just deleting the
 * cookie header) is the RFC-correct approach and guarantees all browsers
 * clear the cookie regardless of the path they originally set it on.
 *
 * This route is PUBLIC — no session is required to call it, which means
 * a user whose token has already expired can still safely log out without
 * hitting a 401.
 *
 * Responses:
 *   200  { success: true }  — cookie expired
 */
import { NextResponse } from 'next/server'
import { signOut } from '@/lib/auth'

export async function POST() {
  await signOut()
  return NextResponse.json({ success: true })
}

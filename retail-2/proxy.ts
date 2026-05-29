import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const COOKIE_NAME = 'crm_session'

function getSecret(): Uint8Array {
  return new TextEncoder().encode(process.env.JWT_SECRET!)
}

const PROTECTED_PAGES = ['/', '/customers', '/inventory', '/orders', '/reports']
const AUTH_PAGES = ['/auth/login', '/auth/sign-up']
const PUBLIC_API_PREFIXES = ['/api/auth/', '/api/health']

async function getAuthenticatedUser(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload
  } catch {
    return null
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const user = await getAuthenticatedUser(request)

  if (pathname.startsWith('/api/')) {
    const isPublicApi = PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))
    if (isPublicApi) return NextResponse.next()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    return NextResponse.next()
  }

  const isProtectedPage = PROTECTED_PAGES.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  )
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p))

  if (isProtectedPage && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  if (isAuthPage && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|/favicon.ico|uploads/|/uploads/|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

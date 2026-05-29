/**
 * app/api/customers/route.ts
 *
 * GET /api/customers
 *   Returns paginated customers ordered by created_at DESC.
 *   Query params: ?page=1&limit=20&search=jane
 *
 * POST /api/customers
 *   Creates a new customer. Validates required fields.
 *
 * Authentication: required (enforced by middleware.ts).
 */
import { NextRequest, NextResponse } from 'next/server'
import { getCustomersPaginated, createCustomer } from '@/lib/mysql/queries'
import log from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const page   = Math.max(1, parseInt(searchParams.get('page')  ?? '1', 10))
    const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
    const search = searchParams.get('search') ?? undefined

    const result = await getCustomersPaginated({ page, limit, search })
    return NextResponse.json(result)
  } catch (err) {
    log.error({ err, route: 'GET /api/customers' }, 'Failed to fetch customers')
    return NextResponse.json({ error: 'Failed to fetch customers.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email } = body

    if (!name?.trim())
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
    if (!email?.trim())
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })

    const customer = await createCustomer(body)
    log.info({ customerId: customer?.id, route: 'POST /api/customers' }, 'Customer created')
    return NextResponse.json(customer, { status: 201 })
  } catch (err) {
    log.error({ err, route: 'POST /api/customers' }, 'Failed to create customer')
    const msg =
      err instanceof Error && err.message.includes('Duplicate')
        ? 'A customer with that email already exists.'
        : 'Failed to create customer.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

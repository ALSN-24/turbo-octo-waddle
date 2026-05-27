/**
 * app/api/orders/route.ts
 *
 * GET /api/orders
 *   Returns paginated orders with customer + items.
 *   Query params: ?page=1&limit=20&status=pending
 *
 * POST /api/orders
 *   Creates a new order atomically. Server re-calculates the total from
 *   items to prevent client-side tampering.
 *
 * Authentication: required (enforced by middleware.ts).
 */
import { NextRequest, NextResponse } from 'next/server'
import { getOrdersPaginated, createOrder } from '@/lib/mysql/queries'
import log from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const page  = Math.max(1, parseInt(searchParams.get('page')  ?? '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
    const status = searchParams.get('status') ?? undefined

    const result = await getOrdersPaginated({ page, limit, status })
    return NextResponse.json(result)
  } catch (err) {
    log.error({ err, route: 'GET /api/orders' }, 'Failed to fetch orders')
    return NextResponse.json({ error: 'Failed to fetch orders.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, customer_id, status } = body

    if (!Array.isArray(items) || items.length === 0)
      return NextResponse.json(
        { error: 'Order must contain at least one item.' },
        { status: 400 },
      )

    // Server-side total recalculation — never trust the client-submitted value.
    const serverTotal = items.reduce(
      (sum: number, item: { price: number; quantity: number }) =>
        sum + item.price * item.quantity,
      0,
    )

    const order = await createOrder({
      customer_id: customer_id ?? null,
      status,
      total: serverTotal,
      items,
    })

    log.info({ orderId: order?.id, route: 'POST /api/orders' }, 'Order created')
    return NextResponse.json(order, { status: 201 })
  } catch (err) {
    log.error({ err, route: 'POST /api/orders' }, 'Failed to create order')
    return NextResponse.json({ error: 'Failed to create order.' }, { status: 500 })
  }
}

/**
 * app/api/orders/[id]/route.ts
 *
 * Individual order endpoint.
 *
 * GET /api/orders/:id
 *   Returns a single order with customer and order_items (including product
 *   snapshots). Used by the orders page after creating a new order to
 *   immediately display the complete record.
 *
 * PUT /api/orders/:id
 *   Updates the order status. Only the `status` field can be changed here;
 *   order line items are immutable after creation.
 *   Body: { status: 'pending' | 'processing' | 'completed' | 'cancelled' }
 *
 * DELETE /api/orders/:id
 *   Deletes the order. All related order_items are deleted automatically
 *   via the ON DELETE CASCADE foreign key constraint.
 *
 * Authentication: required (enforced by middleware.ts).
 */
import { NextRequest, NextResponse } from 'next/server'
import { getOrderById, updateOrderStatus, deleteOrder } from '@/lib/mysql/queries'
import type { Order } from '@/lib/types'
import log from '@/lib/logger'

/** All valid order status values — used for input validation on PUT. */
const VALID_STATUSES: Order['status'][] = [
  'pending',
  'processing',
  'completed',
  'cancelled',
]

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const order = await getOrderById(id)
    if (!order)
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
    return NextResponse.json(order)
  } catch (err) {
    log.error({ err, route: 'GET /api/orders/:id' }, 'Failed to fetch order')
    return NextResponse.json({ error: 'Failed to fetch order.' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const existing = await getOrderById(id)
    if (!existing)
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 })

    const body = await request.json()

    // Validate that the status value is one of the allowed enum values.
    // Return the full list in the error message so the caller knows what's valid.
    if (!body.status || !VALID_STATUSES.includes(body.status))
      return NextResponse.json(
        { error: `Status must be one of: ${VALID_STATUSES.join(', ')}.` },
        { status: 400 },
      )

    const order = await updateOrderStatus(id, body.status as Order['status'])
    return NextResponse.json(order)
  } catch (err) {
    log.error({ err, route: 'PUT /api/orders/:id' }, 'Failed to update order')
    return NextResponse.json({ error: 'Failed to update order.' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const existing = await getOrderById(id)
    if (!existing)
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 })

    // order_items rows are deleted automatically via ON DELETE CASCADE.
    await deleteOrder(id)
    return NextResponse.json({ success: true })
  } catch (err) {
    log.error({ err, route: 'DELETE /api/orders/:id' }, 'Failed to delete order')
    return NextResponse.json({ error: 'Failed to delete order.' }, { status: 500 })
  }
}

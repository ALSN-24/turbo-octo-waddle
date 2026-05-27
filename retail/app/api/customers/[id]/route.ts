/**
 * app/api/customers/[id]/route.ts
 *
 * Individual customer endpoint.
 *
 * PUT /api/customers/:id
 *   Partially updates a customer. Only fields present in the body are updated
 *   (undefined fields are ignored by updateCustomer() — no accidental nulling).
 *   Body: { name?, email?, phone?, address? }
 *
 * DELETE /api/customers/:id
 *   Deletes the customer. Related orders have their customer_id set to NULL
 *   (ON DELETE SET NULL in the schema), preserving order history.
 *
 * Both handlers check for existence first and return 404 if not found.
 *
 * Authentication: required (enforced by middleware.ts).
 */
import { NextRequest, NextResponse } from 'next/server'
import { getCustomerById, updateCustomer, deleteCustomer } from '@/lib/mysql/queries'
import log from '@/lib/logger'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    // Existence check before mutation — return 404 rather than silently
    // updating 0 rows and returning 200.
    const existing = await getCustomerById(id)
    if (!existing)
      return NextResponse.json({ error: 'Customer not found.' }, { status: 404 })

    const body = await request.json()

    // Validate email format if the field is being updated.
    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email))
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })

    const customer = await updateCustomer(id, body)
    return NextResponse.json(customer)
  } catch (err) {
    log.error({ err, route: 'PUT /api/customers/:id' }, 'Failed to update customer')
    const msg =
      err instanceof Error && err.message.includes('Duplicate')
        ? 'A customer with that email already exists.'
        : 'Failed to update customer.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const existing = await getCustomerById(id)
    if (!existing)
      return NextResponse.json({ error: 'Customer not found.' }, { status: 404 })

    await deleteCustomer(id)
    return NextResponse.json({ success: true })
  } catch (err) {
    log.error({ err, route: 'DELETE /api/customers/:id' }, 'Failed to delete customer')
    return NextResponse.json({ error: 'Failed to delete customer.' }, { status: 500 })
  }
}

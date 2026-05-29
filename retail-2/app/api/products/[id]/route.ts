/**
 * app/api/products/[id]/route.ts
 *
 * Individual product endpoint.
 *
 * PUT /api/products/:id
 *   Partially updates a product. Only fields present in the body are updated.
 *   Validates price and stock if provided.
 *   Body: { name?, sku?, category?, price?, stock?, low_stock_threshold?, description?, status? }
 *
 * DELETE /api/products/:id
 *   Deletes the product. Related order_items have their product_id set to NULL
 *   (ON DELETE SET NULL in the schema), preserving historical line item data.
 *
 * Authentication: required (enforced by middleware.ts).
 */
import { NextRequest, NextResponse } from 'next/server'
import log from '@/lib/logger'
import { getProductById, updateProduct, deleteProduct } from '@/lib/mysql/queries'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const existing = await getProductById(id)
    if (!existing)
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 })

    const body = await request.json()

    // Only validate numeric fields when they are actually being updated.
    if (body.price !== undefined && (typeof body.price !== 'number' || body.price < 0))
      return NextResponse.json(
        { error: 'Price must be a non-negative number.' },
        { status: 400 },
      )
    if (body.stock !== undefined && (typeof body.stock !== 'number' || body.stock < 0))
      return NextResponse.json(
        { error: 'Stock must be a non-negative integer.' },
        { status: 400 },
      )

    const product = await updateProduct(id, body)
    return NextResponse.json(product)
  } catch (err) {
    log.error({ err, route: 'PUT /api/products/:id' }, 'Failed to update product')
    const msg =
      err instanceof Error && err.message.includes('Duplicate')
        ? 'A product with that SKU already exists.'
        : 'Failed to update product.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const existing = await getProductById(id)
    if (!existing)
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 })

    await deleteProduct(id)
    return NextResponse.json({ success: true })
  } catch (err) {
    log.error({ err, route: 'DELETE /api/products/:id' }, 'Failed to delete product')
    return NextResponse.json({ error: 'Failed to delete product.' }, { status: 500 })
  }
}

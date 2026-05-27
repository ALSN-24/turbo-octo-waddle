/**
 * app/api/products/route.ts
 *
 * GET /api/products
 *   Returns paginated products ordered by created_at DESC.
 *   Query params: ?page=1&limit=20&active=true&search=shirt
 *
 * POST /api/products
 *   Creates a new product. Validates all required fields.
 *
 * Authentication: required (enforced by middleware.ts).
 */
import { NextRequest, NextResponse } from 'next/server'
import log from '@/lib/logger'
import { getProductsPaginated, createProduct } from '@/lib/mysql/queries'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const page      = Math.max(1, parseInt(searchParams.get('page')  ?? '1', 10))
    const limit     = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
    const activeOnly = searchParams.get('active') === 'true'
    const search    = searchParams.get('search') ?? undefined

    const result = await getProductsPaginated({ page, limit, activeOnly, search })
    return NextResponse.json(result)
  } catch (err) {
    log.error({ err, route: 'GET /api/products' }, 'Failed to fetch products')
    return NextResponse.json({ error: 'Failed to fetch products.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, sku, price, stock } = body

    if (!name?.trim())
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
    if (!sku?.trim())
      return NextResponse.json({ error: 'SKU is required.' }, { status: 400 })
    if (typeof price !== 'number' || price < 0)
      return NextResponse.json(
        { error: 'Price must be a non-negative number.' },
        { status: 400 },
      )
    if (typeof stock !== 'number' || stock < 0)
      return NextResponse.json(
        { error: 'Stock must be a non-negative integer.' },
        { status: 400 },
      )

    const product = await createProduct(body)
    log.info({ productId: product?.id, route: 'POST /api/products' }, 'Product created')
    return NextResponse.json(product, { status: 201 })
  } catch (err) {
    log.error({ err, route: 'POST /api/products' }, 'Failed to create product')
    const msg =
      err instanceof Error && err.message.includes('Duplicate')
        ? 'A product with that SKU already exists.'
        : 'Failed to create product.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

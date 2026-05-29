/**
 * lib/mysql/queries.ts
 *
 * All database access for the CRM. Every exported function returns plain JS
 * objects matching the interfaces in lib/types.ts, so UI components receive
 * typed data without any additional transformation.
 *
 * Design principles:
 *   - All IDs are generated in application code (crypto.randomUUID()), never
 *     in the database. This keeps the DB schema simple and avoids AUTO_INCREMENT
 *     for distributed deployments.
 *   - createOrder() is wrapped in withTransaction() — the order row and all
 *     item rows are inserted atomically. A failure on any item rolls back the
 *     entire operation, preventing orphaned order records.
 *   - fetchOrders() uses exactly two queries for any number of orders:
 *     one JOIN for orders+customers, one IN() batch for order_items+products.
 *     This avoids N+1 query patterns regardless of result set size.
 *   - updateCustomer() / updateProduct() build SET clauses dynamically from
 *     only the fields present in the request body, so a PATCH-style update
 *     never accidentally nulls an omitted column.
 *   - After every INSERT or UPDATE, the function re-reads the row by ID and
 *     returns it. This provides read-your-own-writes consistency and ensures
 *     the returned object includes DB-generated values (created_at, updated_at).
 */

import { query, queryOne, withTransaction } from './db'
import type {
  Customer,
  Product,
  Order,
  OrderItem,
  DashboardStats,
  HydratedOrder,
  HydratedOrderItem,
} from '../types'

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

/** Returns all customers ordered by most recently created first. */
export async function getCustomers(): Promise<Customer[]> {
  return query<Customer>(
    'SELECT * FROM customers ORDER BY created_at DESC',
  )
}

/** Returns a single customer by primary key, or null if not found. */
export async function getCustomerById(id: string): Promise<Customer | null> {
  return queryOne<Customer>('SELECT * FROM customers WHERE id = ?', [id])
}

/** Inserts a new customer and returns the freshly-read row. */
export async function createCustomer(
  data: Omit<Customer, 'id' | 'member_since' | 'created_at' | 'updated_at'>,
) {
  const id = crypto.randomUUID()
  await query(
    `INSERT INTO customers (id, name, email, phone, address)
     VALUES (?, ?, ?, ?, ?)`,
    [id, data.name, data.email, data.phone ?? null, data.address ?? null],
  )
  return getCustomerById(id)
}

/**
 * Updates only the fields present in `data`. Undefined fields are skipped,
 * preventing accidental nulling of columns not included in the request body.
 */
export async function updateCustomer(
  id: string,
  data: Partial<Omit<Customer, 'id' | 'member_since' | 'created_at' | 'updated_at'>>,
) {
  const fields: string[] = []
  const values: unknown[] = []
  if (data.name    !== undefined) { fields.push('name = ?');    values.push(data.name) }
  if (data.email   !== undefined) { fields.push('email = ?');   values.push(data.email) }
  if (data.phone   !== undefined) { fields.push('phone = ?');   values.push(data.phone) }
  if (data.address !== undefined) { fields.push('address = ?'); values.push(data.address) }
  // Nothing to update — return the current record unchanged.
  if (fields.length === 0) return getCustomerById(id)
  values.push(id)
  await query(`UPDATE customers SET ${fields.join(', ')} WHERE id = ?`, values)
  return getCustomerById(id)
}

/**
 * Deletes a customer. Related orders have their customer_id set to NULL
 * (ON DELETE SET NULL) so order history is preserved.
 */
export async function deleteCustomer(id: string) {
  await query('DELETE FROM customers WHERE id = ?', [id])
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

/**
 * Returns all products ordered by most recently created.
 * @param activeOnly  When true, only returns products with status='active'.
 *                    The orders page passes true so inactive products are
 *                    excluded from the "add item" dropdown.
 */
export async function getProducts(activeOnly = false): Promise<Product[]> {
  const where = activeOnly ? "WHERE status = 'active'" : ''
  return query<Product>(
    `SELECT * FROM products ${where} ORDER BY created_at DESC`,
  )
}

/** Returns a single product by primary key, or null if not found. */
export async function getProductById(id: string): Promise<Product | null> {
  return queryOne<Product>('SELECT * FROM products WHERE id = ?', [id])
}

/** Inserts a new product and returns the freshly-read row. */
export async function createProduct(
  data: Omit<Product, 'id' | 'created_at' | 'updated_at'>,
) {
  const id = crypto.randomUUID()
  await query(
    `INSERT INTO products
       (id, name, sku, category, price, stock, low_stock_threshold, description, image_url, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.name,
      data.sku,
      data.category,
      data.price,
      data.stock,
      data.low_stock_threshold,
      data.description ?? null,
      data.image_url ?? null,
      data.status ?? 'active',
    ],
  )
  return getProductById(id)
}

/**
 * Updates only the fields present in `data`.
 * Supports partial updates — e.g. updating only stock without touching price.
 */
export async function updateProduct(
  id: string,
  data: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>,
) {
  const fields: string[] = []
  const values: unknown[] = []
  const cols = [
    'name', 'sku', 'category', 'price', 'stock',
    'low_stock_threshold', 'description', 'image_url', 'status',
  ] as const
  for (const col of cols) {
    if (data[col] !== undefined) {
      fields.push(`${col} = ?`)
      values.push(data[col])
    }
  }
  if (fields.length === 0) return getProductById(id)
  values.push(id)
  await query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values)
  return getProductById(id)
}

/**
 * Deletes a product. Related order_items have their product_id set to NULL
 * (ON DELETE SET NULL) so historical order line items are preserved.
 */
export async function deleteProduct(id: string) {
  await query('DELETE FROM products WHERE id = ?', [id])
}

// ---------------------------------------------------------------------------
// Orders — private fetch helper
// ---------------------------------------------------------------------------

/**
 * Private helper that fetches orders with their customer and order_items using
 * exactly two queries, regardless of how many orders are returned.
 *
 * Accepts a structured options object instead of a raw SQL suffix string to
 * prevent accidental SQL injection from future callers.
 */
interface FetchOrdersOptions {
  where?: string
  orderBy?: string
  limit?: number
  offset?: number
}

async function fetchOrders(opts: FetchOrdersOptions | string = {}, params: unknown[] = []): Promise<HydratedOrder[]> {
  // Backward-compat: internal callers in this file may still pass a string suffix.
  // All new external callers should use the options object form.
  let where = '', orderBy = 'ORDER BY o.created_at DESC', limitClause = '', offsetClause = ''
  if (typeof opts === 'string') {
    // Legacy string suffix — split known clauses for safety
    where = opts.includes('WHERE') ? opts.split('ORDER')[0].trim() : ''
    orderBy = opts.includes('ORDER') ? 'ORDER' + opts.split('ORDER')[1] : orderBy
  } else {
    where       = opts.where   ?? ''
    orderBy     = opts.orderBy ?? 'ORDER BY o.created_at DESC'
    limitClause  = opts.limit  !== undefined ? `LIMIT ${Number(opts.limit)}`  : ''
    offsetClause = opts.offset !== undefined ? `OFFSET ${Number(opts.offset)}` : ''
  }

  const rows = await query<
    Order & {
      customer_name: string | null
      customer_email: string | null
      customer_phone: string | null
      customer_address: string | null
      customer_member_since: string | null
      customer_created_at: string | null
      customer_updated_at: string | null
    }
  >(
    `SELECT
       o.*,
       c.name         AS customer_name,
       c.email        AS customer_email,
       c.phone        AS customer_phone,
       c.address      AS customer_address,
       c.member_since AS customer_member_since,
       c.created_at   AS customer_created_at,
       c.updated_at   AS customer_updated_at
     FROM orders o
     LEFT JOIN customers c ON c.id = o.customer_id
     ${where} ${orderBy} ${limitClause} ${offsetClause}`,
    params,
  )

  if (rows.length === 0) return []

  // Batch-load all order_items for these orders in a single query.
  // Using WHERE order_id IN (...) avoids one query per order (N+1 problem).
  const orderIds = rows.map(r => r.id)
  const placeholders = orderIds.map(() => '?').join(',')
  const items = await query<
    OrderItem & {
      product_name: string | null
      product_sku: string | null
      product_category: string | null
      product_price: number | null
      product_stock: number | null
      product_low_stock_threshold: number | null
      product_description: string | null
      product_image_url: string | null
      product_status: string | null
      product_created_at: string | null
      product_updated_at: string | null
    }
  >(
    `SELECT
       oi.*,
       p.name                AS product_name,
       p.sku                 AS product_sku,
       p.category            AS product_category,
       p.price               AS product_price,
       p.stock               AS product_stock,
       p.low_stock_threshold AS product_low_stock_threshold,
       p.description         AS product_description,
       p.image_url           AS product_image_url,
       p.status              AS product_status,
       p.created_at          AS product_created_at,
       p.updated_at          AS product_updated_at
     FROM order_items oi
     LEFT JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id IN (${placeholders})`,
    orderIds,
  )

  // Group items by their parent order_id for efficient lookup below.
  const itemsByOrder = new Map<string, HydratedOrderItem[]>()
  for (const item of items) {
    const mapped: HydratedOrderItem = {
      id: item.id,
      order_id: item.order_id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      created_at: item.created_at,
      // Only attach product if the product row still exists (product_id not null).
      product: item.product_name
        ? {
            id: item.product_id as string,
            name: item.product_name,
            sku: item.product_sku!,
            category: item.product_category!,
            price: item.product_price!,
            stock: item.product_stock!,
            low_stock_threshold: item.product_low_stock_threshold!,
            description: item.product_description,
            image_url: item.product_image_url,
            status: item.product_status as 'active' | 'inactive',
            created_at: item.product_created_at ?? '',
            updated_at: item.product_updated_at ?? '',
          }
        : null,
    }
    const list = itemsByOrder.get(item.order_id) ?? []
    list.push(mapped)
    itemsByOrder.set(item.order_id, list)
  }

  // Assemble the final Order objects with nested customer and items.
  return rows.map(row => ({
    id: row.id,
    customer_id: row.customer_id,
    status: row.status,
    total: row.total,
    created_at: row.created_at,
    updated_at: row.updated_at,
    customer: row.customer_name
      ? {
          id: row.customer_id as string,
          name: row.customer_name,
          email: row.customer_email!,
          phone: row.customer_phone,
          address: row.customer_address,
          member_since: row.customer_member_since!,
          created_at: row.customer_created_at!,
          updated_at: row.customer_updated_at!,
        }
      : null,
    order_items: itemsByOrder.get(row.id) ?? [],
  }))
}

// ---------------------------------------------------------------------------
// Orders — public API
// ---------------------------------------------------------------------------

/** Returns all orders with customer and items, newest first. */
export async function getOrders(): Promise<HydratedOrder[]> {
  return fetchOrders('ORDER BY o.created_at DESC')
}

/** Returns all orders with a specific status, newest first. */
export async function getOrdersByStatus(status: Order['status']): Promise<HydratedOrder[]> {
  return fetchOrders('WHERE o.status = ? ORDER BY o.created_at DESC', [status])
}

/** Returns a single order by primary key with customer and items, or null. */
export async function getOrderById(id: string): Promise<HydratedOrder | null> {
  const orders = await fetchOrders('WHERE o.id = ?', [id])
  return orders[0] ?? null
}

/**
 * Creates an order and all its line items atomically.
 *
 * Uses withTransaction() so that if any item INSERT fails (e.g. a foreign key
 * violation on product_id), the entire operation rolls back. This prevents
 * orphaned order rows with no items.
 *
 * The `price` field on each item is a snapshot of the product price at the
 * time of the order — it does not change if the product price is later updated.
 */
export async function createOrder(data: {
  customer_id: string | null
  status?: Order['status']
  total: number
  items: { product_id: string; quantity: number; price: number }[]
}) {
  const id = crypto.randomUUID()

  await withTransaction(async (conn) => {
    await conn.execute(
      `INSERT INTO orders (id, customer_id, status, total) VALUES (?, ?, ?, ?)`,
      [id, data.customer_id ?? null, data.status ?? 'pending', data.total],
    )
    // Insert each line item within the same transaction.
    for (const item of data.items) {
      await conn.execute(
        `INSERT INTO order_items (id, order_id, product_id, quantity, price)
         VALUES (?, ?, ?, ?, ?)`,
        [crypto.randomUUID(), id, item.product_id, item.quantity, item.price],
      )
    }
  })

  // Return the complete order with customer and items after the transaction commits.
  return getOrderById(id)
}

/** Updates only the status of an order. Line items are immutable after creation. */
export async function updateOrderStatus(id: string, status: Order['status']) {
  await query('UPDATE orders SET status = ? WHERE id = ?', [status, id])
  return getOrderById(id)
}

/**
 * Deletes an order. All related order_items are deleted automatically
 * via the ON DELETE CASCADE foreign key constraint.
 */
export async function deleteOrder(id: string) {
  await query('DELETE FROM orders WHERE id = ?', [id])
}

// ---------------------------------------------------------------------------
// Dashboard stats
// ---------------------------------------------------------------------------

/**
 * Fetches all aggregated statistics for the dashboard page.
 *
 * Runs two sets of parallel queries (Promise.all) for a total of 6 round-trips:
 *   Round 1 (parallel): COUNT customers, COUNT products, COUNT orders
 *   Round 2 (parallel): SUM revenue, low-stock products, recent orders, pending count
 *
 * The recent orders query uses fetchOrders() with LIMIT 5 so it shares the
 * same efficient two-query batch logic — it does NOT load all orders.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  // First round: basic counts (fast, index-only queries).
  const [[{ total: totalCustomers }], [{ total: totalProducts }], [{ total: totalOrders }]] =
    await Promise.all([
      query<{ total: number }>('SELECT COUNT(*) AS total FROM customers'),
      query<{ total: number }>('SELECT COUNT(*) AS total FROM products'),
      query<{ total: number }>('SELECT COUNT(*) AS total FROM orders'),
    ])

  // Second round: more complex aggregations run in parallel.
  const [revenueRows, lowStockRows, recentOrderRows, [{ total: pendingOrdersCount }]] =
    await Promise.all([
      // Total revenue is the sum of completed order totals only.
      query<{ total: number }>(
        "SELECT COALESCE(SUM(total), 0) AS total FROM orders WHERE status = 'completed'",
      ),
      // Low-stock products: those where stock is below their individual threshold.
      query<Product>(
        `SELECT * FROM products
         WHERE stock < low_stock_threshold
         ORDER BY stock ASC
         LIMIT 5`,
      ),
      // Fetch only the 5 most recent orders — avoids loading the full table.
      fetchOrders('ORDER BY o.created_at DESC LIMIT 5', []),
      query<{ total: number }>(
        "SELECT COUNT(*) AS total FROM orders WHERE status = 'pending'",
      ),
    ])

  return {
    totalCustomers:    Number(totalCustomers),
    totalProducts:     Number(totalProducts),
    totalOrders:       Number(totalOrders),
    totalRevenue:      Number(revenueRows[0]?.total ?? 0),
    lowStockProducts:  lowStockRows,
    recentOrders:      recentOrderRows,
    pendingOrdersCount: Number(pendingOrdersCount),
  }
}

// ---------------------------------------------------------------------------
// Paginated collection helpers
// ---------------------------------------------------------------------------

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface PaginateOptions {
  page: number
  limit: number
}

/** Returns customers with optional name/email search, paginated. */
export async function getCustomersPaginated(
  opts: PaginateOptions & { search?: string },
): Promise<PaginatedResult<Customer>> {
  const { page, limit, search } = opts
  const offset = (page - 1) * limit

  const whereParts: string[] = []
  const params: unknown[] = []

  if (search) {
    whereParts.push('(name LIKE ? OR email LIKE ?)')
    params.push(`%${search}%`, `%${search}%`)
  }

  const where = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : ''

  const safeLimit = Number(limit)
  const safeOffset = Number(offset)

  const [countRows, data] = await Promise.all([
    query<{ total: number }>(`SELECT COUNT(*) AS total FROM customers ${where}`, [...params]),
    query<Customer>(
      `SELECT * FROM customers ${where} ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      [...params],
    ),
  ])

  const total = Number(countRows[0]?.total ?? 0)
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
}

/** Returns products with optional search + active filter, paginated. */
export async function getProductsPaginated(
  opts: PaginateOptions & { activeOnly?: boolean; search?: string },
): Promise<PaginatedResult<Product>> {
  const { page, limit, activeOnly, search } = opts
  const offset = (page - 1) * limit

  const whereParts: string[] = []
  const params: unknown[] = []

  if (activeOnly) {
    whereParts.push("status = 'active'")
  }
  if (search) {
    whereParts.push('(name LIKE ? OR sku LIKE ? OR category LIKE ?)')
    params.push(`%${search}%`, `%${search}%`, `%${search}%`)
  }

  const where = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : ''
  const safeLimit = Number(limit)
  const safeOffset = Number(offset)

  const [countRows, data] = await Promise.all([
    query<{ total: number }>(`SELECT COUNT(*) AS total FROM products ${where}`, [...params]),
    query<Product>(
      `SELECT * FROM products ${where} ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      [...params],
    ),
  ])

  const total = Number(countRows[0]?.total ?? 0)
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
}

/** Returns orders with optional status filter, paginated. */
export async function getOrdersPaginated(
  opts: PaginateOptions & { status?: string },
): Promise<PaginatedResult<HydratedOrder>> {
  const { page, limit, status } = opts
  const offset = (page - 1) * limit

  const whereParams: unknown[] = []
  const whereClause = status ? 'WHERE o.status = ?' : ''
  if (status) whereParams.push(status)

  const safeLimit = Number(limit)
  const safeOffset = Number(offset)

  const [countRows, data] = await Promise.all([
    query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM orders o ${whereClause}`,
      whereParams,
    ),
    fetchOrders(
      { where: status ? 'WHERE o.status = ?' : '', orderBy: 'ORDER BY o.created_at DESC', limit: safeLimit, offset: safeOffset },
      status ? [status] : [],
    ),
  ])

  const total = Number(countRows[0]?.total ?? 0)
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
}

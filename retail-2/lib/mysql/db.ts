import mysql from 'mysql2/promise'
import '@/lib/env'

// ---------------------------------------------------------------------------
// Pool singleton — guarded so Next.js HMR in dev doesn't leak connections
// ---------------------------------------------------------------------------

declare global {
  var __mysqlPool: mysql.Pool | undefined
}

function createPool(): mysql.Pool {
  return mysql.createPool({
    host:     process.env.MYSQL_HOST     || 'localhost',
    port:     Number(process.env.MYSQL_PORT || 3306),
    user:     process.env.MYSQL_USER     || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'retail_crm',
    waitForConnections: true,
    connectionLimit:    10,
    queueLimit:         0,
    // Return dates as ISO strings — Next.js cannot serialise Date objects
    // from Server Components to Client Components
    dateStrings: true,
    // Cast DECIMAL columns to JS numbers automatically
    decimalNumbers: true,
  })
}

// In dev, store the pool on `global` so HMR module reloads reuse it.
// In production there is only one module instance, so globalThis is fine too.
const pool: mysql.Pool =
  globalThis.__mysqlPool ?? (globalThis.__mysqlPool = createPool())

export default pool

// ---------------------------------------------------------------------------
// Convenience helpers
// ---------------------------------------------------------------------------

/**
 * Run a parameterised query and return typed rows.
 *
 * @example
 * const rows = await query<Customer>('SELECT * FROM customers WHERE id = ?', [id])
 */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const [rows] = await pool.execute(sql, params)
  return rows as T[]
}

/**
 * Run a query that returns a single row, or null if not found.
 */
export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(sql, params)
  return rows[0] ?? null
}

/**
 * Run a callback inside a MySQL transaction.
 * Automatically commits on success and rolls back on any error.
 *
 * @example
 * const result = await withTransaction(async (conn) => {
 *   await conn.execute('INSERT INTO orders …', […])
 *   await conn.execute('INSERT INTO order_items …', […])
 *   return orderId
 * })
 */
export async function withTransaction<T>(
  fn: (conn: mysql.PoolConnection) => Promise<T>,
): Promise<T> {
  const conn = await pool.getConnection()
  await conn.beginTransaction()
  try {
    const result = await fn(conn)
    await conn.commit()
    return result
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

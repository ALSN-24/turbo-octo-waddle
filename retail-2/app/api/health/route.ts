/**
 * GET /api/health
 *
 * Returns 200 if the database is reachable and all required env vars are set.
 * Returns 503 if any check fails. Used by Docker healthcheck and uptime monitors.
 *
 * Response shape:
 *   { status: 'ok' | 'degraded', checks: Record<string, boolean> }
 */
import { NextResponse } from 'next/server'
import pool from '@/lib/mysql/db'
import log from '@/lib/logger'

export async function GET() {
  const checks: Record<string, boolean> = {
    jwt_secret:     !!process.env.JWT_SECRET,
    mysql_host:     !!process.env.MYSQL_HOST,
    mysql_user:     !!process.env.MYSQL_USER,
    mysql_password: !!process.env.MYSQL_PASSWORD,
    mysql_database: !!process.env.MYSQL_DATABASE,
    db_reachable:   false,
  }

  try {
    const conn = await pool.getConnection()
    await conn.ping()
    conn.release()
    checks.db_reachable = true
  } catch (err) {
    log.error({ err }, 'Health check: DB ping failed')
  }

  const healthy = Object.values(checks).every(Boolean)

  if (!healthy) {
    const failed = Object.entries(checks)
      .filter(([, v]) => !v)
      .map(([k]) => k)
    log.warn({ failed }, 'Health check degraded')
  }

  return NextResponse.json(
    { status: healthy ? 'ok' : 'degraded', checks },
    { status: healthy ? 200 : 503 },
  )
}

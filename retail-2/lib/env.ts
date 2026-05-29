/**
 * lib/env.ts
 *
 * Validates required environment variables at module load time.
 * Import this at the top of any server-side entry point to get
 * a clear error at startup rather than a cryptic failure mid-request.
 *
 * Usage: import '@/lib/env'
 */

const REQUIRED: Record<string, string> = {
  JWT_SECRET: 'Used to sign and verify session cookies. Generate with: openssl rand -base64 32',
  MYSQL_HOST: 'Hostname of your MySQL server (e.g. localhost)',
  MYSQL_USER: 'MySQL username (e.g. root)',
  MYSQL_PASSWORD: 'Password for MYSQL_USER (use a strong password in production)',
  MYSQL_DATABASE: 'MySQL database name (e.g. retail_crm)',
}

const missing = Object.entries(REQUIRED)
  .filter(([key]) => !process.env[key])
  .map(([key, hint]) => `  ${key} — ${hint}`)

if (missing.length > 0) {
  throw new Error(
    `\n\nMissing required environment variables:\n\n${missing.join('\n')}\n\n` +
    `Copy .env.example to .env.local and fill in the values.\n`,
  )
}

// Optional: set ALLOW_REGISTRATION=false to disable public sign-up.
// When false, POST /api/auth/register returns 403 for all requests.
// Useful for internal CRMs where new accounts are created by admins only.
export const ALLOW_REGISTRATION =
  (process.env.ALLOW_REGISTRATION ?? 'true').toLowerCase() !== 'false'

export {}

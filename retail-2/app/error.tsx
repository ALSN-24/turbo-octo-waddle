/**
 * app/error.tsx — Root error boundary (Client Component)
 *
 * Next.js App Router automatically wraps each page in this component when
 * an unhandled error is thrown in a Server Component (e.g. a database
 * connection failure or an uncaught exception in a query).
 *
 * Must be a Client Component ('use client') — Next.js requires error
 * boundaries to be client-side so they can receive the error object and
 * the reset() callback.
 *
 * The `reset` function re-renders the route segment, triggering a fresh
 * server-side data fetch. This allows transient errors (e.g. a momentary
 * DB timeout) to recover without a full page reload.
 *
 * Error detection:
 *   Database connection errors (ECONNREFUSED) are detected from the message
 *   and shown a specific hint about checking MySQL settings, rather than a
 *   generic "something went wrong".
 */
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorPageProps {
  error: Error & { digest?: string }
  /** Call this to re-render the route and retry the failed server query. */
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error for observability. In production, replace this with a
    // real error reporting service (e.g. Sentry, Datadog Logs).
    console.error('[App error]', error)
  }, [error])

  // Provide a specific message for the most common failure — DB unreachable.
  const message =
    error.message?.includes('ECONNREFUSED') || error.message?.includes('connect')
      ? 'Could not connect to the database. Check your MySQL connection settings.'
      : error.message || 'An unexpected error occurred while loading this page.'

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-muted-foreground">{message}</p>
          {/* digest is a Next.js-generated error ID — useful for correlating
              server logs to a specific client-visible error. */}
          {error.digest && (
            <p className="font-mono text-xs text-muted-foreground">
              Error ID: {error.digest}
            </p>
          )}
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

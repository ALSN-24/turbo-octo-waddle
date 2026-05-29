/**
 * app/auth/error/page.tsx — Auth error page (Server Component)
 *
 * Generic error display for authentication failures. Accepts an optional
 * error message via URL query parameters:
 *   ?error=<message>    — primary message param
 *   ?message=<message>  — fallback param
 *
 * Falls back to a generic message if neither param is present.
 *
 * Used as a landing page for edge-case auth failures (e.g. an expired or
 * tampered token that the middleware cannot handle gracefully).
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingBag, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface AuthErrorPageProps {
  searchParams: Promise<{ error?: string; message?: string }>
}

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const params = await searchParams
  const message = params.message || params.error || 'An authentication error occurred.'

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold">Retail CRM</h1>
          </div>
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-2xl">Authentication error</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 text-center">
              <p className="text-sm text-muted-foreground">{message}</p>
              <Button asChild className="w-full">
                <Link href="/auth/login">Back to login</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

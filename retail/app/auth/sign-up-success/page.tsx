/**
 * app/auth/sign-up-success/page.tsx — Post-registration landing (Server Component)
 *
 * Shown after a successful account creation. In the original Supabase version
 * this page asked the user to check their email for a confirmation link.
 * With credential auth, registration signs the user in immediately, so this
 * page simply confirms success and links to the dashboard.
 *
 * This page is rarely reached in normal flow (the register route redirects
 * directly to /) but is kept as a fallback landing target.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingBag, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function SignUpSuccessPage() {
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
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <CardTitle className="text-2xl">Account created</CardTitle>
              <CardDescription>You are now signed in</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">
                Your account has been created successfully. You can now access the CRM.
              </p>
              <Link
                href="/"
                className="mt-4 inline-block text-sm underline underline-offset-4"
              >
                Go to dashboard
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

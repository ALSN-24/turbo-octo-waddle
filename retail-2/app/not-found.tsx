/**
 * app/not-found.tsx — Custom 404 page (Server Component)
 *
 * Rendered by Next.js for any URL that does not match a route.
 * Replaces the default framework 404 with a branded, navigable page.
 *
 * Note: This page has no access to the session, so it does not render the
 * CRM sidebar. It is designed to be standalone — accessible even when not
 * authenticated (e.g. a bookmarked URL that no longer exists).
 */
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingBag, Home } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <CardTitle className="text-4xl font-bold">404</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 text-center">
          <p className="text-lg font-medium">Page not found</p>
          <p className="text-sm text-muted-foreground">
            The page you are looking for doesn&apos;t exist or has been moved.
          </p>
          <Button asChild className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Back to dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

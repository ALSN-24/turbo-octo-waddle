/**
 * app/auth/sign-up/page.tsx — Registration form (Client Component)
 *
 * Standalone auth page — no CRM sidebar, accessible when unauthenticated.
 * middleware.ts redirects already-authenticated users away to /.
 *
 * Validation (client-side, before network call):
 *   - email: required
 *   - password: minimum 8 characters
 *   - repeatPassword: must match password exactly
 *
 * On success the server creates the account, signs a JWT, sets the
 * crm_session cookie, and returns HTTP 201. The user is then redirected
 * directly to the dashboard — no separate email confirmation step.
 *
 * autoComplete="new-password" on both password fields tells password
 * managers to offer to save the new credential rather than auto-fill.
 */
'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { Spinner } from '@/components/ui/spinner'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim()) { setError('Email is required.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== repeatPassword) { setError('Passwords do not match.'); return }

    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, name: name.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed.')
      router.push('/')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background p-6 md:p-10">
      <div className="fixed right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold">Retail CRM</h1>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Create account</CardTitle>
              <CardDescription>Fill in the details below to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name <span className="text-muted-foreground text-xs">(optional)</span></Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your name"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password <span className="text-muted-foreground text-xs">(min 8 chars)</span></Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="repeat-password">Confirm password</Label>
                    <Input
                      id="repeat-password"
                      type="password"
                      required
                      autoComplete="new-password"
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  {error && (
                    <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {error}
                    </p>
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <><Spinner className="mr-2" />Creating account…</>
                    ) : 'Create account'}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  Already have an account?{' '}
                  <Link href="/auth/login" className="underline underline-offset-4">Login</Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

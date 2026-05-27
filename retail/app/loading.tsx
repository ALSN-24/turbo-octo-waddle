/**
 * app/loading.tsx — Root loading skeleton (Server Component)
 *
 * Next.js App Router automatically shows this component while a page's
 * Server Component data fetches are in progress. It streams to the browser
 * immediately (before the data is ready) so the user sees the app shell
 * rather than a blank screen.
 *
 * The skeleton mirrors the exact layout of the CRM pages:
 *   - Fixed left sidebar with nav item placeholders
 *   - Sticky header bar
 *   - 4-column stats card row
 *   - A main content card placeholder
 *
 * The Skeleton component from shadcn/ui applies the animate-pulse class and
 * the correct background colour automatically in both light and dark modes.
 *
 * Per-route loading files (app/customers/loading.tsx etc.) re-export this
 * component so each route gets the same skeleton without duplication.
 */
import { Skeleton } from '@/components/ui/skeleton'

export default function LoadingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar skeleton — mirrors the fixed sidebar from crm-sidebar.tsx */}
      <div className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-sidebar">
        <div className="flex h-16 items-center border-b border-sidebar-border px-6">
          <Skeleton className="h-5 w-24 bg-sidebar-accent/40" />
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex h-10 items-center gap-3 rounded-md px-3">
              <Skeleton className="h-5 w-5 bg-sidebar-accent/40" />
              {/* Vary the widths so the skeleton looks natural, not robotic. */}
              <Skeleton
                className="h-4 bg-sidebar-accent/40"
                style={{ width: `${60 + i * 8}px` }}
              />
            </div>
          ))}
        </nav>
      </div>

      {/* Main content skeleton */}
      <main className="ml-64">
        {/* Header bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-card px-6">
          <Skeleton className="h-5 w-32" />
        </header>

        <div className="p-6 space-y-6">
          {/* Stats row — 4 cards matching the dashboard layout */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>

          {/* Main content card */}
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </main>
    </div>
  )
}

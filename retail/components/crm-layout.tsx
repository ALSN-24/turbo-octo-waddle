/**
 * components/crm-layout.tsx — CRM page shell (Client Component)
 *
 * Provides the outer structure shared by all CRM pages:
 *   - Fixed sidebar (CrmSidebar) on the left
 *   - Sticky header bar with the page title and optional action buttons
 *   - Scrollable main content area
 *
 * Marked 'use client' because CrmSidebar uses usePathname() and useRouter()
 * which require client-side rendering.
 *
 * Props:
 *   title       — page heading shown in the sticky header
 *   actions     — optional React node rendered in the header's right slot
 *                 (e.g. an "Add" button that belongs contextually in the header)
 *   userEmail   — passed to CrmSidebar to display in the footer
 *   userName    — displayed in preference to email when available
 *   children    — the page's main content component
 */
"use client"

import { CrmSidebar } from "./crm-sidebar"

interface CrmLayoutProps {
  children: React.ReactNode
  title: string
  actions?: React.ReactNode
  userEmail?: string | null
  userName?: string | null
}

export function CrmLayout({ children, title, actions, userEmail, userName }: CrmLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <CrmSidebar userEmail={userEmail} userName={userName} />

      {/* ml-64 offsets content to the right of the 256px fixed sidebar */}
      <main className="ml-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-6">
          <h2 className="text-xl font-semibold text-card-foreground">{title}</h2>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}

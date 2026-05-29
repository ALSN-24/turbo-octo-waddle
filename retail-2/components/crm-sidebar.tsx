/**
 * components/crm-sidebar.tsx — Navigation sidebar (Client Component)
 *
 * Fixed left sidebar containing the app logo, navigation links,
 * and the logged-in user's display name with a logout button.
 *
 * Marked 'use client' because it uses:
 *   - usePathname() to highlight the active nav item
 *   - useRouter() to redirect after logout
 *
 * Logout flow:
 *   1. POST /api/auth/logout (expires the crm_session cookie server-side).
 *   2. Redirect to /auth/login regardless of whether the fetch succeeded.
 *      This means the user is always navigated away even if the network
 *      request fails — the middleware will clear the stale cookie on the
 *      next authenticated request.
 */
"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Users, Package, ShoppingCart, BarChart3, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

/** Top-level navigation items. Order here determines render order in the sidebar. */
const navItems = [
  { href: "/",          label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/orders",    label: "Orders",    icon: ShoppingCart },
  { href: "/reports",   label: "Reports",   icon: BarChart3 },
]

interface CrmSidebarProps {
  /** Shown in the sidebar footer. Null for unauthenticated states. */
  userEmail?: string | null
  /** Shown in preference to email when available. */
  userName?: string | null
}

export function CrmSidebar({ userEmail, userName }: CrmSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      // Ask the server to expire the HttpOnly cookie. This cannot be done
      // purely client-side because HttpOnly cookies are inaccessible to JS.
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Network error — proceed with redirect anyway. The middleware will
      // reject the stale cookie on the next request and clear it.
    }
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground">
      {/* App logo / name */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <h1 className="text-xl font-bold">Retail CRM</h1>
      </div>

      {/* Navigation links */}
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {navItems.map((item) => {
          // Exact match for root (/); prefix match for all other routes
          // so sub-paths like /customers/new correctly highlight Customers.
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User info + logout — only rendered when a session exists */}
      {userEmail && (
        <div className="border-t border-sidebar-border p-4">
          {/* Show name if available, fall back to email address */}
          <div className="mb-3 truncate text-sm text-sidebar-foreground/70">
            {userName || userEmail}
          </div>

          {/* Three-way theme toggle: Light / Dark / System */}
          <ThemeToggle className="mb-3 w-full" />

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      )}
    </aside>
  )
}

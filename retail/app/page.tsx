/**
 * app/page.tsx — Dashboard page (Server Component)
 *
 * Loads aggregated CRM statistics in parallel and renders them.
 * The session is read alongside data queries at no extra cost — getSession()
 * only verifies the JWT cookie, it does not hit the database.
 *
 * Data loaded:
 *   - getDashboardStats(): 6 parallel queries — customer/product/order counts,
 *     total revenue, low-stock products (top 5), recent orders (top 5),
 *     pending order count.
 *   - getSession(): cookie read + JWT verify only.
 */
import { CrmLayout } from '@/components/crm-layout'
import { DashboardContent } from '@/components/dashboard-content'
import { getDashboardStats } from '@/lib/mysql/queries'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const [stats, session] = await Promise.all([getDashboardStats(), getSession()])

  return (
    <CrmLayout title="Dashboard" userEmail={session?.email} userName={session?.name}>
      <DashboardContent stats={stats} />
    </CrmLayout>
  )
}

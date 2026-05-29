/**
 * app/reports/page.tsx — Reports page (Server Component)
 *
 * Loads data for analytics. To avoid unbounded table scans, all three
 * collections are capped: the 1 000 most recent orders (covers ~3 months
 * for most retail volumes), all products (typically < 10 k rows), and a
 * customer count. For stores with very high order volumes, these caps keep
 * the SSR response under ~2 s while still producing accurate charts.
 */
import { CrmLayout } from '@/components/crm-layout'
import { ReportsContent } from '@/components/reports-content'
import { getOrdersPaginated, getProductsPaginated, getCustomersPaginated } from '@/lib/mysql/queries'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  const [ordersResult, productsResult, customersResult, session] = await Promise.all([
    getOrdersPaginated({ page: 1, limit: 1000 }),   // recent 1 000 orders for charts
    getProductsPaginated({ page: 1, limit: 500 }),   // all products for inventory breakdown
    getCustomersPaginated({ page: 1, limit: 1 }),    // only total count needed
    getSession(),
  ])

  return (
    <CrmLayout title="Reports" userEmail={session?.email} userName={session?.name}>
      <ReportsContent
        orders={ordersResult.data}
        products={productsResult.data}
        customers={customersResult.data}
        customerTotal={customersResult.total}
      />
    </CrmLayout>
  )
}

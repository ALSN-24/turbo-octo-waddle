/**
 * app/customers/page.tsx — Customers page (Server Component)
 *
 * Loads the first page of customers (20 rows) and a capped set of orders
 * for the stats sidebar. Client-side pagination fetches further pages via
 * GET /api/customers?page=N.
 *
 * Why load recent orders here?
 *   The sidebar shows per-customer spend summaries. We load the 500 most
 *   recent orders as a reasonable approximation — far cheaper than loading
 *   the entire orders table for a large store.
 */
import { CrmLayout } from '@/components/crm-layout'
import { CustomersContent } from '@/components/customers-content'
import { getCustomersPaginated, getOrdersPaginated } from '@/lib/mysql/queries'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function CustomersPage() {
  const [customersResult, ordersResult, session] = await Promise.all([
    getCustomersPaginated({ page: 1, limit: 20 }),
    getOrdersPaginated({ page: 1, limit: 500 }), // capped for spend stats
    getSession(),
  ])

  return (
    <CrmLayout title="Customers" userEmail={session?.email} userName={session?.name}>
      <CustomersContent
        initialCustomers={customersResult.data}
        initialTotal={customersResult.total}
        orders={ordersResult.data}
      />
    </CrmLayout>
  )
}

/**
 * app/orders/page.tsx — Orders page (Server Component)
 *
 * Loads the first page of orders (20 rows) plus the dropdowns needed
 * for creating new orders. Client-side pagination fetches subsequent
 * pages via GET /api/orders?page=N.
 */
import { CrmLayout } from '@/components/crm-layout'
import { OrdersContent } from '@/components/orders-content'
import { getOrdersPaginated, getCustomersPaginated, getProductsPaginated } from '@/lib/mysql/queries'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  const [ordersResult, customersResult, productsResult, session] = await Promise.all([
    getOrdersPaginated({ page: 1, limit: 20 }),
    getCustomersPaginated({ page: 1, limit: 200 }), // dropdown — reasonable upper bound
    getProductsPaginated({ page: 1, limit: 200, activeOnly: true }),
    getSession(),
  ])

  return (
    <CrmLayout title="Orders" userEmail={session?.email} userName={session?.name}>
      <OrdersContent
        initialOrders={ordersResult.data}
        initialTotal={ordersResult.total}
        customers={customersResult.data}
        products={productsResult.data}
      />
    </CrmLayout>
  )
}

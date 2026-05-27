/**
 * app/inventory/page.tsx — Inventory page (Server Component)
 *
 * Loads the first page of products (20 rows).
 * Client-side pagination fetches further pages via GET /api/products?page=N.
 */
import { CrmLayout } from '@/components/crm-layout'
import { InventoryContent } from '@/components/inventory-content'
import { getProductsPaginated } from '@/lib/mysql/queries'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function InventoryPage() {
  const [productsResult, session] = await Promise.all([
    getProductsPaginated({ page: 1, limit: 20 }),
    getSession(),
  ])

  return (
    <CrmLayout title="Inventory" userEmail={session?.email} userName={session?.name}>
      <InventoryContent
        initialProducts={productsResult.data}
        initialTotal={productsResult.total}
      />
    </CrmLayout>
  )
}

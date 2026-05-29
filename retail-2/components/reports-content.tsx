/**
 * components/reports-content.tsx — Analytics charts (Client Component)
 *
 * Read-only analytics view. All data is computed from the orders, products,
 * and customers props — no additional API calls are made.
 *
 * Charts (Recharts via shadcn ChartContainer):
 *   - Monthly Revenue:  LineChart of completed order totals grouped by month.
 *   - Orders by Month:  BarChart of order count per month.
 *   - Order Status:     PieChart of order count by status.
 *   - Top 5 Products:   Horizontal BarChart by revenue from completed orders.
 *   - Inventory by Category: PieChart of product count per category.
 *
 * Summary stats:
 *   - Total revenue (completed orders only)
 *   - This month's revenue vs last month's (percentage change)
 *   - Total order count
 *   - Average order value (completed orders only — avoids divide-by-zero)
 *
 * Note on division safety:
 *   Avg order value guards on completedOrders.length (not orders.length) to
 *   avoid dividing by zero when there are only pending/cancelled orders.
 */
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package } from "lucide-react"
import type { HydratedOrder, Product, Customer } from "@/lib/types"

interface ReportsContentProps {
  orders: HydratedOrder[]
  products: Product[]
  customers: Customer[]
  customerTotal: number
}

export function ReportsContent({ orders, products, customers: _customers, customerTotal }: ReportsContentProps) {
  // Calculate monthly revenue data
  const monthlyRevenue = orders
    .filter(o => o.status === "completed")
    .reduce((acc, order) => {
      const date = new Date(order.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      const monthName = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
      
      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthName, revenue: 0, orders: 0 }
      }
      acc[monthKey].revenue += Number(order.total)
      acc[monthKey].orders += 1
      return acc
    }, {} as Record<string, { month: string; revenue: number; orders: number }>)

  const revenueData = Object.values(monthlyRevenue).slice(-12)

  // Calculate order status distribution
  const orderStatusData = orders.reduce((acc, order) => {
    const existing = acc.find(item => item.status === order.status)
    if (existing) {
      existing.count += 1
    } else {
      acc.push({ status: order.status, count: 1 })
    }
    return acc
  }, [] as { status: string; count: number }[])

  // Calculate top selling products
  const productSales = orders
    .filter(o => o.status === "completed")
    .flatMap(order => order.order_items || [])
    .reduce((acc, item) => {
      if (item.product) {
        const name = item.product.name
        if (!acc[name]) {
          acc[name] = { name, quantity: 0, revenue: 0 }
        }
        acc[name].quantity += item.quantity
        acc[name].revenue += Number(item.price) * item.quantity
      }
      return acc
    }, {} as Record<string, { name: string; quantity: number; revenue: number }>)

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // Calculate category distribution
  const categoryData = products.reduce((acc, product) => {
    const existing = acc.find(item => item.category === product.category)
    if (existing) {
      existing.count += 1
      existing.value += Number(product.price) * product.stock
    } else {
      acc.push({ 
        category: product.category, 
        count: 1, 
        value: Number(product.price) * product.stock 
      })
    }
    return acc
  }, [] as { category: string; count: number; value: number }[])

  // Summary stats
  const totalRevenue = orders
    .filter(o => o.status === "completed")
    .reduce((sum, o) => sum + Number(o.total), 0)
  
  const thisMonthOrders = orders.filter(o => {
    const date = new Date(o.created_at)
    const now = new Date()
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  })
  
  const thisMonthRevenue = thisMonthOrders
    .filter(o => o.status === "completed")
    .reduce((sum, o) => sum + Number(o.total), 0)

  const lastMonthOrders = orders.filter(o => {
    const date = new Date(o.created_at)
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear()
  })

  const lastMonthRevenue = lastMonthOrders
    .filter(o => o.status === "completed")
    .reduce((sum, o) => sum + Number(o.total), 0)

  const revenueChange = lastMonthRevenue > 0 
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
    : 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const revenueChartConfig = {
    revenue: {
      label: "Revenue",
      color: "var(--color-primary)",
    },
    orders: {
      label: "Orders",
      color: "var(--color-chart-2)",
    },
  } satisfies ChartConfig

  const statusChartConfig = {
    completed: { label: "Completed", color: "var(--color-success)" },
    processing: { label: "Processing", color: "var(--color-primary)" },
    pending: { label: "Pending", color: "var(--color-warning)" },
    cancelled: { label: "Cancelled", color: "var(--color-destructive)" },
  } satisfies ChartConfig

  const productChartConfig = {
    revenue: {
      label: "Revenue",
      color: "var(--color-primary)",
    },
  } satisfies ChartConfig

  const PIE_COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">From {orders.filter(o => o.status === "completed").length} completed orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            {revenueChange >= 0 ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(thisMonthRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {revenueChange >= 0 ? "+" : ""}{revenueChange.toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">{thisMonthOrders.length} this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                const completed = orders.filter(o => o.status === "completed")
                return formatCurrency(completed.length > 0 ? totalRevenue / completed.length : 0)
              })()}
            </div>
            <p className="text-xs text-muted-foreground">{customerTotal} customers</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="revenue" className="w-full">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue</CardTitle>
              <CardDescription>Revenue trend over the last 12 months</CardDescription>
            </CardHeader>
            <CardContent>
              {revenueData.length > 0 ? (
                <ChartContainer config={revenueChartConfig} className="h-[350px] w-full">
                  <LineChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(value) => `$${value}`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="var(--color-revenue)" 
                      strokeWidth={2}
                      dot={{ fill: "var(--color-revenue)" }}
                    />
                  </LineChart>
                </ChartContainer>
              ) : (
                <div className="flex h-[350px] items-center justify-center text-muted-foreground">
                  No revenue data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Order Status Distribution</CardTitle>
                <CardDescription>Breakdown of orders by status</CardDescription>
              </CardHeader>
              <CardContent>
                {orderStatusData.length > 0 ? (
                  <ChartContainer config={statusChartConfig} className="h-[300px] w-full">
                    <PieChart>
                      <Pie
                        data={orderStatusData}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ status, count }) => `${status}: ${count}`}
                      >
                        {orderStatusData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={PIE_COLORS[index % PIE_COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                    No order data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Orders by Month</CardTitle>
                <CardDescription>Number of orders placed each month</CardDescription>
              </CardHeader>
              <CardContent>
                {revenueData.length > 0 ? (
                  <ChartContainer config={revenueChartConfig} className="h-[300px] w-full">
                    <BarChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="orders" fill="var(--color-orders)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                    No order data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Selling Products</CardTitle>
                <CardDescription>Products by revenue</CardDescription>
              </CardHeader>
              <CardContent>
                {topProducts.length > 0 ? (
                  <ChartContainer config={productChartConfig} className="h-[300px] w-full">
                    <BarChart data={topProducts} layout="vertical" margin={{ top: 20, right: 30, left: 100, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" tickFormatter={(value) => `$${value}`} />
                      <YAxis dataKey="name" type="category" className="text-xs" width={90} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                    No product sales data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inventory by Category</CardTitle>
                <CardDescription>Product distribution across categories</CardDescription>
              </CardHeader>
              <CardContent>
                {categoryData.length > 0 ? (
                  <ChartContainer config={productChartConfig} className="h-[300px] w-full">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="count"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ category, count }) => `${category}: ${count}`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={PIE_COLORS[index % PIE_COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                    No category data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

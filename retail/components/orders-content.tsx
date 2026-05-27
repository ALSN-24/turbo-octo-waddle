/**
 * components/orders-content.tsx — Orders table + CRUD (Client Component)
 *
 * Renders a searchable table of orders with status change controls and an
 * order creation dialog. Order creation is atomic — the API uses a database
 * transaction so a partial failure rolls back the entire order.
 *
 * Order creation flow:
 *   1. User selects an optional customer and adds product + quantity rows.
 *   2. calculateTotal() computes the total client-side from product prices.
 *   3. POST /api/orders sends the full payload.
 *   4. The newly created order is fetched by ID (GET /api/orders/:id) to get
 *      the complete record with customer and items nested — this is passed
 *      to setOrders() to update the table immediately.
 *
 * Status changes:
 *   Each row has an inline Select for status. On change, PUT /api/orders/:id
 *   is called and local state updated immediately on success.
 *
 * isSubmitting (separate from isLoading):
 *   Named differently to clearly distinguish the "creating order" loading
 *   state from other possible loading states in the component.
 */
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Plus, Search, Eye, Trash2, X } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import type { Order, Customer, Product, HydratedOrder } from "@/lib/types"

interface OrdersContentProps {
  initialOrders: HydratedOrder[]
  initialTotal: number
  customers: Customer[]
  products: Product[]
}

export function OrdersContent({ initialOrders, initialTotal: _initialTotal, customers, products }: OrdersContentProps) {
  const router = useRouter()
  const [orders, setOrders] = useState(initialOrders)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [viewingOrder, setViewingOrder] = useState<HydratedOrder | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [orderItems, setOrderItems] = useState<{ productId: string; quantity: number }[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredOrders = orders.filter(
    (o) =>
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.status.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const resetForm = () => { setSelectedCustomer(""); setOrderItems([]) }

  const addOrderItem = () => setOrderItems([...orderItems, { productId: "", quantity: 1 }])

  const updateOrderItem = (index: number, field: "productId" | "quantity", value: string | number) => {
    const updated = [...orderItems]
    updated[index] = { ...updated[index], [field]: value }
    setOrderItems(updated)
  }

  const removeOrderItem = (index: number) => setOrderItems(orderItems.filter((_, i) => i !== index))

  const calculateTotal = () =>
    orderItems.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId)
      return sum + (product ? Number(product.price) * item.quantity : 0)
    }, 0)

  const handleAdd = async () => {
    const validItems = orderItems.filter((item) => item.productId)
    if (validItems.length === 0) { toast.error("Add at least one product to the order."); return }

    setIsSubmitting(true)
    try {
      const items = validItems.map((item) => {
        const product = products.find((p) => p.id === item.productId)
        return { product_id: item.productId, quantity: item.quantity, price: product?.price ?? 0 }
      })

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: selectedCustomer || null,
          total: calculateTotal(),
          status: "pending",
          items,
        }),
      })
      const created = await res.json()
      if (!res.ok) throw new Error(created.error || "Failed to create order.")

      const fullRes = await fetch(`/api/orders/${created.id}`)
      if (fullRes.ok) {
        const fullOrder = await fullRes.json()
        setOrders([fullOrder, ...orders])
      }

      setIsAddDialogOpen(false)
      resetForm()
      toast.success("Order created successfully.")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create order.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete order.")
      }
      setOrders(orders.filter((o) => o.id !== id))
      toast.success("Order deleted.")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete order.")
    }
  }

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update status.")
      }
      setOrders(orders.map((o) => o.id === orderId ? { ...o, status: newStatus as Order["status"] } : o))
      toast.success(`Order marked as ${newStatus}.`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update order status.")
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-success text-success-foreground"
      case "processing": return "bg-primary text-primary-foreground"
      case "pending": return "bg-warning text-warning-foreground"
      case "cancelled": return "bg-destructive text-destructive-foreground"
      default: return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by order ID, customer, or status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Create Order</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
              <DialogDescription>Select a customer and add items to the order.</DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <FieldLabel>Customer <span className="font-normal text-muted-foreground">(optional)</span></FieldLabel>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer} disabled={isSubmitting}>
                  <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <div>
                <FieldLabel className="mb-2 block">Order Items</FieldLabel>
                <div className="flex flex-col gap-3">
                  {orderItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Select value={item.productId} onValueChange={(v) => updateOrderItem(index, "productId", v)} disabled={isSubmitting}>
                        <SelectTrigger className="flex-1"><SelectValue placeholder="Select product" /></SelectTrigger>
                        <SelectContent>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name} — {formatCurrency(Number(p.price))}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number" min="1" value={item.quantity}
                        onChange={(e) => updateOrderItem(index, "quantity", parseInt(e.target.value) || 1)}
                        className="w-20" disabled={isSubmitting}
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeOrderItem(index)} disabled={isSubmitting}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" onClick={addOrderItem} className="w-full" disabled={isSubmitting}>
                    <Plus className="mr-2 h-4 w-4" />Add Item
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between border-t pt-4">
                <span className="font-medium">Total:</span>
                <span className="text-xl font-bold">{formatCurrency(calculateTotal())}</span>
              </div>
              <Button onClick={handleAdd} className="w-full" disabled={isSubmitting || orderItems.length === 0}>
                {isSubmitting && <Spinner className="mr-2" />}
                Create Order
              </Button>
            </FieldGroup>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">No orders found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">{order.id.slice(0, 8)}…</TableCell>
                    <TableCell>{order.customer?.name || "Guest"}</TableCell>
                    <TableCell>{order.order_items?.length || 0} items</TableCell>
                    <TableCell>{formatCurrency(Number(order.total))}</TableCell>
                    <TableCell>
                      <Select value={order.status} onValueChange={(v) => handleStatusChange(order.id, v)}>
                        <SelectTrigger className="w-[130px]">
                          <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{formatDate(order.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Dialog open={viewingOrder?.id === order.id} onOpenChange={(open) => { if (!open) setViewingOrder(null) }}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setViewingOrder(order)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Order Details</DialogTitle>
                              <DialogDescription>View the complete order information.</DialogDescription>
                            </DialogHeader>
                            {viewingOrder && (
                              <div className="flex flex-col gap-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div><p className="text-muted-foreground">Order ID</p><p className="font-mono text-xs">{viewingOrder.id}</p></div>
                                  <div><p className="text-muted-foreground">Customer</p><p>{viewingOrder.customer?.name || "Guest"}</p></div>
                                  <div><p className="text-muted-foreground">Date</p><p>{formatDate(viewingOrder.created_at)}</p></div>
                                  <div><p className="text-muted-foreground">Status</p><Badge className={getStatusColor(viewingOrder.status)}>{viewingOrder.status}</Badge></div>
                                </div>
                                <div className="border-t pt-4">
                                  <p className="font-medium mb-2">Items</p>
                                  <div className="flex flex-col gap-2">
                                    {viewingOrder.order_items?.map((item) => (
                                      <div key={item.id} className="flex items-center justify-between text-sm">
                                        <span>{item.product?.name || "Unknown"} × {item.quantity}</span>
                                        <span>{formatCurrency(Number(item.price) * item.quantity)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex items-center justify-between border-t pt-4">
                                  <span className="font-medium">Total</span>
                                  <span className="text-xl font-bold">{formatCurrency(Number(viewingOrder.total))}</span>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(order.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

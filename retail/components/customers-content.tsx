/**
 * components/customers-content.tsx — Customers list + CRUD (Client Component)
 *
 * Renders a grid of customer cards with inline edit, delete, and purchase
 * history dialogs. All mutations call the REST API; local state is updated
 * optimistically so the UI responds instantly.
 *
 * State:
 *   - initialCustomers and orders are Server Component props loaded into
 *     useState on mount. Mutations update local state directly.
 *   - isLoading disables all form inputs and submit buttons during requests
 *     to prevent double-submit.
 *
 * Validation (client-side, before network):
 *   - name: required, non-empty
 *   - email: required, valid format
 *
 * Toast feedback:
 *   - toast.success() on successful add / edit / delete
 *   - toast.error() with the server error message on failure
 *
 * Purchase history modal:
 *   Orders are pre-loaded on the page and filtered client-side by customer_id.
 *   Avoids a per-customer API call when opening the history dialog.
 */
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Plus, Search, Mail, Phone, MapPin, Calendar, Pencil, Trash2, History, ShoppingCart,
} from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import type { Customer, Order } from "@/lib/types"

interface CustomersContentProps {
  initialCustomers: Customer[]
  initialTotal: number
  orders: Order[]
}

export function CustomersContent({ initialCustomers, initialTotal: _initialTotal, orders }: CustomersContentProps) {
  const router = useRouter()
  const [customers, setCustomers] = useState(initialCustomers)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [viewingHistory, setViewingHistory] = useState<Customer | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", address: "" })

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getCustomerOrders = (customerId: string) =>
    orders.filter((o) => o.customer_id === customerId)

  const getCustomerStats = (customerId: string) => {
    const customerOrders = getCustomerOrders(customerId)
    const totalSpent = customerOrders
      .filter((o) => o.status === "completed")
      .reduce((sum, o) => sum + Number(o.total), 0)
    return { orderCount: customerOrders.length, totalSpent }
  }

  const resetForm = () => {
    setFormData({ name: "", email: "", phone: "", address: "" })
    setEditingCustomer(null)
  }

  const validateForm = () => {
    if (!formData.name.trim()) { toast.error("Name is required."); return false }
    if (!formData.email.trim()) { toast.error("Email is required."); return false }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Please enter a valid email address."); return false
    }
    return true
  }

  const handleAdd = async () => {
    if (!validateForm()) return
    setIsLoading(true)
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create customer.")
      setCustomers([data, ...customers])
      setIsAddDialogOpen(false)
      resetForm()
      toast.success("Customer added successfully.")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create customer.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!editingCustomer || !validateForm()) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/customers/${editingCustomer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update customer.")
      setCustomers(customers.map((c) => (c.id === data.id ? data : c)))
      setEditingCustomer(null)
      resetForm()
      toast.success("Customer updated successfully.")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update customer.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete customer.")
      }
      setCustomers(customers.filter((c) => c.id !== id))
      toast.success("Customer deleted.")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete customer.")
    }
  }

  const openEditDialog = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || "",
      address: customer.address || "",
    })
  }

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
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
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Customer</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>Fill in the customer details below.</DialogDescription>
            </DialogHeader>
            <CustomerForm formData={formData} setFormData={setFormData} onSubmit={handleAdd} submitLabel="Add Customer" isLoading={isLoading} />
          </DialogContent>
        </Dialog>
      </div>

      {filteredCustomers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No customers found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCustomers.map((customer) => {
            const stats = getCustomerStats(customer.id)
            return (
              <Card key={customer.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{customer.name}</h3>
                      <div className="mt-1 flex gap-2">
                        <Badge variant="secondary" className="text-xs">{stats.orderCount} orders</Badge>
                        <Badge variant="outline" className="text-xs">{formatCurrency(stats.totalSpent)} spent</Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Dialog open={viewingHistory?.id === customer.id} onOpenChange={(open) => { if (!open) setViewingHistory(null) }}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setViewingHistory(customer)}>
                            <History className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Purchase History — {customer.name}</DialogTitle>
                            <DialogDescription>All orders placed by this customer.</DialogDescription>
                          </DialogHeader>
                          <CustomerPurchaseHistory orders={getCustomerOrders(customer.id)} formatDate={formatDate} formatCurrency={formatCurrency} getStatusColor={getStatusColor} />
                        </DialogContent>
                      </Dialog>
                      <Dialog open={editingCustomer?.id === customer.id} onOpenChange={(open) => { if (!open) resetForm() }}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(customer)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Customer</DialogTitle>
                            <DialogDescription>Update the customer details below.</DialogDescription>
                          </DialogHeader>
                          <CustomerForm formData={formData} setFormData={setFormData} onSubmit={handleEdit} submitLabel="Save Changes" isLoading={isLoading} />
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(customer.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />{customer.email}
                    </div>
                    {customer.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />{customer.phone}
                      </div>
                    )}
                    {customer.address && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />{customer.address}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />Member since {formatDate(customer.member_since)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface CustomerFormProps {
  formData: { name: string; email: string; phone: string; address: string }
  setFormData: React.Dispatch<React.SetStateAction<{ name: string; email: string; phone: string; address: string }>>
  onSubmit: () => void
  submitLabel: string
  isLoading: boolean
}

function CustomerForm({ formData, setFormData, onSubmit, submitLabel, isLoading }: CustomerFormProps) {
  return (
    <FieldGroup>
      <Field>
        <FieldLabel>Name <span className="text-destructive">*</span></FieldLabel>
        <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Customer name" disabled={isLoading} />
      </Field>
      <Field>
        <FieldLabel>Email <span className="text-destructive">*</span></FieldLabel>
        <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="customer@example.com" disabled={isLoading} />
      </Field>
      <Field>
        <FieldLabel>Phone</FieldLabel>
        <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+1 234 567 8900" disabled={isLoading} />
      </Field>
      <Field>
        <FieldLabel>Address</FieldLabel>
        <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="123 Main St, City, State" disabled={isLoading} />
      </Field>
      <Button onClick={onSubmit} className="w-full" disabled={isLoading}>
        {isLoading && <Spinner className="mr-2" />}
        {submitLabel}
      </Button>
    </FieldGroup>
  )
}

interface CustomerPurchaseHistoryProps {
  orders: Order[]
  formatDate: (d: string) => string
  formatCurrency: (n: number) => string
  getStatusColor: (s: string) => string
}

function CustomerPurchaseHistory({ orders, formatDate, formatCurrency, getStatusColor }: CustomerPurchaseHistoryProps) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <ShoppingCart className="h-12 w-12 mb-4" />
        <p>No orders yet</p>
      </div>
    )
  }
  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="flex flex-col gap-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Order #{order.id.slice(0, 8)}</CardTitle>
                <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
            </CardHeader>
            <CardContent>
              {order.order_items && order.order_items.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span>{item.product?.name || "Unknown Product"} × {item.quantity}</span>
                      <span className="text-muted-foreground">{formatCurrency(Number(item.price) * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="mt-2 flex items-center justify-between border-t pt-2 font-medium">
                    <span>Total</span>
                    <span>{formatCurrency(Number(order.total))}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No items</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  )
}

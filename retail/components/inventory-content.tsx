/**
 * components/inventory-content.tsx — Inventory table + CRUD (Client Component)
 *
 * Renders a searchable table of products with inline edit and delete actions.
 * The add/edit form includes all product fields including the optional
 * description (via the Textarea component from shadcn/ui).
 *
 * Low-stock indicator:
 *   Rows where stock < low_stock_threshold show an AlertTriangle icon and
 *   the stock value in destructive red.
 *
 * Search:
 *   Filters locally on name, SKU, and category — no server round-trip.
 *   State is held in searchQuery and applied via Array.filter().
 *
 * Form validation (client-side):
 *   - name, sku: required and non-empty
 *   - price: required, non-negative number
 *   - stock: required, non-negative integer
 *
 * The EMPTY_FORM constant defines the default state for the add form and is
 * also used by resetForm() to clear the edit dialog after submission.
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
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { Plus, Search, Pencil, Trash2, AlertTriangle } from "lucide-react"
import type { Product } from "@/lib/types"

interface InventoryContentProps {
  initialProducts: Product[]
  initialTotal: number
}

const categories = ["Electronics", "Clothing", "Food", "Home", "Sports", "Other"]

type FormData = {
  name: string; sku: string; category: string; price: string; stock: string
  low_stock_threshold: string; description: string; status: "active" | "inactive"
}

const EMPTY_FORM: FormData = {
  name: "", sku: "", category: "Other", price: "", stock: "",
  low_stock_threshold: "10", description: "", status: "active",
}

export function InventoryContent({ initialProducts, initialTotal: _initialTotal }: InventoryContentProps) {
  const router = useRouter()
  const [products, setProducts] = useState(initialProducts)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM)
  const [isLoading, setIsLoading] = useState(false)

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const resetForm = () => { setFormData(EMPTY_FORM); setEditingProduct(null) }

  const validateForm = () => {
    if (!formData.name.trim()) { toast.error("Product name is required."); return false }
    if (!formData.sku.trim()) { toast.error("SKU is required."); return false }
    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
      toast.error("Please enter a valid price."); return false
    }
    if (!formData.stock || isNaN(parseInt(formData.stock)) || parseInt(formData.stock) < 0) {
      toast.error("Please enter a valid stock quantity."); return false
    }
    return true
  }

  const buildPayload = () => ({
    name: formData.name.trim(),
    sku: formData.sku.trim(),
    category: formData.category,
    price: parseFloat(formData.price),
    stock: parseInt(formData.stock),
    low_stock_threshold: parseInt(formData.low_stock_threshold) || 10,
    description: formData.description.trim() || null,
    status: formData.status,
  })

  const handleAdd = async () => {
    if (!validateForm()) return
    setIsLoading(true)
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create product.")
      setProducts([data, ...products])
      setIsAddDialogOpen(false)
      resetForm()
      toast.success("Product added successfully.")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create product.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!editingProduct || !validateForm()) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update product.")
      setProducts(products.map((p) => (p.id === data.id ? data : p)))
      resetForm()
      toast.success("Product updated successfully.")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update product.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete product.")
      }
      setProducts(products.filter((p) => p.id !== id))
      toast.success("Product deleted.")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete product.")
    }
  }

  const openEditDialog = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category,
      price: product.price.toString(),
      stock: product.stock.toString(),
      low_stock_threshold: product.low_stock_threshold.toString(),
      description: product.description ?? "",
      status: product.status,
    })
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
  const isLowStock = (p: Product) => p.stock < p.low_stock_threshold

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, SKU, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Product</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>Fill in the product details below.</DialogDescription>
            </DialogHeader>
            <ProductForm formData={formData} setFormData={setFormData} onSubmit={handleAdd} submitLabel="Add Product" isLoading={isLoading} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">No products found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>{formatCurrency(Number(product.price))}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isLowStock(product) && <AlertTriangle className="h-4 w-4 text-warning" />}
                        <span className={isLowStock(product) ? "text-destructive font-medium" : ""}>{product.stock}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.status === "active" ? "default" : "secondary"}>{product.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Dialog open={editingProduct?.id === product.id} onOpenChange={(open) => { if (!open) resetForm() }}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(product)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Product</DialogTitle>
                              <DialogDescription>Update the product details below.</DialogDescription>
                            </DialogHeader>
                            <ProductForm formData={formData} setFormData={setFormData} onSubmit={handleEdit} submitLabel="Save Changes" isLoading={isLoading} />
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
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

function ProductForm({
  formData, setFormData, onSubmit, submitLabel, isLoading,
}: {
  formData: FormData
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
  onSubmit: () => void
  submitLabel: string
  isLoading: boolean
}) {
  return (
    <FieldGroup>
      <Field>
        <FieldLabel>Name <span className="text-destructive">*</span></FieldLabel>
        <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Product name" disabled={isLoading} />
      </Field>
      <Field>
        <FieldLabel>SKU <span className="text-destructive">*</span></FieldLabel>
        <Input value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} placeholder="SKU-001" disabled={isLoading} />
      </Field>
      <Field>
        <FieldLabel>Category</FieldLabel>
        <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })} disabled={isLoading}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel>Price <span className="text-destructive">*</span></FieldLabel>
          <Input type="number" step="0.01" min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="0.00" disabled={isLoading} />
        </Field>
        <Field>
          <FieldLabel>Stock <span className="text-destructive">*</span></FieldLabel>
          <Input type="number" min="0" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} placeholder="0" disabled={isLoading} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel>Low Stock Threshold</FieldLabel>
          <Input type="number" min="0" value={formData.low_stock_threshold} onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })} placeholder="10" disabled={isLoading} />
        </Field>
        <Field>
          <FieldLabel>Status</FieldLabel>
          <Select value={formData.status} onValueChange={(v: "active" | "inactive") => setFormData({ ...formData, status: v })} disabled={isLoading}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field>
        <FieldLabel>Description <span className="font-normal text-muted-foreground">(optional)</span></FieldLabel>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Product description…"
          rows={3}
          disabled={isLoading}
        />
      </Field>
      <Button onClick={onSubmit} className="w-full" disabled={isLoading}>
        {isLoading && <Spinner className="mr-2" />}
        {submitLabel}
      </Button>
    </FieldGroup>
  )
}

/**
 * components/inventory-content.tsx — Inventory table + CRUD (Client Component)
 *
 * Renders a searchable table of products with inline edit and delete actions.
 * The add/edit form includes all product fields including the optional
 * description and image upload.
 *
 * Image upload:
 *   Clicking "Choose Image" POSTs the file to /api/products/upload (multipart).
 *   On success the returned URL is stored in formData.image_url and sent as
 *   part of the normal create/update payload. A live preview is shown below
 *   the file picker so users can confirm the upload before saving.
 *
 * Low-stock indicator:
 *   Rows where stock < low_stock_threshold show an AlertTriangle icon and
 *   the stock value in destructive red.
 *
 * Search:
 *   Filters locally on name, SKU, and category — no server round-trip.
 */
"use client"

import { useState, useRef } from "react"
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
import { Plus, Search, Pencil, Trash2, AlertTriangle, ImagePlus, X } from "lucide-react"
import type { Product } from "@/lib/types"

interface InventoryContentProps {
  initialProducts: Product[]
  initialTotal: number
}

const categories = ["Electronics", "Clothing", "Food", "Home", "Sports", "Other"]

type FormData = {
  name: string; sku: string; category: string; price: string; stock: string
  low_stock_threshold: string; description: string; status: "active" | "inactive"
  image_url: string | null
}

const EMPTY_FORM: FormData = {
  name: "", sku: "", category: "Other", price: "", stock: "",
  low_stock_threshold: "10", description: "", status: "active",
  image_url: null,
}

// Fallback for images that fail to load (handles absolute vs relative URLs).
function handleImageFallback(e: any) {
  const img: HTMLImageElement = e.currentTarget
  // Prevent infinite loop
  img.onerror = null
  try {
    // If src is absolute, try stripping origin to use the app-served static path
    const parsed = new URL(img.src)
    if (parsed.pathname && parsed.pathname !== img.src) {
      img.src = parsed.pathname
      return
    }
  } catch {}
  // As a last resort, try constructing from filename
  const parts = img.src.split('/')
  const filename = parts[parts.length - 1]
  if (filename) img.src = `/uploads/products/${filename}`
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
    image_url: formData.image_url || null,
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
      image_url: product.image_url ?? null,
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
          <DialogContent className="max-h-[90vh] overflow-y-auto">
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
                  <TableHead className="w-[60px]">Image</TableHead>
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
                    <TableCell>
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          onError={handleImageFallback}
                          className="h-10 w-10 rounded-md object-cover border border-border"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                          <ImagePlus className="h-4 w-4" />
                        </div>
                      )}
                    </TableCell>
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
                          <DialogContent className="max-h-[90vh] overflow-y-auto">
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
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/products/upload", {
        method: "POST",
        body: fd,
        credentials: "same-origin",
      })
      const data = await res.json().catch(() => ({ error: 'Upload failed.' }))
      if (!res.ok) {
        const message =
          res.status === 401
            ? 'Unauthorized. Please log in again to upload images.'
            : data.error || `Upload failed. (${res.status})`
        throw new Error(message)
      }
      setFormData((prev) => ({ ...prev, image_url: data.url }))
      toast.success("Image uploaded.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.")
    } finally {
      setUploading(false)
      // reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, image_url: null }))
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

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

      {/* ── Image upload ──────────────────────────────────────────────── */}
      <Field>
        <FieldLabel>Product Image <span className="font-normal text-muted-foreground">(optional, max 2 MB)</span></FieldLabel>

        {formData.image_url ? (
          <div className="relative w-fit">
            <img
              src={formData.image_url}
              onError={handleImageFallback}
              alt="Product preview"
              className="h-32 w-32 rounded-lg object-cover border border-border"
            />
            <button
              type="button"
              onClick={removeImage}
              disabled={isLoading || uploading}
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow hover:opacity-90 transition-opacity"
              aria-label="Remove image"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <label
            className={`flex flex-col items-center justify-center gap-2 h-32 w-full rounded-lg border-2 border-dashed border-border cursor-pointer hover:bg-muted/50 transition-colors ${(isLoading || uploading) ? "opacity-50 pointer-events-none" : ""}`}
          >
            {uploading ? (
              <>
                <Spinner className="h-6 w-6" />
                <span className="text-sm text-muted-foreground">Uploading…</span>
              </>
            ) : (
              <>
                <ImagePlus className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Click to upload image</span>
                <span className="text-xs text-muted-foreground">JPG, JPEG, PNG, WebP or GIF</span>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,image/jpeg,image/jpg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={handleImageChange}
              disabled={isLoading || uploading}
            />
          </label>
        )}
      </Field>

      <Button onClick={onSubmit} className="w-full" disabled={isLoading || uploading}>
        {isLoading && <Spinner className="mr-2" />}
        {submitLabel}
      </Button>
    </FieldGroup>
  )
}

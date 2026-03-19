"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Download,
  RefreshCw,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { DataTable, type Column } from "@/components/ui/data-table";
import { toast } from "sonner";
import { useAgentActionsStore } from "@/stores/agent-actions";
import { AddProductModal } from "@/components/products/add-product-modal";
import { CsvImportDialog } from "@/components/csv-import-dialog";
import { CsvExportButton } from "@/components/csv-export-button";
import { importProductsCsv } from "@/lib/api";
import {
  getProducts,
  deleteProduct,
  getCategories,
  formatPrice,
  resolveImageUrl,
  type ProductSummary,
  type ProductStatus,
  type ProductCategory,
} from "@/lib/api";
import { usePageContext } from "@/hooks/use-page-context";

function getStatusBadge(status: ProductStatus) {
  switch (status) {
    case "published":
      return <Badge className="bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-950/30">Published</Badge>;
    case "ready":
      return <Badge className="bg-blue-100 dark:bg-blue-950/30 text-blue-800 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/30">Ready</Badge>;
    case "draft":
      return <Badge className="bg-gray-100 dark:bg-gray-800/30 text-gray-800 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/30">Draft</Badge>;
    case "pending_assets":
      return <Badge className="bg-yellow-100 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-950/30">Processing...</Badge>;
    case "proposed":
      return <Badge className="bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/30">Proposed</Badge>;
    case "rejected":
      return <Badge className="bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/30">Rejected</Badge>;
    case "failed":
      return <Badge className="bg-red-200 dark:bg-red-950/40 text-red-900 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-950/40">Failed</Badge>;
    case "archived":
      return <Badge className="bg-gray-200 dark:bg-gray-800/40 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800/40">Archived</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

// Component to handle search params (needs Suspense)
function ProductsPageContent({ onOpenModal }: { onOpenModal: () => void }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("action") === "add") {
      onOpenModal();
      router.replace("/products", { scroll: false });
    }
  }, [searchParams, router, onOpenModal]);

  return null;
}

export default function ProductsPage() {
  usePageContext("products");
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [pagination, setPagination] = useState({
    start: 0,
    end: 20,
    totalElements: 0,
    totalPages: 0,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductSummary | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  // Agent actions: auto-open add-product modal
  const pendingModal = useAgentActionsStore(s => s.pendingModal);
  const consumeModal = useAgentActionsStore(s => s.consumeModal);

  useEffect(() => {
    if (pendingModal?.modalId === "add-product") {
      setAddProductOpen(true);
      consumeModal("add-product");
    }
  }, [pendingModal, consumeModal]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getProducts({
        start: pagination.start,
        end: pagination.end,
        q: searchQuery || undefined,
        status: statusFilter !== "all" ? (statusFilter as ProductStatus) : undefined,
      });
      setProducts(response.content || []);
      setPagination((prev) => ({
        ...prev,
        totalElements: response.totalElements || 0,
        totalPages: response.totalPages || 0,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await getCategories({ limit: 100 });
      setCategories(response.categories || []);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, pagination.start]);

  const handleProductSave = (data: any, isDraft: boolean) => {
    console.log("Product saved:", data, "Draft:", isDraft);
    fetchProducts();
  };

  const handleDeleteProduct = (product: ProductSummary) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct(productToDelete.id);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      toast.success("Product deleted");
      fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete product");
      toast.error("Failed to delete product");
      setDeleteDialogOpen(false);
    }
  };

  const handleBulkPublish = async () => {
    toast.success(`Published ${selectedProducts.size} products`);
    setSelectedProducts(new Set());
  };

  const handleBulkUnpublish = async () => {
    toast.success(`Unpublished ${selectedProducts.size} products`);
    setSelectedProducts(new Set());
  };

  const handleBulkDelete = async () => {
    toast.success(`Deleted ${selectedProducts.size} products`);
    setSelectedProducts(new Set());
  };

  const currentPage = Math.floor(pagination.start / 20) + 1;

  const productColumns: Column<ProductSummary>[] = useMemo(
    () => [
      {
        id: "image",
        header: "Image",
        className: "w-[100px]",
        cell: (product) => (
          <Link href={`/products/${product.id}`} onClick={(e) => e.stopPropagation()}>
            {product.thumbnail ? (
              <img
                src={resolveImageUrl(product.thumbnail) || ""}
                alt={product.title}
                className="h-12 w-12 rounded object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                  if (fallback) fallback.style.display = "flex";
                }}
              />
            ) : null}
            <div className={`${product.thumbnail ? "hidden" : "flex"} h-12 w-12 rounded bg-muted items-center justify-center`}>
              <ImageIcon className="h-5 w-5 text-muted-foreground/50" />
            </div>
          </Link>
        ),
      },
      {
        id: "product",
        header: "Product",
        cell: (product) => (
          <Link href={`/products/${product.id}`} className="flex flex-col" onClick={(e) => e.stopPropagation()}>
            <span className="font-medium hover:underline">{product.title}</span>
            {product.subtitle && (
              <span className="text-xs text-muted-foreground">
                {product.subtitle}
              </span>
            )}
          </Link>
        ),
      },
      {
        id: "handle",
        header: "Handle",
        hideOnMobile: true,
        cell: (product) => <span className="text-muted-foreground">/{product.handle}</span>,
      },
      {
        id: "variants",
        header: "Variants",
        className: "text-center",
        hideOnMobile: true,
        cell: (product) => <>{product.variantCount ?? 0}</>,
      },
      {
        id: "status",
        header: "Status",
        cell: (product) => getStatusBadge(product.status),
      },
      {
        id: "actions",
        header: "",
        className: "w-[50px]",
        cell: (product) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/products/${product.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/products/${product.id}`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => handleDeleteProduct(product)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    []
  );

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Handle search params */}
      <Suspense fallback={null}>
        <ProductsPageContent onOpenModal={() => setAddProductOpen(true)} />
      </Suspense>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={addProductOpen}
        onClose={() => setAddProductOpen(false)}
        onSave={handleProductSave}
      />

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your product inventory and listings
          </p>
        </div>
        <div className="flex gap-2">
          <CsvExportButton type="products" />
          <CsvImportDialog type="products" onImport={importProductsCsv} onComplete={() => fetchProducts()} />
          <Button className="gap-2" onClick={() => setAddProductOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-wrap gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_assets">Processing</SelectItem>
                  <SelectItem value="proposed">Proposed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={fetchProducts} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
          <CardDescription>
            {pagination.totalElements} products in your inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Error State */}
          {error && (
            <div className="flex items-center gap-2 p-4 mb-4 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={fetchProducts} className="ml-auto">
                Retry
              </Button>
            </div>
          )}

          <DataTable
            columns={productColumns}
            data={products}
            loading={loading}
            selectable
            selectedIds={selectedProducts}
            onSelectionChange={setSelectedProducts}
            getRowId={(p) => p.id}
            onRowClick={(p) => (window.location.href = `/products/${p.id}`)}
            pagination={pagination.totalPages > 1 ? {
              page: currentPage,
              pageSize: 20,
              total: pagination.totalElements,
              onPageChange: (page) => setPagination((prev) => ({
                ...prev,
                start: (page - 1) * 20,
                end: page * 20,
              })),
            } : undefined}
            emptyTitle="No products found"
            emptyIcon={<ImageIcon className="h-10 w-10 opacity-40" />}
          />
        </CardContent>
      </Card>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedProducts.size}
        onClearSelection={() => setSelectedProducts(new Set())}
        actions={[
          { label: "Publish", icon: <Eye className="h-4 w-4" />, onClick: handleBulkPublish },
          { label: "Unpublish", icon: <EyeOff className="h-4 w-4" />, onClick: handleBulkUnpublish, variant: "outline" },
          { label: "Delete", icon: <Trash2 className="h-4 w-4" />, onClick: handleBulkDelete, variant: "destructive" },
        ]}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{productToDelete?.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteProduct}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

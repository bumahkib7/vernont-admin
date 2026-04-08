"use client";

import { useEffect, Suspense, useMemo, useCallback } from "react";
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
import { resolveImageUrl, formatPrice } from "@/lib/api/client";
import type { ProductSummary, ProductStatus } from "@/lib/api/products";
import { usePageContext } from "@/hooks/use-page-context";
import { useProductStore } from "@/stores/product-store";
import { useProducts, useCategories, useDeleteProduct, useBulkDeleteProducts } from "@/hooks/use-products";

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

  // --------------- Zustand: client UI state ---------------
  const filters = useProductStore((s) => s.filters);
  const setSearch = useProductStore((s) => s.setSearch);
  const setStatusFilter = useProductStore((s) => s.setStatusFilter);
  const setCategoryFilter = useProductStore((s) => s.setCategoryFilter);
  const pagination = useProductStore((s) => s.pagination);
  const setPage = useProductStore((s) => s.setPage);
  const selectedIds = useProductStore((s) => s.selectedIds);
  const selectAll = useProductStore((s) => s.selectAll);
  const clearSelection = useProductStore((s) => s.clearSelection);
  const addProductOpen = useProductStore((s) => s.addProductOpen);
  const setAddProductOpen = useProductStore((s) => s.setAddProductOpen);
  const deleteDialogOpen = useProductStore((s) => s.deleteDialogOpen);
  const productToDeleteId = useProductStore((s) => s.productToDeleteId);
  const productToDeleteTitle = useProductStore((s) => s.productToDeleteTitle);
  const openDeleteDialog = useProductStore((s) => s.openDeleteDialog);
  const closeDeleteDialog = useProductStore((s) => s.closeDeleteDialog);

  // --------------- React Query: server state ---------------
  const {
    data: productsData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useProducts({
    page: pagination.page,
    pageSize: pagination.pageSize,
    search: filters.search,
    status: filters.status,
  });

  const { data: categoriesData } = useCategories();

  const deleteMutation = useDeleteProduct();
  const bulkDeleteMutation = useBulkDeleteProducts();

  const products = productsData?.content ?? [];
  const totalElements = productsData?.totalElements ?? 0;
  const totalPages = productsData?.totalPages ?? 0;
  const categories = categoriesData?.categories ?? [];

  // --------------- Agent actions: auto-open modal ---------------
  const pendingModal = useAgentActionsStore((s) => s.pendingModal);
  const consumeModal = useAgentActionsStore((s) => s.consumeModal);

  useEffect(() => {
    if (pendingModal?.modalId === "add-product") {
      setAddProductOpen(true);
      consumeModal("add-product");
    }
  }, [pendingModal, consumeModal, setAddProductOpen]);

  // --------------- Handlers ---------------
  const handleProductSave = useCallback(
    (_isDraft: boolean) => {
      refetch();
    },
    [refetch]
  );

  const handleDeleteProduct = useCallback(
    (product: ProductSummary) => {
      openDeleteDialog(product.id, product.title);
    },
    [openDeleteDialog]
  );

  const confirmDeleteProduct = useCallback(async () => {
    if (!productToDeleteId) return;
    try {
      await deleteMutation.mutateAsync(productToDeleteId);
      closeDeleteDialog();
      toast.success("Product deleted");
    } catch {
      toast.error("Failed to delete product");
      closeDeleteDialog();
    }
  }, [productToDeleteId, deleteMutation, closeDeleteDialog]);

  const handleBulkPublish = useCallback(async () => {
    toast.success(`Published ${selectedIds.size} products`);
    clearSelection();
  }, [selectedIds.size, clearSelection]);

  const handleBulkUnpublish = useCallback(async () => {
    toast.success(`Unpublished ${selectedIds.size} products`);
    clearSelection();
  }, [selectedIds.size, clearSelection]);

  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    try {
      const result = await bulkDeleteMutation.mutateAsync(ids);
      if (result.failed.length > 0) {
        toast.error(`${result.failed.length} product(s) failed to delete`);
      }
      if (result.deleted > 0) {
        toast.success(`Deleted ${result.deleted} product(s)`);
      }
    } catch {
      toast.error("Failed to delete products");
    }
    clearSelection();
  }, [selectedIds, bulkDeleteMutation, clearSelection]);

  // --------------- Table columns ---------------
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
    [handleDeleteProduct]
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
          <CsvImportDialog type="products" onImport={importProductsCsv} onComplete={() => refetch()} />
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
                  value={filters.search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={filters.category} onValueChange={setCategoryFilter}>
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
              <Select value={filters.status} onValueChange={setStatusFilter}>
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
              <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
                <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
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
            {totalElements} products in your inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Error State */}
          {isError && (
            <div className="flex items-center gap-2 p-4 mb-4 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <span>{error instanceof Error ? error.message : "Failed to load products"}</span>
              <Button variant="ghost" size="sm" onClick={() => refetch()} className="ml-auto">
                Retry
              </Button>
            </div>
          )}

          <DataTable
            columns={productColumns}
            data={products}
            loading={isLoading}
            selectable
            selectedIds={selectedIds}
            onSelectionChange={(ids) => {
              // DataTable passes a Set<string> directly
              if (ids.size === 0) clearSelection();
              else selectAll(Array.from(ids));
            }}
            getRowId={(p) => p.id}
            onRowClick={(p) => (window.location.href = `/products/${p.id}`)}
            pagination={totalPages > 1 ? {
              page: pagination.page,
              pageSize: pagination.pageSize,
              total: totalElements,
              onPageChange: setPage,
            } : undefined}
            emptyTitle="No products found"
            emptyIcon={<ImageIcon className="h-10 w-10 opacity-40" />}
          />
        </CardContent>
      </Card>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onClearSelection={clearSelection}
        actions={[
          { label: "Publish", icon: <Eye className="h-4 w-4" />, onClick: handleBulkPublish },
          { label: "Unpublish", icon: <EyeOff className="h-4 w-4" />, onClick: handleBulkUnpublish, variant: "outline" },
          { label: "Delete", icon: <Trash2 className="h-4 w-4" />, onClick: handleBulkDelete, variant: "destructive" },
        ]}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={(open) => { if (!open) closeDeleteDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{productToDeleteTitle}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={closeDeleteDialog}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteProduct} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  bulkUpdateProductStatus,
  type BulkDeleteResponse,
  type BulkStatusUpdateResult,
  getCategories,
  type ProductStatus,
  type ProductsResponse,
  type Product,
  type CreateProductInput,
  type UpdateProductInput,
  type CreateProductResponse,
  type AdminCategoriesResponse,
} from "@/lib/api/products";

// ---------------------------------------------------------------------------
// Query key factory — single source of truth for cache key structure
// ---------------------------------------------------------------------------
export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  categories: () => ["categories"] as const,
};

// ---------------------------------------------------------------------------
// Products list query
// ---------------------------------------------------------------------------
export interface UseProductsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string; // "all" means no filter
}

export function useProducts(params: UseProductsParams = {}) {
  const { page = 1, pageSize = 20, search, status } = params;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return useQuery<ProductsResponse>({
    queryKey: productKeys.list({ start, end, search, status }),
    queryFn: () =>
      getProducts({
        start,
        end,
        q: search || undefined,
        status: status && status !== "all" ? (status as ProductStatus) : undefined,
      }),
    placeholderData: keepPreviousData,
  });
}

// ---------------------------------------------------------------------------
// Single product query
// ---------------------------------------------------------------------------
export function useProduct(id: string | undefined) {
  return useQuery<Product>({
    queryKey: productKeys.detail(id!),
    queryFn: () => getProduct(id!),
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Categories query (used alongside products for filtering)
// ---------------------------------------------------------------------------
export function useCategories() {
  return useQuery<AdminCategoriesResponse>({
    queryKey: productKeys.categories(),
    queryFn: () => getCategories({ limit: 100 }),
    staleTime: 5 * 60 * 1000, // categories change rarely
  });
}

// ---------------------------------------------------------------------------
// Create product mutation
// ---------------------------------------------------------------------------
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation<CreateProductResponse, Error, CreateProductInput>({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

// ---------------------------------------------------------------------------
// Update product mutation
// ---------------------------------------------------------------------------
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation<
    Product,
    Error,
    { id: string; data: UpdateProductInput }
  >({
    mutationFn: ({ id, data }) => updateProduct(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

// ---------------------------------------------------------------------------
// Delete product mutation
// ---------------------------------------------------------------------------
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

// ---------------------------------------------------------------------------
// Bulk delete products mutation
// ---------------------------------------------------------------------------
export function useBulkDeleteProducts() {
  const queryClient = useQueryClient();

  return useMutation<BulkDeleteResponse, Error, string[]>({
    mutationFn: bulkDeleteProducts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

// ---------------------------------------------------------------------------
// Bulk update product status mutation
// ---------------------------------------------------------------------------
export function useBulkUpdateProductStatus() {
  const queryClient = useQueryClient();

  return useMutation<
    BulkStatusUpdateResult,
    Error,
    { ids: string[]; status: ProductStatus }
  >({
    mutationFn: ({ ids, status }) => bulkUpdateProductStatus(ids, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

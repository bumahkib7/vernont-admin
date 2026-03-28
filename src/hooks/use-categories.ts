"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  activateCategory,
  deactivateCategory,
  getCategoryProducts,
  addProductsToCategory,
  removeProductsFromCategory,
  moveProductToCategory,
  type AdminCategoriesResponse,
  type ProductCategory,
  type CreateCategoryInput,
  type CategoryProductsResponse,
} from "@/lib/api";

// ============================================================================
// Query Keys
// ============================================================================

export const categoryKeys = {
  all: ["categories"] as const,
  lists: () => [...categoryKeys.all, "list"] as const,
  list: (params?: { offset?: number; limit?: number; q?: string; is_active?: boolean }) =>
    [...categoryKeys.lists(), params] as const,
  details: () => [...categoryKeys.all, "detail"] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
  products: (categoryId: string, params?: { offset?: number; limit?: number }) =>
    [...categoryKeys.all, "products", categoryId, params] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch all categories with optional filters.
 */
export function useCategories(params?: {
  offset?: number;
  limit?: number;
  q?: string;
  is_active?: boolean;
}) {
  return useQuery<AdminCategoriesResponse>({
    queryKey: categoryKeys.list(params),
    queryFn: () => getCategories(params),
    staleTime: 30_000,
  });
}

/**
 * Fetch a single category by ID.
 */
export function useCategory(id: string, enabled = true) {
  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: () => getCategory(id),
    enabled: enabled && !!id,
    staleTime: 30_000,
    select: (data) => data.category,
  });
}

/**
 * Fetch products belonging to a category.
 */
export function useCategoryProducts(
  categoryId: string,
  params?: { offset?: number; limit?: number },
  enabled = true
) {
  return useQuery<CategoryProductsResponse>({
    queryKey: categoryKeys.products(categoryId, params),
    queryFn: () => getCategoryProducts(categoryId, params),
    enabled: enabled && !!categoryId,
    staleTime: 30_000,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new category.
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryInput) => createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

/**
 * Update an existing category.
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCategoryInput> }) =>
      updateCategory(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
  });
}

/**
 * Delete a category.
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

/**
 * Activate a category.
 */
export function useActivateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => activateCategory(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
  });
}

/**
 * Deactivate a category.
 */
export function useDeactivateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deactivateCategory(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
  });
}

/**
 * Add products to a category.
 */
export function useAddProductsToCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      categoryId,
      productIds,
    }: {
      categoryId: string;
      productIds: string[];
    }) => addProductsToCategory(categoryId, productIds),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: categoryKeys.products(variables.categoryId),
      });
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
  });
}

/**
 * Remove products from a category.
 */
export function useRemoveProductsFromCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      categoryId,
      productIds,
    }: {
      categoryId: string;
      productIds: string[];
    }) => removeProductsFromCategory(categoryId, productIds),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: categoryKeys.products(variables.categoryId),
      });
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
  });
}

/**
 * Move a product from one category to another.
 */
export function useMoveProductToCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      targetCategoryId,
      productId,
      fromCategoryId,
    }: {
      targetCategoryId: string;
      productId: string;
      fromCategoryId?: string;
    }) => moveProductToCategory(targetCategoryId, productId, fromCategoryId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: categoryKeys.products(variables.targetCategoryId),
      });
      if (variables.fromCategoryId) {
        queryClient.invalidateQueries({
          queryKey: categoryKeys.products(variables.fromCategoryId),
        });
      }
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
  });
}

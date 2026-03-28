"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCollections,
  getCollection,
  createCollection,
  updateCollection,
  deleteCollection,
  publishCollection,
  uploadCollectionImage,
  addProductsToCollection,
  removeProductsFromCollection,
  type AdminCollectionsResponse,
  type ProductCollection,
  type CreateCollectionInput,
} from "@/lib/api";

// ============================================================================
// Query Keys
// ============================================================================

export const collectionKeys = {
  all: ["collections"] as const,
  lists: () => [...collectionKeys.all, "list"] as const,
  list: (params?: { offset?: number; limit?: number }) =>
    [...collectionKeys.lists(), params] as const,
  details: () => [...collectionKeys.all, "detail"] as const,
  detail: (id: string) => [...collectionKeys.details(), id] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch all collections with optional pagination.
 */
export function useCollections(params?: { offset?: number; limit?: number }) {
  return useQuery<AdminCollectionsResponse>({
    queryKey: collectionKeys.list(params),
    queryFn: () => getCollections(params),
    staleTime: 30_000,
  });
}

/**
 * Fetch a single collection by ID.
 */
export function useCollection(id: string, enabled = true) {
  return useQuery({
    queryKey: collectionKeys.detail(id),
    queryFn: () => getCollection(id),
    enabled: enabled && !!id,
    staleTime: 30_000,
    select: (data) => data.collection,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new collection.
 */
export function useCreateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCollectionInput) => createCollection(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.all });
    },
  });
}

/**
 * Update an existing collection.
 */
export function useUpdateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCollectionInput> }) =>
      updateCollection(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
    },
  });
}

/**
 * Delete a collection.
 */
export function useDeleteCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCollection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.all });
    },
  });
}

/**
 * Publish a collection.
 */
export function usePublishCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => publishCollection(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
    },
  });
}

/**
 * Upload an image for a collection.
 */
export function useUploadCollectionImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, collectionId }: { file: File; collectionId?: string }) =>
      uploadCollectionImage(file, collectionId),
    onSuccess: (_data, variables) => {
      if (variables.collectionId) {
        queryClient.invalidateQueries({
          queryKey: collectionKeys.detail(variables.collectionId),
        });
      }
    },
  });
}

/**
 * Add products to a collection.
 */
export function useAddProductsToCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      collectionId,
      productIds,
    }: {
      collectionId: string;
      productIds: string[];
    }) => addProductsToCollection(collectionId, productIds),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: collectionKeys.detail(variables.collectionId),
      });
      queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
    },
  });
}

/**
 * Remove products from a collection.
 */
export function useRemoveProductsFromCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      collectionId,
      productIds,
    }: {
      collectionId: string;
      productIds: string[];
    }) => removeProductsFromCollection(collectionId, productIds),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: collectionKeys.detail(variables.collectionId),
      });
      queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
    },
  });
}

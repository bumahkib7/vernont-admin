"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getRegions,
  getRegion,
  createRegion,
  updateRegion,
  deleteRegion,
  getTaxRegions,
  getTaxRates,
  getTaxRate,
  createTaxRate,
  updateTaxRate,
  deleteTaxRate,
  type RegionsResponse,
  type RegionResponse,
  type Region,
  type CreateRegionInput,
  type UpdateRegionInput,
  type TaxRegionsResponse,
  type TaxRatesResponse,
  type TaxRateResponse,
  type CreateTaxRateInput,
  type UpdateTaxRateInput,
} from "@/lib/api";

// ============================================================================
// Query Keys
// ============================================================================

export const regionKeys = {
  all: ["regions"] as const,
  lists: () => [...regionKeys.all, "list"] as const,
  list: (params?: { limit?: number; offset?: number; q?: string }) =>
    [...regionKeys.lists(), params] as const,
  detail: (id: string) => [...regionKeys.all, "detail", id] as const,

  // Tax sub-keys
  taxAll: ["tax-regions"] as const,
  taxLists: () => [...regionKeys.taxAll, "list"] as const,
  taxList: (params?: { limit?: number; offset?: number; q?: string }) =>
    [...regionKeys.taxLists(), params] as const,
  taxRates: (params?: { limit?: number; offset?: number; regionId?: string; q?: string }) =>
    [...regionKeys.taxAll, "rates", params] as const,
  taxRateDetail: (id: string) => [...regionKeys.taxAll, "rate", id] as const,
};

// ============================================================================
// Region Queries
// ============================================================================

/**
 * Fetch all regions.
 */
export function useRegions(params?: { limit?: number; offset?: number; q?: string }) {
  return useQuery<RegionsResponse>({
    queryKey: regionKeys.list(params),
    queryFn: () => getRegions(params),
    staleTime: 30_000,
  });
}

/**
 * Fetch a single region by ID.
 */
export function useRegion(id: string, enabled = true) {
  return useQuery<RegionResponse>({
    queryKey: regionKeys.detail(id),
    queryFn: () => getRegion(id),
    enabled: enabled && !!id,
    staleTime: 30_000,
  });
}

// ============================================================================
// Region Mutations
// ============================================================================

/**
 * Create a new region.
 */
export function useCreateRegion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRegionInput) => createRegion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: regionKeys.all });
      // Tax regions may reference regions, invalidate those too
      queryClient.invalidateQueries({ queryKey: regionKeys.taxAll });
    },
  });
}

/**
 * Update an existing region.
 */
export function useUpdateRegion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRegionInput }) =>
      updateRegion(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: regionKeys.all });
      queryClient.invalidateQueries({ queryKey: regionKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: regionKeys.taxAll });
    },
  });
}

/**
 * Delete a region.
 */
export function useDeleteRegion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteRegion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: regionKeys.all });
      queryClient.invalidateQueries({ queryKey: regionKeys.taxAll });
    },
  });
}

// ============================================================================
// Tax Region / Tax Rate Queries
// ============================================================================

/**
 * Fetch all tax regions (regions grouped with their tax rates).
 */
export function useTaxRegions(params?: { limit?: number; offset?: number; q?: string }) {
  return useQuery<TaxRegionsResponse>({
    queryKey: regionKeys.taxList(params),
    queryFn: () => getTaxRegions(params),
    staleTime: 30_000,
  });
}

/**
 * Fetch tax rates, optionally filtered by region.
 */
export function useTaxRates(params?: {
  limit?: number;
  offset?: number;
  regionId?: string;
  q?: string;
}) {
  return useQuery<TaxRatesResponse>({
    queryKey: regionKeys.taxRates(params),
    queryFn: () => getTaxRates(params),
    staleTime: 30_000,
  });
}

/**
 * Fetch a single tax rate by ID.
 */
export function useTaxRate(id: string, enabled = true) {
  return useQuery<TaxRateResponse>({
    queryKey: regionKeys.taxRateDetail(id),
    queryFn: () => getTaxRate(id),
    enabled: enabled && !!id,
    staleTime: 30_000,
  });
}

// ============================================================================
// Tax Rate Mutations
// ============================================================================

/**
 * Create a new tax rate.
 */
export function useCreateTaxRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaxRateInput) => createTaxRate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: regionKeys.taxAll });
    },
  });
}

/**
 * Update a tax rate.
 */
export function useUpdateTaxRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaxRateInput }) =>
      updateTaxRate(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: regionKeys.taxAll });
      queryClient.invalidateQueries({ queryKey: regionKeys.taxRateDetail(variables.id) });
    },
  });
}

/**
 * Delete a tax rate.
 */
export function useDeleteTaxRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTaxRate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: regionKeys.taxAll });
    },
  });
}

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDiscounts,
  getDiscount,
  getDiscountStats,
  getDiscountActivity,
  getDiscountRedemptions,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  activateDiscount,
  deactivateDiscount,
  duplicateDiscount,
  bulkDiscountAction,
  generateDiscountCode,
  type PromotionsListResponse,
  type PromotionResponse,
  type DiscountStatsResponse,
  type DiscountActivityResponse,
  type RedemptionsResponse,
  type CreatePromotionRequest,
  type UpdatePromotionRequest,
  type BulkDiscountRequest,
  type BulkDiscountResult,
} from "@/lib/api";
import { toast } from "sonner";

// =============================================================================
// Query Keys
// =============================================================================

export const discountKeys = {
  all: ["discounts"] as const,
  list: (params?: {
    limit?: number;
    offset?: number;
    q?: string;
    status?: string;
    type?: string;
  }) => ["discounts", "list", params ?? {}] as const,
  detail: (id: string) => ["discounts", "detail", id] as const,
  stats: () => ["discounts", "stats"] as const,
  activity: (params?: { limit?: number }) =>
    ["discounts", "activity", params ?? {}] as const,
  redemptions: (id: string, params?: { limit?: number; offset?: number }) =>
    ["discounts", "redemptions", id, params ?? {}] as const,
};

// =============================================================================
// Queries
// =============================================================================

export function useDiscounts(params?: {
  limit?: number;
  offset?: number;
  q?: string;
  status?: string;
  type?: string;
}) {
  return useQuery<PromotionsListResponse>({
    queryKey: discountKeys.list(params),
    queryFn: () => getDiscounts(params),
    staleTime: 30000,
  });
}

export function useDiscount(id: string, enabled = true) {
  return useQuery<PromotionResponse>({
    queryKey: discountKeys.detail(id),
    queryFn: () => getDiscount(id),
    enabled: !!id && enabled,
  });
}

export function useDiscountStats() {
  return useQuery<DiscountStatsResponse>({
    queryKey: discountKeys.stats(),
    queryFn: getDiscountStats,
    staleTime: 30000,
  });
}

export function useDiscountActivity(params?: { limit?: number }) {
  return useQuery<DiscountActivityResponse>({
    queryKey: discountKeys.activity(params),
    queryFn: () => getDiscountActivity(params),
    staleTime: 30000,
  });
}

export function useDiscountRedemptions(
  id: string,
  params?: { limit?: number; offset?: number },
  enabled = true
) {
  return useQuery<RedemptionsResponse>({
    queryKey: discountKeys.redemptions(id, params),
    queryFn: () => getDiscountRedemptions(id, params),
    enabled: !!id && enabled,
  });
}

// =============================================================================
// Mutations
// =============================================================================

function useInvalidateDiscounts() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["discounts"] });
  };
}

export function useCreateDiscount() {
  const invalidate = useInvalidateDiscounts();

  return useMutation({
    mutationFn: (data: CreatePromotionRequest) => createDiscount(data),
    onSuccess: () => {
      toast.success("Discount created");
      invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create discount");
    },
  });
}

export function useUpdateDiscount() {
  const invalidate = useInvalidateDiscounts();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePromotionRequest }) =>
      updateDiscount(id, data),
    onSuccess: () => {
      toast.success("Discount updated");
      invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update discount");
    },
  });
}

export function useDeleteDiscount() {
  const invalidate = useInvalidateDiscounts();

  return useMutation({
    mutationFn: (id: string) => deleteDiscount(id),
    onSuccess: () => {
      toast.success("Discount deleted");
      invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete discount");
    },
  });
}

export function useActivateDiscount() {
  const invalidate = useInvalidateDiscounts();

  return useMutation({
    mutationFn: (id: string) => activateDiscount(id),
    onSuccess: () => {
      toast.success("Discount activated");
      invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to activate discount");
    },
  });
}

export function useDeactivateDiscount() {
  const invalidate = useInvalidateDiscounts();

  return useMutation({
    mutationFn: (id: string) => deactivateDiscount(id),
    onSuccess: () => {
      toast.success("Discount deactivated");
      invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to deactivate discount");
    },
  });
}

export function useDuplicateDiscount() {
  const invalidate = useInvalidateDiscounts();

  return useMutation({
    mutationFn: (id: string) => duplicateDiscount(id),
    onSuccess: () => {
      toast.success("Discount duplicated");
      invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to duplicate discount");
    },
  });
}

export function useBulkDiscountAction() {
  const invalidate = useInvalidateDiscounts();

  return useMutation<BulkDiscountResult, Error, BulkDiscountRequest>({
    mutationFn: (request) => bulkDiscountAction(request),
    onSuccess: (result, variables) => {
      toast.success(
        `Bulk ${variables.action.toLowerCase()} completed for ${result.successCount} discount(s)`
      );
      invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Bulk action failed");
    },
  });
}

export function useGenerateDiscountCode() {
  return useMutation({
    mutationFn: generateDiscountCode,
    onError: (error: Error) => {
      toast.error(error.message || "Failed to generate code");
    },
  });
}

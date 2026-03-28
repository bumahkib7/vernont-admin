"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getGiftCards,
  getGiftCard,
  getGiftCardStats,
  lookupGiftCard,
  createGiftCard,
  updateGiftCard,
  adjustGiftCardBalance,
  disableGiftCard,
  enableGiftCard,
  deleteGiftCard,
  bulkGiftCardAction,
  type GiftCardsResponse,
  type GiftCardResponse,
  type GiftCardStatsResponse,
  type GiftCardStatus,
  type CreateGiftCardRequest,
  type UpdateGiftCardRequest,
  type AdjustBalanceRequest,
  type BulkGiftCardRequest,
  type BulkGiftCardResult,
} from "@/lib/api";
import { toast } from "sonner";

// =============================================================================
// Query Keys
// =============================================================================

export const giftCardKeys = {
  all: ["gift-cards"] as const,
  list: (params?: {
    limit?: number;
    offset?: number;
    q?: string;
    status?: GiftCardStatus;
  }) => ["gift-cards", "list", params ?? {}] as const,
  detail: (id: string) => ["gift-cards", "detail", id] as const,
  lookup: (code: string) => ["gift-cards", "lookup", code] as const,
  stats: () => ["gift-cards", "stats"] as const,
};

// =============================================================================
// Queries
// =============================================================================

export function useGiftCards(params?: {
  limit?: number;
  offset?: number;
  q?: string;
  status?: GiftCardStatus;
}) {
  return useQuery<GiftCardsResponse>({
    queryKey: giftCardKeys.list(params),
    queryFn: () => getGiftCards(params),
    staleTime: 30000,
  });
}

export function useGiftCard(id: string, enabled = true) {
  return useQuery<GiftCardResponse>({
    queryKey: giftCardKeys.detail(id),
    queryFn: () => getGiftCard(id),
    enabled: !!id && enabled,
  });
}

export function useGiftCardLookup(code: string, enabled = true) {
  return useQuery<GiftCardResponse>({
    queryKey: giftCardKeys.lookup(code),
    queryFn: () => lookupGiftCard(code),
    enabled: !!code && enabled,
  });
}

export function useGiftCardStats() {
  return useQuery<GiftCardStatsResponse>({
    queryKey: giftCardKeys.stats(),
    queryFn: getGiftCardStats,
    staleTime: 30000,
  });
}

// =============================================================================
// Mutations
// =============================================================================

function useInvalidateGiftCards() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["gift-cards"] });
  };
}

export function useCreateGiftCard() {
  const invalidate = useInvalidateGiftCards();

  return useMutation({
    mutationFn: (data: CreateGiftCardRequest) => createGiftCard(data),
    onSuccess: () => {
      toast.success("Gift card created");
      invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create gift card");
    },
  });
}

export function useUpdateGiftCard() {
  const invalidate = useInvalidateGiftCards();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGiftCardRequest }) =>
      updateGiftCard(id, data),
    onSuccess: () => {
      toast.success("Gift card updated");
      invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update gift card");
    },
  });
}

export function useAdjustGiftCardBalance() {
  const invalidate = useInvalidateGiftCards();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdjustBalanceRequest }) =>
      adjustGiftCardBalance(id, data),
    onSuccess: () => {
      toast.success("Balance adjusted");
      invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to adjust balance");
    },
  });
}

export function useDisableGiftCard() {
  const invalidate = useInvalidateGiftCards();

  return useMutation({
    mutationFn: (id: string) => disableGiftCard(id),
    onSuccess: () => {
      toast.success("Gift card disabled");
      invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to disable gift card");
    },
  });
}

export function useEnableGiftCard() {
  const invalidate = useInvalidateGiftCards();

  return useMutation({
    mutationFn: (id: string) => enableGiftCard(id),
    onSuccess: () => {
      toast.success("Gift card enabled");
      invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to enable gift card");
    },
  });
}

export function useDeleteGiftCard() {
  const invalidate = useInvalidateGiftCards();

  return useMutation({
    mutationFn: (id: string) => deleteGiftCard(id),
    onSuccess: () => {
      toast.success("Gift card deleted");
      invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete gift card");
    },
  });
}

export function useBulkGiftCardAction() {
  const invalidate = useInvalidateGiftCards();

  return useMutation<BulkGiftCardResult, Error, BulkGiftCardRequest>({
    mutationFn: (request) => bulkGiftCardAction(request),
    onSuccess: (result, variables) => {
      toast.success(
        `Bulk ${variables.action.toLowerCase()} completed for ${result.successCount} card(s)`
      );
      invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Bulk action failed");
    },
  });
}

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getReturns,
  getReturn,
  getReturnStats,
  receiveReturn,
  processReturnRefund,
  rejectReturn,
  type ReturnsResponse,
  type Return,
  type ReturnStats,
} from "@/lib/api";

// ============================================================================
// Query Keys
// ============================================================================

export const returnKeys = {
  all: ["returns"] as const,
  lists: () => [...returnKeys.all, "list"] as const,
  list: (params?: { limit?: number; offset?: number; status?: string; q?: string }) =>
    [...returnKeys.lists(), params] as const,
  details: () => [...returnKeys.all, "detail"] as const,
  detail: (id: string) => [...returnKeys.details(), id] as const,
  stats: () => [...returnKeys.all, "stats"] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook for fetching paginated returns list with optional filters.
 */
export function useReturns(params?: {
  limit?: number;
  offset?: number;
  status?: string;
  q?: string;
}) {
  return useQuery<ReturnsResponse>({
    queryKey: returnKeys.list(params),
    queryFn: () => getReturns(params),
    staleTime: 15000,
  });
}

/**
 * Hook for fetching a single return by ID.
 */
export function useReturn(id: string, enabled = true) {
  return useQuery<Return>({
    queryKey: returnKeys.detail(id),
    queryFn: async () => {
      const res = await getReturn(id);
      return res.return_request;
    },
    enabled: enabled && !!id,
    staleTime: 10000,
  });
}

/**
 * Hook for fetching return statistics.
 */
export function useReturnStats() {
  return useQuery<ReturnStats>({
    queryKey: returnKeys.stats(),
    queryFn: getReturnStats,
    staleTime: 30000,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Hook for marking a return as received.
 * Invalidates the return detail and list queries on success.
 */
export function useReceiveReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: { receivedBy?: string; notes?: string } }) =>
      receiveReturn(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: returnKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: returnKeys.lists() });
      queryClient.invalidateQueries({ queryKey: returnKeys.stats() });
    },
  });
}

/**
 * Hook for processing a refund for a return.
 * Invalidates the return detail and list queries on success.
 */
export function useProcessReturnRefund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: { processedBy?: string } }) =>
      processReturnRefund(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: returnKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: returnKeys.lists() });
      queryClient.invalidateQueries({ queryKey: returnKeys.stats() });
    },
  });
}

/**
 * Hook for rejecting a return.
 * Invalidates the return detail and list queries on success.
 */
export function useRejectReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { reason: string; rejectedBy?: string } }) =>
      rejectReturn(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: returnKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: returnKeys.lists() });
      queryClient.invalidateQueries({ queryKey: returnKeys.stats() });
    },
  });
}

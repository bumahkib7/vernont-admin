"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getOrders,
  getOrder,
  cancelOrder,
  fulfillOrder,
  shipOrder,
  completeOrder,
  getOrderFulfillments,
  type OrdersResponse,
  type Order,
  type FulfillOrderResponse,
  type ShipOrderRequest,
  type ShipOrderResponse,
  type CompleteOrderResponse,
  type FulfillmentDetail,
} from "@/lib/api/orders";
import {
  useOrderStore,
  applyOrderFilters,
} from "@/stores/order-store";

// ============================================================================
// Query Keys
// ============================================================================

export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...orderKeys.lists(), params] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
  fulfillments: (orderId: string) =>
    [...orderKeys.all, "fulfillments", orderId] as const,
};

// ============================================================================
// Query Hooks — Server State
// ============================================================================

/**
 * Fetch paginated order list.
 * Search query (q) is passed to the server; status filters are applied
 * client-side via `applyOrderFilters`.
 */
export function useOrders(params?: {
  limit?: number;
  offset?: number;
  q?: string;
}) {
  return useQuery<OrdersResponse>({
    queryKey: orderKeys.list(params ?? {}),
    queryFn: () => getOrders(params),
    staleTime: 15000, // 15s — orders change frequently
    refetchInterval: 30000, // Poll every 30s for near-real-time updates
  });
}

/**
 * Fetch a single order by ID.
 */
export function useOrder(id: string, enabled = true) {
  return useQuery<Order>({
    queryKey: orderKeys.detail(id),
    queryFn: () => getOrder(id),
    enabled: enabled && !!id,
    staleTime: 10000,
  });
}

/**
 * Fetch fulfillments for an order.
 */
export function useOrderFulfillments(orderId: string, enabled = true) {
  return useQuery<{ fulfillments: FulfillmentDetail[]; count: number }>({
    queryKey: orderKeys.fulfillments(orderId),
    queryFn: () => getOrderFulfillments(orderId),
    enabled: enabled && !!orderId,
    staleTime: 15000,
  });
}

// ============================================================================
// Mutation Hooks — Server State Transitions
// ============================================================================

/**
 * Cancel an order. Invalidates both the list and detail caches.
 */
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data?: { canceledBy?: string; reason?: string };
    }) => cancelOrder(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) });
      toast.success("Order canceled successfully");
    },
    onError: (error) => {
      toast.error(`Failed to cancel order: ${error.message}`);
    },
  });
}

/**
 * Fulfill an order.
 */
export function useFulfillOrder() {
  const queryClient = useQueryClient();

  return useMutation<
    FulfillOrderResponse,
    Error,
    { id: string; data?: { fulfilledBy?: string } }
  >({
    mutationFn: ({ id, data }) => fulfillOrder(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) });
      queryClient.invalidateQueries({
        queryKey: orderKeys.fulfillments(id),
      });
      toast.success("Order fulfilled successfully");
    },
    onError: (error) => {
      toast.error(`Failed to fulfill order: ${error.message}`);
    },
  });
}

/**
 * Ship an order.
 */
export function useShipOrder() {
  const queryClient = useQueryClient();

  return useMutation<
    ShipOrderResponse,
    Error,
    { id: string; data?: ShipOrderRequest }
  >({
    mutationFn: ({ id, data }) => shipOrder(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) });
      queryClient.invalidateQueries({
        queryKey: orderKeys.fulfillments(id),
      });
      toast.success("Order shipped successfully");
    },
    onError: (error) => {
      toast.error(`Failed to ship order: ${error.message}`);
    },
  });
}

/**
 * Complete an order.
 */
export function useCompleteOrder() {
  const queryClient = useQueryClient();

  return useMutation<CompleteOrderResponse, Error, string>({
    mutationFn: (id) => completeOrder(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) });
      toast.success("Order completed successfully");
    },
    onError: (error) => {
      toast.error(`Failed to complete order: ${error.message}`);
    },
  });
}

// ============================================================================
// Bulk Mutation Hooks
// ============================================================================

/**
 * Bulk ship orders.
 */
export function useBulkShipOrders() {
  const queryClient = useQueryClient();
  const { clearSelection } = useOrderStore();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(
        ids.map((id) => shipOrder(id))
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      return { total: ids.length, failed };
    },
    onSuccess: ({ total, failed }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      if (failed === 0) {
        toast.success(`Marked ${total} orders as shipped`);
      } else {
        toast.warning(
          `Shipped ${total - failed} of ${total} orders. ${failed} failed.`
        );
      }
      clearSelection();
    },
    onError: (error) => {
      toast.error(`Bulk ship failed: ${error.message}`);
    },
  });
}

/**
 * Bulk cancel orders.
 */
export function useBulkCancelOrders() {
  const queryClient = useQueryClient();
  const { clearSelection } = useOrderStore();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(
        ids.map((id) => cancelOrder(id))
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      return { total: ids.length, failed };
    },
    onSuccess: ({ total, failed }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      if (failed === 0) {
        toast.success(`Canceled ${total} orders`);
      } else {
        toast.warning(
          `Canceled ${total - failed} of ${total} orders. ${failed} failed.`
        );
      }
      clearSelection();
    },
    onError: (error) => {
      toast.error(`Bulk cancel failed: ${error.message}`);
    },
  });
}

// ============================================================================
// Combined Page Hook
// ============================================================================

/**
 * All-in-one hook for the orders list page.
 * Wires Zustand UI state to React Query server state.
 */
export function useOrdersPage() {
  const store = useOrderStore();

  // Debounce the search query so we don't fire a request on every keystroke.
  // This is a UI timing concern, not a data-fetching side-effect.
  const [debouncedSearch, setDebouncedSearch] = useState(store.searchQuery);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(store.searchQuery), 300);
    return () => clearTimeout(timer);
  }, [store.searchQuery]);

  const offset = (store.page - 1) * store.pageSize;

  // Server-side query — search + pagination
  const ordersQuery = useOrders({
    limit: store.pageSize,
    offset,
    q: debouncedSearch || undefined,
  });

  // Client-side filter the results
  const filteredOrders = applyOrderFilters(
    ordersQuery.data?.orders ?? [],
    store.activeFilters
  );

  const totalCount = ordersQuery.data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / store.pageSize);

  // Mutations
  const bulkShip = useBulkShipOrders();
  const bulkCancel = useBulkCancelOrders();

  return {
    // Data
    orders: filteredOrders,
    totalCount,
    totalPages,

    // Loading / error
    isLoading: ordersQuery.isLoading,
    isFetching: ordersQuery.isFetching,
    error: ordersQuery.error,
    refetch: ordersQuery.refetch,

    // Pagination
    page: store.page,
    pageSize: store.pageSize,
    setPage: store.setPage,
    setPageSize: store.setPageSize,

    // Search
    searchQuery: store.searchQuery,
    setSearchQuery: store.setSearchQuery,

    // Filters
    activeFilters: store.activeFilters,
    addFilter: store.addFilter,
    removeFilter: store.removeFilter,
    clearFilters: store.clearFilters,

    // Selection
    selectedOrderIds: store.selectedOrderIds,
    toggleOrderSelection: store.toggleOrderSelection,
    selectAllOrders: store.selectAllOrders,
    clearSelection: store.clearSelection,

    // Bulk actions
    bulkShip: (ids: string[]) => bulkShip.mutate(ids),
    bulkCancel: (ids: string[]) => bulkCancel.mutate(ids),
    isBulkShipping: bulkShip.isPending,
    isBulkCanceling: bulkCancel.isPending,
  };
}

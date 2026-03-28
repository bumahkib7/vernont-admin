"use client";

import { create } from "zustand";
import type {
  OrderSummary,
  Order,
  PaymentStatus,
  FulfillmentStatus,
  OrderStatus,
} from "@/lib/api/orders";

// ============================================================================
// Types
// ============================================================================

export type OrderFilterId = "payment" | "fulfillment" | "status";

export interface OrderFilter {
  id: OrderFilterId;
  label: string;
  value: string;
}

export type OrderSortField = "createdAt" | "total" | "displayId";
export type OrderSortDirection = "asc" | "desc";

// ============================================================================
// Zustand Store — Client UI State Only
// ============================================================================

interface OrderUIState {
  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Filters (client-side)
  activeFilters: OrderFilter[];
  addFilter: (filter: OrderFilter) => void;
  removeFilter: (filterId: OrderFilterId, value: string) => void;
  clearFilters: () => void;

  // Sorting
  sortField: OrderSortField;
  sortDirection: OrderSortDirection;
  setSort: (field: OrderSortField, direction?: OrderSortDirection) => void;

  // Selection (bulk actions)
  selectedOrderIds: Set<string>;
  toggleOrderSelection: (id: string) => void;
  selectAllOrders: (ids: string[]) => void;
  clearSelection: () => void;

  // Pagination
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;

  // Detail view dialogs
  fulfillDialogOpen: boolean;
  shipDialogOpen: boolean;
  cancelDialogOpen: boolean;
  completeDialogOpen: boolean;
  setFulfillDialogOpen: (open: boolean) => void;
  setShipDialogOpen: (open: boolean) => void;
  setCancelDialogOpen: (open: boolean) => void;
  setCompleteDialogOpen: (open: boolean) => void;

  // Active order in detail view
  activeOrderId: string | null;
  setActiveOrderId: (id: string | null) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  searchQuery: "",
  activeFilters: [] as OrderFilter[],
  sortField: "createdAt" as OrderSortField,
  sortDirection: "desc" as OrderSortDirection,
  selectedOrderIds: new Set<string>(),
  page: 1,
  pageSize: 20,
  fulfillDialogOpen: false,
  shipDialogOpen: false,
  cancelDialogOpen: false,
  completeDialogOpen: false,
  activeOrderId: null as string | null,
};

export const useOrderStore = create<OrderUIState>((set, get) => ({
  ...initialState,

  // Search
  setSearchQuery: (query) => set({ searchQuery: query, page: 1 }),

  // Filters
  addFilter: (filter) => {
    const current = get().activeFilters;
    const exists = current.some(
      (f) => f.id === filter.id && f.value === filter.value
    );
    if (!exists) {
      set({ activeFilters: [...current, filter], page: 1 });
    }
  },
  removeFilter: (filterId, value) => {
    set({
      activeFilters: get().activeFilters.filter(
        (f) => !(f.id === filterId && f.value === value)
      ),
      page: 1,
    });
  },
  clearFilters: () => set({ activeFilters: [], page: 1 }),

  // Sorting
  setSort: (field, direction) => {
    const current = get();
    const newDirection =
      direction ??
      (current.sortField === field && current.sortDirection === "asc"
        ? "desc"
        : "asc");
    set({ sortField: field, sortDirection: newDirection, page: 1 });
  },

  // Selection
  toggleOrderSelection: (id) => {
    const next = new Set(get().selectedOrderIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    set({ selectedOrderIds: next });
  },
  selectAllOrders: (ids) => set({ selectedOrderIds: new Set(ids) }),
  clearSelection: () => set({ selectedOrderIds: new Set() }),

  // Pagination
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize, page: 1 }),

  // Dialogs
  setFulfillDialogOpen: (open) => set({ fulfillDialogOpen: open }),
  setShipDialogOpen: (open) => set({ shipDialogOpen: open }),
  setCancelDialogOpen: (open) => set({ cancelDialogOpen: open }),
  setCompleteDialogOpen: (open) => set({ completeDialogOpen: open }),

  // Active order
  setActiveOrderId: (id) => set({ activeOrderId: id }),

  // Reset
  reset: () => set(initialState),
}));

// ============================================================================
// Selectors — derive filtered/sorted data outside the store
// ============================================================================

/**
 * Apply client-side filters to an order list.
 * Server-side search (q param) is handled by React Query; these are
 * additional status filters the user toggles in the UI.
 */
export function applyOrderFilters(
  orders: OrderSummary[],
  filters: OrderFilter[]
): OrderSummary[] {
  if (filters.length === 0) return orders;

  return orders.filter((order) => {
    for (const filter of filters) {
      if (filter.id === "payment" && order.paymentStatus !== filter.value)
        return false;
      if (
        filter.id === "fulfillment" &&
        order.fulfillmentStatus !== filter.value
      )
        return false;
      if (filter.id === "status" && order.status !== filter.value) return false;
    }
    return true;
  });
}

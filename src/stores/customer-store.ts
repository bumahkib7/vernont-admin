"use client";

import { create } from "zustand";
import type { CustomerSummary } from "@/lib/api/customers";

// =============================================================================
// Customer UI State — Zustand store for client-only state (filters, selection,
// dialog visibility, pagination). Server data lives in React Query.
// =============================================================================

interface CustomerDialogState {
  emailDialogOpen: boolean;
  giftCardDialogOpen: boolean;
  suspendDialogOpen: boolean;
  changeTierDialogOpen: boolean;
}

interface CustomerUIState extends CustomerDialogState {
  // Filters
  search: string;
  tierFilter: string;
  statusFilter: string;

  // Pagination
  currentPage: number;

  // Selection (bulk actions)
  selectedIds: Set<string>;

  // Active customer for dialogs
  selectedCustomer: CustomerSummary | null;

  // Detail page — note form
  newNote: string;

  // Actions — filters
  setSearch: (search: string) => void;
  setTierFilter: (tier: string) => void;
  setStatusFilter: (status: string) => void;
  resetFilters: () => void;

  // Actions — pagination
  setCurrentPage: (page: number) => void;

  // Actions — selection
  setSelectedIds: (ids: Set<string>) => void;
  clearSelection: () => void;

  // Actions — dialogs
  openDialog: (dialog: keyof CustomerDialogState, customer: CustomerSummary) => void;
  closeDialog: (dialog: keyof CustomerDialogState) => void;
  closeAllDialogs: () => void;

  // Actions — notes
  setNewNote: (note: string) => void;
  clearNewNote: () => void;
}

const initialDialogState: CustomerDialogState = {
  emailDialogOpen: false,
  giftCardDialogOpen: false,
  suspendDialogOpen: false,
  changeTierDialogOpen: false,
};

export const useCustomerUIStore = create<CustomerUIState>((set) => ({
  // Initial state
  search: "",
  tierFilter: "all",
  statusFilter: "all",
  currentPage: 1,
  selectedIds: new Set(),
  selectedCustomer: null,
  newNote: "",
  ...initialDialogState,

  // Filters
  setSearch: (search) => set({ search, currentPage: 1 }),
  setTierFilter: (tierFilter) => set({ tierFilter, currentPage: 1 }),
  setStatusFilter: (statusFilter) => set({ statusFilter, currentPage: 1 }),
  resetFilters: () => set({ search: "", tierFilter: "all", statusFilter: "all", currentPage: 1 }),

  // Pagination
  setCurrentPage: (currentPage) => set({ currentPage }),

  // Selection
  setSelectedIds: (selectedIds) => set({ selectedIds }),
  clearSelection: () => set({ selectedIds: new Set() }),

  // Dialogs
  openDialog: (dialog, customer) =>
    set({ [dialog]: true, selectedCustomer: customer }),
  closeDialog: (dialog) => set({ [dialog]: false }),
  closeAllDialogs: () => set({ ...initialDialogState, selectedCustomer: null }),

  // Notes
  setNewNote: (newNote) => set({ newNote }),
  clearNewNote: () => set({ newNote: "" }),
}));

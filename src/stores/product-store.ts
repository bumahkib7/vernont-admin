"use client";

import { create } from "zustand";
import type { ProductStatus } from "@/lib/api/products";

interface ProductFilters {
  search: string;
  status: string; // "all" | ProductStatus
  category: string; // "all" | category ID
}

interface ProductPagination {
  page: number;
  pageSize: number;
}

interface ProductUIState {
  // Filters
  filters: ProductFilters;
  setSearch: (search: string) => void;
  setStatusFilter: (status: string) => void;
  setCategoryFilter: (category: string) => void;
  resetFilters: () => void;

  // Pagination
  pagination: ProductPagination;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;

  // Selection
  selectedIds: Set<string>;
  toggleSelected: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;

  // Modals
  addProductOpen: boolean;
  setAddProductOpen: (open: boolean) => void;
  deleteDialogOpen: boolean;
  productToDeleteId: string | null;
  productToDeleteTitle: string | null;
  openDeleteDialog: (id: string, title: string) => void;
  closeDeleteDialog: () => void;
}

const DEFAULT_FILTERS: ProductFilters = {
  search: "",
  status: "all",
  category: "all",
};

const DEFAULT_PAGINATION: ProductPagination = {
  page: 1,
  pageSize: 20,
};

export const useProductStore = create<ProductUIState>((set) => ({
  // Filters
  filters: { ...DEFAULT_FILTERS },
  setSearch: (search) =>
    set((s) => ({
      filters: { ...s.filters, search },
      pagination: { ...s.pagination, page: 1 },
    })),
  setStatusFilter: (status) =>
    set((s) => ({
      filters: { ...s.filters, status },
      pagination: { ...s.pagination, page: 1 },
    })),
  setCategoryFilter: (category) =>
    set((s) => ({
      filters: { ...s.filters, category },
      pagination: { ...s.pagination, page: 1 },
    })),
  resetFilters: () =>
    set({ filters: { ...DEFAULT_FILTERS }, pagination: { ...DEFAULT_PAGINATION } }),

  // Pagination
  pagination: { ...DEFAULT_PAGINATION },
  setPage: (page) => set((s) => ({ pagination: { ...s.pagination, page } })),
  setPageSize: (pageSize) =>
    set((s) => ({ pagination: { pageSize, page: 1 } })),

  // Selection
  selectedIds: new Set(),
  toggleSelected: (id) =>
    set((s) => {
      const next = new Set(s.selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedIds: next };
    }),
  selectAll: (ids) => set({ selectedIds: new Set(ids) }),
  clearSelection: () => set({ selectedIds: new Set() }),

  // Modals
  addProductOpen: false,
  setAddProductOpen: (open) => set({ addProductOpen: open }),
  deleteDialogOpen: false,
  productToDeleteId: null,
  productToDeleteTitle: null,
  openDeleteDialog: (id, title) =>
    set({ deleteDialogOpen: true, productToDeleteId: id, productToDeleteTitle: title }),
  closeDeleteDialog: () =>
    set({ deleteDialogOpen: false, productToDeleteId: null, productToDeleteTitle: null }),
}));

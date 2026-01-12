"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { create } from "zustand";
import {
  getSalesChannels,
  getSalesChannel,
  createSalesChannel,
  updateSalesChannel,
  deleteSalesChannel,
  type SalesChannel,
  type SalesChannelsResponse,
  type CreateSalesChannelInput,
  type UpdateSalesChannelInput,
} from "@/lib/api";

// ============================================================================
// Zustand Store for UI State
// ============================================================================

interface SalesChannelUIState {
  // Search & filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Create modal
  isCreateModalOpen: boolean;
  openCreateModal: () => void;
  closeCreateModal: () => void;

  // Edit modal
  isEditModalOpen: boolean;
  editingChannel: SalesChannel | null;
  openEditModal: (channel: SalesChannel) => void;
  closeEditModal: () => void;

  // Delete modal
  isDeleteModalOpen: boolean;
  deletingChannel: SalesChannel | null;
  openDeleteModal: (channel: SalesChannel) => void;
  closeDeleteModal: () => void;

  // Reset all
  reset: () => void;
}

export const useSalesChannelStore = create<SalesChannelUIState>((set) => ({
  // Search & filters
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Create modal
  isCreateModalOpen: false,
  openCreateModal: () => set({ isCreateModalOpen: true }),
  closeCreateModal: () => set({ isCreateModalOpen: false }),

  // Edit modal
  isEditModalOpen: false,
  editingChannel: null,
  openEditModal: (channel) => set({ isEditModalOpen: true, editingChannel: channel }),
  closeEditModal: () => set({ isEditModalOpen: false, editingChannel: null }),

  // Delete modal
  isDeleteModalOpen: false,
  deletingChannel: null,
  openDeleteModal: (channel) => set({ isDeleteModalOpen: true, deletingChannel: channel }),
  closeDeleteModal: () => set({ isDeleteModalOpen: false, deletingChannel: null }),

  // Reset all
  reset: () =>
    set({
      searchQuery: "",
      isCreateModalOpen: false,
      isEditModalOpen: false,
      editingChannel: null,
      isDeleteModalOpen: false,
      deletingChannel: null,
    }),
}));

// ============================================================================
// React Query Hooks
// ============================================================================

const QUERY_KEY = "sales-channels";

/**
 * Hook for fetching all sales channels
 */
export function useSalesChannels(params?: { limit?: number; offset?: number; q?: string }) {
  return useQuery<SalesChannelsResponse>({
    queryKey: [QUERY_KEY, "list", params],
    queryFn: () => getSalesChannels(params),
    staleTime: 30000, // Consider stale after 30s
  });
}

/**
 * Hook for fetching a single sales channel
 */
export function useSalesChannel(id: string, enabled = true) {
  return useQuery({
    queryKey: [QUERY_KEY, "detail", id],
    queryFn: () => getSalesChannel(id),
    enabled: enabled && !!id,
    staleTime: 30000,
  });
}

/**
 * Hook for creating a sales channel
 */
export function useCreateSalesChannel() {
  const queryClient = useQueryClient();
  const { closeCreateModal } = useSalesChannelStore();

  return useMutation({
    mutationFn: (data: CreateSalesChannelInput) => createSalesChannel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      closeCreateModal();
    },
  });
}

/**
 * Hook for updating a sales channel
 */
export function useUpdateSalesChannel() {
  const queryClient = useQueryClient();
  const { closeEditModal } = useSalesChannelStore();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSalesChannelInput }) =>
      updateSalesChannel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      closeEditModal();
    },
  });
}

/**
 * Hook for deleting a sales channel
 */
export function useDeleteSalesChannel() {
  const queryClient = useQueryClient();
  const { closeDeleteModal } = useSalesChannelStore();

  return useMutation({
    mutationFn: (id: string) => deleteSalesChannel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      closeDeleteModal();
    },
  });
}

/**
 * Combined hook for the sales channels page
 */
export function useSalesChannelsPage() {
  const store = useSalesChannelStore();
  const channelsQuery = useSalesChannels({ limit: 100 });
  const createMutation = useCreateSalesChannel();
  const updateMutation = useUpdateSalesChannel();
  const deleteMutation = useDeleteSalesChannel();

  // Filter channels by search query
  const filteredChannels = (channelsQuery.data?.sales_channels || []).filter((channel) => {
    if (!store.searchQuery) return true;
    const query = store.searchQuery.toLowerCase();
    return (
      channel.name.toLowerCase().includes(query) ||
      (channel.description?.toLowerCase().includes(query) ?? false)
    );
  });

  return {
    // Data
    channels: filteredChannels,
    totalCount: channelsQuery.data?.count || 0,

    // Loading states
    isLoading: channelsQuery.isLoading,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Error states
    error: channelsQuery.error,
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,

    // Actions
    refetch: channelsQuery.refetch,
    createChannel: createMutation.mutate,
    updateChannel: (id: string, data: UpdateSalesChannelInput) =>
      updateMutation.mutate({ id, data }),
    deleteChannel: deleteMutation.mutate,

    // UI State from store
    ...store,
  };
}

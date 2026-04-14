"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getTickets,
  bulkUpdateTickets,
  getAssignableUsers,
  getSupportStats,
  getOverdueTickets,
  getSupportActivity,
  type TicketsResponse,
  type TicketsQueryParams,
  type TicketStatus,
  type TicketPriority,
  type TicketCategory,
  type TicketAssignee,
  type BulkTicketUpdateRequest,
  type SupportStats,
  type OverdueTicket,
  type SupportActivityEvent,
} from "@/lib/api/support";

// ============================================================================
// Query Keys
// ============================================================================

export const ticketKeys = {
  all: ["tickets"] as const,
  lists: () => [...ticketKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...ticketKeys.lists(), params] as const,
  details: () => [...ticketKeys.all, "detail"] as const,
  detail: (id: string) => [...ticketKeys.details(), id] as const,
  assignableUsers: () => ["assignable-users"] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

export function useTickets(params?: TicketsQueryParams) {
  return useQuery<TicketsResponse>({
    queryKey: ticketKeys.list((params ?? {}) as Record<string, unknown>),
    queryFn: () => getTickets(params),
    staleTime: 15000,
    refetchInterval: 30000,
  });
}

export function useAssignableUsers() {
  return useQuery<TicketAssignee[]>({
    queryKey: ticketKeys.assignableUsers(),
    queryFn: () => getAssignableUsers(),
    staleTime: 60000,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

export function useBulkUpdateTickets() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkTicketUpdateRequest) => bulkUpdateTickets(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      toast.success("Tickets updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update tickets: ${error.message}`);
    },
  });
}

// ============================================================================
// Dashboard Hooks
// ============================================================================

export function useSupportStats() {
  return useQuery<SupportStats>({
    queryKey: ["support", "stats"],
    queryFn: getSupportStats,
    refetchInterval: 30000,
    staleTime: 10000,
  });
}

export function useOverdueTickets() {
  return useQuery<OverdueTicket[]>({
    queryKey: ["support", "overdue"],
    queryFn: getOverdueTickets,
    refetchInterval: 60000,
    staleTime: 15000,
  });
}

export function useSupportActivity(limit: number = 10) {
  return useQuery<SupportActivityEvent[]>({
    queryKey: ["support", "activity", limit],
    queryFn: () => getSupportActivity(limit),
    refetchInterval: 30000,
    staleTime: 10000,
  });
}

// ============================================================================
// Combined Page Hook
// ============================================================================

export function useTicketsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory[]>([]);
  const [assignedToFilter, setAssignedToFilter] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const pageSize = 20;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, priorityFilter, categoryFilter, assignedToFilter]);

  const queryParams: TicketsQueryParams = {
    page,
    limit: pageSize,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(statusFilter.length > 0 && { status: statusFilter }),
    ...(priorityFilter.length > 0 && { priority: priorityFilter }),
    ...(categoryFilter.length > 0 && { category: categoryFilter }),
    ...(assignedToFilter && { assignedTo: assignedToFilter }),
  };

  const ticketsQuery = useTickets(queryParams);
  const assignableUsersQuery = useAssignableUsers();
  const bulkUpdate = useBulkUpdateTickets();

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const clearAllFilters = useCallback(() => {
    setStatusFilter([]);
    setPriorityFilter([]);
    setCategoryFilter([]);
    setAssignedToFilter("");
    setSearchInput("");
  }, []);

  const hasActiveFilters =
    statusFilter.length > 0 ||
    priorityFilter.length > 0 ||
    categoryFilter.length > 0 ||
    !!assignedToFilter;

  const handleBulkAssign = useCallback(
    (assigneeId: string) => {
      const ids = Array.from(selectedIds);
      if (ids.length > 0) {
        bulkUpdate.mutate(
          { ticketIds: ids, assigneeId },
          { onSuccess: () => clearSelection() }
        );
      }
    },
    [selectedIds, bulkUpdate, clearSelection]
  );

  const handleBulkStatus = useCallback(
    (status: TicketStatus) => {
      const ids = Array.from(selectedIds);
      if (ids.length > 0) {
        bulkUpdate.mutate(
          { ticketIds: ids, status },
          { onSuccess: () => clearSelection() }
        );
      }
    },
    [selectedIds, bulkUpdate, clearSelection]
  );

  const handleBulkPriority = useCallback(
    (priority: TicketPriority) => {
      const ids = Array.from(selectedIds);
      if (ids.length > 0) {
        bulkUpdate.mutate(
          { ticketIds: ids, priority },
          { onSuccess: () => clearSelection() }
        );
      }
    },
    [selectedIds, bulkUpdate, clearSelection]
  );

  const handleBulkClose = useCallback(() => {
    const ids = Array.from(selectedIds);
    if (ids.length > 0) {
      bulkUpdate.mutate(
        { ticketIds: ids, status: "CLOSED" },
        { onSuccess: () => clearSelection() }
      );
    }
  }, [selectedIds, bulkUpdate, clearSelection]);

  return {
    // Data
    tickets: ticketsQuery.data?.tickets ?? [],
    totalCount: ticketsQuery.data?.count ?? 0,
    assignableUsers: assignableUsersQuery.data ?? [],

    // Loading / error
    isLoading: ticketsQuery.isLoading,
    isFetching: ticketsQuery.isFetching,
    error: ticketsQuery.error,
    refetch: ticketsQuery.refetch,
    isBulkUpdating: bulkUpdate.isPending,

    // Pagination
    page,
    pageSize,
    setPage,

    // Search
    searchInput,
    setSearchInput,

    // Filters
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    categoryFilter,
    setCategoryFilter,
    assignedToFilter,
    setAssignedToFilter,
    hasActiveFilters,
    clearAllFilters,

    // Selection
    selectedIds,
    setSelectedIds,
    clearSelection,

    // Bulk actions
    handleBulkAssign,
    handleBulkStatus,
    handleBulkPriority,
    handleBulkClose,
  };
}

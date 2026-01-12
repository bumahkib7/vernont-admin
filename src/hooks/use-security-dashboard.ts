"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { create } from "zustand";
import {
  getActiveSessions,
  revokeSession,
  getIpList,
  addIpToList,
  removeIpFromList,
  getSecurityEvents,
  resolveSecurityEvent,
  bulkResolveSecurityEvents,
  getSecurityConfig,
  updateSecurityConfig,
  getSecurityStats,
  type SecuritySession,
  type IpListEntry,
  type SecurityEvent,
  type SecurityConfig,
  type AddIpToListInput,
} from "@/lib/api";

// ============================================================================
// Zustand Store for UI State
// ============================================================================

interface SecurityUIState {
  // IP List tab
  ipListTab: "ALLOWLIST" | "BLOCKLIST";
  setIpListTab: (tab: "ALLOWLIST" | "BLOCKLIST") => void;

  // Events filter
  eventFilter: "all" | "unresolved";
  setEventFilter: (filter: "all" | "unresolved") => void;

  // Selected events for bulk actions
  selectedEventIds: Set<string>;
  toggleEventSelection: (id: string) => void;
  selectAllEvents: (ids: string[]) => void;
  clearEventSelection: () => void;

  // Add IP dialog
  isAddIpDialogOpen: boolean;
  openAddIpDialog: () => void;
  closeAddIpDialog: () => void;

  // Revoke session dialog
  isRevokeDialogOpen: boolean;
  sessionToRevoke: SecuritySession | null;
  openRevokeDialog: (session: SecuritySession) => void;
  closeRevokeDialog: () => void;

  // Resolve event dialog
  isResolveDialogOpen: boolean;
  eventToResolve: SecurityEvent | null;
  openResolveDialog: (event: SecurityEvent) => void;
  closeResolveDialog: () => void;

  // Bulk resolve dialog
  isBulkResolveDialogOpen: boolean;
  openBulkResolveDialog: () => void;
  closeBulkResolveDialog: () => void;

  // Reset all
  reset: () => void;
}

export const useSecurityStore = create<SecurityUIState>((set) => ({
  // IP List tab
  ipListTab: "ALLOWLIST",
  setIpListTab: (tab) => set({ ipListTab: tab }),

  // Events filter
  eventFilter: "unresolved",
  setEventFilter: (filter) => set({ eventFilter: filter }),

  // Selected events for bulk actions
  selectedEventIds: new Set<string>(),
  toggleEventSelection: (id) =>
    set((state) => {
      const newSet = new Set(state.selectedEventIds);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return { selectedEventIds: newSet };
    }),
  selectAllEvents: (ids) => set({ selectedEventIds: new Set(ids) }),
  clearEventSelection: () => set({ selectedEventIds: new Set() }),

  // Add IP dialog
  isAddIpDialogOpen: false,
  openAddIpDialog: () => set({ isAddIpDialogOpen: true }),
  closeAddIpDialog: () => set({ isAddIpDialogOpen: false }),

  // Revoke session dialog
  isRevokeDialogOpen: false,
  sessionToRevoke: null,
  openRevokeDialog: (session) => set({ isRevokeDialogOpen: true, sessionToRevoke: session }),
  closeRevokeDialog: () => set({ isRevokeDialogOpen: false, sessionToRevoke: null }),

  // Resolve event dialog
  isResolveDialogOpen: false,
  eventToResolve: null,
  openResolveDialog: (event) => set({ isResolveDialogOpen: true, eventToResolve: event }),
  closeResolveDialog: () => set({ isResolveDialogOpen: false, eventToResolve: null }),

  // Bulk resolve dialog
  isBulkResolveDialogOpen: false,
  openBulkResolveDialog: () => set({ isBulkResolveDialogOpen: true }),
  closeBulkResolveDialog: () => set({ isBulkResolveDialogOpen: false }),

  // Reset all
  reset: () =>
    set({
      ipListTab: "ALLOWLIST",
      eventFilter: "unresolved",
      selectedEventIds: new Set(),
      isAddIpDialogOpen: false,
      isRevokeDialogOpen: false,
      sessionToRevoke: null,
      isResolveDialogOpen: false,
      eventToResolve: null,
      isBulkResolveDialogOpen: false,
    }),
}));

// ============================================================================
// React Query Hooks
// ============================================================================

const QUERY_KEYS = {
  stats: ["security", "stats"],
  sessions: ["security", "sessions"],
  ipList: ["security", "ip-list"],
  events: ["security", "events"],
  config: ["security", "config"],
};

/**
 * Hook for fetching security stats
 */
export function useSecurityStats() {
  return useQuery({
    queryKey: QUERY_KEYS.stats,
    queryFn: getSecurityStats,
    staleTime: 10000, // 10 seconds
    refetchInterval: 30000, // Auto-refresh every 30s
  });
}

/**
 * Hook for fetching active sessions
 */
export function useActiveSessions() {
  return useQuery({
    queryKey: QUERY_KEYS.sessions,
    queryFn: async () => {
      const data = await getActiveSessions();
      return data.sessions || [];
    },
    staleTime: 5000,
  });
}

/**
 * Hook for fetching IP list
 */
export function useIpList() {
  return useQuery({
    queryKey: QUERY_KEYS.ipList,
    queryFn: async () => {
      const data = await getIpList();
      return data.entries || [];
    },
    staleTime: 30000,
  });
}

/**
 * Hook for fetching security events
 */
export function useSecurityEvents(params: { limit?: number; resolved?: boolean }) {
  return useQuery({
    queryKey: [...QUERY_KEYS.events, params],
    queryFn: async () => {
      const data = await getSecurityEvents(params);
      return data.events || [];
    },
    staleTime: 10000,
  });
}

/**
 * Hook for fetching security config
 */
export function useSecurityConfigQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.config,
    queryFn: async () => {
      const data = await getSecurityConfig();
      return data.config;
    },
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook for revoking a session
 */
export function useRevokeSession() {
  const queryClient = useQueryClient();
  const { closeRevokeDialog } = useSecurityStore();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => revokeSession(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sessions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats });
      closeRevokeDialog();
    },
  });
}

/**
 * Hook for adding an IP to allowlist/blocklist
 */
export function useAddIp() {
  const queryClient = useQueryClient();
  const { closeAddIpDialog } = useSecurityStore();

  return useMutation({
    mutationFn: (data: AddIpToListInput) => addIpToList(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ipList });
      closeAddIpDialog();
    },
  });
}

/**
 * Hook for removing an IP from list
 */
export function useRemoveIp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => removeIpFromList(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ipList });
    },
  });
}

/**
 * Hook for resolving a security event
 */
export function useResolveEvent() {
  const queryClient = useQueryClient();
  const { closeResolveDialog } = useSecurityStore();

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => resolveSecurityEvent(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats });
      closeResolveDialog();
    },
  });
}

/**
 * Hook for bulk resolving security events
 */
export function useBulkResolveEvents() {
  const queryClient = useQueryClient();
  const { closeBulkResolveDialog, clearEventSelection } = useSecurityStore();

  return useMutation({
    mutationFn: ({ ids, notes }: { ids: string[]; notes?: string }) =>
      bulkResolveSecurityEvents(ids, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats });
      closeBulkResolveDialog();
      clearEventSelection();
    },
  });
}

/**
 * Hook for updating security config
 */
export function useUpdateSecurityConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<SecurityConfig>) => updateSecurityConfig(data),
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.config, data.config);
    },
  });
}

/**
 * Combined hook for the security dashboard page
 */
export function useSecurityDashboard() {
  const store = useSecurityStore();
  const statsQuery = useSecurityStats();
  const sessionsQuery = useActiveSessions();
  const ipListQuery = useIpList();
  const eventsQuery = useSecurityEvents({
    limit: 50,
    resolved: store.eventFilter === "all" ? undefined : false,
  });
  const configQuery = useSecurityConfigQuery();

  const revokeMutation = useRevokeSession();
  const addIpMutation = useAddIp();
  const removeIpMutation = useRemoveIp();
  const resolveEventMutation = useResolveEvent();
  const bulkResolveEventsMutation = useBulkResolveEvents();
  const updateConfigMutation = useUpdateSecurityConfig();

  // Filter IP list by current tab
  const filteredIpList = (ipListQuery.data || []).filter(
    (entry) => entry.listType === store.ipListTab
  );

  return {
    // Data
    stats: statsQuery.data,
    sessions: sessionsQuery.data || [],
    ipList: filteredIpList,
    allIpEntries: ipListQuery.data || [],
    events: eventsQuery.data || [],
    config: configQuery.data,

    // Loading states
    isLoadingStats: statsQuery.isLoading,
    isLoadingSessions: sessionsQuery.isLoading,
    isLoadingIpList: ipListQuery.isLoading,
    isLoadingEvents: eventsQuery.isLoading,
    isLoadingConfig: configQuery.isLoading,
    isRevoking: revokeMutation.isPending,
    isAddingIp: addIpMutation.isPending,
    isRemovingIp: removeIpMutation.isPending,
    isResolvingEvent: resolveEventMutation.isPending,
    isBulkResolving: bulkResolveEventsMutation.isPending,
    isSavingConfig: updateConfigMutation.isPending,

    // Errors
    statsError: statsQuery.error,
    sessionsError: sessionsQuery.error,
    ipListError: ipListQuery.error,
    eventsError: eventsQuery.error,
    configError: configQuery.error,
    revokeError: revokeMutation.error,
    addIpError: addIpMutation.error,
    removeIpError: removeIpMutation.error,
    resolveEventError: resolveEventMutation.error,
    bulkResolveError: bulkResolveEventsMutation.error,
    updateConfigError: updateConfigMutation.error,

    // Refetch actions
    refetchStats: statsQuery.refetch,
    refetchSessions: sessionsQuery.refetch,
    refetchIpList: ipListQuery.refetch,
    refetchEvents: eventsQuery.refetch,
    refetchConfig: configQuery.refetch,

    // Mutation actions
    revokeSession: (id: string, reason: string) => revokeMutation.mutate({ id, reason }),
    addIp: addIpMutation.mutate,
    removeIp: removeIpMutation.mutate,
    resolveEvent: (id: string, notes?: string) => resolveEventMutation.mutate({ id, notes }),
    bulkResolveEvents: (ids: string[], notes?: string) =>
      bulkResolveEventsMutation.mutate({ ids, notes }),
    updateConfig: updateConfigMutation.mutate,

    // UI State from store
    ...store,
  };
}

/**
 * Hook to update sessions from WebSocket
 */
export function useSessionsWebSocketUpdate() {
  const queryClient = useQueryClient();

  const handleSessionCreated = (session: SecuritySession) => {
    queryClient.setQueryData<SecuritySession[]>(QUERY_KEYS.sessions, (old = []) => [
      session,
      ...old,
    ]);
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats });
  };

  const handleSessionUpdated = (session: SecuritySession) => {
    queryClient.setQueryData<SecuritySession[]>(QUERY_KEYS.sessions, (old = []) =>
      old.map((s) => (s.id === session.id ? session : s))
    );
  };

  const handleSessionRemoved = (sessionId: string) => {
    queryClient.setQueryData<SecuritySession[]>(QUERY_KEYS.sessions, (old = []) =>
      old.filter((s) => s.id !== sessionId)
    );
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats });
  };

  const handleEventCreated = (event: SecurityEvent) => {
    queryClient.setQueryData<SecurityEvent[]>(
      [...QUERY_KEYS.events, { limit: 50, resolved: false }],
      (old = []) => [event, ...old.slice(0, 49)]
    );
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats });
  };

  return {
    handleSessionCreated,
    handleSessionUpdated,
    handleSessionRemoved,
    handleEventCreated,
  };
}

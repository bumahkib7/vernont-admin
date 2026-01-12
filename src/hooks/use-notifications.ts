"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { create } from "zustand";
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
  resetNotificationPreferences,
  type Notification,
  type NotificationPreference,
  type UpdatePreferencesInput,
} from "@/lib/api";

// ============================================================================
// Zustand Store for UI State
// ============================================================================

interface NotificationUIState {
  // Notification panel state
  isPanelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;

  // Browser permission state
  browserPermission: NotificationPermission | null;
  setBrowserPermission: (permission: NotificationPermission) => void;

  // Reset
  reset: () => void;
}

export const useNotificationStore = create<NotificationUIState>((set) => ({
  isPanelOpen: false,
  openPanel: () => set({ isPanelOpen: true }),
  closePanel: () => set({ isPanelOpen: false }),
  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),

  browserPermission: null,
  setBrowserPermission: (permission) => set({ browserPermission: permission }),

  reset: () =>
    set({
      isPanelOpen: false,
      browserPermission: null,
    }),
}));

// ============================================================================
// React Query Keys
// ============================================================================

const QUERY_KEYS = {
  notifications: ["notifications"],
  unreadCount: ["notifications", "unread-count"],
  preferences: ["notifications", "preferences"],
};

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook for fetching notifications
 */
export function useNotifications(limit = 50, unreadOnly = false) {
  return useQuery({
    queryKey: [...QUERY_KEYS.notifications, { limit, unreadOnly }],
    queryFn: async () => {
      const data = await getNotifications({ limit, unreadOnly });
      return data.notifications || [];
    },
    staleTime: 10000, // 10 seconds
  });
}

/**
 * Hook for fetching unread count
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: QUERY_KEYS.unreadCount,
    queryFn: async () => {
      const data = await getUnreadCount();
      return data.count;
    },
    staleTime: 5000, // 5 seconds
    refetchInterval: 30000, // Auto-refresh every 30s
  });
}

/**
 * Hook for fetching notification preferences
 */
export function useNotificationPreferences() {
  return useQuery({
    queryKey: QUERY_KEYS.preferences,
    queryFn: async () => {
      const data = await getNotificationPreferences();
      return data.preferences || [];
    },
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook for marking a notification as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.unreadCount });
    },
  });
}

/**
 * Hook for marking all notifications as read
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  const { closePanel } = useNotificationStore();

  return useMutation({
    mutationFn: () => markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.unreadCount });
    },
  });
}

/**
 * Hook for deleting a notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.unreadCount });
    },
  });
}

/**
 * Hook for updating notification preferences
 */
export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePreferencesInput) => updateNotificationPreferences(data),
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.preferences, data.preferences);
    },
  });
}

/**
 * Hook for resetting notification preferences
 */
export function useResetPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => resetNotificationPreferences(),
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.preferences, data.preferences);
    },
  });
}

// ============================================================================
// Browser Notification Permission
// ============================================================================

/**
 * Check if browser notifications are supported
 */
export function isBrowserNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/**
 * Get current browser notification permission
 */
export function getBrowserPermission(): NotificationPermission | null {
  if (!isBrowserNotificationSupported()) return null;
  return Notification.permission;
}

/**
 * Request browser notification permission
 */
export async function requestBrowserPermission(): Promise<NotificationPermission | null> {
  if (!isBrowserNotificationSupported()) return null;

  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";

  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return null;
  }
}

/**
 * Show a browser notification
 */
export function showBrowserNotification(
  title: string,
  options?: {
    body?: string;
    icon?: string;
    tag?: string;
    onClick?: () => void;
  }
): globalThis.Notification | null {
  if (!isBrowserNotificationSupported()) return null;
  if (Notification.permission !== "granted") return null;

  const notification = new Notification(title, {
    body: options?.body,
    icon: options?.icon || "/icon-192.png",
    tag: options?.tag,
  });

  if (options?.onClick) {
    notification.onclick = () => {
      window.focus();
      options.onClick?.();
      notification.close();
    };
  }

  return notification;
}

// ============================================================================
// WebSocket Update Handler
// ============================================================================

/**
 * Hook for updating notifications from WebSocket
 */
export function useNotificationsWebSocketUpdate() {
  const queryClient = useQueryClient();

  const handleNewNotification = (notification: Notification) => {
    // Update notifications list
    queryClient.setQueryData<Notification[]>(
      [...QUERY_KEYS.notifications, { limit: 50, unreadOnly: false }],
      (old = []) => [notification, ...old.slice(0, 49)]
    );

    // Update unread count
    queryClient.setQueryData<number>(QUERY_KEYS.unreadCount, (old = 0) => old + 1);
  };

  const handleNotificationRead = (notificationId: string) => {
    // Update notifications list
    queryClient.setQueryData<Notification[]>(
      [...QUERY_KEYS.notifications, { limit: 50, unreadOnly: false }],
      (old = []) =>
        old.map((n) =>
          n.id === notificationId
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n
        )
    );

    // Decrement unread count
    queryClient.setQueryData<number>(QUERY_KEYS.unreadCount, (old = 1) =>
      Math.max(0, old - 1)
    );
  };

  return {
    handleNewNotification,
    handleNotificationRead,
  };
}

// ============================================================================
// Combined Hook for Notification Dashboard
// ============================================================================

/**
 * Combined hook for the notification preferences page
 */
export function useNotificationDashboard() {
  const store = useNotificationStore();
  const notificationsQuery = useNotifications();
  const unreadCountQuery = useUnreadCount();
  const preferencesQuery = useNotificationPreferences();

  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const deleteNotificationMutation = useDeleteNotification();
  const updatePreferencesMutation = useUpdatePreferences();
  const resetPreferencesMutation = useResetPreferences();

  return {
    // Data
    notifications: notificationsQuery.data || [],
    unreadCount: unreadCountQuery.data || 0,
    preferences: preferencesQuery.data || [],

    // Loading states
    isLoadingNotifications: notificationsQuery.isLoading,
    isLoadingUnreadCount: unreadCountQuery.isLoading,
    isLoadingPreferences: preferencesQuery.isLoading,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeleting: deleteNotificationMutation.isPending,
    isUpdatingPreferences: updatePreferencesMutation.isPending,
    isResettingPreferences: resetPreferencesMutation.isPending,

    // Errors
    notificationsError: notificationsQuery.error,
    unreadCountError: unreadCountQuery.error,
    preferencesError: preferencesQuery.error,
    markAsReadError: markAsReadMutation.error,
    updatePreferencesError: updatePreferencesMutation.error,

    // Refetch actions
    refetchNotifications: notificationsQuery.refetch,
    refetchUnreadCount: unreadCountQuery.refetch,
    refetchPreferences: preferencesQuery.refetch,

    // Mutation actions
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    updatePreferences: updatePreferencesMutation.mutate,
    resetPreferences: resetPreferencesMutation.mutate,

    // UI State from store
    ...store,
  };
}

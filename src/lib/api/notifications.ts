import { apiFetch } from "./client";

// ============================================================================
// Notifications
// ============================================================================

export interface Notification {
  id: string;
  eventType: string;
  title: string;
  message: string | null;
  entityType: string | null;
  entityId: string | null;
  navigateTo: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  count: number;
}

export interface UnreadCountResponse {
  count: number;
}

export interface NotificationPreference {
  eventType: string;
  eventTypeDisplayName: string;
  browserEnabled: boolean;
  inAppEnabled: boolean;
}

export interface PreferencesResponse {
  preferences: NotificationPreference[];
}

export interface UpdatePreferencesInput {
  preferences: {
    eventType: string;
    browserEnabled: boolean;
    inAppEnabled: boolean;
  }[];
}

// Get user notifications
export async function getNotifications(params?: {
  limit?: number;
  unreadOnly?: boolean;
}): Promise<NotificationsResponse> {
  const query = new URLSearchParams();
  if (params?.limit) query.set("limit", params.limit.toString());
  if (params?.unreadOnly) query.set("unreadOnly", "true");
  return apiFetch<NotificationsResponse>(`/api/v1/internal/notifications${query.toString() ? `?${query}` : ""}`);
}

// Get unread notification count
export async function getUnreadCount(): Promise<UnreadCountResponse> {
  return apiFetch<UnreadCountResponse>("/api/v1/internal/notifications/unread-count");
}

// Mark notification as read
export async function markNotificationAsRead(id: string): Promise<{ id: string; isRead: boolean }> {
  return apiFetch<{ id: string; isRead: boolean }>(`/api/v1/internal/notifications/${id}/read`, {
    method: "POST",
  });
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(): Promise<{ markedAsRead: number }> {
  return apiFetch<{ markedAsRead: number }>("/api/v1/internal/notifications/read-all", {
    method: "POST",
  });
}

// Delete a notification
export async function deleteNotification(id: string): Promise<{ id: string; deleted: boolean }> {
  return apiFetch<{ id: string; deleted: boolean }>(`/api/v1/internal/notifications/${id}`, {
    method: "DELETE",
  });
}

// Get notification preferences
export async function getNotificationPreferences(): Promise<PreferencesResponse> {
  return apiFetch<PreferencesResponse>("/api/v1/internal/notifications/preferences");
}

// Update notification preferences
export async function updateNotificationPreferences(data: UpdatePreferencesInput): Promise<PreferencesResponse> {
  return apiFetch<PreferencesResponse>("/api/v1/internal/notifications/preferences", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Reset notification preferences to defaults
export async function resetNotificationPreferences(): Promise<PreferencesResponse> {
  return apiFetch<PreferencesResponse>("/api/v1/internal/notifications/preferences/reset", {
    method: "POST",
  });
}

// Send activity heartbeat (keeps user session active for notification delivery)
export async function sendHeartbeat(): Promise<void> {
  await apiFetch<void>("/admin/notifications/heartbeat", {
    method: "POST",
  });
}

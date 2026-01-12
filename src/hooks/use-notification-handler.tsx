"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useWebSocket } from "./use-websocket";
import {
  useNotificationsWebSocketUpdate,
  useNotificationStore,
  showBrowserNotification,
  getBrowserPermission,
} from "./use-notifications";
import type { Notification } from "@/lib/api";

// WebSocket message type from backend
interface NotificationWebSocketMessage {
  id: string;
  eventType: string;
  title: string;
  message: string | null;
  entityType: string | null;
  entityId: string | null;
  navigateTo: string | null;
  createdAt: string;
  timestamp: string;
}

// User queue destination (STOMP user-specific queue)
// Note: Spring STOMP automatically prefixes with /user/{username}
const USER_NOTIFICATION_QUEUE = "/user/queue/notifications";

// Convert WebSocket message to Notification type
function toNotification(msg: NotificationWebSocketMessage): Notification {
  return {
    id: msg.id,
    eventType: msg.eventType,
    title: msg.title,
    message: msg.message,
    entityType: msg.entityType,
    entityId: msg.entityId,
    navigateTo: msg.navigateTo,
    isRead: false,
    readAt: null,
    createdAt: msg.createdAt,
  };
}

// Get toast action label based on entity type
function getActionLabel(entityType: string | null): string {
  switch (entityType) {
    case "ORDER":
      return "View Order";
    case "CUSTOMER":
      return "View Customer";
    case "PRODUCT":
      return "View Product";
    case "SECURITY_EVENT":
      return "View Security";
    default:
      return "View";
  }
}

/**
 * Hook for handling real-time notifications.
 * Subscribes to the user's notification queue via WebSocket
 * and shows browser/toast notifications.
 */
export function useNotificationHandler() {
  const router = useRouter();
  const { isConnected, subscribe, unsubscribe } = useWebSocket();
  const { handleNewNotification } = useNotificationsWebSocketUpdate();
  const subscriptionRef = useRef<ReturnType<typeof subscribe> | null>(null);
  const hasSubscribedRef = useRef(false);

  // Handle incoming notification from WebSocket
  const handleNotificationMessage = useCallback(
    (message: unknown) => {
      const msg = message as NotificationWebSocketMessage;
      const notification = toNotification(msg);

      console.log("[NotificationHandler] Received notification:", notification);

      // Update React Query cache
      handleNewNotification(notification);

      // Show browser notification if permitted
      const browserPermission = getBrowserPermission();
      if (browserPermission === "granted") {
        showBrowserNotification(notification.title, {
          body: notification.message || undefined,
          tag: notification.id,
          onClick: () => {
            if (notification.navigateTo) {
              router.push(notification.navigateTo);
            }
          },
        });
      }

      // Show toast notification
      toast(notification.title, {
        description: notification.message || undefined,
        duration: 5000,
        action: notification.navigateTo
          ? {
              label: getActionLabel(notification.entityType),
              onClick: () => {
                router.push(notification.navigateTo!);
              },
            }
          : undefined,
      });
    },
    [handleNewNotification, router]
  );

  // Subscribe to notification queue when connected
  useEffect(() => {
    console.log("[NotificationHandler] Effect triggered, isConnected:", isConnected);

    if (!isConnected) {
      console.log("[NotificationHandler] Not connected, resetting subscription state");
      hasSubscribedRef.current = false;
      return;
    }

    // Prevent duplicate subscriptions
    if (hasSubscribedRef.current) {
      console.log("[NotificationHandler] Already subscribed, skipping");
      return;
    }

    console.log("[NotificationHandler] Subscribing to:", USER_NOTIFICATION_QUEUE);
    hasSubscribedRef.current = true;

    const subscription = subscribe(
      USER_NOTIFICATION_QUEUE,
      handleNotificationMessage
    );

    console.log("[NotificationHandler] Subscription result:", subscription ? "success" : "null (pending)");

    if (subscription) {
      subscriptionRef.current = subscription;
    }

    return () => {
      if (subscriptionRef.current) {
        console.log("[NotificationHandler] Cleanup: unsubscribing from notifications queue");
        unsubscribe(subscriptionRef.current);
        subscriptionRef.current = null;
        hasSubscribedRef.current = false;
      }
    };
  }, [isConnected, subscribe, unsubscribe, handleNotificationMessage]);

  return {
    isConnected,
  };
}

/**
 * Provider component that initializes the notification handler.
 * Should be placed near the root of the authenticated app.
 */
export function NotificationHandlerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useNotificationHandler();
  return <>{children}</>;
}

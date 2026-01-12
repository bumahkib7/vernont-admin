"use client";

import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  Settings,
  Package,
  User,
  CreditCard,
  ShieldAlert,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useNotificationStore,
} from "@/hooks/use-notifications";
import type { Notification } from "@/lib/api";

// Get icon for notification type
function getNotificationIcon(eventType: string) {
  switch (eventType) {
    case "ORDER_CREATED":
    case "ORDER_PAID":
    case "ORDER_CANCELLED":
    case "ORDER_FULFILLED":
    case "REFUND_CREATED":
      return <Package className="h-4 w-4 text-blue-500" />;
    case "CUSTOMER_REGISTERED":
      return <User className="h-4 w-4 text-green-500" />;
    case "LOW_STOCK_ALERT":
    case "PRODUCT_OUT_OF_STOCK":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case "FULFILLMENT_CREATED":
    case "FULFILLMENT_SHIPPED":
    case "FULFILLMENT_DELIVERED":
      return <CreditCard className="h-4 w-4 text-purple-500" />;
    case "SECURITY_ALERT":
      return <ShieldAlert className="h-4 w-4 text-red-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
}

// Format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (diffMs < 0) return "Just now";

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Notification item component
function NotificationItem({
  notification,
  onRead,
  onClick,
}: {
  notification: Notification;
  onRead: (id: string) => void;
  onClick: () => void;
}) {
  const handleClick = () => {
    if (!notification.isRead) {
      onRead(notification.id);
    }
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
        !notification.isRead && "bg-blue-50/50 dark:bg-blue-950/20"
      )}
    >
      <div className="mt-0.5">{getNotificationIcon(notification.eventType)}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm truncate",
              !notification.isRead && "font-medium"
            )}
          >
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-500" />
          )}
        </div>
        {notification.message && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {notification.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>
    </button>
  );
}

export function NotificationBell() {
  const router = useRouter();
  const { isPanelOpen, openPanel, closePanel } = useNotificationStore();

  const { data: notifications = [], isLoading: isLoadingNotifications } =
    useNotifications(20);
  const { data: unreadCount = 0 } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  // Handle click on notification
  const handleNotificationClick = (notification: Notification) => {
    closePanel();
    if (notification.navigateTo) {
      router.push(notification.navigateTo);
    }
  };

  // Handle mark as read
  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id);
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  // Go to settings
  const handleGoToSettings = () => {
    closePanel();
    router.push("/settings/notifications");
  };

  return (
    <Popover open={isPanelOpen} onOpenChange={(open) => (open ? openPanel() : closePanel())}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[380px] p-0"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="font-semibold">Notifications</h4>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsRead.isPending}
              >
                {markAllAsRead.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCheck className="mr-1 h-3 w-3" />
                )}
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleGoToSettings}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[400px]">
          {isLoadingNotifications ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={handleMarkAsRead}
                  onClick={() => handleNotificationClick(notification)}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              className="w-full h-8 text-xs"
              onClick={() => {
                closePanel();
                router.push("/notifications");
              }}
            >
              View all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

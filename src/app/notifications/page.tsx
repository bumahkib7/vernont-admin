"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  Package,
  User,
  CreditCard,
  ShieldAlert,
  AlertTriangle,
  Loader2,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
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
      return <Package className="h-5 w-5 text-blue-500" />;
    case "CUSTOMER_REGISTERED":
      return <User className="h-5 w-5 text-green-500" />;
    case "LOW_STOCK_ALERT":
    case "PRODUCT_OUT_OF_STOCK":
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case "FULFILLMENT_CREATED":
    case "FULFILLMENT_SHIPPED":
    case "FULFILLMENT_DELIVERED":
      return <CreditCard className="h-5 w-5 text-purple-500" />;
    case "SECURITY_ALERT":
      return <ShieldAlert className="h-5 w-5 text-red-500" />;
    default:
      return <Bell className="h-5 w-5 text-gray-500" />;
  }
}

// Get badge variant for event type
function getEventBadgeVariant(eventType: string): "default" | "secondary" | "destructive" | "outline" {
  if (eventType.includes("CANCELLED") || eventType.includes("ALERT")) {
    return "destructive";
  }
  if (eventType.includes("CREATED") || eventType.includes("REGISTERED")) {
    return "default";
  }
  return "secondary";
}

// Format event type for display
function formatEventType(eventType: string): string {
  return eventType
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
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
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString();
}

// Format full date
function formatFullDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString();
}

// Notification row component
function NotificationRow({
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
        "flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-muted/50 border-b last:border-b-0",
        !notification.isRead && "bg-blue-50/50 dark:bg-blue-950/20"
      )}
    >
      <div className="flex-shrink-0">
        {getNotificationIcon(notification.eventType)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className={cn("text-sm", !notification.isRead && "font-semibold")}>
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-500" />
          )}
        </div>
        {notification.message && (
          <p className="text-sm text-muted-foreground truncate">
            {notification.message}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <Badge variant={getEventBadgeVariant(notification.eventType)} className="text-xs">
            {formatEventType(notification.eventType)}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(notification.createdAt)}
          </span>
        </div>
      </div>

      {notification.navigateTo && (
        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      )}
    </button>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const { data: notifications = [], isLoading } = useNotifications(100);
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  // Filter notifications based on selection
  const filteredNotifications = filter === "unread"
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Handle click on notification
  const handleNotificationClick = (notification: Notification) => {
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

  return (
    <div className="container max-w-4xl py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
              : "You're all caught up"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unread">Unread only</SelectItem>
            </SelectContent>
          </Select>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsRead.isPending}
            >
              {markAllAsRead.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCheck className="h-4 w-4 mr-2" />
              )}
              Mark all read
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">
            {filter === "unread" ? "Unread Notifications" : "All Notifications"}
            <span className="ml-2 text-muted-foreground font-normal">
              ({filteredNotifications.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No notifications</p>
              <p className="text-sm">
                {filter === "unread"
                  ? "You have no unread notifications"
                  : "You haven't received any notifications yet"}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredNotifications.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  onRead={handleMarkAsRead}
                  onClick={() => handleNotificationClick(notification)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

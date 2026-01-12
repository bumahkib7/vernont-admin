"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  BellOff,
  BellRing,
  Monitor,
  Smartphone,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Settings,
} from "lucide-react";
import {
  useNotificationDashboard,
  isBrowserNotificationSupported,
  getBrowserPermission,
  requestBrowserPermission,
} from "@/hooks/use-notifications";
import { ApiError, type NotificationPreference } from "@/lib/api";

// Helper to get error message
const getErrorMessage = (err: unknown): string => {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "An unexpected error occurred";
};

// Event type display names
const eventTypeLabels: Record<string, { label: string; description: string }> = {
  ORDER_CREATED: {
    label: "New Order",
    description: "When a new order is placed",
  },
  ORDER_PAID: {
    label: "Order Paid",
    description: "When payment is captured for an order",
  },
  ORDER_CANCELLED: {
    label: "Order Cancelled",
    description: "When an order is cancelled",
  },
  ORDER_FULFILLED: {
    label: "Order Fulfilled",
    description: "When an order is fully fulfilled",
  },
  REFUND_CREATED: {
    label: "Refund Issued",
    description: "When a refund is processed",
  },
  CUSTOMER_REGISTERED: {
    label: "New Customer",
    description: "When a new customer registers",
  },
  LOW_STOCK_ALERT: {
    label: "Low Stock Alert",
    description: "When product stock falls below threshold",
  },
  PRODUCT_OUT_OF_STOCK: {
    label: "Out of Stock",
    description: "When a product goes out of stock",
  },
  FULFILLMENT_CREATED: {
    label: "Fulfillment Created",
    description: "When a fulfillment is created",
  },
  FULFILLMENT_SHIPPED: {
    label: "Fulfillment Shipped",
    description: "When a fulfillment is shipped",
  },
  FULFILLMENT_DELIVERED: {
    label: "Fulfillment Delivered",
    description: "When a fulfillment is delivered",
  },
  SECURITY_ALERT: {
    label: "Security Alert",
    description: "Critical security events",
  },
};

export default function NotificationSettingsPage() {
  const {
    preferences,
    isLoadingPreferences,
    isUpdatingPreferences,
    isResettingPreferences,
    preferencesError,
    updatePreferences,
    resetPreferences,
    refetchPreferences,
    browserPermission,
    setBrowserPermission,
  } = useNotificationDashboard();

  const [pendingChanges, setPendingChanges] = useState<Map<string, { browserEnabled: boolean; inAppEnabled: boolean }>>(new Map());
  const [hasChanges, setHasChanges] = useState(false);

  // Check browser permission on mount
  useEffect(() => {
    if (isBrowserNotificationSupported()) {
      setBrowserPermission(getBrowserPermission() || "default");
    }
  }, [setBrowserPermission]);

  // Request browser permission
  const handleRequestPermission = async () => {
    const result = await requestBrowserPermission();
    if (result) {
      setBrowserPermission(result);
    }
  };

  // Toggle preference
  const handleToggle = (
    eventType: string,
    field: "browserEnabled" | "inAppEnabled",
    currentValue: boolean,
    originalPref: NotificationPreference
  ) => {
    const existing = pendingChanges.get(eventType) || {
      browserEnabled: originalPref.browserEnabled,
      inAppEnabled: originalPref.inAppEnabled,
    };

    const updated = { ...existing, [field]: !currentValue };
    const newChanges = new Map(pendingChanges);
    newChanges.set(eventType, updated);
    setPendingChanges(newChanges);
    setHasChanges(true);
  };

  // Get current value (pending or original)
  const getCurrentValue = (
    pref: NotificationPreference,
    field: "browserEnabled" | "inAppEnabled"
  ): boolean => {
    const pending = pendingChanges.get(pref.eventType);
    if (pending) return pending[field];
    return pref[field];
  };

  // Save changes
  const handleSave = () => {
    const updates = Array.from(pendingChanges.entries()).map(([eventType, values]) => ({
      eventType,
      browserEnabled: values.browserEnabled,
      inAppEnabled: values.inAppEnabled,
    }));

    updatePreferences(
      { preferences: updates },
      {
        onSuccess: () => {
          setPendingChanges(new Map());
          setHasChanges(false);
        },
      }
    );
  };

  // Discard changes
  const handleDiscard = () => {
    setPendingChanges(new Map());
    setHasChanges(false);
  };

  // Reset to defaults
  const handleReset = () => {
    resetPreferences(undefined, {
      onSuccess: () => {
        setPendingChanges(new Map());
        setHasChanges(false);
      },
    });
  };

  // Enable all for a channel
  const handleEnableAll = (field: "browserEnabled" | "inAppEnabled") => {
    const newChanges = new Map(pendingChanges);
    preferences.forEach((pref) => {
      const existing = newChanges.get(pref.eventType) || {
        browserEnabled: pref.browserEnabled,
        inAppEnabled: pref.inAppEnabled,
      };
      newChanges.set(pref.eventType, { ...existing, [field]: true });
    });
    setPendingChanges(newChanges);
    setHasChanges(true);
  };

  // Disable all for a channel
  const handleDisableAll = (field: "browserEnabled" | "inAppEnabled") => {
    const newChanges = new Map(pendingChanges);
    preferences.forEach((pref) => {
      const existing = newChanges.get(pref.eventType) || {
        browserEnabled: pref.browserEnabled,
        inAppEnabled: pref.inAppEnabled,
      };
      newChanges.set(pref.eventType, { ...existing, [field]: false });
    });
    setPendingChanges(newChanges);
    setHasChanges(true);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/settings">Settings</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Notifications</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notification Preferences</h1>
          <p className="text-sm text-muted-foreground">
            Configure how you receive notifications for different events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchPreferences()}
            disabled={isLoadingPreferences}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingPreferences ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Browser Permission Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Browser Notifications
          </CardTitle>
          <CardDescription>
            Receive native desktop/mobile notifications even when the browser is in the background
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isBrowserNotificationSupported() ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <BellOff className="h-4 w-4" />
              <span>Browser notifications are not supported in this browser</span>
            </div>
          ) : browserPermission === "granted" ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Browser notifications are enabled</span>
            </div>
          ) : browserPermission === "denied" ? (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>
                Browser notifications are blocked. Please update your browser settings to enable them.
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Bell className="h-4 w-4" />
                <span>Browser notifications are not enabled</span>
              </div>
              <Button onClick={handleRequestPermission} size="sm">
                <BellRing className="mr-2 h-4 w-4" />
                Enable Notifications
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {preferencesError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-2 py-4 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{getErrorMessage(preferencesError)}</span>
          </CardContent>
        </Card>
      )}

      {/* Preferences Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Event Notifications
              </CardTitle>
              <CardDescription>
                Choose which events trigger notifications
              </CardDescription>
            </div>
            {hasChanges && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleDiscard}>
                  Discard
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isUpdatingPreferences}>
                  {isUpdatingPreferences && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingPreferences ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Bulk Actions */}
              <div className="mb-4 flex items-center justify-between border-b pb-4">
                <div className="text-sm text-muted-foreground">
                  Configure notifications per event type
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Browser:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => handleEnableAll("browserEnabled")}
                    >
                      Enable All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => handleDisableAll("browserEnabled")}
                    >
                      Disable All
                    </Button>
                  </div>
                  <div className="h-4 w-px bg-border" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">In-App:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => handleEnableAll("inAppEnabled")}
                    >
                      Enable All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => handleDisableAll("inAppEnabled")}
                    >
                      Disable All
                    </Button>
                  </div>
                </div>
              </div>

              {/* Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Event</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[120px] text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Monitor className="h-4 w-4" />
                        <span>Browser</span>
                      </div>
                    </TableHead>
                    <TableHead className="w-[120px] text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Smartphone className="h-4 w-4" />
                        <span>In-App</span>
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preferences.map((pref) => {
                    const typeInfo = eventTypeLabels[pref.eventType] || {
                      label: pref.eventTypeDisplayName,
                      description: "",
                    };
                    return (
                      <TableRow key={pref.eventType}>
                        <TableCell className="font-medium">
                          {typeInfo.label}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {typeInfo.description}
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={getCurrentValue(pref, "browserEnabled")}
                            onCheckedChange={() =>
                              handleToggle(
                                pref.eventType,
                                "browserEnabled",
                                getCurrentValue(pref, "browserEnabled"),
                                pref
                              )
                            }
                            disabled={browserPermission === "denied"}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={getCurrentValue(pref, "inAppEnabled")}
                            onCheckedChange={() =>
                              handleToggle(
                                pref.eventType,
                                "inAppEnabled",
                                getCurrentValue(pref, "inAppEnabled"),
                                pref
                              )
                            }
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Reset Button */}
              <div className="mt-4 flex justify-end border-t pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={isResettingPreferences}
                >
                  {isResettingPreferences && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Reset to Defaults
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

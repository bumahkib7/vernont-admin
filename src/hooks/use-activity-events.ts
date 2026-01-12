"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useWebSocket } from "./use-websocket";
import { ActivityItem } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const ACTIVITY_TOPIC = "/topic/auditlog";
const MAX_ACTIVITIES = 100;
const DEFAULT_POLLING_INTERVAL = 120000; // 2 minutes

export type ConnectionStatus = "live" | "polling" | "disconnected";

export interface UseActivityEventsOptions {
  onActivity?: (activity: ActivityItem) => void;
  pollingInterval?: number;
  maxActivities?: number;
  autoConnect?: boolean;
}

export interface UseActivityEventsReturn {
  activities: ActivityItem[];
  isConnected: boolean;
  isPolling: boolean;
  connectionStatus: ConnectionStatus;
  clearActivities: () => void;
  refetch: () => Promise<void>;
}

// Entity types that should be shown in the activity feed (must match backend ENTITY_CONFIG)
const ALLOWED_ENTITY_TYPES = new Set([
  "Order",
  "Product",
  "ProductVariant",
  "Customer",
  "Payment",
  "Refund",
  "Fulfillment",
  "InventoryItem",
  "InventoryLevel",
  "Return",
  "GiftCard",
  "Discount",
  "Promotion",
  "Region",
  "TaxRate",
  "StockLocation",
  "ShippingProfile",
  "ReturnReasonConfig",
  "RefundReasonConfig",
]);

// Actions that should be shown
const ALLOWED_ACTIONS = new Set(["CREATE", "UPDATE", "DELETE"]);

// Human-readable message generators for each entity type
const MESSAGE_GENERATORS: Record<
  string,
  (action: string, entityId: string, userName?: string) => string
> = {
  Order: (action, id, user) => {
    const shortId = id.substring(0, 8);
    switch (action) {
      case "CREATE":
        return `New order #${shortId} placed`;
      case "UPDATE":
        return `Order #${shortId} updated`;
      case "DELETE":
        return `Order #${shortId} cancelled`;
      default:
        return `Order #${shortId} ${action.toLowerCase()}`;
    }
  },
  Product: (action, id, user) => {
    const prefix = user && user !== "SYSTEM" ? `${user} ` : "";
    const shortId = id.substring(0, 8);
    switch (action) {
      case "CREATE":
        return `${prefix}added a new product`;
      case "UPDATE":
        return `${prefix}updated product #${shortId}`;
      case "DELETE":
        return `${prefix}removed product #${shortId}`;
      default:
        return `${prefix}modified product #${shortId}`;
    }
  },
  ProductVariant: (action, id, user) => {
    const prefix = user && user !== "SYSTEM" ? `${user} ` : "";
    switch (action) {
      case "CREATE":
        return `${prefix}added a product variant`;
      case "UPDATE":
        return `${prefix}updated product variant`;
      case "DELETE":
        return `${prefix}removed product variant`;
      default:
        return `${prefix}modified product variant`;
    }
  },
  Customer: (action) => {
    switch (action) {
      case "CREATE":
        return "New customer registered";
      case "UPDATE":
        return "Customer profile updated";
      case "DELETE":
        return "Customer account removed";
      default:
        return `Customer ${action.toLowerCase()}`;
    }
  },
  Payment: (action, id) => {
    const shortId = id.substring(0, 8);
    switch (action) {
      case "CREATE":
        return `Payment #${shortId} received`;
      case "UPDATE":
        return `Payment #${shortId} updated`;
      case "DELETE":
        return `Payment #${shortId} voided`;
      default:
        return `Payment #${shortId} ${action.toLowerCase()}`;
    }
  },
  Refund: (action, id) => {
    const shortId = id.substring(0, 8);
    switch (action) {
      case "CREATE":
        return `Refund #${shortId} issued`;
      case "UPDATE":
        return `Refund #${shortId} updated`;
      default:
        return `Refund #${shortId} ${action.toLowerCase()}`;
    }
  },
  Fulfillment: (action, id) => {
    const shortId = id.substring(0, 8);
    switch (action) {
      case "CREATE":
        return `Shipment #${shortId} created`;
      case "UPDATE":
        return `Shipment #${shortId} updated`;
      case "DELETE":
        return `Shipment #${shortId} cancelled`;
      default:
        return `Shipment #${shortId} ${action.toLowerCase()}`;
    }
  },
  InventoryItem: (action, id, user) => {
    const prefix = user && user !== "SYSTEM" ? `${user} ` : "";
    switch (action) {
      case "CREATE":
        return `${prefix}added inventory item`;
      case "UPDATE":
        return `${prefix}adjusted inventory`;
      case "DELETE":
        return `${prefix}removed inventory item`;
      default:
        return `${prefix}modified inventory`;
    }
  },
  InventoryLevel: (action) => {
    switch (action) {
      case "UPDATE":
        return "Stock level adjusted";
      default:
        return `Stock ${action.toLowerCase()}`;
    }
  },
  Return: (action, id) => {
    const shortId = id.substring(0, 8);
    switch (action) {
      case "CREATE":
        return `Return #${shortId} requested`;
      case "UPDATE":
        return `Return #${shortId} updated`;
      case "DELETE":
        return `Return #${shortId} cancelled`;
      default:
        return `Return #${shortId} ${action.toLowerCase()}`;
    }
  },
  GiftCard: (action, id, user) => {
    const prefix = user && user !== "SYSTEM" ? `${user} ` : "";
    switch (action) {
      case "CREATE":
        return `${prefix}issued a gift card`;
      case "UPDATE":
        return `${prefix}updated gift card`;
      case "DELETE":
        return `${prefix}disabled gift card`;
      default:
        return `${prefix}modified gift card`;
    }
  },
  Discount: (action, id, user) => {
    const prefix = user && user !== "SYSTEM" ? `${user} ` : "";
    switch (action) {
      case "CREATE":
        return `${prefix}created a discount`;
      case "UPDATE":
        return `${prefix}updated discount`;
      case "DELETE":
        return `${prefix}removed discount`;
      default:
        return `${prefix}modified discount`;
    }
  },
  Promotion: (action, id, user) => {
    const prefix = user && user !== "SYSTEM" ? `${user} ` : "";
    switch (action) {
      case "CREATE":
        return `${prefix}created a promotion`;
      case "UPDATE":
        return `${prefix}updated promotion`;
      case "DELETE":
        return `${prefix}ended promotion`;
      default:
        return `${prefix}modified promotion`;
    }
  },
  Region: (action, id, user) => {
    const prefix = user && user !== "SYSTEM" ? `${user} ` : "";
    switch (action) {
      case "CREATE":
        return `${prefix}created a new region`;
      case "UPDATE":
        return `${prefix}updated region settings`;
      case "DELETE":
        return `${prefix}removed a region`;
      default:
        return `${prefix}modified region`;
    }
  },
  TaxRate: (action, id, user) => {
    const prefix = user && user !== "SYSTEM" ? `${user} ` : "";
    switch (action) {
      case "CREATE":
        return `${prefix}created a new tax rate`;
      case "UPDATE":
        return `${prefix}updated tax rate`;
      case "DELETE":
        return `${prefix}removed a tax rate`;
      default:
        return `${prefix}modified tax rate`;
    }
  },
  StockLocation: (action, id, user) => {
    const prefix = user && user !== "SYSTEM" ? `${user} ` : "";
    switch (action) {
      case "CREATE":
        return `${prefix}added a new stock location`;
      case "UPDATE":
        return `${prefix}updated stock location`;
      case "DELETE":
        return `${prefix}removed a stock location`;
      default:
        return `${prefix}modified stock location`;
    }
  },
  ShippingProfile: (action, id, user) => {
    const prefix = user && user !== "SYSTEM" ? `${user} ` : "";
    switch (action) {
      case "CREATE":
        return `${prefix}created a shipping profile`;
      case "UPDATE":
        return `${prefix}updated shipping profile`;
      case "DELETE":
        return `${prefix}removed a shipping profile`;
      default:
        return `${prefix}modified shipping profile`;
    }
  },
  ReturnReasonConfig: (action, id, user) => {
    const prefix = user && user !== "SYSTEM" ? `${user} ` : "";
    switch (action) {
      case "CREATE":
        return `${prefix}added a return reason`;
      case "UPDATE":
        return `${prefix}updated return reason`;
      case "DELETE":
        return `${prefix}removed a return reason`;
      default:
        return `${prefix}modified return reason`;
    }
  },
  RefundReasonConfig: (action, id, user) => {
    const prefix = user && user !== "SYSTEM" ? `${user} ` : "";
    switch (action) {
      case "CREATE":
        return `${prefix}added a refund reason`;
      case "UPDATE":
        return `${prefix}updated refund reason`;
      case "DELETE":
        return `${prefix}removed a refund reason`;
      default:
        return `${prefix}modified refund reason`;
    }
  },
};

/**
 * Check if an audit log event should be displayed
 */
function isAllowedEvent(entityType: string, action: string): boolean {
  return ALLOWED_ENTITY_TYPES.has(entityType) && ALLOWED_ACTIONS.has(action);
}

/**
 * Format a human-readable message for an audit log event
 */
function formatMessage(
  entityType: string,
  action: string,
  entityId: string,
  userName?: string
): string {
  const generator = MESSAGE_GENERATORS[entityType];
  if (generator) {
    return generator(action, entityId, userName);
  }

  // Fallback for unknown entity types
  const prefix = userName && userName !== "SYSTEM" ? `${userName} ` : "";
  const actionVerb =
    action === "CREATE" ? "created" : action === "DELETE" ? "deleted" : "updated";
  return `${prefix}${entityType} ${actionVerb}`;
}

/**
 * Hook for real-time activity feed using STOMP WebSocket with HTTP polling fallback.
 *
 * - Primary: STOMP WebSocket subscription to /topic/auditlog
 * - Fallback: HTTP polling at 120s intervals when WebSocket disconnected
 * - Filters to only show business-relevant events
 * - Deduplicates events by ID
 */
export function useActivityEvents(
  options: UseActivityEventsOptions = {}
): UseActivityEventsReturn {
  const {
    onActivity,
    pollingInterval = DEFAULT_POLLING_INTERVAL,
    maxActivities = MAX_ACTIVITIES,
    autoConnect = true,
  } = options;

  const { isConnected, subscribe } = useWebSocket({ autoConnect });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const lastTimestampRef = useRef<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Add activity with deduplication
  const addActivity = useCallback(
    (activity: ActivityItem) => {
      if (seenIdsRef.current.has(activity.id)) {
        return; // Already seen this activity
      }

      seenIdsRef.current.add(activity.id);

      // Update last timestamp for polling
      if (!lastTimestampRef.current || activity.timestamp > lastTimestampRef.current) {
        lastTimestampRef.current = activity.timestamp;
      }

      setActivities((prev) => {
        const newActivities = [activity, ...prev];
        // Trim to max size and update seen IDs
        const trimmed = newActivities.slice(0, maxActivities);

        // Clean up seen IDs for removed activities
        const activeIds = new Set(trimmed.map((a) => a.id));
        seenIdsRef.current = activeIds;

        return trimmed;
      });

      onActivity?.(activity);
    },
    [maxActivities, onActivity]
  );

  // Add multiple activities (for initial load or polling)
  const addActivities = useCallback(
    (newActivities: ActivityItem[]) => {
      // Filter out already seen activities
      const unseen = newActivities.filter((a) => !seenIdsRef.current.has(a.id));

      if (unseen.length === 0) return;

      // Add to seen IDs
      unseen.forEach((a) => seenIdsRef.current.add(a.id));

      // Update last timestamp
      const maxTimestamp = unseen.reduce(
        (max, a) => (a.timestamp > max ? a.timestamp : max),
        lastTimestampRef.current || ""
      );
      if (maxTimestamp) {
        lastTimestampRef.current = maxTimestamp;
      }

      setActivities((prev) => {
        // Merge and sort by timestamp (newest first)
        const merged = [...unseen, ...prev]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, maxActivities);

        // Update seen IDs
        seenIdsRef.current = new Set(merged.map((a) => a.id));

        return merged;
      });

      // Notify for each new activity
      unseen.forEach((a) => onActivity?.(a));
    },
    [maxActivities, onActivity]
  );

  // Fetch activities from HTTP endpoint
  const fetchActivities = useCallback(
    async (since?: string): Promise<ActivityItem[]> => {
      try {
        const url = since
          ? `${API_URL}/admin/activity?limit=50&since=${encodeURIComponent(since)}`
          : `${API_URL}/admin/activity?limit=50`;

        const response = await fetch(url, {
          credentials: "include",
        });

        if (!response.ok) {
          console.error("[ActivityEvents] Failed to fetch activities:", response.status);
          return [];
        }

        const data = await response.json();
        return data.items || [];
      } catch (error) {
        console.error("[ActivityEvents] Error fetching activities:", error);
        return [];
      }
    },
    []
  );

  // Initial fetch
  const refetch = useCallback(async () => {
    const activities = await fetchActivities();
    addActivities(activities);
  }, [fetchActivities, addActivities]);

  // Poll for new activities
  const poll = useCallback(async () => {
    if (!lastTimestampRef.current) {
      // No timestamp yet, do a full fetch
      const activities = await fetchActivities();
      addActivities(activities);
    } else {
      // Fetch only new activities since last timestamp
      const activities = await fetchActivities(lastTimestampRef.current);
      addActivities(activities);
    }
  }, [fetchActivities, addActivities]);

  // Start/stop polling based on WebSocket connection
  useEffect(() => {
    if (isConnected) {
      // WebSocket connected, stop polling
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      setIsPolling(false);
    } else {
      // WebSocket disconnected, start polling
      setIsPolling(true);

      // Do an immediate poll
      poll();

      // Set up interval
      pollingIntervalRef.current = setInterval(poll, pollingInterval);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isConnected, poll, pollingInterval]);

  // Subscribe to WebSocket when connected
  useEffect(() => {
    if (!isConnected) return;

    const subscription = subscribe(ACTIVITY_TOPIC, (message) => {
      // Transform the audit log message to ActivityItem format
      const auditLog = message as {
        id?: number;
        entityType?: string;
        entityId?: string;
        action?: string;
        timestamp?: string;
        userId?: string;
        userName?: string;
        description?: string;
      };

      const entityType = auditLog.entityType || "";
      const action = auditLog.action || "";

      // Filter: only show allowed business events
      if (!isAllowedEvent(entityType, action)) {
        return;
      }

      // Generate human-readable message
      const message_text = formatMessage(
        entityType,
        action,
        auditLog.entityId || "",
        auditLog.userName || undefined
      );

      const activity: ActivityItem = {
        id: auditLog.id?.toString() || `ws-${Date.now()}`,
        type: `${entityType.toLowerCase()}_${action.toLowerCase()}`,
        message: message_text,
        entityType: entityType.toLowerCase() || null,
        entityId: auditLog.entityId || null,
        timestamp: auditLog.timestamp || new Date().toISOString(),
        userId: auditLog.userId || null,
        userName: auditLog.userName || null,
      };

      addActivity(activity);
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [isConnected, subscribe, addActivity]);

  // Initial load
  useEffect(() => {
    refetch();
  }, [refetch]);

  const clearActivities = useCallback(() => {
    setActivities([]);
    seenIdsRef.current.clear();
    lastTimestampRef.current = null;
  }, []);

  const connectionStatus: ConnectionStatus = isConnected
    ? "live"
    : isPolling
    ? "polling"
    : "disconnected";

  return {
    activities,
    isConnected,
    isPolling,
    connectionStatus,
    clearActivities,
    refetch,
  };
}

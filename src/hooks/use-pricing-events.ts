"use client";

import { useEffect, useCallback, useState } from "react";
import { useWebSocket } from "./use-websocket";

export interface PricingEvent {
  type: "PRICE_CHANGED" | "BULK_UPDATE" | "RULE_CREATED" | "RULE_UPDATED" | "RULE_DELETED";
  variantId?: string;
  productTitle?: string;
  previousPrice?: number;
  newPrice?: number;
  changedBy?: string;
  count?: number;
  ruleId?: string;
  ruleName?: string;
  timestamp: string;
}

export interface UsePricingEventsOptions {
  onPriceChange?: (event: PricingEvent) => void;
  onBulkUpdate?: (event: PricingEvent) => void;
  onRuleChange?: (event: PricingEvent) => void;
  onAnyEvent?: (event: PricingEvent) => void;
}

export interface UsePricingEventsReturn {
  isConnected: boolean;
  events: PricingEvent[];
  clearEvents: () => void;
}

const PRICING_TOPIC = "/topic/pricing";
const MAX_EVENTS = 50;

export function usePricingEvents(options: UsePricingEventsOptions = {}): UsePricingEventsReturn {
  const { onPriceChange, onBulkUpdate, onRuleChange, onAnyEvent } = options;

  const { isConnected, subscribe } = useWebSocket({ autoConnect: true });
  const [events, setEvents] = useState<PricingEvent[]>([]);

  const handleEvent = useCallback(
    (event: PricingEvent) => {
      // Add to events list
      setEvents((prev) => {
        const newEvents = [event, ...prev];
        return newEvents.slice(0, MAX_EVENTS);
      });

      // Call specific handlers
      onAnyEvent?.(event);

      switch (event.type) {
        case "PRICE_CHANGED":
          onPriceChange?.(event);
          break;
        case "BULK_UPDATE":
          onBulkUpdate?.(event);
          break;
        case "RULE_CREATED":
        case "RULE_UPDATED":
        case "RULE_DELETED":
          onRuleChange?.(event);
          break;
      }
    },
    [onPriceChange, onBulkUpdate, onRuleChange, onAnyEvent]
  );

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  // Subscribe to pricing events when connected
  useEffect(() => {
    if (!isConnected) return;

    const subscription = subscribe(PRICING_TOPIC, (message) => {
      handleEvent(message as PricingEvent);
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [isConnected, subscribe, handleEvent]);

  return {
    isConnected,
    events,
    clearEvents,
  };
}

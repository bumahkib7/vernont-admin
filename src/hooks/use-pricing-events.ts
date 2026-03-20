"use client";

import { useEffect, useCallback, useRef, useState } from "react";
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

  // Use refs for callbacks to keep the subscription effect stable
  const onPriceChangeRef = useRef(onPriceChange);
  const onBulkUpdateRef = useRef(onBulkUpdate);
  const onRuleChangeRef = useRef(onRuleChange);
  const onAnyEventRef = useRef(onAnyEvent);

  useEffect(() => { onPriceChangeRef.current = onPriceChange; }, [onPriceChange]);
  useEffect(() => { onBulkUpdateRef.current = onBulkUpdate; }, [onBulkUpdate]);
  useEffect(() => { onRuleChangeRef.current = onRuleChange; }, [onRuleChange]);
  useEffect(() => { onAnyEventRef.current = onAnyEvent; }, [onAnyEvent]);

  const handleEvent = useCallback((event: PricingEvent) => {
    setEvents((prev) => [event, ...prev].slice(0, MAX_EVENTS));

    onAnyEventRef.current?.(event);

    switch (event.type) {
      case "PRICE_CHANGED":
        onPriceChangeRef.current?.(event);
        break;
      case "BULK_UPDATE":
        onBulkUpdateRef.current?.(event);
        break;
      case "RULE_CREATED":
      case "RULE_UPDATED":
      case "RULE_DELETED":
        onRuleChangeRef.current?.(event);
        break;
    }
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  // Subscribe to pricing events when connected — stable deps now
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

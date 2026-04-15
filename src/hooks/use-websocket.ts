"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Client, IMessage, StompSubscription } from "@stomp/stompjs";

const DIRECT_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
// HTTP calls still go through the Next.js rewrite so cookies are same-origin
// (helps with Safari ITP on regular XHR/fetch).
const API_URL =
  typeof window !== "undefined" && process.env.NODE_ENV === "production"
    ? "/api/proxy"
    : DIRECT_API_URL;

// WebSocket connects directly to the backend using the native WebSocket API.
// We dropped SockJS: the Next.js rewrite can't proxy the HTTP Upgrade frame,
// which made SockJS fall back to 5+ HTTP transports (xhr_streaming,
// eventsource, htmlfile, jsonp, iframe.html) — each failing differently.
// The backend auth cookie is `SameSite=None; Secure` and admin.vernont.com
// is on the CORS allow-list, so it's sent on the cross-origin WS handshake.
const WS_ENDPOINT = (() => {
  const base = DIRECT_API_URL.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
  return `${base}/ws`;
})();

export interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnectDelay?: number;
  debug?: boolean;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  subscribe: (topic: string, callback: (message: unknown) => void) => StompSubscription | null;
  unsubscribe: (subscription: StompSubscription) => void;
}

interface PendingSubscription {
  topic: string;
  callback: (message: unknown) => void;
  resolve: (sub: StompSubscription | null) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  // Enable debug by default in development
  const isDev = process.env.NODE_ENV === "development";
  const { autoConnect = true, reconnectDelay = 5000, debug = isDev } = options;

  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<Map<string, StompSubscription>>(new Map());
  const pendingSubscriptionsRef = useRef<PendingSubscription[]>([]);

  const log = useCallback(
    (message: string, ...args: unknown[]) => {
      if (debug) {
        console.log(`[WebSocket] ${message}`, ...args);
      }
    },
    [debug]
  );

  // Process any pending subscriptions once connected
  const processPendingSubscriptions = useCallback(() => {
    const client = clientRef.current;
    if (!client?.connected) return;

    const pending = [...pendingSubscriptionsRef.current];
    pendingSubscriptionsRef.current = [];

    pending.forEach(({ topic, callback, resolve }) => {
      log(`Processing pending subscription to ${topic}`);
      try {
        const subscription = client.subscribe(topic, (message: IMessage) => {
          try {
            const parsed = JSON.parse(message.body);
            callback(parsed);
          } catch (e) {
            console.error("[WebSocket] Failed to parse message:", e);
            callback(message.body);
          }
        });
        subscriptionsRef.current.set(topic, subscription);
        resolve(subscription);
      } catch (e) {
        console.error("[WebSocket] Failed to process pending subscription:", e);
        resolve(null);
      }
    });
  }, [log]);

  const connect = useCallback(async () => {
    if (clientRef.current?.active) {
      log("Already connected or connecting");
      return;
    }

    // Cookie-based auth: the HTTP-only access_token cookie is sent on the
    // WebSocket handshake. It's `SameSite=None; Secure` so the browser sends
    // it even though the handshake is cross-origin (admin.vernont.com →
    // vernont-backend-*.runixcloud.dev). No token in the URL — URLs get
    // logged everywhere.
    const client = new Client({
      brokerURL: WS_ENDPOINT,
      reconnectDelay,
      debug: debug ? (msg) => console.log(`[STOMP] ${msg}`) : () => {},
      onConnect: () => {
        log("Connected to WebSocket");
        setIsConnected(true);
        // Process any subscriptions that were requested before connection was ready
        processPendingSubscriptions();
      },
      onDisconnect: () => {
        log("Disconnected from WebSocket");
        setIsConnected(false);
      },
      onStompError: (frame) => {
        console.error("[WebSocket] STOMP error:", frame.headers.message);
        setIsConnected(false);
      },
      onWebSocketError: (event) => {
        console.error("[WebSocket] WebSocket error:", event);
      },
    });

    clientRef.current = client;
    client.activate();
  }, [reconnectDelay, debug, log, processPendingSubscriptions]);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      // Clear pending subscriptions
      pendingSubscriptionsRef.current.forEach(({ resolve }) => resolve(null));
      pendingSubscriptionsRef.current = [];

      // Unsubscribe from all topics
      subscriptionsRef.current.forEach((sub) => {
        try {
          sub.unsubscribe();
        } catch (e) {
          // Ignore errors during cleanup
        }
      });
      subscriptionsRef.current.clear();

      clientRef.current.deactivate();
      clientRef.current = null;
      setIsConnected(false);
      log("Disconnected");
    }
  }, [log]);

  const subscribe = useCallback(
    (topic: string, callback: (message: unknown) => void): StompSubscription | null => {
      const client = clientRef.current;

      // Check if client is actually connected (not just active)
      if (!client?.connected) {
        log(`Client not connected yet, queueing subscription to ${topic}`);

        // Queue the subscription to be processed when connected
        // For now, return null and the caller should rely on the useEffect re-running
        // when isConnected changes
        let resolvedSub: StompSubscription | null = null;
        const pendingSub: PendingSubscription = {
          topic,
          callback,
          resolve: (sub) => {
            resolvedSub = sub;
          },
        };
        pendingSubscriptionsRef.current.push(pendingSub);

        // If we're already connected but the state hasn't updated yet, process immediately
        if (client?.connected) {
          processPendingSubscriptions();
          return resolvedSub;
        }

        return null;
      }

      log(`Subscribing to ${topic}`);

      try {
        const subscription = client.subscribe(topic, (message: IMessage) => {
          try {
            const parsed = JSON.parse(message.body);
            callback(parsed);
          } catch (e) {
            console.error("[WebSocket] Failed to parse message:", e);
            callback(message.body);
          }
        });

        subscriptionsRef.current.set(topic, subscription);
        return subscription;
      } catch (e) {
        console.error("[WebSocket] Failed to subscribe:", e);
        return null;
      }
    },
    [log, processPendingSubscriptions]
  );

  const unsubscribe = useCallback(
    (subscription: StompSubscription) => {
      try {
        subscription.unsubscribe();
        // Remove from map
        subscriptionsRef.current.forEach((sub, key) => {
          if (sub === subscription) {
            subscriptionsRef.current.delete(key);
          }
        });
        log("Unsubscribed");
      } catch (e) {
        console.error("[WebSocket] Error unsubscribing:", e);
      }
    },
    [log]
  );

  // Store connect/disconnect in refs to avoid effect re-triggering on callback identity changes
  const connectRef = useRef(connect);
  const disconnectRef = useRef(disconnect);
  useEffect(() => { connectRef.current = connect; }, [connect]);
  useEffect(() => { disconnectRef.current = disconnect; }, [disconnect]);

  // Auto-connect on mount — stable effect that only runs once
  useEffect(() => {
    if (autoConnect) {
      connectRef.current();
    }

    return () => {
      disconnectRef.current();
    };
  }, [autoConnect]);

  return {
    isConnected,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
  };
}

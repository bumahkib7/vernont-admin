"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const WS_ENDPOINT = `${API_URL}/ws`;

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
  const { autoConnect = true, reconnectDelay = 5000, debug = false } = options;

  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<Map<string, StompSubscription>>(new Map());
  const wsTokenRef = useRef<string | null>(null);
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

  // Fetch a WebSocket token from the backend (authenticated via HTTP-only cookie)
  const fetchWsToken = useCallback(async (): Promise<string | null> => {
    try {
      const response = await fetch(`${API_URL}/api/v1/internal/auth/ws-token`, {
        method: "POST",
        credentials: "include", // Send HTTP-only cookies
      });
      if (response.ok) {
        const data = await response.json();
        return data.token || null;
      }
      log("Failed to fetch WS token:", response.status);
      return null;
    } catch (error) {
      log("Error fetching WS token:", error);
      return null;
    }
  }, [log]);

  const connect = useCallback(async () => {
    if (clientRef.current?.active) {
      log("Already connected or connecting");
      return;
    }

    // Get WS token for authentication
    const token = await fetchWsToken();
    if (!token) {
      log("No WS token available, cannot connect");
      return;
    }
    wsTokenRef.current = token;

    const wsUrl = `${WS_ENDPOINT}?token=${token}`;

    const client = new Client({
      webSocketFactory: () => {
        return new SockJS(wsUrl, null, {
          timeout: 5000,
        }) as unknown as WebSocket;
      },
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
  }, [reconnectDelay, debug, log, fetchWsToken, processPendingSubscriptions]);

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

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
  };
}

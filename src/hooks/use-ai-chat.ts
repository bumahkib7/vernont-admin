"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { aiChat, aiClearSession, aiDescribeProduct } from "@/lib/api";

export interface ToolActivity {
  toolName: string;
  toolId: string;
  status: "executing" | "complete" | "error";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  toolActivity?: ToolActivity[];
}

export interface UseAiChatReturn {
  messages: ChatMessage[];
  loading: boolean;
  activeTools: ToolActivity[];
  sessionId: string;
  sendMessage: (text: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  generateDescription: (productId: string) => Promise<string | null>;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const TOOL_LABELS: Record<string, string> = {
  search_orders: "Searching orders",
  get_order: "Looking up order",
  cancel_order: "Cancelling order",
  update_order_status: "Updating order status",
  search_customers: "Searching customers",
  get_customer_profile: "Loading customer profile",
  get_daily_summary: "Getting daily summary",
  get_revenue_report: "Generating revenue report",
  get_analytics: "Analyzing data",
  get_low_stock_report: "Checking inventory",
  update_stock: "Adjusting stock",
  search_products: "Searching products",
  update_product: "Updating product",
  list_returns: "Loading returns",
  get_return: "Loading return details",
  receive_return: "Processing return receipt",
  process_return_refund: "Processing refund",
  reject_return: "Rejecting return",
};

export function getToolLabel(toolName: string): string {
  return TOOL_LABELS[toolName] || `Running ${toolName}`;
}

/**
 * Parse a line of NDJSON into a typed object.
 * Strips optional SSE "data:" prefix for backwards compatibility.
 */
function parseLine(line: string): Record<string, unknown> | null {
  let s = line.trim();
  if (!s || s === "[DONE]") return null;
  // Strip SSE prefix if present (backwards compat)
  if (s.startsWith("data:")) s = s.slice(5).trim();
  if (s.startsWith("event:")) return null;
  if (!s) return null;
  try {
    const parsed = JSON.parse(s);
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

export function useAiChat(): UseAiChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTools, setActiveTools] = useState<ToolActivity[]>([]);
  const sessionIdRef = useRef<string>(generateId());
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setActiveTools([]);

    const assistantMsgId = generateId();
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMsgId,
        role: "assistant" as const,
        content: "",
        timestamp: new Date(),
        toolActivity: [],
      },
    ]);

    try {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const response = await aiChat(sessionIdRef.current, trimmed);
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let accumulated = "";
      let buffer = "";
      const toolActivities: ToolActivity[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (controller.signal.aborted) {
          reader.cancel();
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // NDJSON: split on newlines, keep last partial line in buffer
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const parsed = parseLine(line);
          if (!parsed) continue;

          switch (parsed.type) {
            case "message": {
              if (typeof parsed.content === "string") {
                accumulated += parsed.content;
                updateMessage(assistantMsgId, accumulated, toolActivities);
              }
              break;
            }
            case "tool_call": {
              const activity: ToolActivity = {
                toolName: parsed.tool as string,
                toolId: parsed.tool_id as string,
                status: "executing",
              };
              toolActivities.push(activity);
              setActiveTools([
                ...toolActivities.filter((t) => t.status === "executing"),
              ]);
              updateMessage(assistantMsgId, accumulated, toolActivities);
              break;
            }
            case "tool_result": {
              const idx = toolActivities.findIndex(
                (t) => t.toolId === (parsed.tool_id as string)
              );
              if (idx >= 0) {
                toolActivities[idx] = {
                  ...toolActivities[idx],
                  status:
                    parsed.status === "complete" ? "complete" : "error",
                };
              }
              setActiveTools([
                ...toolActivities.filter((t) => t.status === "executing"),
              ]);
              updateMessage(assistantMsgId, accumulated, toolActivities);
              break;
            }
            case "done":
              setActiveTools([]);
              break;
            case "error": {
              const errMsg =
                typeof parsed.error === "string"
                  ? parsed.error
                  : "Unknown error";
              accumulated = `Error: ${errMsg}`;
              updateMessage(assistantMsgId, accumulated, toolActivities);
              break;
            }
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        const parsed = parseLine(buffer);
        if (parsed?.type === "message" && typeof parsed.content === "string") {
          accumulated += parsed.content;
          updateMessage(assistantMsgId, accumulated, toolActivities);
        }
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      const errorContent =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: `Error: ${errorContent}` }
            : m
        )
      );
    } finally {
      setLoading(false);
      setActiveTools([]);
    }

    function updateMessage(
      msgId: string,
      content: string,
      tools: ToolActivity[]
    ) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? { ...m, content, toolActivity: [...tools] }
            : m
        )
      );
    }
  }, []);

  const clearHistory = useCallback(async () => {
    try {
      await aiClearSession(sessionIdRef.current);
    } catch {
      // Ignore errors on clear — session may already be expired
    }
    setMessages([]);
    setActiveTools([]);
    sessionIdRef.current = generateId();
  }, []);

  const generateDescription = useCallback(
    async (productId: string): Promise<string | null> => {
      try {
        setLoading(true);
        const result = await aiDescribeProduct(productId);
        return result.description;
      } catch (error) {
        console.error("[AI] Failed to generate description:", error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    messages,
    loading,
    activeTools,
    sessionId: sessionIdRef.current,
    sendMessage,
    clearHistory,
    generateDescription,
  };
}

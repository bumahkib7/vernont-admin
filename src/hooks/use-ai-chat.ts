"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { aiChat, aiClearSession, aiDescribeProduct } from "@/lib/api";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface UseAiChatReturn {
  messages: ChatMessage[];
  loading: boolean;
  sessionId: string;
  sendMessage: (text: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  generateDescription: (productId: string) => Promise<string | null>;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useAiChat(): UseAiChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const sessionIdRef = useRef<string>(generateId());
  const abortControllerRef = useRef<AbortController | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: generateId(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    // Prepare assistant message placeholder
    const assistantMsgId = generateId();
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const response = await aiChat(sessionIdRef.current, trimmed);
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let accumulated = "";
      let buffer = ""; // Buffer for incomplete SSE lines across chunks

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (controller.signal.aborted) {
          reader.cancel();
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // Process complete lines from buffer
        const parts = buffer.split(/\r?\n/);
        // Keep the last part as it may be incomplete
        buffer = parts.pop() || "";

        for (const line of parts) {
          if (!line.startsWith("data:")) continue;
          const raw = line.slice(5).trimStart();
          if (!raw || raw === "[DONE]") continue;

          try {
            const parsed = JSON.parse(raw);
            // Backend sends {"content": "chunk text"}
            if (parsed && typeof parsed.content === "string") {
              accumulated += parsed.content;
            } else if (typeof parsed === "string") {
              accumulated += parsed;
            }
          } catch {
            // Plain text fallback
            accumulated += raw;
          }

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, content: accumulated } : m
            )
          );
        }
      }

      // Process any remaining buffer
      if (buffer.startsWith("data:")) {
        const raw = buffer.slice(5).trimStart();
        if (raw && raw !== "[DONE]") {
          try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed.content === "string") {
              accumulated += parsed.content;
            } else if (typeof parsed === "string") {
              accumulated += parsed;
            }
          } catch {
            accumulated += raw;
          }
        }
      }

      // Ensure final state is set
      if (accumulated) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, content: accumulated } : m
          )
        );
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      const errorContent =
        error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: `Error: ${errorContent}` }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const clearHistory = useCallback(async () => {
    try {
      await aiClearSession(sessionIdRef.current);
    } catch {
      // Ignore errors on clear — session may already be expired
    }
    setMessages([]);
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
    sessionId: sessionIdRef.current,
    sendMessage,
    clearHistory,
    generateDescription,
  };
}

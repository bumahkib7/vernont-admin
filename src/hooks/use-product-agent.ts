"use client";

import { useState, useRef, useCallback } from "react";
import {
  aiProductAgent,
  type ProductAgentRequest,
  type ProductContentResult,
} from "@/lib/api/ai";

export type ProductAgentStatus = "idle" | "running" | "done" | "error";

export interface ProductAgentStep {
  tool: string;
  label: string;
  status: "executing" | "complete" | "error";
}

const STEP_LABELS: Record<string, string> = {
  analyze_product_image: "Analyzing product images with AI vision",
  search_product_online: "Researching product online",
  generate_product_content: "Generating product content",
};

/**
 * Parse a line of NDJSON into a typed object.
 * Strips optional SSE "data:" prefix for backwards compatibility.
 */
function parseLine(line: string): Record<string, unknown> | null {
  let s = line.trim();
  if (!s || s === "[DONE]") return null;
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

export function useProductAgent() {
  const [status, setStatus] = useState<ProductAgentStatus>("idle");
  const [steps, setSteps] = useState<ProductAgentStep[]>([]);
  const [result, setResult] = useState<ProductContentResult | null>(null);
  const [textBuffer, setTextBuffer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setSteps([]);
    setResult(null);
    setTextBuffer("");
    setError(null);
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setStatus("idle");
  }, []);

  const start = useCallback(async (request: ProductAgentRequest) => {
    // Reset state
    setStatus("running");
    setSteps([]);
    setResult(null);
    setTextBuffer("");
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await aiProductAgent(request);

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulatedText = "";

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
            case "tool_call":
              setSteps((prev) => [
                ...prev,
                {
                  tool: parsed.tool as string,
                  label:
                    STEP_LABELS[parsed.tool as string] ||
                    (parsed.tool as string),
                  status: "executing",
                },
              ]);
              break;

            case "tool_result":
              setSteps((prev) =>
                prev.map((s) =>
                  s.tool === (parsed.tool as string) &&
                  s.status === "executing"
                    ? {
                        ...s,
                        status:
                          parsed.status === "error"
                            ? ("error" as const)
                            : ("complete" as const),
                      }
                    : s
                )
              );
              break;

            case "message":
              if (typeof parsed.content === "string") {
                accumulatedText += parsed.content;
                setTextBuffer(accumulatedText);
              }
              break;

            case "product_content":
              if (parsed.content) {
                setResult(parsed.content as ProductContentResult);
              }
              break;

            case "done":
              setStatus("done");
              break;

            case "error": {
              const errMsg =
                typeof parsed.error === "string"
                  ? parsed.error
                  : "An error occurred";
              setError(errMsg);
              setStatus("error");
              break;
            }
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        const parsed = parseLine(buffer);
        if (parsed?.type === "message" && typeof parsed.content === "string") {
          accumulatedText += parsed.content;
          setTextBuffer(accumulatedText);
        } else if (parsed?.type === "product_content" && parsed.content) {
          setResult(parsed.content as ProductContentResult);
        }
      }

      // If stream ended without explicit "done" event, mark as done
      setStatus((prev) => (prev === "running" ? "done" : prev));

      // Fallback: try to extract product content JSON from text buffer
      // if the server didn't emit a separate product_content event
      setResult((prev) => {
        if (prev) return prev;
        try {
          const jsonMatch = accumulatedText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const extracted = JSON.parse(jsonMatch[0]);
            if (
              extracted.description ||
              extracted.tags ||
              extracted.metaTitle
            ) {
              return extracted as ProductContentResult;
            }
          }
        } catch {
          // Not valid JSON, that's fine
        }
        return null;
      });
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(
        err instanceof Error
          ? err.message
          : "Failed to connect to AI agent"
      );
      setStatus("error");
    }
  }, []);

  return {
    status,
    steps,
    result,
    textBuffer,
    error,
    start,
    cancel,
    reset,
  };
}

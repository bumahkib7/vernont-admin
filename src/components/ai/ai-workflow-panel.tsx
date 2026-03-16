"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  Loader2,
  Bot,
  User,
  Package,
  Tag,
  Truck,
  X,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  startAiWorkflow,
  continueAiWorkflow,
  cancelAiWorkflow,
  type AiWorkflowState,
} from "@/lib/api";

interface WorkflowMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface WorkflowDef {
  type: string;
  label: string;
  description: string;
  icon: typeof Package;
}

const WORKFLOWS: WorkflowDef[] = [
  {
    type: "create_product",
    label: "Create Product",
    description: "Step-by-step product creation",
    icon: Package,
  },
  {
    type: "create_discount",
    label: "Create Discount",
    description: "Set up a new discount rule",
    icon: Tag,
  },
  {
    type: "setup_shipping",
    label: "Setup Shipping",
    description: "Configure shipping options",
    icon: Truck,
  },
];

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface AiWorkflowPanelProps {
  /** Externally-provided session ID (shared with chat) */
  sessionId: string;
}

export function AiWorkflowPanel({ sessionId }: AiWorkflowPanelProps) {
  const [messages, setMessages] = useState<WorkflowMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [workflowState, setWorkflowState] = useState<AiWorkflowState | null>(
    null
  );
  const [activeWorkflow, setActiveWorkflow] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const readStream = useCallback(
    async (response: Response, assistantMsgId: string) => {
      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let accumulated = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // NDJSON: split on newlines, keep last partial line in buffer
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          let s = line.trim();
          if (!s) continue;
          // Strip SSE prefix if present (backwards compat)
          if (s.startsWith("data:")) s = s.slice(5).trim();
          if (s.startsWith("event:") || s === "[DONE]") continue;
          if (!s) continue;

          try {
            const parsed = JSON.parse(s);
            if (parsed.type === "message" && typeof parsed.content === "string") {
              accumulated += parsed.content;
            } else if (parsed.type === "done") {
              // Handle workflow state if included
              if (parsed.workflowState) {
                setWorkflowState(parsed.workflowState);
              }
            } else if (parsed.type === "error") {
              accumulated = `Error: ${parsed.error || "Unknown error"}`;
            } else if (parsed.workflowState) {
              setWorkflowState(parsed.workflowState);
            } else if (typeof parsed.content === "string") {
              accumulated += parsed.content;
            }
          } catch {
            // Skip unparseable lines
          }
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, content: accumulated } : m
            )
          );
        }
      }

      // Process remaining buffer
      if (buffer.trim()) {
        try {
          let s = buffer.trim();
          if (s.startsWith("data:")) s = s.slice(5).trim();
          const parsed = JSON.parse(s);
          if (parsed.type === "message" && typeof parsed.content === "string") {
            accumulated += parsed.content;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, content: accumulated } : m
              )
            );
          }
        } catch {
          // ignore
        }
      }
    },
    []
  );

  const handleStartWorkflow = async (workflow: WorkflowDef) => {
    setActiveWorkflow(workflow.type);
    setMessages([]);
    setLoading(true);

    const assistantMsgId = generateId();
    setMessages([
      {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      },
    ]);

    try {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      const response = await startAiWorkflow(sessionId, workflow.type);
      await readStream(response, assistantMsgId);
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content: `Error: ${error instanceof Error ? error.message : "Something went wrong."}`,
              }
            : m
        )
      );
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading || !activeWorkflow) return;
    setInput("");

    const userMsg: WorkflowMessage = {
      id: generateId(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    const assistantMsgId = generateId();
    setMessages((prev) => [
      ...prev,
      { id: assistantMsgId, role: "assistant", content: "", timestamp: new Date() },
    ]);

    try {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      const response = await continueAiWorkflow(sessionId, text);
      await readStream(response, assistantMsgId);
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content: `Error: ${error instanceof Error ? error.message : "Something went wrong."}`,
              }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    abortRef.current?.abort();
    try {
      await cancelAiWorkflow(sessionId);
    } catch {
      // Ignore — session may already be cleared
    }
    setActiveWorkflow(null);
    setMessages([]);
    setWorkflowState(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Workflow picker (no active workflow)
  if (!activeWorkflow) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <p className="text-sm text-muted-foreground">
          Choose a guided workflow to get started:
        </p>
        {WORKFLOWS.map((wf) => (
          <button
            key={wf.type}
            onClick={() => handleStartWorkflow(wf)}
            className="flex items-center gap-3 rounded-lg border p-3 text-left hover:bg-muted/50 transition-colors"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
              <wf.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium">{wf.label}</span>
              <p className="text-xs text-muted-foreground">{wf.description}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    );
  }

  const progressPercent =
    workflowState && workflowState.totalSteps > 0
      ? Math.round(
          (workflowState.currentStep / workflowState.totalSteps) * 100
        )
      : 0;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Workflow progress header */}
      <div className="border-b px-4 py-2 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            {workflowState?.completed ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <Badge variant="outline" className="font-normal text-xs">
                Step {workflowState?.currentStep || 1} of{" "}
                {workflowState?.totalSteps || "..."}
              </Badge>
            )}
            <span className="text-muted-foreground">
              {workflowState?.stepLabel || "Starting..."}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="h-7 px-2"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Cancel
          </Button>
        </div>
        {!workflowState?.completed && (
          <Progress value={progressPercent} className="h-1" />
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0">
        <div ref={scrollRef} className="flex flex-col gap-3 p-4">
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-2.5 max-w-[85%]",
                  isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                    isUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {isUser ? (
                    <User className="h-3.5 w-3.5" />
                  ) : (
                    <Bot className="h-3.5 w-3.5" />
                  )}
                </div>
                <div
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm leading-relaxed",
                    isUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                </div>
              </div>
            );
          })}
          {loading && messages[messages.length - 1]?.content === "" && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Thinking...
            </div>
          )}
          {workflowState?.completed && workflowState.resultUrl && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 text-green-800 text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Workflow complete!</span>
              <Link
                href={workflowState.resultUrl}
                className="underline font-medium ml-auto"
              >
                View result
              </Link>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      {!workflowState?.completed && (
        <div className="border-t p-3">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer..."
              disabled={loading}
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

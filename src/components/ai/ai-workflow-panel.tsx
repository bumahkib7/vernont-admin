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
  Sparkles,
  Paperclip,
} from "lucide-react";
import { uploadProductImage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { AgentMessageRenderer } from "@/components/ai/ai-message-renderer";
import { AgentThinkingIndicator } from "@/components/ai/ai-thinking-indicator";
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
  color: string;
  bg: string;
}

const WORKFLOWS: WorkflowDef[] = [
  {
    type: "create_product",
    label: "Create Product",
    description: "AI guides you step-by-step through product creation",
    icon: Package,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10 hover:bg-indigo-500/15 border-indigo-500/20",
  },
  {
    type: "create_discount",
    label: "Create Discount",
    description: "Set up discount rules with AI assistance",
    icon: Tag,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/20",
  },
  {
    type: "setup_shipping",
    label: "Setup Shipping",
    description: "Configure shipping options interactively",
    icon: Truck,
    color: "text-blue-500",
    bg: "bg-blue-500/10 hover:bg-blue-500/15 border-blue-500/20",
  },
];

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface AiWorkflowPanelProps {
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
  const [attachedImages, setAttachedImages] = useState<{ file: File; preview: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

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

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          let s = line.trim();
          if (!s) continue;
          if (s.startsWith("data:")) s = s.slice(5).trim();
          if (s.startsWith("event:") || s === "[DONE]") continue;
          if (!s) continue;

          try {
            const parsed = JSON.parse(s);
            if (
              parsed.type === "message" &&
              typeof parsed.content === "string"
            ) {
              accumulated += parsed.content;
            } else if (parsed.type === "done") {
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
            // skip
          }
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, content: accumulated } : m
            )
          );
        }
      }

      if (buffer.trim()) {
        try {
          let s = buffer.trim();
          if (s.startsWith("data:")) s = s.slice(5).trim();
          const parsed = JSON.parse(s);
          if (
            parsed.type === "message" &&
            typeof parsed.content === "string"
          ) {
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newImages = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 4 - attachedImages.length)
      .map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setAttachedImages((prev) => [...prev, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setAttachedImages((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[index].preview);
      next.splice(index, 1);
      return next;
    });
  };

  const handleSend = async () => {
    const text = input.trim();
    if ((!text && attachedImages.length === 0) || loading || !activeWorkflow) return;
    setInput("");

    let finalText = text;
    // Upload images if attached
    if (attachedImages.length > 0) {
      setUploading(true);
      try {
        const urls: string[] = [];
        for (const img of attachedImages) {
          const result = await uploadProductImage(img.file);
          urls.push(result.url);
          URL.revokeObjectURL(img.preview);
        }
        setAttachedImages([]);
        const imageNote = urls.map((url) => `[Attached image: ${url}]`).join("\n");
        finalText = text ? `${text}\n\n${imageNote}` : imageNote;
      } catch (err) {
        console.error("[workflow] Image upload failed:", err);
        if (!text) { setUploading(false); return; }
      } finally {
        setUploading(false);
      }
    }

    const userMsg: WorkflowMessage = {
      id: generateId(),
      role: "user",
      content: finalText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    const assistantMsgId = generateId();
    setMessages((prev) => [
      ...prev,
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
      const response = await continueAiWorkflow(sessionId, finalText);
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
      // Ignore
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

  // Workflow picker
  if (!activeWorkflow) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-col items-center pt-4 pb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/10 mb-3">
            <Sparkles className="h-5 w-5 text-violet-500" />
          </div>
          <p className="text-xs text-muted-foreground text-center max-w-[260px]">
            AI-guided workflows walk you through complex tasks step by step.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {WORKFLOWS.map((wf) => (
            <button
              key={wf.type}
              onClick={() => handleStartWorkflow(wf)}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3.5 text-left transition-all duration-200 hover:shadow-sm",
                wf.bg
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  wf.bg.split(" ")[0]
                )}
              >
                <wf.icon className={cn("h-4 w-4", wf.color)} />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium">{wf.label}</span>
                <p className="text-xs text-muted-foreground">
                  {wf.description}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
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
      {/* Progress header */}
      <div className="border-b px-4 py-2.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            {workflowState?.completed ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <Badge
                variant="outline"
                className="font-mono text-[10px] px-1.5"
              >
                {workflowState?.currentStep || 1}/
                {workflowState?.totalSteps || "?"}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {workflowState?.stepLabel || "Starting..."}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="h-7 px-2 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
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
                  "flex gap-2.5 agent-message-enter",
                  isUser
                    ? "ml-auto flex-row-reverse max-w-[85%]"
                    : "mr-auto max-w-[95%]"
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg mt-0.5",
                    isUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-gradient-to-br from-violet-500/20 to-blue-500/20"
                  )}
                >
                  {isUser ? (
                    <User className="h-3.5 w-3.5" />
                  ) : (
                    <Bot className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                  )}
                </div>
                <div
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-sm",
                    isUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50"
                  )}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                  ) : (
                    <AgentMessageRenderer content={msg.content} />
                  )}
                </div>
              </div>
            );
          })}
          {loading && messages[messages.length - 1]?.content === "" && (
            <AgentThinkingIndicator />
          )}
          {workflowState?.completed && workflowState.resultUrl && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm agent-message-enter">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
              <span className="text-green-700 dark:text-green-300">
                Workflow complete!
              </span>
              <Link
                href={workflowState.resultUrl}
                className="underline font-medium ml-auto text-green-700 dark:text-green-300"
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
          {/* Attached image previews */}
          {attachedImages.length > 0 && (
            <div className="flex gap-2 mb-2 flex-wrap">
              {attachedImages.map((img, i) => (
                <div key={i} className="relative group">
                  <img
                    src={img.preview}
                    alt={`Attached ${i + 1}`}
                    className="h-14 w-14 rounded-lg object-cover border"
                  />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageSelect}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || uploading || attachedImages.length >= 4}
              title="Attach images"
              className="h-9 w-9 rounded-lg shrink-0"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer..."
              disabled={loading || uploading}
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={(!input.trim() && attachedImages.length === 0) || loading || uploading}
              className="h-9 w-9 rounded-lg shrink-0"
            >
              {loading || uploading ? (
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

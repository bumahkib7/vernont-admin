"use client";

import { useRef, useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAiChat,
  type ChatMessage,
} from "@/hooks/use-ai-chat";
import { AiWorkflowPanel } from "@/components/ai/ai-workflow-panel";
import { ToolExecutionGroup } from "@/components/ai/ai-tool-execution";
import { AgentThinkingIndicator } from "@/components/ai/ai-thinking-indicator";
import { AgentMessageRenderer } from "@/components/ai/ai-message-renderer";
import { AiConfirmationCard } from "@/components/ai/ai-confirmation-card";
import { useAgentActionsStore } from "@/stores/agent-actions";
import {
  Send,
  Trash2,
  Loader2,
  Bot,
  User,
  TrendingUp,
  ShoppingCart,
  Package,
  RotateCcw,
  Users,
  BarChart3,
  MessageSquare,
  Workflow,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AiChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SUGGESTIONS = [
  {
    label: "Sales summary",
    prompt: "Give me a sales summary for this week",
    icon: TrendingUp,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10 hover:bg-emerald-500/15",
  },
  {
    label: "Recent orders",
    prompt: "What are the most recent orders?",
    icon: ShoppingCart,
    color: "text-blue-500",
    bg: "bg-blue-500/10 hover:bg-blue-500/15",
  },
  {
    label: "Top products",
    prompt: "What are the top selling products?",
    icon: Package,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10 hover:bg-indigo-500/15",
  },
  {
    label: "Low stock",
    prompt: "Show me items that are low on stock",
    icon: BarChart3,
    color: "text-orange-500",
    bg: "bg-orange-500/10 hover:bg-orange-500/15",
  },
  {
    label: "Pending returns",
    prompt: "Are there any pending returns I need to handle?",
    icon: RotateCcw,
    color: "text-pink-500",
    bg: "bg-pink-500/10 hover:bg-pink-500/15",
  },
  {
    label: "Customer insights",
    prompt: "Tell me about my top customers",
    icon: Users,
    color: "text-violet-500",
    bg: "bg-violet-500/10 hover:bg-violet-500/15",
  },
];

function AgentStatusDot({ active }: { active: boolean }) {
  return (
    <span className="relative flex h-2 w-2">
      {active && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
      )}
      <span
        className={cn(
          "relative inline-flex h-2 w-2 rounded-full",
          active ? "bg-emerald-500" : "bg-muted-foreground/40"
        )}
      />
    </span>
  );
}

function EmptyState({ onSuggestion }: { onSuggestion: (prompt: string) => void }) {
  return (
    <div className="flex flex-col items-center px-4 pt-8 pb-4">
      {/* Agent avatar */}
      <div className="relative mb-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/10">
          <Sparkles className="h-6 w-6 text-violet-500" />
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-background">
          <span className="text-[8px] text-white font-bold">AI</span>
        </div>
      </div>

      <h3 className="text-sm font-semibold mb-1">Vernont AI Agent</h3>
      <p className="text-xs text-muted-foreground text-center mb-6 max-w-[260px]">
        I can search orders, manage inventory, process returns, analyze sales, and more.
        What would you like to do?
      </p>

      {/* Suggestion grid */}
      <div className="grid grid-cols-2 gap-2 w-full">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.label}
            onClick={() => onSuggestion(s.prompt)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left transition-all duration-200 hover:shadow-sm",
              s.bg
            )}
          >
            <s.icon className={cn("h-3.5 w-3.5 shrink-0", s.color)} />
            <span className="text-xs font-medium">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function AgentMessage({ message }: { message: ChatMessage }) {
  const hasTools =
    message.toolActivity && message.toolActivity.length > 0;

  return (
    <div className="flex gap-2.5 mr-auto max-w-[95%] agent-message-enter">
      {/* Agent icon */}
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 mt-0.5">
        <Bot className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
      </div>
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        {/* Tool execution cards */}
        {hasTools && (
          <ToolExecutionGroup activities={message.toolActivity!} />
        )}
        {/* Message content */}
        {message.content && (
          <div className="rounded-lg bg-muted/50 px-3 py-2.5">
            <AgentMessageRenderer content={message.content} />
          </div>
        )}
      </div>
    </div>
  );
}

function UserMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="flex gap-2.5 ml-auto max-w-[85%] flex-row-reverse agent-message-enter">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground mt-0.5">
        <User className="h-3.5 w-3.5" />
      </div>
      <div className="rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm">
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
      </div>
    </div>
  );
}

export function AiChatPanel({ open, onOpenChange }: AiChatPanelProps) {
  const {
    messages,
    loading,
    activeTools,
    sessionId,
    sendMessage,
    clearHistory,
  } = useAiChat();
  const pendingConfirmation = useAgentActionsStore((s) => s.pendingConfirmation);
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState("chat");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeTools]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isAgentBusy = loading && activeTools.length > 0;
  const isAgentThinking =
    loading &&
    activeTools.length === 0 &&
    messages.length > 0 &&
    messages[messages.length - 1]?.content === "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col p-0 sm:max-w-[420px] w-full"
      >
        {/* Header */}
        <SheetHeader className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20">
                  <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
              </div>
              <div>
                <SheetTitle className="text-sm flex items-center gap-2">
                  AI Agent
                  <AgentStatusDot active={loading} />
                  {loading && (
                    <span className="text-[10px] font-normal text-muted-foreground agent-shimmer-text">
                      {isAgentBusy ? "Executing" : "Thinking"}
                    </span>
                  )}
                </SheetTitle>
                <SheetDescription className="text-[11px]">
                  Powered by Claude
                </SheetDescription>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {activeTab === "chat" && messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearHistory}
                  disabled={loading}
                  title="Clear history"
                  className="h-7 w-7"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        {/* Tab bar */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="px-4 pt-2">
            <TabsList className="w-full h-9">
              <TabsTrigger value="chat" className="text-xs gap-1.5">
                <MessageSquare className="h-3 w-3" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="workflows" className="text-xs gap-1.5">
                <Workflow className="h-3 w-3" />
                Workflows
              </TabsTrigger>
            </TabsList>
          </div>

          {activeTab === "chat" ? (
            <>
              {/* Message area */}
              <ScrollArea className="flex-1 min-h-0">
                <div ref={scrollRef} className="flex flex-col gap-4 p-4">
                  {messages.length === 0 ? (
                    <EmptyState onSuggestion={(p) => !loading && sendMessage(p)} />
                  ) : (
                    <>
                      {messages.map((msg) =>
                        msg.role === "user" ? (
                          <UserMessage key={msg.id} message={msg} />
                        ) : (
                          <AgentMessage key={msg.id} message={msg} />
                        )
                      )}

                      {/* Live thinking indicator */}
                      {isAgentThinking && <AgentThinkingIndicator />}

                      {/* Live tool execution (not yet attached to a message) */}
                      {isAgentBusy && (
                        <div className="flex gap-2.5 mr-auto max-w-[95%]">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 mt-0.5">
                            <Bot className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                          </div>
                          <ToolExecutionGroup activities={activeTools} />
                        </div>
                      )}

                      {/* Confirmation card */}
                      {pendingConfirmation && (
                        <AiConfirmationCard onConfirm={(msg) => sendMessage(msg)} />
                      )}
                    </>
                  )}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="border-t p-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask the agent anything..."
                      disabled={loading}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 pr-8"
                    />
                  </div>
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    className="h-9 w-9 rounded-lg shrink-0"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-1.5 px-1">
                  <span className="text-[10px] text-muted-foreground/60">
                    Press Enter to send
                  </span>
                </div>
              </div>
            </>
          ) : (
            <AiWorkflowPanel sessionId={sessionId} />
          )}
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

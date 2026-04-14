"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sparkles,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Lightbulb,
  ListChecks,
  Scissors,
  ShoppingBag,
  SpellCheck,
} from "lucide-react";
import type { BlogBlock, BlogPostType } from "@/lib/api/blog";

// ============================================================================
// Types
// ============================================================================

interface CopilotMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  summary?: string;
  timestamp: Date;
}

interface AiCopilotPanelProps {
  postId: string;
  blocks: BlogBlock[];
  title: string;
  postType: BlogPostType;
  category: string;
  onBlocksUpdate: (blocks: BlogBlock[]) => void;
  isPending: boolean;
  onSubmit: (prompt: string) => void;
}

// ============================================================================
// Quick Actions
// ============================================================================

const QUICK_ACTIONS = [
  { label: "Improve intro", icon: Lightbulb, prompt: "Rewrite the introduction to be more compelling and engaging" },
  { label: "Add FAQs", icon: ListChecks, prompt: "Add 3 frequently asked questions relevant to this article's topic" },
  { label: "Make concise", icon: Scissors, prompt: "Make the content more concise — tighten prose, remove filler, keep key points" },
  { label: "Add products", icon: ShoppingBag, prompt: "Add product mention blocks where relevant eyewear products could be featured" },
  { label: "Fix grammar", icon: SpellCheck, prompt: "Fix any grammar, spelling, or punctuation errors throughout the post" },
];

// ============================================================================
// Component
// ============================================================================

export function AiCopilotPanel({
  postId,
  blocks,
  title,
  postType,
  category,
  onBlocksUpdate,
  isPending,
  onSubmit,
}: AiCopilotPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = useCallback(
    (prompt: string) => {
      if (!prompt.trim() || isPending) return;

      const userMessage: CopilotMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: prompt.trim(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      onSubmit(prompt.trim());
    },
    [isPending, onSubmit]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(input);
      }
    },
    [input, handleSubmit]
  );

  // Called by parent when AI response arrives
  const addAssistantMessage = useCallback((message: string, summary: string) => {
    const assistantMessage: CopilotMessage = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: message,
      summary,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, assistantMessage]);
  }, []);

  // Expose addAssistantMessage via ref-like pattern using a callback prop pattern
  // We use an effect to attach a method to the component instance
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__blogCopilotAddMessage = addAssistantMessage;
    return () => {
      delete (window as unknown as Record<string, unknown>).__blogCopilotAddMessage;
    };
  }, [addAssistantMessage]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border rounded-lg bg-card overflow-hidden">
        {/* Header / Trigger */}
        <CollapsibleTrigger asChild>
          <button className="flex items-center justify-between w-full px-4 py-2.5 hover:bg-muted/50 transition-colors text-left">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-500" />
              <span className="text-sm font-medium">AI Copilot</span>
              {messages.length > 0 && (
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                  {messages.length}
                </span>
              )}
            </div>
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t">
            {/* Quick Actions */}
            <div className="px-3 py-2 border-b bg-muted/20">
              <div className="flex flex-wrap gap-1.5">
                {QUICK_ACTIONS.map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1 bg-background"
                    disabled={isPending}
                    onClick={() => handleSubmit(action.prompt)}
                  >
                    <action.icon className="h-3 w-3" />
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Message History */}
            {messages.length > 0 && (
              <div className="max-h-48 overflow-y-auto px-3 py-2 space-y-2">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`text-xs ${
                      msg.role === "user"
                        ? "text-muted-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <div className="flex items-start gap-1.5">
                        <MessageSquare className="h-3 w-3 mt-0.5 shrink-0 text-violet-500" />
                        <span>{msg.content}</span>
                      </div>
                    ) : (
                      <div className="flex items-start gap-1.5">
                        <Sparkles className="h-3 w-3 mt-0.5 shrink-0 text-violet-500" />
                        <div>
                          {msg.summary && (
                            <span className="font-medium text-violet-600 dark:text-violet-400">
                              {msg.summary}
                            </span>
                          )}
                          {msg.content && msg.content !== msg.summary && (
                            <p className="text-muted-foreground mt-0.5">{msg.content}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Loading indicator */}
                {isPending && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin text-violet-500" />
                    <span>AI is editing...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Input Bar */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-t">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask AI to edit blocks..."
                className="h-8 text-sm"
                disabled={isPending}
              />
              <Button
                size="sm"
                className="h-8 px-3 gap-1"
                disabled={!input.trim() || isPending}
                onClick={() => handleSubmit(input)}
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

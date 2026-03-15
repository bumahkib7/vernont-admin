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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAiChat, type ChatMessage } from "@/hooks/use-ai-chat";
import { AiWorkflowPanel } from "@/components/ai/ai-workflow-panel";
import {
  Send,
  Trash2,
  Loader2,
  Bot,
  User,
  TrendingUp,
  ShoppingCart,
  Package,
  MessageSquare,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AiChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QUICK_ACTIONS = [
  { label: "Sales summary", prompt: "Give me a sales summary for this week", icon: TrendingUp },
  { label: "Recent orders", prompt: "What are the most recent orders?", icon: ShoppingCart },
  { label: "Top products", prompt: "What are the top selling products?", icon: Package },
];

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div
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
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>
      <div
        className={cn(
          "rounded-lg px-3 py-2 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
      </div>
    </div>
  );
}

export function AiChatPanel({ open, onOpenChange }: AiChatPanelProps) {
  const { messages, loading, sessionId, sendMessage, clearHistory } = useAiChat();
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState("chat");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when panel opens
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

  const handleQuickAction = async (prompt: string) => {
    if (loading) return;
    await sendMessage(prompt);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col p-0 sm:max-w-md w-full">
        <SheetHeader className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-base">AI Assistant</SheetTitle>
              <SheetDescription className="text-xs">
                Ask questions or use guided workflows
              </SheetDescription>
            </div>
            {activeTab === "chat" && messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={clearHistory}
                disabled={loading}
                title="Clear history"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </SheetHeader>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
          <div className="px-4 pt-2">
            <TabsList className="w-full">
              <TabsTrigger value="chat">
                <MessageSquare className="h-3.5 w-3.5 mr-1" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="workflows">
                <Workflow className="h-3.5 w-3.5 mr-1" />
                Workflows
              </TabsTrigger>
            </TabsList>
          </div>

        {activeTab === "chat" ? (
          <>
            {/* Quick actions */}
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2 px-4 pt-3">
                {QUICK_ACTIONS.map((action) => (
                  <Badge
                    key={action.label}
                    variant="outline"
                    className="cursor-pointer gap-1.5 py-1.5 px-2.5 hover:bg-accent transition-colors"
                    onClick={() => handleQuickAction(action.prompt)}
                  >
                    <action.icon className="h-3 w-3" />
                    {action.label}
                  </Badge>
                ))}
              </div>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1 min-h-0">
              <div ref={scrollRef} className="flex flex-col gap-3 p-4">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Bot className="h-10 w-10 text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Ask me anything about your store, orders, or products.
                    </p>
                  </div>
                )}
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                {loading && messages[messages.length - 1]?.content === "" && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Thinking...
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t p-3">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question..."
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
          </>
        ) : (
          <AiWorkflowPanel sessionId={sessionId} />
        )}
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

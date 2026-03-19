"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  RefreshCw,
  Search,
  MessageSquare,
  Bot,
  User,
  Clock,
  Zap,
  Hash,
  Cpu,
  ChevronLeft,
  ChevronRight,
  Inbox,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import ReactMarkdown from "react-markdown";
import {
  getAiSessions,
  getAiSessionMessages,
  type AiSessionSummary,
  type AiSessionMessage,
  type AgentType,
} from "@/lib/api";

// ── Helpers ──────────────────────────────────────────────

function AgentBadge({ type }: { type: AgentType }) {
  if (type === "STOREFRONT") {
    return (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400 text-[10px] px-1.5 py-0">
        Store
      </Badge>
    );
  }
  return (
    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400 text-[10px] px-1.5 py-0">
      Admin
    </Badge>
  );
}

interface ToolCall {
  tool: string;
  status?: string;
}

function parseToolCalls(toolCallsJson: string | null): ToolCall[] {
  if (!toolCallsJson) return [];
  try {
    const parsed = JSON.parse(toolCallsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ── Session List Item ────────────────────────────────────

function SessionItem({
  session,
  isSelected,
  onClick,
}: {
  session: AiSessionSummary;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors ${
        isSelected ? "bg-muted" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <AgentBadge type={session.agentType} />
        <span className="text-[10px] text-muted-foreground">
          {formatDistanceToNow(new Date(session.lastMessageAt), { addSuffix: true })}
        </span>
      </div>
      <p className="text-sm font-medium truncate">
        {session.firstMessage || "New conversation"}
      </p>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-[11px] text-muted-foreground truncate font-mono">
          {session.userId?.slice(0, 12)}
        </span>
        <span className="text-[11px] text-muted-foreground ml-auto flex items-center gap-0.5">
          <MessageSquare className="h-3 w-3" />
          {session.messageCount}
        </span>
      </div>
    </button>
  );
}

// ── Message Bubble ───────────────────────────────────────

function MessageBubble({ message }: { message: AiSessionMessage }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const toolCalls = parseToolCalls(message.toolCalls);

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <div className="bg-muted/50 border border-dashed rounded-lg px-4 py-2 max-w-lg text-center">
          <p className="text-xs text-muted-foreground">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className="h-7 w-7 rounded-full bg-indigo-100 dark:bg-indigo-950/30 flex items-center justify-center">
            <Bot className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
      )}

      <div className={`max-w-[75%] space-y-1 ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-3.5 py-2.5 ${
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-muted rounded-tl-sm"
          }`}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="text-sm prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Meta row */}
        <div className={`flex flex-wrap items-center gap-1.5 px-1 ${isUser ? "justify-end" : ""}`}>
          <span className="text-[10px] text-muted-foreground">
            {format(new Date(message.createdAt), "HH:mm:ss")}
          </span>
          {!isUser && message.model && (
            <Badge variant="outline" className="text-[9px] h-4 gap-0.5 px-1">
              <Cpu className="h-2 w-2" />
              {message.model.replace("claude-", "").replace("-20250514", "")}
            </Badge>
          )}
          {!isUser && message.inputTokens != null && message.outputTokens != null && (
            <Badge variant="outline" className="text-[9px] h-4 gap-0.5 px-1">
              <Hash className="h-2 w-2" />
              {message.inputTokens.toLocaleString()}/{message.outputTokens.toLocaleString()}
            </Badge>
          )}
          {!isUser && message.latencyMs != null && (
            <Badge variant="outline" className="text-[9px] h-4 gap-0.5 px-1">
              <Zap className="h-2 w-2" />
              {message.latencyMs >= 1000
                ? `${(message.latencyMs / 1000).toFixed(1)}s`
                : `${message.latencyMs}ms`}
            </Badge>
          )}
          {toolCalls.map((tc, i) => (
            <Badge key={i} variant="secondary" className="text-[9px] h-4 gap-0.5 px-1">
              {tc.tool}
            </Badge>
          ))}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-3.5 w-3.5 text-primary" />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────

export default function ChatSessionsPage() {
  // Session list state
  const [sessions, setSessions] = useState<AiSessionSummary[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [search, setSearch] = useState("");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 30;

  // Selected session state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiSessionMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const params: {
        page: number;
        size: number;
        agentType?: AgentType;
        search?: string;
      } = { page, size: pageSize };
      if (agentFilter !== "all") params.agentType = agentFilter as AgentType;
      if (search.trim()) params.search = search.trim();
      const data = await getAiSessions(params);
      setSessions(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      console.error("Failed to fetch AI sessions:", err);
    } finally {
      setLoadingSessions(false);
    }
  }, [page, agentFilter, search]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    setPage(0);
  }, [agentFilter, search]);

  // Fetch messages when session selected
  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setLoadingMessages(true);
    getAiSessionMessages(selectedId)
      .then((data) => {
        if (!cancelled) setMessages(data);
      })
      .catch((err) => {
        console.error("Failed to fetch messages:", err);
        if (!cancelled) setMessages([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingMessages(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  // Scroll to bottom when messages load
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectedSession = sessions.find((s) => s.sessionId === selectedId);

  // Stats for selected conversation
  const totalTokensIn = messages.reduce((sum, m) => sum + (m.inputTokens ?? 0), 0);
  const totalTokensOut = messages.reduce((sum, m) => sum + (m.outputTokens ?? 0), 0);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* ── Left panel: Session list ── */}
      <div className="w-[340px] flex-shrink-0 border-r border-border flex flex-col bg-background">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-semibold">Chat Sessions</h1>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchSessions}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger className="w-24 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="STOREFRONT">Store</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Session list */}
        <ScrollArea className="flex-1">
          {loadingSessions ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Inbox className="h-8 w-8 mb-2" />
              <p className="text-sm">No sessions found</p>
            </div>
          ) : (
            <>
              {sessions.map((session) => (
                <SessionItem
                  key={session.sessionId}
                  session={session}
                  isSelected={selectedId === session.sessionId}
                  onClick={() => setSelectedId(session.sessionId)}
                />
              ))}
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-2 border-t border-border/50">
                  <span className="text-[10px] text-muted-foreground">
                    {totalElements} total
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={page === 0}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <span className="text-[10px] text-muted-foreground">
                      {page + 1}/{totalPages}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </ScrollArea>
      </div>

      {/* ── Right panel: Conversation ── */}
      <div className="flex-1 flex flex-col bg-background min-w-0">
        {!selectedId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-3 opacity-20" />
            <p className="text-sm font-medium">Select a conversation</p>
            <p className="text-xs mt-1">Choose a session from the list to view messages</p>
          </div>
        ) : (
          <>
            {/* Conversation header */}
            <div className="px-5 py-3 border-b border-border flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {selectedSession && <AgentBadge type={selectedSession.agentType} />}
                <span className="text-sm font-mono text-muted-foreground truncate">
                  {selectedSession?.userId}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-shrink-0">
                {messages.length > 0 && (
                  <>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {messages.length}
                    </span>
                    {(totalTokensIn > 0 || totalTokensOut > 0) && (
                      <span className="flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        {(totalTokensIn + totalTokensOut).toLocaleString()} tokens
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(messages[0].createdAt), "MMM d, HH:mm")}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-5 py-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground">
                  <p className="text-sm">No messages in this session</p>
                </div>
              ) : (
                <div className="space-y-4 max-w-3xl mx-auto">
                  {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>
          </>
        )}
      </div>
    </div>
  );
}

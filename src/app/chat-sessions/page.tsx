"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

function AgentBadge({ type, compact }: { type: AgentType; compact?: boolean }) {
  if (type === "STOREFRONT") {
    return (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400 text-[10px] px-1.5 py-0">
        {compact ? "S" : "Store"}
      </Badge>
    );
  }
  return (
    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400 text-[10px] px-1.5 py-0">
      {compact ? "A" : "Admin"}
    </Badge>
  );
}

interface ToolCall {
  tool: string;
  status?: string;
}

function parseToolCalls(json: string | null): ToolCall[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
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
      className={`w-full text-left px-3 py-2.5 border-b border-border/40 transition-colors ${
        isSelected
          ? "bg-accent"
          : "hover:bg-muted/50"
      }`}
    >
      <div className="flex items-center gap-2 mb-0.5">
        <AgentBadge type={session.agentType} />
        <span className="text-[10px] text-muted-foreground ml-auto whitespace-nowrap">
          {formatDistanceToNow(new Date(session.lastMessageAt), { addSuffix: true })}
        </span>
      </div>
      <p className="text-[13px] font-medium truncate leading-tight">
        {session.firstMessage || "New conversation"}
      </p>
      <div className="flex items-center gap-1.5 mt-0.5">
        <span className="text-[10px] text-muted-foreground font-mono truncate">
          {session.userId?.slice(0, 8)}…
        </span>
        <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-0.5">
          <MessageSquare className="h-2.5 w-2.5" />
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
      <div className="flex justify-center my-2">
        <p className="text-[11px] text-muted-foreground italic px-3 py-1 bg-muted/30 rounded-full">
          {message.content}
        </p>
      </div>
    );
  }

  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className="flex-shrink-0 mt-0.5">
        {isUser ? (
          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-3 w-3 text-primary" />
          </div>
        ) : (
          <div className="h-6 w-6 rounded-full bg-indigo-100 dark:bg-indigo-950/30 flex items-center justify-center">
            <Bot className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
          </div>
        )}
      </div>

      <div className={`max-w-[80%] min-w-0 ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-xl px-3 py-2 ${
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          }`}
        >
          {isUser ? (
            <p className="text-[13px] whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <div className="text-[13px] prose prose-sm dark:prose-invert max-w-none break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Meta info */}
        <div className={`flex flex-wrap items-center gap-1 mt-0.5 px-0.5 ${isUser ? "justify-end" : ""}`}>
          <span className="text-[9px] text-muted-foreground">
            {format(new Date(message.createdAt), "HH:mm")}
          </span>
          {!isUser && message.latencyMs != null && (
            <span className="text-[9px] text-muted-foreground">
              · {message.latencyMs >= 1000
                ? `${(message.latencyMs / 1000).toFixed(1)}s`
                : `${message.latencyMs}ms`}
            </span>
          )}
          {toolCalls.length > 0 && (
            <span className="text-[9px] text-muted-foreground">
              · {toolCalls.map(t => t.tool).join(", ")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────

export default function ChatSessionsPage() {
  const [sessions, setSessions] = useState<AiSessionSummary[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [search, setSearch] = useState("");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 30;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiSessionMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const params: { page: number; size: number; agentType?: AgentType; search?: string } = {
        page,
        size: pageSize,
      };
      if (agentFilter !== "all") params.agentType = agentFilter as AgentType;
      if (search.trim()) params.search = search.trim();
      const data = await getAiSessions(params);
      setSessions(data.sessions ?? []);
      setTotalPages(data.totalPages ?? 0);
    } catch (err) {
      console.error("Failed to fetch AI sessions:", err);
    } finally {
      setLoadingSessions(false);
    }
  }, [page, agentFilter, search]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);
  useEffect(() => { setPage(0); }, [agentFilter, search]);

  useEffect(() => {
    if (!selectedId) { setMessages([]); return; }
    let cancelled = false;
    setLoadingMessages(true);
    getAiSessionMessages(selectedId)
      .then((data) => { if (!cancelled) setMessages(data); })
      .catch(() => { if (!cancelled) setMessages([]); })
      .finally(() => { if (!cancelled) setLoadingMessages(false); });
    return () => { cancelled = true; };
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectedSession = sessions.find((s) => s.sessionId === selectedId);

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* ── Left: Session list ── */}
      <div className="w-[300px] flex-shrink-0 border-r border-border flex flex-col overflow-hidden">
        {/* Filters */}
        <div className="p-2.5 border-b border-border space-y-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Sessions</h2>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={fetchSessions}>
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex gap-1.5">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-7 h-7 text-xs"
              />
            </div>
            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger className="w-[72px] h-7 text-[11px]">
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

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loadingSessions ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Inbox className="h-6 w-6 mb-1.5 opacity-30" />
              <p className="text-xs">No sessions</p>
            </div>
          ) : (
            sessions.map((session) => (
              <SessionItem
                key={session.sessionId}
                session={session}
                isSelected={selectedId === session.sessionId}
                onClick={() => setSelectedId(session.sessionId)}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-2.5 py-1.5 border-t border-border flex-shrink-0">
            <Button
              variant="ghost" size="icon" className="h-6 w-6"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[10px] text-muted-foreground">{page + 1}/{totalPages}</span>
            <Button
              variant="ghost" size="icon" className="h-6 w-6"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* ── Right: Conversation ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {!selectedId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="h-10 w-10 mb-2 opacity-15" />
            <p className="text-sm">Select a conversation</p>
          </div>
        ) : (
          <>
            {/* Header bar */}
            <div className="px-4 py-2.5 border-b border-border flex items-center gap-3 flex-shrink-0 bg-background">
              {selectedSession && (
                <>
                  <AgentBadge type={selectedSession.agentType} />
                  <span className="text-xs font-mono text-muted-foreground truncate">
                    {selectedSession.userId}
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {messages.length} messages
                  </span>
                  {messages.length > 0 && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(messages[0].createdAt), "MMM d, HH:mm")}
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground">
                  <p className="text-xs">No messages</p>
                </div>
              ) : (
                <div className="space-y-3 max-w-2xl mx-auto">
                  {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

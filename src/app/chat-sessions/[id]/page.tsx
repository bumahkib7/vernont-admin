"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ArrowLeft,
  Bot,
  User,
  Clock,
  Zap,
  Hash,
  Cpu,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import ReactMarkdown from "react-markdown";
import {
  getAiSessionMessages,
  type AiSessionMessage,
  type AgentType,
} from "@/lib/api";

interface ToolCall {
  tool: string;
  status?: string;
}

function parseToolCalls(toolCallsJson: string | null): ToolCall[] {
  if (!toolCallsJson) return [];
  try {
    const parsed = JSON.parse(toolCallsJson);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

function AgentBadge({ type }: { type: AgentType }) {
  if (type === "STOREFRONT") {
    return (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400">
        Storefront
      </Badge>
    );
  }
  return (
    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400">
      Admin
    </Badge>
  );
}

function MessageBubble({ message }: { message: AiSessionMessage }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const toolCalls = parseToolCalls(message.toolCalls);

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <div className="bg-muted/50 border border-dashed rounded-lg px-4 py-2 max-w-lg text-center">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
            System
          </p>
          <p className="text-sm text-muted-foreground">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-950/30 flex items-center justify-center">
            <Bot className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
      )}

      <div className={`max-w-[70%] space-y-2 ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-md"
              : "bg-muted rounded-tl-md"
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

        {/* Meta info for assistant messages */}
        {!isUser && (
          <div className="flex flex-wrap items-center gap-2 px-1">
            <span className="text-xs text-muted-foreground">
              {format(new Date(message.createdAt), "HH:mm:ss")}
            </span>
            {message.model && (
              <Badge variant="outline" className="text-[10px] h-5 gap-1">
                <Cpu className="h-2.5 w-2.5" />
                {message.model}
              </Badge>
            )}
            {message.inputTokens != null && message.outputTokens != null && (
              <Badge variant="outline" className="text-[10px] h-5 gap-1">
                <Hash className="h-2.5 w-2.5" />
                {message.inputTokens.toLocaleString()} in / {message.outputTokens.toLocaleString()} out
              </Badge>
            )}
            {message.latencyMs != null && (
              <Badge variant="outline" className="text-[10px] h-5 gap-1">
                <Zap className="h-2.5 w-2.5" />
                {message.latencyMs >= 1000
                  ? `${(message.latencyMs / 1000).toFixed(1)}s`
                  : `${message.latencyMs}ms`}
              </Badge>
            )}
            {toolCalls.length > 0 &&
              toolCalls.map((tc, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-[10px] h-5 gap-1"
                >
                  {tc.tool}
                  {tc.status && (
                    <span
                      className={
                        tc.status === "complete"
                          ? "text-green-600 dark:text-green-400"
                          : "text-yellow-600 dark:text-yellow-400"
                      }
                    >
                      ({tc.status})
                    </span>
                  )}
                </Badge>
              ))}
          </div>
        )}

        {/* Timestamp for user messages */}
        {isUser && (
          <div className="flex justify-end px-1">
            <span className="text-xs text-muted-foreground">
              {format(new Date(message.createdAt), "HH:mm:ss")}
            </span>
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChatSessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [messages, setMessages] = useState<AiSessionMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAiSessionMessages(sessionId);
      setMessages(data);
    } catch (err) {
      console.error("Failed to fetch session messages:", err);
      setError("Failed to load session messages.");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Derive session info from messages
  const firstMessage = messages[0];
  const lastMessage = messages[messages.length - 1];
  const agentType = firstMessage?.agentType;
  const userId = firstMessage?.userId;
  const totalTokensIn = messages.reduce(
    (sum, m) => sum + (m.inputTokens ?? 0),
    0
  );
  const totalTokensOut = messages.reduce(
    (sum, m) => sum + (m.outputTokens ?? 0),
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/chat-sessions")}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Sessions
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={fetchMessages}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/chat-sessions")}
            className="-ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Sessions
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">
            Session Details
          </h1>
          <p className="text-sm text-muted-foreground font-mono">
            {sessionId}
          </p>
        </div>
      </div>

      {/* Session summary cards */}
      {firstMessage && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground mb-1">Agent</p>
              <AgentBadge type={agentType} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground mb-1">User</p>
              <p className="text-sm font-mono truncate">{userId}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground mb-1">Messages</p>
              <p className="text-lg font-semibold">{messages.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground mb-1">Tokens</p>
              <p className="text-sm">
                <span className="font-medium">{totalTokensIn.toLocaleString()}</span>
                <span className="text-muted-foreground"> in</span>
                {" / "}
                <span className="font-medium">{totalTokensOut.toLocaleString()}</span>
                <span className="text-muted-foreground"> out</span>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground mb-1">Duration</p>
              <p className="text-sm flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                {firstMessage && lastMessage
                  ? formatDistanceToNow(new Date(firstMessage.createdAt), {
                      addSuffix: false,
                    })
                  : "-"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {firstMessage
                  ? format(new Date(firstMessage.createdAt), "MMM d, yyyy HH:mm")
                  : ""}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversation</CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No messages in this session.
            </p>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

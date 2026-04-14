"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Send,
  Paperclip,
  MoreVertical,
  Star,
  Archive,
  Trash2,
  Tag,
  CheckCircle,
  Clock,
  MessageSquare,
  Inbox,
  Loader2,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  useChatConversations,
  useChatMessages,
  useSendChatMessage,
  useAssignChatConversation,
  useMarkChatConversationRead,
  useChatWebSocket,
} from "@/hooks/use-chat";
import type {
  ChatConversation,
  ChatConversationStatus,
} from "@/lib/api/chat";

// ============================================================================
// Helper functions
// ============================================================================

function getStatusBadge(status: ChatConversationStatus) {
  switch (status) {
    case "OPEN":
      return (
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400">
          Open
        </Badge>
      );
    case "PENDING_ADMIN":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400">
          Pending
        </Badge>
      );
    case "RESOLVED":
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400">
          Resolved
        </Badge>
      );
    case "CLOSED":
      return (
        <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-950/30 dark:text-gray-400">
          Closed
        </Badge>
      );
    case "ARCHIVED":
      return (
        <Badge variant="secondary">Archived</Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case "HIGH":
    case "URGENT":
      return (
        <Badge variant="outline" className="border-red-500 text-red-600">
          {priority === "URGENT" ? "Urgent" : "High"}
        </Badge>
      );
    case "LOW":
      return (
        <Badge variant="outline" className="border-gray-500 text-gray-600">
          Low
        </Badge>
      );
    default:
      return null;
  }
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatTime(dateString: string | null) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = diff / (1000 * 60 * 60);

  if (hours < 1) {
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes}m ago`;
  } else if (hours < 24) {
    return `${Math.floor(hours)}h ago`;
  } else {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
}

function formatMessageTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** Derive a display name from the customerUserId (best-effort). */
function customerDisplayName(conversation: ChatConversation): string {
  // customerUserId is a UUID -- show a shortened label
  if (conversation.customerId) {
    return `Customer ${conversation.customerId.slice(0, 8)}`;
  }
  return `User ${conversation.customerUserId.slice(0, 8)}`;
}

// ============================================================================
// Page component
// ============================================================================

export default function MessagesPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [replyText, setReplyText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    ChatConversationStatus | undefined
  >(undefined);

  // Data hooks
  const {
    data: conversations,
    isLoading: isLoadingConversations,
    error: conversationsError,
  } = useChatConversations({
    status: statusFilter,
    q: searchQuery || undefined,
  });

  const {
    data: messages,
    isLoading: isLoadingMessages,
  } = useChatMessages(selectedConversationId);

  const sendMessageMutation = useSendChatMessage(selectedConversationId);
  const assignMutation = useAssignChatConversation();
  const markReadMutation = useMarkChatConversationRead();

  // WebSocket subscriptions for real-time updates
  useChatWebSocket(selectedConversationId);

  // Derived state
  const selectedConversation = conversations?.find(
    (c) => c.id === selectedConversationId
  );

  // Auto-select first conversation when list loads
  useEffect(() => {
    if (!selectedConversationId && conversations && conversations.length > 0) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [selectedConversationId, conversations]);

  // Mark conversation as read when selected
  useEffect(() => {
    if (
      selectedConversationId &&
      selectedConversation &&
      selectedConversation.unreadForAdmin > 0
    ) {
      markReadMutation.mutate(selectedConversationId);
    }
    // Only trigger when selection changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversationId]);

  // Auto-scroll messages to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Compute stats from live data
  const stats = {
    open: conversations?.filter(
      (c) => c.status === "OPEN" || c.status === "PENDING_ADMIN"
    ).length ?? 0,
    pending: conversations?.filter((c) => c.status === "PENDING_ADMIN").length ?? 0,
    resolved: conversations?.filter((c) => c.status === "RESOLVED").length ?? 0,
  };

  // Handlers
  function handleSelectConversation(id: string) {
    setSelectedConversationId(id);
  }

  function handleSendReply() {
    if (!replyText.trim() || !selectedConversationId) return;
    sendMessageMutation.mutate(
      {
        body: replyText.trim(),
        clientMessageId: `admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      },
      {
        onSuccess: () => setReplyText(""),
      }
    );
  }

  function handleAssign() {
    if (!selectedConversationId) return;
    assignMutation.mutate(selectedConversationId);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-0">
      {/* Sidebar - Conversation List */}
      <div className="w-full sm:w-[380px] flex-shrink-0 border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold mb-4">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Inbox className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">{stats.open}</span>
            <span className="text-xs text-muted-foreground">Open</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium">{stats.pending}</span>
            <span className="text-xs text-muted-foreground">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">{stats.resolved}</span>
            <span className="text-xs text-muted-foreground">Resolved</span>
          </div>
        </div>

        {/* Conversation List */}
        <ScrollArea className="flex-1">
          {isLoadingConversations ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : conversationsError ? (
            <div className="flex items-center justify-center py-12 text-sm text-destructive">
              Failed to load conversations
            </div>
          ) : !conversations || conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No conversations</p>
            </div>
          ) : (
            <div className="divide-y">
              {conversations.map((conversation) => {
                const displayName = customerDisplayName(conversation);
                const hasUnread = conversation.unreadForAdmin > 0;

                return (
                  <button
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation.id)}
                    className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                      selectedConversationId === conversation.id
                        ? "bg-muted"
                        : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarFallback className="bg-muted">
                          {getInitials(displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`font-medium truncate ${
                              hasUnread
                                ? "text-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
                            {displayName}
                          </span>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {formatTime(conversation.lastMessageAt)}
                          </span>
                        </div>
                        <p
                          className={`text-sm truncate ${
                            hasUnread
                              ? "text-foreground font-medium"
                              : "text-muted-foreground"
                          }`}
                        >
                          {conversation.subject || "No subject"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {conversation.lastMessagePreview || "No messages yet"}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {getStatusBadge(conversation.status)}
                          {getPriorityBadge(conversation.priority)}
                          {conversation.orderId && (
                            <Badge variant="outline" className="text-xs">
                              {conversation.orderId.slice(0, 8)}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {hasUnread && (
                        <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Main Content - Conversation View */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Conversation Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-muted">
                  {getInitials(customerDisplayName(selectedConversation))}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  {selectedConversation.customerId ? (
                    <Link
                      href={`/customers/${selectedConversation.customerId}`}
                      className="font-medium hover:underline"
                    >
                      {customerDisplayName(selectedConversation)}
                    </Link>
                  ) : (
                    <span className="font-medium">
                      {customerDisplayName(selectedConversation)}
                    </span>
                  )}
                  {getStatusBadge(selectedConversation.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedConversation.subject || "No subject"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedConversation.orderId && (
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href={`/orders/${selectedConversation.orderId}`}
                  >
                    View Order
                  </Link>
                </Button>
              )}
              {!selectedConversation.assignedAdminUserId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAssign}
                  disabled={assignMutation.isPending}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  {assignMutation.isPending ? "Claiming..." : "Claim"}
                </Button>
              )}
              <Button variant="ghost" size="icon">
                <Star className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Tag className="mr-2 h-4 w-4" />
                    Add Tag
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Resolved
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4 max-w-3xl mx-auto">
              {/* Subject */}
              <div className="text-center py-4">
                <h2 className="font-medium">
                  {selectedConversation.subject || "Conversation"}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Opened on{" "}
                  {new Date(selectedConversation.openedAt).toLocaleDateString(
                    "en-US",
                    {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    }
                  )}
                </p>
              </div>

              {isLoadingMessages ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !messages || messages.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-8">
                  No messages yet. Start the conversation below.
                </div>
              ) : (
                messages.map((message) => {
                  const isAdmin =
                    message.senderRole === "ADMIN" ||
                    message.senderRole === "BOT" ||
                    message.senderRole === "SYSTEM";

                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        isAdmin ? "flex-row-reverse" : ""
                      }`}
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        {!isAdmin ? (
                          <AvatarFallback className="bg-muted text-xs">
                            {getInitials(
                              customerDisplayName(selectedConversation)
                            )}
                          </AvatarFallback>
                        ) : (
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {message.senderRole === "BOT"
                              ? "AI"
                              : message.senderRole === "SYSTEM"
                                ? "SY"
                                : "A"}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div
                        className={`flex-1 max-w-[70%] ${
                          isAdmin ? "text-right" : ""
                        }`}
                      >
                        <div
                          className={`inline-block rounded-lg px-4 py-2 text-sm ${
                            isAdmin
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="whitespace-pre-wrap text-left">
                            {message.body}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-muted-foreground">
                            {formatMessageTime(message.createdAt)}
                          </p>
                          {message.moderationStatus === "FLAGGED" && (
                            <Badge
                              variant="outline"
                              className="text-[10px] border-yellow-500 text-yellow-600"
                            >
                              Flagged
                            </Badge>
                          )}
                          {message.moderationStatus === "BLOCKED" && (
                            <Badge
                              variant="outline"
                              className="text-[10px] border-red-500 text-red-600"
                            >
                              Blocked
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Reply Input */}
          <div className="p-4 border-t">
            <div className="max-w-3xl mx-auto">
              <div className="flex gap-2">
                <Button variant="ghost" size="icon">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Textarea
                  placeholder="Type your reply... (Enter to send, Shift+Enter for new line)"
                  className="min-h-[80px] resize-none"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
              <div className="flex items-center justify-end mt-3">
                <Button
                  onClick={handleSendReply}
                  disabled={
                    !replyText.trim() || sendMessageMutation.isPending
                  }
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Send Reply
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>
              {isLoadingConversations
                ? "Loading conversations..."
                : "Select a conversation to view"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

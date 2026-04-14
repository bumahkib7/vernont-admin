import { apiFetch } from "./client";

// ============================================================================
// Types — mirrored from backend ChatService response DTOs
// ============================================================================

export type ChatConversationType = "SUPPORT" | "ORDER_SUPPORT" | "PRE_SALES";
export type ChatConversationStatus = "PENDING_ADMIN" | "OPEN" | "RESOLVED" | "CLOSED" | "ARCHIVED";
export type ChatConversationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type ChatParticipantRole = "CUSTOMER" | "ADMIN" | "BOT" | "SYSTEM";
export type ChatMessageType = "TEXT" | "SYSTEM" | "ATTACHMENT";
export type ChatMessageStatus = "SENT" | "EDITED" | "DELETED";
export type ChatModerationStatus = "PENDING" | "ALLOWED" | "FLAGGED" | "BLOCKED" | "OVERRIDDEN";

export interface ChatConversation {
  id: string;
  conversationType: ChatConversationType;
  status: ChatConversationStatus;
  priority: ChatConversationPriority;
  subject: string | null;
  customerUserId: string;
  customerId: string | null;
  orderId: string | null;
  assignedAdminUserId: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  unreadForCustomer: number;
  unreadForAdmin: number;
  openedAt: string;
  closedAt: string | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderUserId: string;
  senderRole: ChatParticipantRole;
  messageType: ChatMessageType;
  body: string;
  status: ChatMessageStatus;
  moderationStatus: ChatModerationStatus;
  moderationReason: string | null;
  moderationScore: number | null;
  createdAt: string;
  clientMessageId: string | null;
}

export interface ChatMessageListResponse {
  messages: ChatMessage[];
  page: number;
  size: number;
  total: number;
  hasMore: boolean;
}

// ============================================================================
// Request types
// ============================================================================

export interface SendChatMessageRequest {
  body: string;
  messageType?: ChatMessageType;
  clientMessageId?: string;
  metadata?: Record<string, unknown>;
}

export interface AssignChatConversationRequest {
  adminUserId?: string;
}

export interface MarkConversationReadRequest {
  lastMessageId?: string;
}

// ============================================================================
// API functions
// ============================================================================

export async function getChatConversations(params?: {
  page?: number;
  size?: number;
  status?: ChatConversationStatus;
  q?: string;
}): Promise<{ conversations: ChatConversation[]; count: number }> {
  const searchParams = new URLSearchParams();
  if (params?.page != null) searchParams.set("page", params.page.toString());
  if (params?.size != null) searchParams.set("size", params.size.toString());
  if (params?.status) searchParams.set("status", params.status);
  if (params?.q) searchParams.set("q", params.q);

  const query = searchParams.toString();
  return apiFetch(`/admin/chat/conversations${query ? `?${query}` : ""}`);
}

export async function getChatMessages(
  conversationId: string,
  params?: {
    page?: number;
    size?: number;
    before?: string;
  }
): Promise<ChatMessageListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page != null) searchParams.set("page", params.page.toString());
  if (params?.size != null) searchParams.set("size", params.size.toString());
  if (params?.before) searchParams.set("before", params.before);

  const query = searchParams.toString();
  return apiFetch(`/admin/chat/conversations/${conversationId}/messages${query ? `?${query}` : ""}`);
}

export async function sendChatMessage(
  conversationId: string,
  request: SendChatMessageRequest
): Promise<{ message: ChatMessage }> {
  return apiFetch(`/admin/chat/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function assignChatConversation(
  conversationId: string,
  request?: AssignChatConversationRequest
): Promise<{ conversation: ChatConversation }> {
  return apiFetch(`/admin/chat/conversations/${conversationId}/assign`, {
    method: "POST",
    body: JSON.stringify(request || {}),
  });
}

export async function markChatConversationRead(
  conversationId: string,
  request?: MarkConversationReadRequest
): Promise<{ ok: boolean }> {
  return apiFetch(`/admin/chat/conversations/${conversationId}/read`, {
    method: "POST",
    body: JSON.stringify(request || {}),
  });
}

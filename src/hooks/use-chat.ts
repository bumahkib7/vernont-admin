"use client";

import { useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getChatConversations,
  getChatMessages,
  sendChatMessage,
  assignChatConversation,
  markChatConversationRead,
  type ChatConversation,
  type ChatConversationStatus,
  type ChatMessage,
  type ChatMessageListResponse,
  type SendChatMessageRequest,
} from "@/lib/api/chat";
import { importKey, decrypt } from "@/lib/chat-crypto";
import { useWebSocket } from "@/hooks/use-websocket";
import { useNotificationSound } from "@/hooks/use-notification-sound";

// In-memory store for per-conversation CryptoKeys (never persisted)
const conversationKeys = new Map<string, CryptoKey>();

async function ensureConversationKey(
  conversationId: string,
  rawKey: string | null | undefined
): Promise<CryptoKey | null> {
  if (conversationKeys.has(conversationId)) {
    return conversationKeys.get(conversationId)!;
  }
  if (!rawKey) return null;
  try {
    const key = await importKey(rawKey);
    conversationKeys.set(conversationId, key);
    return key;
  } catch {
    return null;
  }
}

// ============================================================================
// Query Keys
// ============================================================================

export const chatKeys = {
  all: ["chat"] as const,
  conversations: (params?: { status?: ChatConversationStatus; q?: string }) =>
    [...chatKeys.all, "conversations", params] as const,
  messages: (conversationId: string) =>
    [...chatKeys.all, "messages", conversationId] as const,
};

// ============================================================================
// Conversation List Hook
// ============================================================================

export function useChatConversations(params?: {
  status?: ChatConversationStatus;
  q?: string;
}) {
  return useQuery({
    queryKey: chatKeys.conversations(params),
    queryFn: () =>
      getChatConversations({
        page: 0,
        size: 50,
        status: params?.status,
        q: params?.q,
      }),
    staleTime: 10_000,
    refetchInterval: 30_000,
    select: (data) => data.conversations,
  });
}

// ============================================================================
// Messages Hook
// ============================================================================

export function useChatMessages(conversationId: string | null) {
  return useQuery({
    queryKey: chatKeys.messages(conversationId ?? ""),
    queryFn: async () => {
      const data = await getChatMessages(conversationId!, { size: 100 });
      // Capture encryption key from the messages response (delivered via HTTPS)
      if (conversationId && data.encryptionKey) {
        await ensureConversationKey(conversationId, data.encryptionKey);
      }
      return data;
    },
    enabled: !!conversationId,
    staleTime: 5_000,
    select: (data: ChatMessageListResponse) => data.messages,
  });
}

// ============================================================================
// Send Message Mutation
// ============================================================================

export function useSendChatMessage(conversationId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: SendChatMessageRequest) => {
      if (!conversationId) throw new Error("No conversation selected");
      return sendChatMessage(conversationId, request);
    },
    onSuccess: (data) => {
      // Optimistically append the new message to the cache
      queryClient.setQueryData<ChatMessage[]>(
        chatKeys.messages(conversationId ?? ""),
        (old = []) => {
          // Deduplicate by id
          if (old.some((m) => m.id === data.message.id)) return old;
          return [...old, data.message];
        }
      );
      // Invalidate conversations to refresh previews / unread counts
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
    },
    onError: (error: Error) => {
      toast.error("Failed to send message", { description: error.message });
    },
  });
}

// ============================================================================
// Assign Conversation Mutation
// ============================================================================

export function useAssignChatConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      assignChatConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
      toast.success("Conversation assigned to you");
    },
    onError: (error: Error) => {
      toast.error("Failed to assign conversation", {
        description: error.message,
      });
    },
  });
}

// ============================================================================
// Mark Read Mutation
// ============================================================================

export function useMarkChatConversationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      markChatConversationRead(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
    },
  });
}

// ============================================================================
// WebSocket Subscription Hook
// ============================================================================

export function useChatWebSocket(activeConversationId: string | null) {
  const queryClient = useQueryClient();
  const { isConnected, subscribe, unsubscribe } = useWebSocket();
  const { play: playNotificationSound } = useNotificationSound();
  const activeConversationRef = useRef(activeConversationId);
  activeConversationRef.current = activeConversationId;

  const handleIncomingMessage = useCallback(
    (payload: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = payload as any;
      if (!raw?.id || !raw?.conversationId) return;

      const conversationId = raw.conversationId as string;

      // Handle encrypted message bodies
      const processMessage = async () => {
        let body: string = raw.body || "";

        if (raw.encryptedBody && raw.iv) {
          const cryptoKey = conversationKeys.get(conversationId);
          if (cryptoKey) {
            try {
              body = await decrypt(cryptoKey, raw.encryptedBody, raw.iv);
            } catch {
              body = "[Decryption failed]";
            }
          } else {
            body = raw.encryptedBody; // No key available
          }
        }

        const message: ChatMessage = {
          id: raw.id,
          conversationId: raw.conversationId,
          senderUserId: raw.senderUserId,
          senderRole: raw.senderRole,
          messageType: raw.messageType || "TEXT",
          body,
          status: raw.status,
          moderationStatus: raw.moderationStatus || "ALLOWED",
          moderationReason: raw.moderationReason || null,
          moderationScore: raw.moderationScore || null,
          createdAt: raw.createdAt,
          clientMessageId: raw.clientMessageId || null,
        };

        // Append to message cache if viewing this conversation
        queryClient.setQueryData<ChatMessage[]>(
          chatKeys.messages(message.conversationId),
          (old = []) => {
            if (old.some((m) => m.id === message.id)) return old;
            return [...old, message];
          }
        );

        // Play sound + show toast for messages from customers
        if (message.senderRole === "CUSTOMER") {
          playNotificationSound();
          if (message.conversationId !== activeConversationRef.current) {
            toast.info("New customer message", {
              description: body.slice(0, 100),
            });
          }
        }
      };

      processMessage();
    },
    [queryClient, playNotificationSound]
  );

  const handleConversationUpdate = useCallback(
    (payload: unknown) => {
      const updated = payload as ChatConversation;
      if (!updated?.id) return;

      // Update conversations list cache in-place
      queryClient.setQueryData<ChatConversation[]>(
        chatKeys.conversations(),
        (old = []) => {
          const idx = old.findIndex((c) => c.id === updated.id);
          if (idx >= 0) {
            const next = [...old];
            next[idx] = updated;
            // Re-sort by lastMessageAt descending
            next.sort((a, b) => {
              const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
              const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
              return tb - ta;
            });
            return next;
          }
          // New conversation -- prepend
          return [updated, ...old];
        }
      );
    },
    [queryClient]
  );

  useEffect(() => {
    if (!isConnected) return;

    const msgSub = subscribe(
      "/user/queue/chat-messages",
      handleIncomingMessage
    );
    const updateSub = subscribe(
      "/user/queue/chat-updates",
      handleConversationUpdate
    );

    return () => {
      if (msgSub) unsubscribe(msgSub);
      if (updateSub) unsubscribe(updateSub);
    };
  }, [
    isConnected,
    subscribe,
    unsubscribe,
    handleIncomingMessage,
    handleConversationUpdate,
  ]);
}

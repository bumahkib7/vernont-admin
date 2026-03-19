// AI Chat Sessions API — view conversation logs from storefront and admin agents

import { apiFetch } from "./client";

// --- Types ---

export type AgentType = "STOREFRONT" | "ADMIN";

export interface AiSessionSummary {
  sessionId: string;
  userId: string;
  agentType: AgentType;
  firstMessage: string;
  messageCount: number;
  startedAt: string;
  lastMessageAt: string;
}

export interface AiSessionsPage {
  sessions: AiSessionSummary[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface AiSessionMessage {
  id: string;
  sessionId: string;
  userId: string;
  role: "user" | "assistant" | "system";
  content: string;
  model: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  toolCalls: string | null;
  latencyMs: number | null;
  agentType: AgentType;
  createdAt: string;
}

// --- Params ---

export interface GetAiSessionsParams {
  page?: number;
  size?: number;
  agentType?: AgentType;
  search?: string;
}

// --- API Functions ---

export async function getAiSessions(
  params: GetAiSessionsParams = {}
): Promise<AiSessionsPage> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.agentType) searchParams.set("agentType", params.agentType);
  if (params.search) searchParams.set("search", params.search);

  const query = searchParams.toString();
  return apiFetch<AiSessionsPage>(
    `/admin/ai/sessions${query ? `?${query}` : ""}`
  );
}

interface AiSessionMessagesResponse {
  sessionId: string;
  messages: AiSessionMessage[];
  count: number;
}

export async function getAiSessionMessages(
  sessionId: string
): Promise<AiSessionMessage[]> {
  const data = await apiFetch<AiSessionMessagesResponse>(
    `/admin/ai/sessions/${encodeURIComponent(sessionId)}/messages`
  );
  return data.messages ?? [];
}

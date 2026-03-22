import { apiFetch, API_BASE_URL, parseErrorResponse } from "./client";

// ─── AI Assistant ────────────────────────────────────────────────────────────

/**
 * Send a chat message to the AI assistant. Returns a raw Response for SSE streaming.
 */
export async function aiChat(
  sessionId: string,
  message: string,
  context?: { currentPage: string; currentEntityId: string | null; currentEntityType: string | null }
): Promise<Response> {
  const response = await fetch(`${API_BASE_URL}/admin/ai/chat`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
    body: JSON.stringify({ sessionId, message, context }),
  });
  if (!response.ok) {
    throw await parseErrorResponse(response);
  }
  return response;
}

/**
 * Generate an AI product description.
 */
export async function aiDescribeProduct(productId: string): Promise<{ description: string }> {
  return apiFetch("/admin/ai/describe-product", {
    method: "POST",
    body: JSON.stringify({ productId }),
  });
}

/**
 * Suggest tags for a product using AI.
 */
export async function aiSuggestTags(productName: string, description?: string): Promise<{ tags: string[] }> {
  return apiFetch("/admin/ai/suggest-tags", {
    method: "POST",
    body: JSON.stringify({ productName, description }),
  });
}

/**
 * Analyze sales data with AI. Returns a raw Response for SSE streaming.
 */
export async function aiAnalyzeSales(query: string): Promise<Response> {
  const response = await fetch(`${API_BASE_URL}/admin/ai/analyze-sales`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
    body: JSON.stringify({ query }),
  });
  if (!response.ok) {
    throw await parseErrorResponse(response);
  }
  return response;
}

/**
 * Moderate content using AI.
 */
export async function aiModerate(content: string): Promise<{ action: string; reason?: string }> {
  return apiFetch("/admin/ai/moderate", {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

/**
 * Clear an AI chat session.
 */
export async function aiClearSession(sessionId: string): Promise<void> {
  await apiFetch(`/admin/ai/session?sessionId=${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
  });
}

// ---------------------------------------------------------------------------
// AI Insights
// ---------------------------------------------------------------------------

export interface AiInsight {
  id: string;
  type: "sales" | "inventory" | "marketing" | "customer";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  actionUrl?: string;
  createdAt: string;
}

/**
 * Fetch current AI-generated business insights.
 */
export async function getAiInsights(): Promise<{ insights: AiInsight[] }> {
  return apiFetch("/admin/ai/insights");
}

/**
 * Force-refresh AI insights (re-analyzes store data).
 */
export async function refreshAiInsights(): Promise<{ insights: AiInsight[] }> {
  return apiFetch("/admin/ai/insights/refresh", { method: "POST" });
}

// ---------------------------------------------------------------------------
// AI Guided Workflows
// ---------------------------------------------------------------------------

/**
 * Start a new AI guided workflow. Returns a raw Response for SSE streaming.
 */
export async function startAiWorkflow(
  sessionId: string,
  workflowType: string
): Promise<Response> {
  const response = await fetch(`${API_BASE_URL}/admin/ai/workflow/start`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
    body: JSON.stringify({ sessionId, workflowType }),
  });
  if (!response.ok) {
    throw await parseErrorResponse(response);
  }
  return response;
}

/**
 * Continue an in-progress AI workflow with user input. Returns SSE stream.
 */
export async function continueAiWorkflow(
  sessionId: string,
  input: string
): Promise<Response> {
  const response = await fetch(`${API_BASE_URL}/admin/ai/workflow/continue`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
    body: JSON.stringify({ sessionId, message: input }),
  });
  if (!response.ok) {
    throw await parseErrorResponse(response);
  }
  return response;
}

export interface AiWorkflowState {
  workflowType: string;
  currentStep: number;
  totalSteps: number;
  stepLabel: string;
  completed: boolean;
  resultUrl?: string;
}

/**
 * Get the current state of a workflow session.
 */
export async function getAiWorkflowState(
  sessionId: string
): Promise<{ state: AiWorkflowState } | null> {
  try {
    return await apiFetch(`/admin/ai/workflow/state?sessionId=${encodeURIComponent(sessionId)}`);
  } catch {
    return null;
  }
}

/**
 * Cancel an in-progress workflow.
 */
export async function cancelAiWorkflow(sessionId: string): Promise<void> {
  await apiFetch("/admin/ai/workflow", {
    method: "DELETE",
    body: JSON.stringify({ sessionId }),
  });
}

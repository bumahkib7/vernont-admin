import { apiFetch } from "./client";

// ============================================================================
// Types
// ============================================================================

export type TicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING_ON_CUSTOMER"
  | "RESOLVED"
  | "CLOSED";

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type TicketCategory =
  | "ORDER_ISSUE"
  | "PRODUCT_INQUIRY"
  | "RETURN_REQUEST"
  | "SHIPPING"
  | "BILLING"
  | "ACCOUNT"
  | "OTHER";

export interface TicketAssignee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
}

export interface TicketCustomer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface TicketSummary {
  id: string;
  ticketNumber: number;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  customer: TicketCustomer;
  assignee?: TicketAssignee;
  slaBreached: boolean;
  slaDueAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketsResponse {
  tickets: TicketSummary[];
  count: number;
  page: number;
  limit: number;
}

export interface TicketsQueryParams {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  category?: TicketCategory[];
  assignedTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface BulkTicketUpdateRequest {
  ticketIds: string[];
  status?: TicketStatus;
  priority?: TicketPriority;
  assigneeId?: string;
}

// ============================================================================
// API Functions
// ============================================================================

export async function getTickets(
  params?: TicketsQueryParams
): Promise<TicketsResponse> {
  const searchParams = new URLSearchParams();

  if (params?.status?.length) {
    params.status.forEach((s) => searchParams.append("status", s));
  }
  if (params?.priority?.length) {
    params.priority.forEach((p) => searchParams.append("priority", p));
  }
  if (params?.category?.length) {
    params.category.forEach((c) => searchParams.append("category", c));
  }
  if (params?.assignedTo) searchParams.set("assignedTo", params.assignedTo);
  if (params?.search) searchParams.set("search", params.search);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));

  const qs = searchParams.toString();
  return apiFetch<TicketsResponse>(
    `/admin/support/tickets${qs ? `?${qs}` : ""}`
  );
}

export async function bulkUpdateTickets(
  data: BulkTicketUpdateRequest
): Promise<void> {
  return apiFetch<void>("/admin/support/tickets/bulk", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function getAssignableUsers(): Promise<TicketAssignee[]> {
  return apiFetch<TicketAssignee[]>("/admin/internal-users/assignable");
}

// ============================================================================
// Ticket Creation
// ============================================================================

export interface CreateTicketInput {
  customerEmail: string;
  customerName?: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  category: TicketCategory;
  assigneeId?: string;
  orderNumber?: string;
  tags?: string[];
}

export type TicketSource =
  | "CONTACT_FORM"
  | "LIVE_CHAT"
  | "EMAIL"
  | "PHONE"
  | "ADMIN";

export type TicketMessageType = "REPLY" | "INTERNAL_NOTE" | "SYSTEM";

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderUserId: string;
  senderName: string;
  senderRole: "CUSTOMER" | "ADMIN";
  messageType: TicketMessageType;
  body: string;
  createdAt: string;
}

export interface TicketEvent {
  id: string;
  ticketId: string;
  eventType: string;
  description: string;
  actorName: string;
  actorRole: "CUSTOMER" | "ADMIN" | "SYSTEM";
  createdAt: string;
}

export interface TicketSla {
  firstResponseDeadline: string;
  firstResponseMet: boolean | null;
  resolutionDeadline: string;
  resolutionMet: boolean | null;
}

export interface TicketDetail {
  id: string;
  ticketNumber: number;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  source: TicketSource;
  customer: TicketCustomer & {
    previousTicketCount: number;
    customerSince: string;
  };
  assignee?: TicketAssignee;
  sla: TicketSla;
  linkedOrderId?: string;
  linkedChatId?: string;
  tags: string[];
  messages: TicketMessage[];
  events: TicketEvent[];
  createdAt: string;
  updatedAt: string;
}

export async function createTicket(
  data: CreateTicketInput
): Promise<TicketDetail> {
  return apiFetch<TicketDetail>("/admin/support/tickets", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ============================================================================
// Ticket Detail API Functions
// ============================================================================

export async function getTicket(ticketId: string): Promise<TicketDetail> {
  return apiFetch<TicketDetail>(
    `/admin/support/tickets/${ticketId}`
  );
}

export async function replyToTicket(
  ticketId: string,
  data: { body: string; messageType: TicketMessageType }
): Promise<TicketMessage> {
  return apiFetch<TicketMessage>(
    `/admin/support/tickets/${ticketId}/reply`,
    { method: "POST", body: JSON.stringify(data) }
  );
}

export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus
): Promise<void> {
  return apiFetch<void>(
    `/admin/support/tickets/${ticketId}/status`,
    { method: "PATCH", body: JSON.stringify({ status }) }
  );
}

export async function updateTicketPriority(
  ticketId: string,
  priority: TicketPriority
): Promise<void> {
  return apiFetch<void>(
    `/admin/support/tickets/${ticketId}/priority`,
    { method: "PATCH", body: JSON.stringify({ priority }) }
  );
}

export async function assignTicket(
  ticketId: string,
  assigneeId: string
): Promise<void> {
  return apiFetch<void>(
    `/admin/support/tickets/${ticketId}/assign`,
    { method: "POST", body: JSON.stringify({ assigneeId }) }
  );
}

export async function updateTicketTags(
  ticketId: string,
  tags: string[]
): Promise<void> {
  return apiFetch<void>(
    `/admin/support/tickets/${ticketId}/tags`,
    { method: "PATCH", body: JSON.stringify({ tags }) }
  );
}

// ============================================================================
// Canned Responses
// ============================================================================

export interface CannedResponse {
  id: string;
  title: string;
  body: string;
  category: string;
  shortcut?: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CannedResponsesResponse {
  items: CannedResponse[];
  count: number;
}

export interface CreateCannedResponseInput {
  title: string;
  body: string;
  category: string;
  shortcut?: string;
}

export interface UpdateCannedResponseInput {
  title?: string;
  body?: string;
  category?: string;
  shortcut?: string;
}

export async function getCannedResponses(params?: {
  category?: string;
  search?: string;
}): Promise<CannedResponsesResponse> {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.set("category", params.category);
  if (params?.search) searchParams.set("search", params.search);
  const qs = searchParams.toString();
  return apiFetch<CannedResponsesResponse>(
    `/admin/support/canned-responses${qs ? `?${qs}` : ""}`
  );
}

export async function createCannedResponse(
  data: CreateCannedResponseInput
): Promise<CannedResponse> {
  return apiFetch<CannedResponse>("/admin/support/canned-responses", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCannedResponse(
  id: string,
  data: UpdateCannedResponseInput
): Promise<CannedResponse> {
  return apiFetch<CannedResponse>(
    `/admin/support/canned-responses/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
}

export async function deleteCannedResponse(id: string): Promise<void> {
  return apiFetch<void>(`/admin/support/canned-responses/${id}`, {
    method: "DELETE",
  });
}

// ============================================================================
// SLA Policies
// ============================================================================

export interface SlaPolicy {
  id: string;
  priority: TicketPriority;
  firstResponseMinutes: number;
  resolutionMinutes: number;
  active: boolean;
  updatedAt: string;
}

export interface SlaPoliciesResponse {
  policies: SlaPolicy[];
}

export interface UpdateSlaPolicyInput {
  firstResponseMinutes?: number;
  resolutionMinutes?: number;
  active?: boolean;
}

export async function getSlaPolicies(): Promise<SlaPoliciesResponse> {
  return apiFetch<SlaPoliciesResponse>(
    "/admin/support/sla-policies"
  );
}

export async function updateSlaPolicy(
  id: string,
  data: UpdateSlaPolicyInput
): Promise<SlaPolicy> {
  return apiFetch<SlaPolicy>(`/admin/support/sla-policies/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ============================================================================
// Dashboard Stats
// ============================================================================

export interface SupportStats {
  openTickets: number;
  avgResponseTimeMinutes: number;
  avgResolutionTimeMinutes: number;
  slaCompliancePercent: number;
  ticketsByStatus: Record<string, number>;
  ticketsByPriority: Record<string, number>;
}

export async function getSupportStats(): Promise<SupportStats> {
  return apiFetch<SupportStats>("/admin/support/stats");
}

export interface OverdueTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  customerName: string;
  priority: TicketPriority;
  overdueByMinutes: number;
  createdAt: string;
}

export async function getOverdueTickets(): Promise<OverdueTicket[]> {
  return apiFetch<OverdueTicket[]>("/admin/support/overdue");
}

export interface SupportActivityEvent {
  id: string;
  type: "CREATED" | "REPLIED" | "ASSIGNED" | "STATUS_CHANGED" | "RESOLVED" | "CLOSED" | "ESCALATED" | "NOTE_ADDED";
  ticketNumber: string;
  subject: string;
  actorName: string | null;
  message: string;
  timestamp: string;
}

export async function getSupportActivity(limit: number = 10): Promise<SupportActivityEvent[]> {
  return apiFetch<SupportActivityEvent[]>(`/admin/support/activity?limit=${limit}`);
}

// ============================================================================
// Customer Search (for ticket creation)
// ============================================================================

export async function searchCustomersForSupport(
  query: string
): Promise<TicketCustomer[]> {
  return apiFetch<TicketCustomer[]>(
    `/admin/customers/search?q=${encodeURIComponent(query)}&limit=10`
  );
}

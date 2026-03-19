import { apiFetch } from "./client";

// =============================================================================
// Returns API
// =============================================================================

export type ReturnStatus = "REQUESTED" | "APPROVED" | "RECEIVED" | "REFUNDED" | "REJECTED" | "CANCELED";

export interface ReturnItem {
  id: string;
  orderLineItemId: string;
  variantId?: string;
  title: string;
  description?: string;
  thumbnail?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Return {
  id: string;
  orderId: string;
  orderDisplayId?: number;
  customerId?: string;
  customerEmail?: string;
  status: string;
  reason: string;
  reasonNote?: string;
  refundAmount: number;
  currencyCode: string;
  items: ReturnItem[];
  requestedAt: string;
  approvedAt?: string;
  receivedAt?: string;
  refundedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  returnDeadline: string;
  daysRemaining: number;
  refundId?: string;
  canReceive: boolean;
  canRefund: boolean;
  canReject: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnSummary {
  id: string;
  orderId: string;
  orderDisplayId?: number;
  customerEmail?: string;
  status: string;
  reason: string;
  refundAmount: number;
  currencyCode: string;
  itemCount: number;
  requestedAt: string;
  canReceive: boolean;
  canRefund: boolean;
}

export interface ReturnsResponse {
  returns: ReturnSummary[];
  count: number;
  offset: number;
  limit: number;
}

export interface ReturnStats {
  pending: number;
  received: number;
  refunded: number;
  rejected: number;
  total: number;
}

// Get all returns
export async function getReturns(params?: {
  limit?: number;
  offset?: number;
  status?: string;
  q?: string;
}): Promise<ReturnsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());
  if (params?.status) searchParams.set("status", params.status);
  if (params?.q) searchParams.set("q", params.q);

  const query = searchParams.toString();
  return apiFetch<ReturnsResponse>(`/admin/returns${query ? `?${query}` : ""}`);
}

// Get single return
export async function getReturn(id: string): Promise<{ return_request: Return }> {
  return apiFetch<{ return_request: Return }>(`/admin/returns/${id}`);
}

// Get return stats
export async function getReturnStats(): Promise<ReturnStats> {
  return apiFetch<ReturnStats>("/admin/returns/stats");
}

// Mark return as received
export async function receiveReturn(
  id: string,
  data?: { receivedBy?: string; notes?: string }
): Promise<{ return_request: Return; message: string }> {
  return apiFetch<{ return_request: Return; message: string }>(`/admin/returns/${id}/receive`, {
    method: "POST",
    body: JSON.stringify(data || {}),
  });
}

// Process refund for return
export async function processReturnRefund(
  id: string,
  data?: { processedBy?: string }
): Promise<{ return_request: Return; message: string }> {
  return apiFetch<{ return_request: Return; message: string }>(`/admin/returns/${id}/refund`, {
    method: "POST",
    body: JSON.stringify(data || {}),
  });
}

// Reject return
export async function rejectReturn(
  id: string,
  data: { reason: string; rejectedBy?: string }
): Promise<{ return_request: Return; message: string }> {
  return apiFetch<{ return_request: Return; message: string }>(`/admin/returns/${id}/reject`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Return status display helper
export function getReturnStatusDisplay(status: string): { label: string; color: string } {
  const config: Record<string, { label: string; color: string }> = {
    requested: { label: "Requested", color: "bg-yellow-500" },
    approved: { label: "Approved", color: "bg-green-500" },
    received: { label: "Received", color: "bg-blue-500" },
    refunded: { label: "Refunded", color: "bg-purple-500" },
    rejected: { label: "Rejected", color: "bg-red-500" },
    canceled: { label: "Canceled", color: "bg-gray-500" },
  };
  return config[status.toLowerCase()] || { label: status, color: "bg-gray-400" };
}

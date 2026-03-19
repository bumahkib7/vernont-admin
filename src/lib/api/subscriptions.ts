import { apiFetch } from "./client";

// ============================================================
// Subscription types and API functions
// ============================================================

export type SubscriptionPlanInterval = "MONTHLY" | "YEARLY" | "WEEKLY";
export type SubscriptionPlanStatus = "ACTIVE" | "ARCHIVED";
export type SubscriptionStatus = "ACTIVE" | "PAUSED" | "CANCELLED" | "TRIALING" | "PAST_DUE" | "EXPIRED";

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  interval: SubscriptionPlanInterval;
  trialDays: number;
  features: string[];
  status: SubscriptionPlanStatus;
  subscriberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubscriptionPlanInput {
  name: string;
  description?: string;
  price: number;
  currency: string;
  interval: SubscriptionPlanInterval;
  trialDays?: number;
  features?: string[];
}

export interface UpdateSubscriptionPlanInput {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  interval?: SubscriptionPlanInterval;
  trialDays?: number;
  features?: string[];
  status?: SubscriptionPlanStatus;
}

export interface Subscription {
  id: string;
  customerId: string;
  customerEmail: string;
  customerName?: string;
  planId: string;
  planName: string;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextBillingDate?: string;
  cancelledAt?: string;
  pausedAt?: string;
  trialEnd?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlansResponse {
  plans: SubscriptionPlan[];
  count: number;
  offset: number;
  limit: number;
}

export interface SubscriptionsResponse {
  subscriptions: Subscription[];
  count: number;
  offset: number;
  limit: number;
}

export async function getSubscriptionPlans(params?: {
  limit?: number;
  offset?: number;
}): Promise<SubscriptionPlansResponse> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());
  const query = searchParams.toString();
  return apiFetch<SubscriptionPlansResponse>(
    `/admin/subscriptions/plans${query ? `?${query}` : ""}`
  );
}

export async function getSubscriptionPlan(id: string): Promise<SubscriptionPlan> {
  return apiFetch<SubscriptionPlan>(`/admin/subscriptions/plans/${id}`);
}

export async function createSubscriptionPlan(
  data: CreateSubscriptionPlanInput
): Promise<SubscriptionPlan> {
  return apiFetch<SubscriptionPlan>("/admin/subscriptions/plans", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateSubscriptionPlan(
  id: string,
  data: UpdateSubscriptionPlanInput
): Promise<SubscriptionPlan> {
  return apiFetch<SubscriptionPlan>(`/admin/subscriptions/plans/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteSubscriptionPlan(id: string): Promise<void> {
  await apiFetch<void>(`/admin/subscriptions/plans/${id}`, {
    method: "DELETE",
  });
}

export async function getSubscriptions(params?: {
  limit?: number;
  offset?: number;
  status?: SubscriptionStatus;
}): Promise<SubscriptionsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());
  if (params?.status) searchParams.set("status", params.status);
  const query = searchParams.toString();
  return apiFetch<SubscriptionsResponse>(
    `/admin/subscriptions${query ? `?${query}` : ""}`
  );
}

export async function getSubscription(id: string): Promise<Subscription> {
  return apiFetch<Subscription>(`/admin/subscriptions/${id}`);
}

export async function cancelSubscription(id: string): Promise<Subscription> {
  return apiFetch<Subscription>(`/admin/subscriptions/${id}/cancel`, {
    method: "POST",
  });
}

export async function pauseSubscription(id: string): Promise<Subscription> {
  return apiFetch<Subscription>(`/admin/subscriptions/${id}/pause`, {
    method: "POST",
  });
}

export async function resumeSubscription(id: string): Promise<Subscription> {
  return apiFetch<Subscription>(`/admin/subscriptions/${id}/resume`, {
    method: "POST",
  });
}

export function getSubscriptionStatusDisplay(status: SubscriptionStatus): { label: string; color: string } {
  switch (status) {
    case "ACTIVE":
      return { label: "Active", color: "bg-green-500" };
    case "PAUSED":
      return { label: "Paused", color: "bg-yellow-500" };
    case "CANCELLED":
      return { label: "Cancelled", color: "bg-red-500" };
    case "TRIALING":
      return { label: "Trialing", color: "bg-blue-500" };
    case "PAST_DUE":
      return { label: "Past Due", color: "bg-orange-500" };
    case "EXPIRED":
      return { label: "Expired", color: "bg-gray-500" };
    default:
      return { label: status, color: "bg-gray-400" };
  }
}

export function getSubscriptionPlanStatusDisplay(status: SubscriptionPlanStatus): { label: string; color: string } {
  switch (status) {
    case "ACTIVE":
      return { label: "Active", color: "bg-green-500" };
    case "ARCHIVED":
      return { label: "Archived", color: "bg-gray-500" };
    default:
      return { label: status, color: "bg-gray-400" };
  }
}

export function formatInterval(interval: SubscriptionPlanInterval): string {
  switch (interval) {
    case "MONTHLY":
      return "Monthly";
    case "YEARLY":
      return "Yearly";
    case "WEEKLY":
      return "Weekly";
    default:
      return interval;
  }
}

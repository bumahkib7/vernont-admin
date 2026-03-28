"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerOrders,
  getCustomerActivity,
  getCustomerStats,
  sendCustomerEmail,
  sendGiftCard,
  changeCustomerTier,
  suspendCustomer,
  activateCustomer,
  resetCustomerPassword,
  getCustomerGroups,
  type CustomerTier,
  type CustomerStatus,
  type CustomersResponse,
  type Customer,
  type CustomerStats,
  type CustomerActivityResponse,
  type CreateCustomerRequest,
  type UpdateCustomerRequest,
  type SendEmailRequest,
  type SendGiftCardRequest,
  type ChangeTierRequest,
  type SuspendCustomerRequest,
  type CustomerGroupsResponse,
} from "@/lib/api/customers";
import type { OrdersResponse } from "@/lib/api/orders";

// =============================================================================
// Query Keys — centralized for cache invalidation consistency
// =============================================================================

export const customerKeys = {
  all: ["customers"] as const,
  lists: () => [...customerKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) => [...customerKeys.lists(), filters] as const,
  details: () => [...customerKeys.all, "detail"] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
  orders: (id: string) => [...customerKeys.detail(id), "orders"] as const,
  activity: (id: string) => [...customerKeys.detail(id), "activity"] as const,
  stats: () => [...customerKeys.all, "stats"] as const,
  groups: () => [...customerKeys.all, "groups"] as const,
};

// =============================================================================
// Query Hooks — server state via React Query
// =============================================================================

interface UseCustomersListParams {
  search?: string;
  tier?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

/**
 * Fetch paginated + filtered customer list.
 * Debounce the search input at the call site before passing it here.
 */
export function useCustomersList(params: UseCustomersListParams = {}) {
  const { search, tier, status, limit = 50, offset } = params;

  const queryParams: Record<string, unknown> = {
    limit,
    ...(offset && { offset }),
    ...(search && { q: search }),
    ...(tier && tier !== "all" && { tier: tier as CustomerTier }),
    ...(status && status !== "all" && { status: status as CustomerStatus }),
  };

  return useQuery<CustomersResponse>({
    queryKey: customerKeys.list(queryParams),
    queryFn: () =>
      getCustomers({
        limit,
        ...(offset && { offset }),
        ...(search && { q: search }),
        ...(tier && tier !== "all" && { tier: tier as CustomerTier }),
        ...(status && status !== "all" && { status: status as CustomerStatus }),
      }),
    staleTime: 30_000,
  });
}

/**
 * Fetch a single customer by ID.
 */
export function useCustomerDetail(id: string) {
  return useQuery<Customer>({
    queryKey: customerKeys.detail(id),
    queryFn: async () => {
      const { customer } = await getCustomer(id);
      return customer;
    },
    enabled: !!id,
  });
}

/**
 * Fetch orders for a specific customer.
 */
export function useCustomerOrders(customerId: string, limit = 20) {
  return useQuery<OrdersResponse>({
    queryKey: customerKeys.orders(customerId),
    queryFn: () => getCustomerOrders(customerId, { limit }),
    enabled: !!customerId,
  });
}

/**
 * Fetch activity timeline for a customer.
 */
export function useCustomerActivity(customerId: string, limit = 20) {
  return useQuery<CustomerActivityResponse>({
    queryKey: customerKeys.activity(customerId),
    queryFn: () => getCustomerActivity(customerId, { limit }),
    enabled: !!customerId,
  });
}

/**
 * Fetch customer stats (totals, tiers, revenue).
 */
export function useCustomerStats() {
  return useQuery<CustomerStats>({
    queryKey: customerKeys.stats(),
    queryFn: getCustomerStats,
    staleTime: 60_000,
  });
}

/**
 * Fetch customer groups.
 */
export function useCustomerGroups(params?: { limit?: number; offset?: number }) {
  return useQuery<CustomerGroupsResponse>({
    queryKey: customerKeys.groups(),
    queryFn: () => getCustomerGroups(params),
    staleTime: 60_000,
  });
}

// =============================================================================
// Mutation Hooks — write operations with automatic cache invalidation
// =============================================================================

/**
 * Create a new customer.
 */
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCustomerRequest) => createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.stats() });
      toast.success("Customer created");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create customer");
    },
  });
}

/**
 * Update an existing customer.
 */
export function useUpdateCustomer(customerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCustomerRequest) => updateCustomer(customerId, data),
    onSuccess: ({ customer }) => {
      queryClient.setQueryData(customerKeys.detail(customerId), customer);
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      toast.success("Customer updated");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update customer");
    },
  });
}

/**
 * Delete a customer.
 */
export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: customerKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.stats() });
      toast.success("Customer deleted");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete customer");
    },
  });
}

/**
 * Send email to a customer.
 */
export function useSendCustomerEmail(customerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SendEmailRequest) => sendCustomerEmail(customerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.activity(customerId) });
      toast.success("Email sent successfully");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to send email");
    },
  });
}

/**
 * Send gift card to a customer.
 */
export function useSendGiftCard(customerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SendGiftCardRequest) => sendGiftCard(customerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.activity(customerId) });
      toast.success("Gift card sent successfully");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to send gift card");
    },
  });
}

/**
 * Change a customer's tier.
 */
export function useChangeCustomerTier(customerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ChangeTierRequest) => changeCustomerTier(customerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(customerId) });
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.stats() });
      queryClient.invalidateQueries({ queryKey: customerKeys.activity(customerId) });
      toast.success("Customer tier changed");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to change tier");
    },
  });
}

/**
 * Suspend a customer account.
 */
export function useSuspendCustomer(customerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SuspendCustomerRequest) => suspendCustomer(customerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(customerId) });
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.stats() });
      queryClient.invalidateQueries({ queryKey: customerKeys.activity(customerId) });
      toast.success("Customer account suspended");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to suspend customer");
    },
  });
}

/**
 * Activate a suspended customer account.
 */
export function useActivateCustomer(customerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => activateCustomer(customerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(customerId) });
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.stats() });
      queryClient.invalidateQueries({ queryKey: customerKeys.activity(customerId) });
      toast.success("Customer account activated");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to activate customer");
    },
  });
}

/**
 * Reset a customer's password.
 */
export function useResetCustomerPassword(customerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => resetCustomerPassword(customerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.activity(customerId) });
      toast.success("Password reset email sent");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to reset password");
    },
  });
}

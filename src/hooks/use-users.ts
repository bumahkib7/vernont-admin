"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getInternalUsers,
  getInternalUser,
  createInternalUser,
  updateInternalUser,
  archiveInternalUser,
  hardDeleteInternalUser,
  restoreInternalUser,
  inviteInternalUser,
  resendInvite,
  type InternalUsersResponse,
  type InternalUserResponse,
  type CreateInternalUserRequest,
  type UpdateInternalUserRequest,
  type InviteInternalUserRequest,
  type InviteInternalUserResponse,
} from "@/lib/api";

// ============================================================================
// Query Keys
// ============================================================================

export const userKeys = {
  all: ["internal-users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (params?: { limit?: number; offset?: number }) =>
    [...userKeys.lists(), params] as const,
  detail: (id: string) => [...userKeys.all, "detail", id] as const,
};

// ============================================================================
// Queries
// ============================================================================

/**
 * Fetch all internal users.
 */
export function useInternalUsers(params?: { limit?: number; offset?: number }) {
  return useQuery<InternalUsersResponse>({
    queryKey: userKeys.list(params),
    queryFn: () => getInternalUsers(params),
    staleTime: 30_000,
  });
}

/**
 * Fetch a single internal user by ID.
 */
export function useInternalUser(userId: string, enabled = true) {
  return useQuery<InternalUserResponse>({
    queryKey: userKeys.detail(userId),
    queryFn: () => getInternalUser(userId),
    enabled: enabled && !!userId,
    staleTime: 30_000,
  });
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Create a new internal user directly (with password).
 */
export function useCreateInternalUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInternalUserRequest) => createInternalUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

/**
 * Invite an internal user via email.
 */
export function useInviteInternalUser() {
  const queryClient = useQueryClient();

  return useMutation<InviteInternalUserResponse, Error, InviteInternalUserRequest>({
    mutationFn: (data) => inviteInternalUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

/**
 * Update an internal user.
 */
export function useUpdateInternalUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateInternalUserRequest }) =>
      updateInternalUser(userId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.userId) });
    },
  });
}

/**
 * Archive (soft-delete) an internal user.
 */
export function useArchiveInternalUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => archiveInternalUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

/**
 * Permanently delete an internal user. Cannot be undone.
 */
export function useHardDeleteInternalUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => hardDeleteInternalUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

/**
 * Restore an archived internal user.
 */
export function useRestoreInternalUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => restoreInternalUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

/**
 * Resend invitation email to a pending user.
 */
export function useResendInvite() {
  return useMutation({
    mutationFn: (userId: string) => resendInvite(userId),
  });
}

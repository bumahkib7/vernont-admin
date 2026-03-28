"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPendingReviews,
  getFlaggedReviews,
  getApprovedReviews,
  getReviewStats,
  moderateReview,
  addAdminResponse,
  featureReview,
  deleteReviewAdmin,
  type AdminReview,
  type ReviewListResponse,
  type ReviewStats,
} from "@/lib/api";

// ============================================================================
// Query Keys
// ============================================================================

export const reviewKeys = {
  all: ["reviews"] as const,
  pending: (page: number) => [...reviewKeys.all, "pending", page] as const,
  flagged: (page: number) => [...reviewKeys.all, "flagged", page] as const,
  approved: (page: number) => [...reviewKeys.all, "approved", page] as const,
  stats: () => [...reviewKeys.all, "stats"] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook for fetching pending reviews (awaiting moderation).
 */
export function usePendingReviews(page = 0, size = 20) {
  return useQuery<ReviewListResponse>({
    queryKey: reviewKeys.pending(page),
    queryFn: () => getPendingReviews(page, size),
    staleTime: 15000,
  });
}

/**
 * Hook for fetching flagged reviews (reported by users).
 */
export function useFlaggedReviews(page = 0, size = 20) {
  return useQuery<ReviewListResponse>({
    queryKey: reviewKeys.flagged(page),
    queryFn: () => getFlaggedReviews(page, size),
    staleTime: 15000,
  });
}

/**
 * Hook for fetching approved reviews.
 */
export function useApprovedReviews(page = 0, size = 20) {
  return useQuery<ReviewListResponse>({
    queryKey: reviewKeys.approved(page),
    queryFn: () => getApprovedReviews(page, size),
    staleTime: 15000,
  });
}

/**
 * Hook for fetching review statistics.
 */
export function useReviewStats() {
  return useQuery<ReviewStats>({
    queryKey: reviewKeys.stats(),
    queryFn: getReviewStats,
    staleTime: 30000,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Invalidate all review-related queries.
 * Used after mutations that affect multiple tabs (approve, reject, delete).
 */
function useInvalidateAllReviews() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: reviewKeys.all });
  };
}

/**
 * Hook for moderating a review (approve or reject).
 */
export function useModerateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
      approved,
      note,
    }: {
      reviewId: string;
      approved: boolean;
      note?: string;
    }) => moderateReview(reviewId, approved, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
  });
}

/**
 * Hook for adding an admin response to a review.
 */
export function useAddAdminResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, response }: { reviewId: string; response: string }) =>
      addAdminResponse(reviewId, response),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
  });
}

/**
 * Hook for toggling featured status on a review.
 */
export function useFeatureReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, featured }: { reviewId: string; featured: boolean }) =>
      featureReview(reviewId, featured),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
  });
}

/**
 * Hook for deleting a review.
 */
export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, reason }: { reviewId: string; reason: string }) =>
      deleteReviewAdmin(reviewId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
  });
}

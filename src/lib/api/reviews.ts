import { apiFetch } from "./client";

// ─── Reviews ────────────────────────────────────────────────────────────────

export interface AdminReview {
  id: string;
  productId: string;
  productTitle?: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  rating: number;
  title: string;
  content: string;
  status: string; // PENDING, APPROVED, REJECTED, FLAGGED, HIDDEN
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  notHelpfulCount: number;
  reportCount: number;
  adminResponse?: string;
  moderationVerdict?: string;
  toxicityScore?: number;
  profanityScore?: number;
  images?: Array<{ url: string; caption?: string }>;
  featured?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewListResponse {
  reviews: AdminReview[];
  total: number;
}

export interface ReviewStats {
  pending: number;
  flagged: number;
  averageRating: number;
  total: number;
}

export async function getPendingReviews(page = 0, size = 20): Promise<ReviewListResponse> {
  return apiFetch<ReviewListResponse>(`/admin/reviews/pending?page=${page}&size=${size}`);
}

export async function getFlaggedReviews(page = 0, size = 20): Promise<ReviewListResponse> {
  return apiFetch<ReviewListResponse>(`/admin/reviews/flagged?page=${page}&size=${size}`);
}

export async function getApprovedReviews(page = 0, size = 20): Promise<ReviewListResponse> {
  return apiFetch<ReviewListResponse>(`/admin/reviews/approved?page=${page}&size=${size}`);
}

export async function getReviewStats(): Promise<ReviewStats> {
  return apiFetch<ReviewStats>(`/admin/reviews/stats`);
}

export async function moderateReview(reviewId: string, approved: boolean, note?: string): Promise<AdminReview> {
  return apiFetch<AdminReview>(`/admin/reviews/${reviewId}/moderate`, {
    method: "POST",
    body: JSON.stringify({ approved, note }),
  });
}

export async function addAdminResponse(reviewId: string, response: string): Promise<AdminReview> {
  return apiFetch<AdminReview>(`/admin/reviews/${reviewId}/response`, {
    method: "POST",
    body: JSON.stringify({ response }),
  });
}

export async function featureReview(reviewId: string, featured: boolean): Promise<AdminReview> {
  return apiFetch<AdminReview>(`/admin/reviews/${reviewId}/featured`, {
    method: "POST",
    body: JSON.stringify({ featured }),
  });
}

export async function deleteReviewAdmin(reviewId: string, reason: string): Promise<void> {
  return apiFetch<void>(`/admin/reviews/${reviewId}`, {
    method: "DELETE",
    body: JSON.stringify({ reason }),
  });
}

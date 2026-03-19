"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Star,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Flag,
  ShieldAlert,
  MessageSquare,
  Trash2,
  Eye,
  EyeOff,
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  ImageIcon,
} from "lucide-react";
import {
  getPendingReviews,
  getFlaggedReviews,
  getApprovedReviews,
  getReviewStats,
  moderateReview,
  addAdminResponse,
  featureReview,
  deleteReviewAdmin,
  formatDate,
  resolveImageUrl,
  type AdminReview,
  type ReviewStats,
} from "@/lib/api";
import { usePageContext } from "@/hooks/use-page-context";
import { useConfirm } from "@/hooks/use-confirm";

// ─── Star Rating ────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-muted text-muted"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Moderation Score Badge ─────────────────────────────────────────────────

function ModerationBadge({ label, score }: { label: string; score?: number }) {
  if (score === undefined || score === null) return null;
  const color =
    score > 0.7
      ? "bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-400"
      : score > 0.4
      ? "bg-yellow-100 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-400"
      : "bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-400";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      {label}: {(score * 100).toFixed(0)}%
    </span>
  );
}

// ─── Review Card (Pending / Flagged) ────────────────────────────────────────

function ReviewCard({
  review,
  variant,
  onApprove,
  onReject,
  onRespond,
  onDelete,
  actionLoading,
}: {
  review: AdminReview;
  variant: "pending" | "flagged";
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRespond: (id: string) => void;
  onDelete?: (id: string) => void;
  actionLoading: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLoading = actionLoading === review.id;
  const contentTruncated = review.content.length > 200;

  return (
    <Card className="relative">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-3">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              <StarRating rating={review.rating} />
              {review.isVerifiedPurchase && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <BadgeCheck className="h-3 w-3" />
                  Verified Purchase
                </Badge>
              )}
              {variant === "flagged" && review.reportCount > 0 && (
                <Badge variant="destructive" className="gap-1 text-xs">
                  <Flag className="h-3 w-3" />
                  {review.reportCount} report{review.reportCount !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDate(review.createdAt)}
            </span>
          </div>

          {/* Customer & Product */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm">
            <span className="font-medium">
              {review.customerName || "Anonymous"}
            </span>
            {review.customerEmail && (
              <span className="text-muted-foreground">{review.customerEmail}</span>
            )}
            {review.productTitle && (
              <Link
                href={`/products/${review.productId}`}
                className="text-blue-600 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {review.productTitle}
              </Link>
            )}
          </div>

          {/* Review title + content */}
          <div>
            {review.title && (
              <h4 className="font-semibold text-sm mb-1">{review.title}</h4>
            )}
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {expanded || !contentTruncated
                ? review.content
                : review.content.slice(0, 200) + "..."}
            </p>
            {contentTruncated && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 h-6 px-2 text-xs"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Show more
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Images */}
          {review.images && review.images.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {review.images.map((img, idx) => {
                const src = resolveImageUrl(img.url);
                return src ? (
                  <a
                    key={idx}
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block h-16 w-16 rounded border overflow-hidden bg-muted"
                  >
                    <img
                      src={src}
                      alt={img.caption || `Review image ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </a>
                ) : (
                  <div
                    key={idx}
                    className="flex items-center justify-center h-16 w-16 rounded border bg-muted"
                  >
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                );
              })}
            </div>
          )}

          {/* Moderation scores */}
          {(review.toxicityScore !== undefined || review.profanityScore !== undefined) && (
            <div className="flex items-center gap-2 flex-wrap">
              <ModerationBadge label="Toxicity" score={review.toxicityScore} />
              <ModerationBadge label="Profanity" score={review.profanityScore} />
              {review.moderationVerdict && (
                <Badge variant="outline" className="text-xs">
                  {review.moderationVerdict}
                </Badge>
              )}
            </div>
          )}

          {/* Helpful / not helpful counts */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{review.helpfulCount} helpful</span>
            <span>{review.notHelpfulCount} not helpful</span>
          </div>

          {/* Admin response if already present */}
          {review.adminResponse && (
            <div className="mt-2 p-3 bg-muted rounded-md">
              <p className="text-xs font-medium mb-1">Admin Response:</p>
              <p className="text-sm">{review.adminResponse}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t">
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={isLoading}
              onClick={() => onApprove(review.id)}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={isLoading}
              onClick={() => onReject(review.id)}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isLoading}
              onClick={() => onRespond(review.id)}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Respond
            </Button>
            {variant === "flagged" && onDelete && (
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                disabled={isLoading}
                onClick={() => onDelete(review.id)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
            {isLoading && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function ReviewsPage() {
  usePageContext("reviews");
  const [ConfirmDialog, confirm] = useConfirm();

  // Data
  const [pendingReviews, setPendingReviews] = useState<AdminReview[]>([]);
  const [flaggedReviews, setFlaggedReviews] = useState<AdminReview[]>([]);
  const [approvedReviews, setApprovedReviews] = useState<AdminReview[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);

  // Pagination
  const [pendingPage, setPendingPage] = useState(0);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [flaggedPage, setFlaggedPage] = useState(0);
  const [flaggedTotal, setFlaggedTotal] = useState(0);
  const [approvedPage, setApprovedPage] = useState(0);
  const [approvedTotal, setApprovedTotal] = useState(0);

  // Loading / error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Dialogs
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; reviewId: string }>({
    open: false,
    reviewId: "",
  });
  const [rejectReason, setRejectReason] = useState("");
  const [respondDialog, setRespondDialog] = useState<{ open: boolean; reviewId: string }>({
    open: false,
    reviewId: "",
  });
  const [respondText, setRespondText] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; reviewId: string }>({
    open: false,
    reviewId: "",
  });
  const [deleteReason, setDeleteReason] = useState("");

  const [activeTab, setActiveTab] = useState("pending");

  // ─── Fetchers ───────────────────────────────────────────────────────────

  const fetchPending = useCallback(async () => {
    try {
      const res = await getPendingReviews(pendingPage);
      setPendingReviews(res.reviews);
      setPendingTotal(res.total);
    } catch (err) {
      console.error("Failed to fetch pending reviews:", err);
    }
  }, [pendingPage]);

  const fetchFlagged = useCallback(async () => {
    try {
      const res = await getFlaggedReviews(flaggedPage);
      setFlaggedReviews(res.reviews);
      setFlaggedTotal(res.total);
    } catch (err) {
      console.error("Failed to fetch flagged reviews:", err);
    }
  }, [flaggedPage]);

  const fetchApproved = useCallback(async () => {
    try {
      const res = await getApprovedReviews(approvedPage);
      setApprovedReviews(res.reviews);
      setApprovedTotal(res.total);
    } catch (err) {
      console.error("Failed to fetch approved reviews:", err);
    }
  }, [approvedPage]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await getReviewStats();
      setStats(res);
    } catch (err) {
      console.error("Failed to fetch review stats:", err);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchPending(), fetchFlagged(), fetchApproved(), fetchStats()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [fetchPending, fetchFlagged, fetchApproved, fetchStats]);

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    fetchPending();
  }, [pendingPage]);

  useEffect(() => {
    fetchFlagged();
  }, [flaggedPage]);

  useEffect(() => {
    fetchApproved();
  }, [approvedPage]);

  // ─── Actions ────────────────────────────────────────────────────────────

  const handleApprove = async (reviewId: string) => {
    setActionLoading(reviewId);
    try {
      await moderateReview(reviewId, true);
      await Promise.all([fetchPending(), fetchFlagged(), fetchApproved(), fetchStats()]);
    } catch (err) {
      console.error("Failed to approve review:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectDialog.reviewId) return;
    setActionLoading(rejectDialog.reviewId);
    try {
      await moderateReview(rejectDialog.reviewId, false, rejectReason || undefined);
      setRejectDialog({ open: false, reviewId: "" });
      setRejectReason("");
      await Promise.all([fetchPending(), fetchFlagged(), fetchApproved(), fetchStats()]);
    } catch (err) {
      console.error("Failed to reject review:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRespondSubmit = async () => {
    if (!respondDialog.reviewId || !respondText.trim()) return;
    setActionLoading(respondDialog.reviewId);
    try {
      await addAdminResponse(respondDialog.reviewId, respondText.trim());
      setRespondDialog({ open: false, reviewId: "" });
      setRespondText("");
      await Promise.all([fetchPending(), fetchFlagged(), fetchApproved()]);
    } catch (err) {
      console.error("Failed to add response:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deleteDialog.reviewId || !deleteReason.trim()) return;
    setActionLoading(deleteDialog.reviewId);
    try {
      await deleteReviewAdmin(deleteDialog.reviewId, deleteReason.trim());
      setDeleteDialog({ open: false, reviewId: "" });
      setDeleteReason("");
      await Promise.all([fetchPending(), fetchFlagged(), fetchApproved(), fetchStats()]);
    } catch (err) {
      console.error("Failed to delete review:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleFeatureToggle = async (review: AdminReview) => {
    setActionLoading(review.id);
    try {
      await featureReview(review.id, !review.featured);
      await fetchApproved();
    } catch (err) {
      console.error("Failed to toggle featured:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteApproved = async (reviewId: string) => {
    const ok = await confirm({
      title: "Delete Review",
      description: "Are you sure you want to permanently delete this review? This action cannot be undone.",
      confirmLabel: "Delete",
      variant: "destructive",
    });
    if (!ok) return;
    setActionLoading(reviewId);
    try {
      await deleteReviewAdmin(reviewId, "Deleted by admin");
      await Promise.all([fetchApproved(), fetchStats()]);
    } catch (err) {
      console.error("Failed to delete review:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Pagination helpers ─────────────────────────────────────────────────

  const PAGE_SIZE = 20;

  function PaginationBar({
    total,
    page,
    setPage,
  }: {
    total: number;
    page: number;
    setPage: (p: number) => void;
  }) {
    const totalPages = Math.ceil(total / PAGE_SIZE);
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
        <span>
          {page * PAGE_SIZE + 1} - {Math.min((page + 1) * PAGE_SIZE, total)} of {total}
        </span>
        <div className="flex items-center gap-2">
          <span>
            Page {page + 1} of {totalPages}
          </span>
          <Button variant="ghost" size="sm" disabled={page <= 0} onClick={() => setPage(page - 1)}>
            Prev
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
        <p className="text-muted-foreground">Moderate customer reviews</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending ?? "-"}</div>
            <p className="text-xs text-muted-foreground">Awaiting moderation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Flagged</CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.flagged ?? "-"}</div>
            <p className="text-xs text-muted-foreground">Reported by users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.averageRating !== undefined ? stats.averageRating.toFixed(1) : "-"}
            </div>
            <p className="text-xs text-muted-foreground">Across all reviews</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total ?? "-"}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={fetchAll} className="ml-auto">
            Retry
          </Button>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="pending">
              Pending
              {stats?.pending ? (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {stats.pending}
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="flagged">
              Flagged
              {stats?.flagged ? (
                <Badge variant="destructive" className="ml-2 text-xs">
                  {stats.flagged}
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="approved">All Approved</TabsTrigger>
          </TabsList>
          <Button variant="outline" size="icon" onClick={fetchAll} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>

        {/* ─── Pending Tab ──────────────────────────────────────────────── */}
        <TabsContent value="pending" className="mt-4">
          {loading && pendingReviews.length === 0 ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-8 w-48" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : pendingReviews.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="font-semibold text-lg">All caught up!</h3>
                <p className="text-muted-foreground">No pending reviews to moderate.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  variant="pending"
                  onApprove={handleApprove}
                  onReject={(id) => setRejectDialog({ open: true, reviewId: id })}
                  onRespond={(id) => setRespondDialog({ open: true, reviewId: id })}
                  actionLoading={actionLoading}
                />
              ))}
              <PaginationBar total={pendingTotal} page={pendingPage} setPage={setPendingPage} />
            </div>
          )}
        </TabsContent>

        {/* ─── Flagged Tab ──────────────────────────────────────────────── */}
        <TabsContent value="flagged" className="mt-4">
          {loading && flaggedReviews.length === 0 ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-8 w-48" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : flaggedReviews.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="font-semibold text-lg">No flagged reviews</h3>
                <p className="text-muted-foreground">No reviews have been reported by users.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {flaggedReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  variant="flagged"
                  onApprove={handleApprove}
                  onReject={(id) => setRejectDialog({ open: true, reviewId: id })}
                  onRespond={(id) => setRespondDialog({ open: true, reviewId: id })}
                  onDelete={(id) => setDeleteDialog({ open: true, reviewId: id })}
                  actionLoading={actionLoading}
                />
              ))}
              <PaginationBar total={flaggedTotal} page={flaggedPage} setPage={setFlaggedPage} />
            </div>
          )}
        </TabsContent>

        {/* ─── Approved Tab ─────────────────────────────────────────────── */}
        <TabsContent value="approved" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {loading && approvedReviews.length === 0 ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </div>
                  ))}
                </div>
              ) : approvedReviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg">No approved reviews</h3>
                  <p className="text-muted-foreground">Approved reviews will appear here.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Rating</TableHead>
                          <TableHead className="hidden md:table-cell">Title</TableHead>
                          <TableHead className="hidden sm:table-cell">Date</TableHead>
                          <TableHead>Featured</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {approvedReviews.map((review) => (
                          <TableRow key={review.id}>
                            <TableCell>
                              {review.productTitle ? (
                                <Link
                                  href={`/products/${review.productId}`}
                                  className="text-blue-600 hover:underline text-sm"
                                >
                                  {review.productTitle}
                                </Link>
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  {review.productId.slice(0, 8)}...
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">
                              {review.customerName || review.customerEmail || "-"}
                            </TableCell>
                            <TableCell>
                              <StarRating rating={review.rating} />
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm max-w-[200px] truncate">
                              {review.title || "-"}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                              {formatDate(review.createdAt)}
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={!!review.featured}
                                onCheckedChange={() => handleFeatureToggle(review)}
                                disabled={actionLoading === review.id}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setRespondDialog({ open: true, reviewId: review.id })
                                  }
                                  disabled={actionLoading === review.id}
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteApproved(review.id)}
                                  disabled={actionLoading === review.id}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <PaginationBar
                    total={approvedTotal}
                    page={approvedPage}
                    setPage={setApprovedPage}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── Reject Dialog ──────────────────────────────────────────────── */}
      <Dialog
        open={rejectDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setRejectDialog({ open: false, reviewId: "" });
            setRejectReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Review</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this review. This will be recorded for moderation logs.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection (optional)..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialog({ open: false, reviewId: "" });
                setRejectReason("");
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectSubmit}>
              Reject Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Respond Dialog ─────────────────────────────────────────────── */}
      <Dialog
        open={respondDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setRespondDialog({ open: false, reviewId: "" });
            setRespondText("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin Response</DialogTitle>
            <DialogDescription>
              Write a public response to this review. Customers will see this reply.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Write your response..."
            value={respondText}
            onChange={(e) => setRespondText(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRespondDialog({ open: false, reviewId: "" });
                setRespondText("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleRespondSubmit} disabled={!respondText.trim()}>
              Send Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Dialog ──────────────────────────────────────────────── */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialog({ open: false, reviewId: "" });
            setDeleteReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Review</DialogTitle>
            <DialogDescription>
              This will permanently remove the review. Please provide a reason.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Reason for deletion..."
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialog({ open: false, reviewId: "" });
                setDeleteReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSubmit}
              disabled={!deleteReason.trim()}
            >
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog />
    </div>
  );
}

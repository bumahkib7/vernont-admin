"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Loader2,
  Package,
  ImageIcon,
} from "lucide-react";
import { apiFetch, formatDate } from "@/lib/api";

type ClaimStatus = "OPEN" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "RESOLVED";

interface ClaimItem {
  id: string;
  productId?: string;
  variantId?: string;
  productTitle: string;
  quantity: number;
  reason?: string;
}

interface ClaimImage {
  id: string;
  url: string;
  caption?: string;
}

interface ClaimDetail {
  id: string;
  orderId: string;
  customerId?: string;
  claimType: string;
  status: ClaimStatus;
  resolution?: string;
  description?: string;
  internalNotes?: string;
  items: ClaimItem[];
  images: ClaimImage[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  OPEN: { label: "Open", color: "bg-blue-100 dark:bg-blue-950/30 text-blue-800 dark:text-blue-400", icon: Clock },
  UNDER_REVIEW: { label: "Under Review", color: "bg-yellow-100 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-400", icon: Eye },
  APPROVED: { label: "Approved", color: "bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-400", icon: CheckCircle2 },
  REJECTED: { label: "Rejected", color: "bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-400", icon: XCircle },
  RESOLVED: { label: "Resolved", color: "bg-gray-100 dark:bg-gray-800/30 text-gray-800 dark:text-gray-400", icon: CheckCircle2 },
};

export default function ClaimDetailPage() {
  const params = useParams();
  const router = useRouter();
  const claimId = params.id as string;

  const [claim, setClaim] = useState<ClaimDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [resolution, setResolution] = useState("REPLACEMENT");
  const [notes, setNotes] = useState("");

  const fetchClaim = useCallback(async () => {
    try {
      setError(null);
      const data = await apiFetch(`/admin/claims/${claimId}`) as ClaimDetail;
      setClaim(data);
      if (data.internalNotes) setNotes(data.internalNotes);
    } catch (err) {
      console.error("Failed to fetch claim:", err);
      setError("Failed to load claim details");
    } finally {
      setLoading(false);
    }
  }, [claimId]);

  useEffect(() => {
    fetchClaim();
  }, [fetchClaim]);

  const handleAction = async (action: string, body?: Record<string, unknown>) => {
    setActionLoading(action);
    try {
      await apiFetch(`/admin/claims/${claimId}/${action}`, {
        method: "POST",
        body: JSON.stringify(body ?? {}),
      });
      await fetchClaim();
    } catch (err) {
      console.error(`Failed to ${action} claim:`, err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdate = async () => {
    setActionLoading("update");
    try {
      await apiFetch(`/admin/claims/${claimId}`, {
        method: "PUT",
        body: JSON.stringify({ internalNotes: notes }),
      });
      await fetchClaim();
    } catch (err) {
      console.error("Failed to update claim:", err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !claim) {
    return (
      <div className="p-6">
        <p className="text-destructive">{error ?? "Claim not found"}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back
        </Button>
      </div>
    );
  }

  const config = STATUS_CONFIG[claim.status] ?? STATUS_CONFIG.OPEN;
  const StatusIcon = config.icon;
  const canApprove = claim.status === "OPEN" || claim.status === "UNDER_REVIEW";
  const canReject = claim.status === "OPEN" || claim.status === "UNDER_REVIEW";
  const canResolve = claim.status === "APPROVED";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/returns/claims")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Claim #{claim.id.slice(0, 8)}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Created {formatDate(claim.createdAt)}
              {claim.resolvedAt && ` · Resolved ${formatDate(claim.resolvedAt)}`}
            </p>
          </div>
          <Badge variant="secondary" className={config.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {canApprove && (
            <Button
              variant="default"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleAction("approve")}
              disabled={!!actionLoading}
            >
              {actionLoading === "approve" ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
              )}
              Approve
            </Button>
          )}
          {canReject && (
            <Button
              variant="destructive"
              onClick={() => handleAction("reject")}
              disabled={!!actionLoading}
            >
              {actionLoading === "reject" ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-1.5" />
              )}
              Reject
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Claim Details */}
          <Card>
            <CardHeader>
              <CardTitle>Claim Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Type</span>
                  <p className="font-medium">{claim.claimType.replace("_", " ")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Order</span>
                  <p>
                    <Link href={`/orders/${claim.orderId}`} className="text-primary hover:underline font-medium">
                      {claim.orderId.slice(0, 8)}...
                    </Link>
                  </p>
                </div>
                {claim.resolution && (
                  <div>
                    <span className="text-muted-foreground">Resolution</span>
                    <p className="font-medium">{claim.resolution}</p>
                  </div>
                )}
              </div>
              {claim.description && (
                <div>
                  <span className="text-sm text-muted-foreground">Description</span>
                  <p className="text-sm mt-1">{claim.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Claimed Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Claimed Items ({claim.items?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(!claim.items || claim.items.length === 0) ? (
                <p className="text-sm text-muted-foreground text-center py-4">No items attached to this claim.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {claim.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.productTitle}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell className="text-muted-foreground">{item.reason ?? "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Images */}
          {claim.images && claim.images.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Evidence Photos ({claim.images.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {claim.images.map((img) => (
                    <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                      <img src={img.url} alt={img.caption ?? "Claim evidence"} className="object-cover w-full h-full" />
                      {img.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1.5">
                          {img.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Resolve */}
          {canResolve && (
            <Card>
              <CardHeader>
                <CardTitle>Resolve Claim</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Resolution Type</label>
                  <Select value={resolution} onValueChange={setResolution}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REPLACEMENT">Replacement</SelectItem>
                      <SelectItem value="REFUND">Refund</SelectItem>
                      <SelectItem value="STORE_CREDIT">Store Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  onClick={() => handleAction("resolve", { resolution })}
                  disabled={!!actionLoading}
                >
                  {actionLoading === "resolve" ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  )}
                  Resolve Claim
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Internal Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Internal Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add internal notes about this claim..."
                rows={4}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleUpdate}
                disabled={!!actionLoading}
              >
                {actionLoading === "update" ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : null}
                Save Notes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

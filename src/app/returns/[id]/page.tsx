"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Package,
  DollarSign,
  XCircle,
  Clock,
  Mail,
  ExternalLink,
  Loader2,
} from "lucide-react";
import {
  getReturn,
  receiveReturn,
  processReturnRefund,
  rejectReturn,
  Return,
  formatPrice,
  formatDate,
  formatDateTime,
  getReturnStatusDisplay,
} from "@/lib/api";

function ReturnStatusBadge({ status }: { status: string }) {
  const { label, color } = getReturnStatusDisplay(status);
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted">
      <div className={`h-2 w-2 rounded-full ${color}`} />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

export default function ReturnDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [returnData, setReturnData] = useState<Return | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const returnId = params.id as string;

  const fetchReturn = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getReturn(returnId);
      setReturnData(response.return_request);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load return");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturn();
  }, [returnId]);

  const handleReceive = async () => {
    setActionLoading("receive");
    setActionError(null);
    try {
      await receiveReturn(returnId);
      await fetchReturn();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to mark as received");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefund = async () => {
    setActionLoading("refund");
    setActionError(null);
    try {
      await processReturnRefund(returnId);
      setRefundDialogOpen(false);
      await fetchReturn();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to process refund");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setActionError("Please provide a reason for rejection");
      return;
    }

    setActionLoading("reject");
    setActionError(null);
    try {
      await rejectReturn(returnId, { reason: rejectReason });
      setRejectDialogOpen(false);
      setRejectReason("");
      await fetchReturn();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to reject return");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !returnData) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span>{error || "Return not found"}</span>
          <Button variant="ghost" size="sm" onClick={fetchReturn} className="ml-auto">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/returns")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">Return {returnData.id.slice(0, 8)}</h1>
              <ReturnStatusBadge status={returnData.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              Requested {formatDateTime(returnData.requestedAt)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {returnData.canReceive && (
            <Button onClick={handleReceive} disabled={actionLoading === "receive"}>
              {actionLoading === "receive" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Package className="h-4 w-4 mr-2" />
              )}
              Mark Received
            </Button>
          )}
          {returnData.canRefund && (
            <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Process Refund
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Process Refund</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to process a refund of{" "}
                    {formatPrice(returnData.refundAmount / 100, returnData.currencyCode)}? This action
                    cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setRefundDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleRefund} disabled={actionLoading === "refund"}>
                    {actionLoading === "refund" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Confirm Refund
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {returnData.canReject && (
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject Return</DialogTitle>
                  <DialogDescription>
                    Please provide a reason for rejecting this return. This will be visible to the
                    customer.
                  </DialogDescription>
                </DialogHeader>
                <Textarea
                  placeholder="Reason for rejection..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="min-h-[100px]"
                />
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setRejectDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={actionLoading === "reject" || !rejectReason.trim()}
                  >
                    {actionLoading === "reject" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Reject Return
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Action Error Display */}
      {actionError && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span>{actionError}</span>
          <Button variant="ghost" size="sm" onClick={() => setActionError(null)} className="ml-auto">
            Dismiss
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Return Items</CardTitle>
              <CardDescription>
                {returnData.items.length} item(s) being returned
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {returnData.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    {item.thumbnail && (
                      <div className="relative w-16 h-20 bg-muted rounded overflow-hidden shrink-0">
                        <Image
                          src={item.thumbnail}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.title}</p>
                      {item.description && (
                        <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                      )}
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-medium">
                        {formatPrice(item.total / 100, returnData.currencyCode)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(item.unitPrice / 100, returnData.currencyCode)} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center mt-6 pt-4 border-t">
                <span className="text-lg font-medium">Total Refund</span>
                <span className="text-lg font-bold">
                  {formatPrice(returnData.refundAmount / 100, returnData.currencyCode)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Return Reason */}
          <Card>
            <CardHeader>
              <CardTitle>Return Reason</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium capitalize">
                  {returnData.reason.replace(/_/g, " ").toLowerCase()}
                </p>
                {returnData.reasonNote && (
                  <p className="text-muted-foreground">{returnData.reasonNote}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Rejection Reason (if rejected) */}
          {returnData.status === "rejected" && returnData.rejectionReason && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-700">Rejection Reason</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-700">{returnData.rejectionReason}</p>
                {returnData.rejectedAt && (
                  <p className="text-sm text-red-600 mt-2">
                    Rejected on {formatDateTime(returnData.rejectedAt)}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Info */}
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Order</span>
                <Link
                  href={`/orders/${returnData.orderId}`}
                  className="font-medium hover:underline flex items-center gap-1"
                >
                  #{returnData.orderDisplayId || returnData.orderId.slice(0, 8)}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
              {returnData.customerEmail && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Customer</span>
                  <a
                    href={`mailto:${returnData.customerEmail}`}
                    className="font-medium hover:underline flex items-center gap-1"
                  >
                    <Mail className="h-3 w-3" />
                    {returnData.customerEmail}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Requested */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Requested</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(returnData.requestedAt)}
                    </p>
                  </div>
                </div>

                {/* Approved */}
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      returnData.approvedAt ? "bg-green-100" : "bg-muted"
                    }`}
                  >
                    {returnData.approvedAt ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className={`font-medium ${!returnData.approvedAt && "text-muted-foreground"}`}>
                      Approved
                    </p>
                    {returnData.approvedAt && (
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(returnData.approvedAt)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Received */}
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      returnData.receivedAt ? "bg-green-100" : "bg-muted"
                    }`}
                  >
                    {returnData.receivedAt ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className={`font-medium ${!returnData.receivedAt && "text-muted-foreground"}`}>
                      Items Received
                    </p>
                    {returnData.receivedAt && (
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(returnData.receivedAt)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Refunded */}
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      returnData.refundedAt ? "bg-green-100" : "bg-muted"
                    }`}
                  >
                    {returnData.refundedAt ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className={`font-medium ${!returnData.refundedAt && "text-muted-foreground"}`}>
                      Refunded
                    </p>
                    {returnData.refundedAt && (
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(returnData.refundedAt)}
                      </p>
                    )}
                    {returnData.refundId && (
                      <p className="text-xs text-muted-foreground font-mono">
                        Refund: {returnData.refundId.slice(0, 12)}...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Return Deadline */}
          {returnData.status === "approved" && (
            <Card>
              <CardHeader>
                <CardTitle>Return Deadline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{returnData.daysRemaining} days remaining</p>
                    <p className="text-sm text-muted-foreground">
                      Expires {formatDate(returnData.returnDeadline)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

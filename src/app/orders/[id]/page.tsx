"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Copy,
  MoreHorizontal,
  ArrowRight,
  Package,
  Truck,
  CreditCard,
  ShoppingCart,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Loader2,
  Printer,
  MapPin,
  ExternalLink,
  Ban,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { usePageContext } from "@/hooks/use-page-context";
import {
  getOrder,
  fulfillOrder,
  cancelOrder,
  completeOrder,
  refundOrder,
  getShippingConfig,
  getOrderTracking,
  getOrderFulfillments,
  voidShippingLabel,
  getRefundReasons,
  Order,
  PaymentStatus,
  FulfillmentStatus,
  ShippingConfig,
  FulfillmentDetail,
  TrackingInfo,
  TrackingEvent,
  RefundReason,
  formatPrice,
  formatDateTime,
  getPaymentStatusDisplay,
  getFulfillmentStatusDisplay,
  getOrderStatusDisplay,
} from "@/lib/api";

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <StatusBadge status={status} type="payment" dot />;
}

function FulfillmentStatusBadge({ status }: { status: FulfillmentStatus }) {
  return <StatusBadge status={status} type="fulfillment" dot />;
}

function TimelineIcon({ type }: { type: string }) {
  const iconConfig: Record<string, { icon: React.ReactNode; bgColor: string }> = {
    created: { icon: <ShoppingCart className="h-3 w-3 text-white" />, bgColor: "bg-blue-500" },
    payment: { icon: <CreditCard className="h-3 w-3 text-white" />, bgColor: "bg-orange-500" },
    fulfilled: { icon: <Package className="h-3 w-3 text-white" />, bgColor: "bg-green-500" },
    shipped: { icon: <Truck className="h-3 w-3 text-white" />, bgColor: "bg-blue-500" },
    completed: { icon: <CheckCircle className="h-3 w-3 text-white" />, bgColor: "bg-green-600" },
  };

  const { icon, bgColor } = iconConfig[type] || { icon: <Package className="h-3 w-3 text-white" />, bgColor: "bg-gray-400" };

  return (
    <div className={`h-6 w-6 rounded-full ${bgColor} flex items-center justify-center`}>
      {icon}
    </div>
  );
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const orderId = params.id as string;
  usePageContext("orders", orderId, "order");

  const orderQueryClient = useQueryClient();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [fulfillDialogOpen, setFulfillDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refundType, setRefundType] = useState<"full" | "partial">("full");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundNote, setRefundNote] = useState("");
  const [refundReasons, setRefundReasons] = useState<RefundReason[]>([]);

  // ShipEngine config (used for Shipping & Label Card)
  const [shippingConfig, setShippingConfig] = useState<ShippingConfig | null>(null);

  // Fulfillment & tracking state
  const [fulfillments, setFulfillments] = useState<FulfillmentDetail[]>([]);
  const [tracking, setTracking] = useState<TrackingInfo | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [voidLoading, setVoidLoading] = useState(false);
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);

  // Fetch order via React Query
  const orderQuery = useQuery({
    queryKey: ["order-detail", orderId],
    queryFn: () => getOrder(orderId),
    enabled: !!orderId && !!user && !authLoading,
    staleTime: 15_000,
  });

  const loading = orderQuery.isLoading;

  // Populate order state when data arrives
  useEffect(() => {
    if (orderQuery.data) {
      const data = orderQuery.data;
      setOrder(data);
    }
    if (orderQuery.error) {
      setError(orderQuery.error instanceof Error ? orderQuery.error.message : "Failed to load order");
    }
  }, [orderQuery.data, orderQuery.error]);

  // Fetch shipping config via React Query (needed for Shipping & Label card)
  const shippingConfigQuery = useQuery({
    queryKey: ["shipping-config"],
    queryFn: () => getShippingConfig(),
    enabled: !!user && !authLoading,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (shippingConfigQuery.data) {
      setShippingConfig(shippingConfigQuery.data);
    }
  }, [shippingConfigQuery.data]);

  // Fetch fulfillments via React Query
  const fulfillmentsQuery = useQuery({
    queryKey: ["order-fulfillments", orderId],
    queryFn: async () => {
      const data = await getOrderFulfillments(orderId);
      return data.fulfillments || [];
    },
    enabled: !!orderId && !!user && !authLoading,
    staleTime: 15_000,
  });

  // Populate fulfillments from query
  useEffect(() => {
    if (fulfillmentsQuery.data) {
      setFulfillments(fulfillmentsQuery.data);
    }
  }, [fulfillmentsQuery.data]);

  const fetchOrder = async () => {
    await orderQueryClient.invalidateQueries({ queryKey: ["order-detail", orderId] });
  };

  const fetchFulfillments = async () => {
    await orderQueryClient.invalidateQueries({ queryKey: ["order-fulfillments", orderId] });
  };

  const fetchTracking = async () => {
    setTrackingLoading(true);
    try {
      const data = await getOrderTracking(orderId);
      setTracking(data.tracking || null);
    } catch (err) {
      console.error("Failed to load tracking:", err);
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleVoidLabel = async () => {
    if (!order) return;
    setVoidLoading(true);
    try {
      const result = await voidShippingLabel(order.id);
      if (result.success) {
        toast.success(result.message || "Label voided successfully");
        await fetchFulfillments();
        await fetchOrder();
      } else {
        toast.error(result.message || "Failed to void label");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to void label");
    } finally {
      setVoidLoading(false);
    }
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFulfill = async () => {
    if (!order) return;
    setActionLoading("fulfill");
    try {
      await fulfillOrder(order.id);
      await fetchOrder();
      setFulfillDialogOpen(false);
      toast.success("Order fulfilled successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to fulfill order");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!order) return;
    setActionLoading("cancel");
    try {
      await cancelOrder(order.id, { reason: cancelReason || undefined });
      await fetchOrder();
      setCancelDialogOpen(false);
      setCancelReason("");
      toast.success("Order canceled");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel order");
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async () => {
    if (!order) return;
    setActionLoading("complete");
    try {
      await completeOrder(order.id);
      await fetchOrder();
      setCompleteDialogOpen(false);
      toast.success("Order completed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to complete order");
    } finally {
      setActionLoading(null);
    }
  };

  const openRefundDialog = async () => {
    setRefundDialogOpen(true);
    setRefundType("full");
    setRefundAmount("");
    setRefundReason("");
    setRefundNote("");
    try {
      const res = await getRefundReasons({ active: true });
      setRefundReasons(res.refund_reasons || []);
    } catch {
      // Reasons are optional — dialog still works with a free-text note
    }
  };

  const handleRefund = async () => {
    if (!order) return;
    const amountInCents =
      refundType === "full"
        ? order.total
        : Math.round(parseFloat(refundAmount) * 100);
    if (isNaN(amountInCents) || amountInCents <= 0) {
      toast.error("Please enter a valid refund amount");
      return;
    }
    if (amountInCents > order.total) {
      toast.error("Refund amount cannot exceed order total");
      return;
    }
    setActionLoading("refund");
    try {
      await refundOrder(order.id, {
        amount: amountInCents,
        reason: refundReason || undefined,
        note: refundNote || undefined,
      });
      await fetchOrder();
      setRefundDialogOpen(false);
      toast.success(
        refundType === "full"
          ? "Full refund processed"
          : `Refund of ${formatPrice(amountInCents, order.currencyCode)} processed`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to process refund");
    } finally {
      setActionLoading(null);
    }
  };

  // Loading state (including auth loading)
  if (authLoading || loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Failed to load order</h2>
        <p className="text-muted-foreground">{error || "Order not found"}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/orders")}>
            Back to Orders
          </Button>
          <Button onClick={fetchOrder}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const canFulfill = order.fulfillmentStatus === "NOT_FULFILLED" && order.status !== "CANCELED";
  const canShip = (order.fulfillmentStatus === "FULFILLED" || order.fulfillmentStatus === "NOT_FULFILLED") && order.status !== "CANCELED";
  const canComplete = order.status === "PENDING" && order.fulfillmentStatus !== "NOT_FULFILLED";
  const canCancel = order.status === "PENDING";
  const canRefund =
    (order.status === "COMPLETED" || order.paymentStatus === "PAID" || order.paymentStatus === "CAPTURED") &&
    order.paymentStatus !== "REFUNDED" &&
    order.status !== "CANCELED";

  // Build activity timeline from order data
  const activity = [
    {
      id: "created",
      type: "created",
      title: "Order placed",
      description: formatPrice(order.total, order.currencyCode),
      timestamp: formatDateTime(order.createdAt),
    },
  ];

  if (order.paymentStatus === "CAPTURED" || order.paymentStatus === "PAID") {
    activity.unshift({
      id: "payment",
      type: "payment",
      title: "Payment captured",
      description: formatPrice(order.total, order.currencyCode),
      timestamp: formatDateTime(order.updatedAt),
    });
  }

  if (order.fulfillmentStatus === "FULFILLED" || order.fulfillmentStatus === "SHIPPED") {
    activity.unshift({
      id: "fulfilled",
      type: "fulfilled",
      title: "Order fulfilled",
      description: `${order.items?.length || 0} items`,
      timestamp: formatDateTime(order.updatedAt),
    });
  }

  if (order.fulfillmentStatus === "SHIPPED") {
    activity.unshift({
      id: "shipped",
      type: "shipped",
      title: "Order shipped",
      description: order.metadata?.tracking_number ? `Tracking: ${order.metadata.tracking_number}` : "Shipped",
      timestamp: formatDateTime(order.updatedAt),
    });
  }

  if (order.status === "COMPLETED") {
    activity.unshift({
      id: "completed",
      type: "completed",
      title: "Order completed",
      description: "All items delivered",
      timestamp: formatDateTime(order.updatedAt),
    });
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/orders">Orders</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>#{order.displayId}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Header Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-semibold">#{order.displayId}</h1>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(order.id, "orderId")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    {copiedField === "orderId" && (
                      <span className="text-xs text-green-600">Copied!</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(order.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={order.status} type="order" dot />
                  <PaymentStatusBadge status={order.paymentStatus} />
                  <FulfillmentStatusBadge status={order.fulfillmentStatus} />
                  {(canFulfill || canShip || canComplete || canRefund || canCancel) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canFulfill && (
                          <DropdownMenuItem onClick={() => setFulfillDialogOpen(true)}>
                            Mark as Fulfilled
                          </DropdownMenuItem>
                        )}
                        {canShip && (
                          <DropdownMenuItem asChild>
                            <Link href={`/orders/${orderId}/ship`}>
                              Mark as Shipped
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {canComplete && (
                          <DropdownMenuItem onClick={() => setCompleteDialogOpen(true)}>
                            Complete Order
                          </DropdownMenuItem>
                        )}
                        {canRefund && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={openRefundDialog}>
                              <Undo2 className="mr-2 h-4 w-4" />
                              Refund Order
                            </DropdownMenuItem>
                          </>
                        )}
                        {canCancel && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setCancelDialogOpen(true)}
                              className="text-red-600 dark:text-red-400"
                            >
                              Cancel Order
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Order Items */}
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-muted rounded flex items-center justify-center overflow-hidden">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt={item.title} className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.variantId}</p>
                  </div>
                  <div className="text-right">
                    <p>{formatPrice(item.unitPrice, order.currencyCode)}</p>
                  </div>
                  <div className="text-center text-sm text-muted-foreground">
                    {item.quantity}x
                  </div>
                  <p className="font-medium w-20 text-right">
                    {formatPrice(item.total, order.currencyCode)}
                  </p>
                </div>
              ))}

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal, order.currencyCode)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>{formatPrice(order.shipping, order.currencyCode)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>{formatPrice(order.tax, order.currencyCode)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(order.discount, order.currencyCode)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>{formatPrice(order.total, order.currencyCode)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          {(canFulfill || canShip || canComplete) && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {canFulfill && (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Order is ready to be fulfilled</span>
                    </div>
                    <Button onClick={() => setFulfillDialogOpen(true)} disabled={actionLoading === "fulfill"}>
                      {actionLoading === "fulfill" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Fulfill Order
                    </Button>
                  </div>
                )}

                {canShip && order.fulfillmentStatus === "FULFILLED" && (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Order is ready to be shipped</span>
                    </div>
                    <Button variant="outline" asChild>
                      <Link href={`/orders/${orderId}/ship`}>
                        <Truck className="h-4 w-4 mr-2" />
                        Ship Order
                      </Link>
                    </Button>
                  </div>
                )}

                {canComplete && (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Order is ready to be completed</span>
                    </div>
                    <Button variant="outline" onClick={() => setCompleteDialogOpen(true)} disabled={actionLoading === "complete"}>
                      {actionLoading === "complete" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Complete Order
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Customer Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Email</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{order.email}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(order.email, "email")}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {order.shippingAddress && (
                <>
                  <Separator />
                  <div className="flex items-start justify-between">
                    <span className="text-sm text-muted-foreground">Shipping</span>
                    <div className="text-right text-sm">
                      {order.shippingAddress.firstName && (
                        <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                      )}
                      {order.shippingAddress.address1 && <p>{order.shippingAddress.address1}</p>}
                      {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                      <p>
                        {order.shippingAddress.city}
                        {order.shippingAddress.postalCode && ` ${order.shippingAddress.postalCode}`}
                      </p>
                      {order.shippingAddress.countryCode && <p>{order.shippingAddress.countryCode}</p>}
                    </div>
                  </div>
                </>
              )}

              {order.metadata?.tracking_number && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tracking</span>
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-mono">{order.metadata.tracking_number}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Shipping & Label Card */}
          {fulfillments.length > 0 && (() => {
            const activeFulfillment = fulfillments.find(f => !f.isCanceled);
            if (!activeFulfillment) return null;
            const hasLabel = activeFulfillment.labelId !== null;
            const labelPurchased = activeFulfillment.labelStatus === "PURCHASED";
            const labelVoided = activeFulfillment.labelStatus === "VOIDED";
            const labelVoidFailed = activeFulfillment.labelStatus === "VOID_FAILED";

            return (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Shipping</CardTitle>
                  {hasLabel && (
                    <Badge variant="outline" className="gap-1">
                      <div className={`h-2 w-2 rounded-full ${
                        labelPurchased ? "bg-green-500" :
                        labelVoided ? "bg-gray-400" :
                        labelVoidFailed ? "bg-red-500" : "bg-yellow-500"
                      }`} />
                      {activeFulfillment.labelStatus}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Tracking Numbers */}
                  {activeFulfillment.trackingNumbers.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground font-medium">Tracking</span>
                      {activeFulfillment.trackingNumbers.map((tn, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm font-mono">{tn}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => { navigator.clipboard.writeText(tn); toast.success("Copied!"); }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tracking URLs */}
                  {activeFulfillment.trackingUrls.length > 0 && (
                    <div>
                      <a
                        href={activeFulfillment.trackingUrls[0]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Track Package
                      </a>
                    </div>
                  )}

                  {/* Carrier & Service */}
                  {(activeFulfillment.carrierCode || activeFulfillment.serviceCode) && (
                    <>
                      <Separator />
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {activeFulfillment.carrierCode && (
                          <div>
                            <span className="text-muted-foreground text-xs">Carrier</span>
                            <p className="font-medium capitalize">{activeFulfillment.carrierCode}</p>
                          </div>
                        )}
                        {activeFulfillment.serviceCode && (
                          <div>
                            <span className="text-muted-foreground text-xs">Service</span>
                            <p className="font-medium">{activeFulfillment.serviceCode.replace(/_/g, " ")}</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Label Info */}
                  {hasLabel && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        {activeFulfillment.labelCost != null && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Label Cost</span>
                            <span className="font-medium">
                              {formatPrice((activeFulfillment.labelCost || 0) / 100, order?.currencyCode || "USD")}
                            </span>
                          </div>
                        )}
                        {activeFulfillment.labelPurchasedAt && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Purchased</span>
                            <span>{formatDateTime(activeFulfillment.labelPurchasedAt)}</span>
                          </div>
                        )}
                      </div>

                      {/* Label Actions */}
                      <div className="flex gap-2 pt-1">
                        {activeFulfillment.labelUrl && labelPurchased && (
                          <Button size="sm" variant="outline" asChild className="flex-1">
                            <a href={activeFulfillment.labelUrl} target="_blank" rel="noopener noreferrer">
                              <Printer className="h-3.5 w-3.5 mr-1" />
                              Print Label
                            </a>
                          </Button>
                        )}
                        {labelPurchased && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={handleVoidLabel}
                            disabled={voidLoading}
                          >
                            {voidLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5 mr-1" />}
                            Void
                          </Button>
                        )}
                      </div>

                      {/* Void error */}
                      {labelVoidFailed && activeFulfillment.labelVoidError && (
                        <div className="p-2 bg-red-50 dark:bg-red-950/20 rounded text-xs text-red-600">
                          <AlertCircle className="h-3 w-3 inline mr-1" />
                          Void failed: {activeFulfillment.labelVoidError}
                        </div>
                      )}
                    </>
                  )}

                  {/* Track with ShipEngine */}
                  {activeFulfillment.trackingNumbers.length > 0 && shippingConfig?.shipEngineConfigured && (
                    <>
                      <Separator />
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          fetchTracking();
                          setTrackingDialogOpen(true);
                        }}
                      >
                        <MapPin className="h-3.5 w-3.5 mr-1" />
                        View Tracking Events
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })()}

          {/* Activity Card */}
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                {activity.map((item, index) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <TimelineIcon type={item.type} />
                      {index < activity.length - 1 && (
                        <div className="w-px flex-1 bg-border min-h-[16px]" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        <p className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                          {item.timestamp}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fulfill Dialog */}
      <Dialog open={fulfillDialogOpen} onOpenChange={setFulfillDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fulfill Order</DialogTitle>
            <DialogDescription>
              Mark all items in this order as fulfilled. This will create a fulfillment record.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-3">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 text-sm">{item.title}</span>
                  <span className="text-sm text-muted-foreground">{item.quantity}x</span>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFulfillDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleFulfill} disabled={actionLoading === "fulfill"}>
              {actionLoading === "fulfill" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Fulfill Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Order</DialogTitle>
            <DialogDescription>
              Mark this order as completed. This indicates all items have been delivered.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleComplete} disabled={actionLoading === "complete"}>
              {actionLoading === "complete" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Complete Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason (optional)</label>
              <Input
                placeholder="Enter cancellation reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Keep Order
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={actionLoading === "cancel"}>
              {actionLoading === "cancel" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refund Order</DialogTitle>
            <DialogDescription>
              Process a refund for order #{order.displayId}. Total: {formatPrice(order.total, order.currencyCode)}
              {order.paymentStatus === "PARTIALLY_REFUNDED" && (
                <span className="block mt-1 text-yellow-600">This order has already been partially refunded.</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* Refund Type */}
            <div className="space-y-2">
              <span className="text-sm font-medium">Refund Type</span>
              <Select value={refundType} onValueChange={(v) => setRefundType(v as "full" | "partial")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Refund ({formatPrice(order.total, order.currencyCode)})</SelectItem>
                  <SelectItem value="partial">Partial Refund</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Partial Amount */}
            {refundType === "partial" && (
              <div className="space-y-2">
                <span className="text-sm font-medium">Refund Amount ({order.currencyCode})</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={(order.total / 100).toFixed(2)}
                  placeholder="0.00"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum: {formatPrice(order.total, order.currencyCode)}
                </p>
              </div>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <span className="text-sm font-medium">Reason</span>
              {refundReasons.length > 0 ? (
                <Select value={refundReason} onValueChange={setRefundReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {refundReasons.map((r) => (
                      <SelectItem key={r.id} value={r.label}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder="Reason for refund"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                />
              )}
            </div>

            {/* Note */}
            <div className="space-y-2">
              <span className="text-sm font-medium">Note (optional)</span>
              <Input
                placeholder="Internal note about this refund"
                value={refundNote}
                onChange={(e) => setRefundNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRefund}
              disabled={actionLoading === "refund" || (refundType === "partial" && !refundAmount)}
            >
              {actionLoading === "refund" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {refundType === "full"
                ? `Refund ${formatPrice(order.total, order.currencyCode)}`
                : refundAmount
                  ? `Refund ${formatPrice(Math.round(parseFloat(refundAmount) * 100), order.currencyCode)}`
                  : "Refund"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tracking Events Dialog */}
      <Dialog open={trackingDialogOpen} onOpenChange={setTrackingDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tracking Events</DialogTitle>
            <DialogDescription>
              {tracking ? `Status: ${tracking.statusDescription}` : "Loading tracking information..."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {trackingLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : tracking ? (
              <div className="space-y-4">
                {/* Status Summary */}
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    tracking.statusCode === "DE" ? "bg-green-100 text-green-600 dark:bg-green-950/30 dark:text-green-400" :
                    tracking.statusCode === "IT" ? "bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400" :
                    tracking.statusCode === "AC" ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-950/30 dark:text-yellow-400" :
                    "bg-gray-100 text-gray-600 dark:bg-gray-950/30 dark:text-gray-400"
                  }`}>
                    {tracking.statusCode === "DE" ? <CheckCircle className="h-5 w-5" /> :
                     tracking.statusCode === "IT" ? <Truck className="h-5 w-5" /> :
                     <Package className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-medium">{tracking.statusDescription}</p>
                    <p className="text-xs text-muted-foreground font-mono">{tracking.trackingNumber}</p>
                  </div>
                </div>

                {/* Events Timeline */}
                {tracking.events.length > 0 ? (
                  <div className="space-y-0">
                    {tracking.events.map((event, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`h-2.5 w-2.5 rounded-full mt-1.5 ${
                            index === 0 ? "bg-blue-500" : "bg-gray-300"
                          }`} />
                          {index < tracking.events.length - 1 && (
                            <div className="w-px flex-1 bg-border min-h-[20px]" />
                          )}
                        </div>
                        <div className="flex-1 pb-3">
                          <p className="text-sm">{event.description}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span>{new Date(event.occurredAt).toLocaleString()}</span>
                            {event.cityLocality && (
                              <span className="flex items-center gap-0.5">
                                <MapPin className="h-3 w-3" />
                                {[event.cityLocality, event.stateProvince, event.countryCode].filter(Boolean).join(", ")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No tracking events available yet.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No tracking information available.
              </p>
            )}
          </div>
          <DialogFooter>
            {tracking?.trackingUrl && (
              <Button variant="outline" asChild>
                <a href={tracking.trackingUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Track on Carrier Site
                </a>
              </Button>
            )}
            <Button variant="outline" onClick={() => setTrackingDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

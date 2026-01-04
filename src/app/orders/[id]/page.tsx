"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Send,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getOrder,
  fulfillOrder,
  shipOrder,
  cancelOrder,
  completeOrder,
  Order,
  PaymentStatus,
  FulfillmentStatus,
  formatPrice,
  formatDateTime,
  getPaymentStatusDisplay,
  getFulfillmentStatusDisplay,
  getOrderStatusDisplay,
} from "@/lib/api";

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { label, color } = getPaymentStatusDisplay(status);
  return (
    <Badge variant="outline" className="gap-1 border-0 bg-opacity-20" style={{ backgroundColor: `var(--${color.replace('bg-', '')}-100, #f3f4f6)` }}>
      <div className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </Badge>
  );
}

function FulfillmentStatusBadge({ status }: { status: FulfillmentStatus }) {
  const { label, color } = getFulfillmentStatusDisplay(status);
  return (
    <Badge variant="outline" className="gap-1 border-0" style={{ backgroundColor: `var(--${color.replace('bg-', '')}-100, #f3f4f6)` }}>
      <div className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </Badge>
  );
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
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [fulfillDialogOpen, setFulfillDialogOpen] = useState(false);
  const [shipDialogOpen, setShipDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  const fetchOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrder(orderId);
      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

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

  const handleShip = async () => {
    if (!order) return;
    setActionLoading("ship");
    try {
      await shipOrder(order.id, {
        trackingNumber: trackingNumber || undefined,
        carrier: carrier || undefined,
      });
      await fetchOrder();
      setShipDialogOpen(false);
      setTrackingNumber("");
      setCarrier("");
      toast.success("Order marked as shipped");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to ship order");
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

  // Loading state
  if (loading) {
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
                  <Badge variant="outline" className="gap-1">
                    <div className={`h-2 w-2 rounded-full ${getOrderStatusDisplay(order.status).color}`} />
                    {getOrderStatusDisplay(order.status).label}
                  </Badge>
                  <PaymentStatusBadge status={order.paymentStatus} />
                  <FulfillmentStatusBadge status={order.fulfillmentStatus} />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canFulfill && (
                        <DropdownMenuItem onClick={() => setFulfillDialogOpen(true)}>
                          Mark as Fulfilled
                        </DropdownMenuItem>
                      )}
                      {canShip && (
                        <DropdownMenuItem onClick={() => setShipDialogOpen(true)}>
                          Mark as Shipped
                        </DropdownMenuItem>
                      )}
                      {canComplete && (
                        <DropdownMenuItem onClick={() => setCompleteDialogOpen(true)}>
                          Complete Order
                        </DropdownMenuItem>
                      )}
                      {(canFulfill || canShip || canComplete) && <DropdownMenuSeparator />}
                      {canCancel && (
                        <DropdownMenuItem
                          onClick={() => setCancelDialogOpen(true)}
                          className="text-red-600"
                        >
                          Cancel Order
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                    <Button variant="outline" onClick={() => setShipDialogOpen(true)} disabled={actionLoading === "ship"}>
                      {actionLoading === "ship" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Mark as Shipped
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

      {/* Ship Dialog */}
      <Dialog open={shipDialogOpen} onOpenChange={setShipDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Shipped</DialogTitle>
            <DialogDescription>
              Add tracking information for this order.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Carrier</label>
              <Select value={carrier} onValueChange={setCarrier}>
                <SelectTrigger>
                  <SelectValue placeholder="Select carrier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="royal_mail">Royal Mail</SelectItem>
                  <SelectItem value="dhl">DHL</SelectItem>
                  <SelectItem value="ups">UPS</SelectItem>
                  <SelectItem value="fedex">FedEx</SelectItem>
                  <SelectItem value="dpd">DPD</SelectItem>
                  <SelectItem value="evri">Evri (Hermes)</SelectItem>
                  <SelectItem value="yodel">Yodel</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tracking Number</label>
              <Input
                placeholder="Enter tracking number"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShipDialogOpen(false);
                setTrackingNumber("");
                setCarrier("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleShip} disabled={actionLoading === "ship"}>
              {actionLoading === "ship" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Mark as Shipped
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
    </div>
  );
}

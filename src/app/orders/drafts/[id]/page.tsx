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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Copy,
  MoreHorizontal,
  Package,
  AlertCircle,
  RefreshCw,
  Loader2,
  Send,
  ArrowRightLeft,
  XCircle,
  User,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import {
  getDraftOrder,
  sendDraftOrderInvoice,
  convertDraftOrderToOrder,
  cancelDraftOrder,
  DraftOrder,
  DraftOrderStatus,
  formatPrice,
  formatDateTime,
  getDraftOrderStatusDisplay,
} from "@/lib/api";

function DraftStatusBadge({ status }: { status: DraftOrderStatus }) {
  const { label, color } = getDraftOrderStatusDisplay(status);
  return (
    <Badge variant="outline" className="gap-1 border-0">
      <div className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </Badge>
  );
}

export default function DraftOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const draftId = params.id as string;

  const [draft, setDraft] = useState<DraftOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Dialogs
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const fetchDraft = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDraftOrder(draftId);
      setDraft(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load draft order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDraft();
  }, [draftId]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSendInvoice = async () => {
    if (!draft) return;
    setActionLoading("invoice");
    try {
      await sendDraftOrderInvoice(draft.id);
      await fetchDraft();
      setInvoiceDialogOpen(false);
      toast.success("Invoice sent successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send invoice");
    } finally {
      setActionLoading(null);
    }
  };

  const handleConvert = async () => {
    if (!draft) return;
    setActionLoading("convert");
    try {
      const result = await convertDraftOrderToOrder(draft.id);
      toast.success("Draft order converted to order");
      router.push(`/orders/${result.orderId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to convert draft order");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!draft) return;
    setActionLoading("cancel");
    try {
      await cancelDraftOrder(draft.id);
      await fetchDraft();
      setCancelDialogOpen(false);
      toast.success("Draft order cancelled");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel draft order");
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
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !draft) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Failed to load draft order</h2>
        <p className="text-muted-foreground">{error || "Draft order not found"}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/orders/drafts")}>
            Back to Drafts
          </Button>
          <Button onClick={fetchDraft}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const canSendInvoice = draft.status === "OPEN";
  const canConvert = draft.status === "OPEN" || draft.status === "INVOICE_SENT";
  const canCancel = draft.status === "OPEN" || draft.status === "INVOICE_SENT";

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
            <BreadcrumbLink href="/orders/drafts">Draft Orders</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{draft.id.slice(0, 8)}...</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-semibold font-mono">
                      {draft.id.slice(0, 8)}...
                    </h1>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(draft.id, "draftId")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    {copiedField === "draftId" && (
                      <span className="text-xs text-green-600">Copied!</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Created {formatDateTime(draft.createdAt)}
                  </p>
                  {draft.createdBy && (
                    <p className="text-xs text-muted-foreground mt-1">
                      by {draft.createdBy}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <DraftStatusBadge status={draft.status} />
                  {draft.convertedOrderId && (
                    <Badge variant="secondary" className="gap-1">
                      <ArrowRightLeft className="h-3 w-3" />
                      Converted
                    </Badge>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canSendInvoice && (
                        <DropdownMenuItem onClick={() => setInvoiceDialogOpen(true)}>
                          <Send className="h-4 w-4 mr-2" />
                          Send Invoice
                        </DropdownMenuItem>
                      )}
                      {canConvert && (
                        <DropdownMenuItem onClick={() => setConvertDialogOpen(true)}>
                          <ArrowRightLeft className="h-4 w-4 mr-2" />
                          Convert to Order
                        </DropdownMenuItem>
                      )}
                      {(canSendInvoice || canConvert) && canCancel && <DropdownMenuSeparator />}
                      {canCancel && (
                        <DropdownMenuItem
                          onClick={() => setCancelDialogOpen(true)}
                          className="text-red-600"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Cancel Draft
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items Card */}
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="w-24">SKU</TableHead>
                    <TableHead className="w-20 text-center">Qty</TableHead>
                    <TableHead className="w-28 text-right">Unit Price</TableHead>
                    <TableHead className="w-28 text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {draft.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{item.title}</p>
                            {item.variantId && (
                              <p className="text-xs text-muted-foreground">
                                Variant: {item.variantId.slice(0, 8)}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {item.sku || "-"}
                      </TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatPrice(item.unitPrice, draft.currency)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPrice(item.total, draft.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(draft.subtotal, draft.currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>{formatPrice(draft.shippingTotal, draft.currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>{formatPrice(draft.taxTotal, draft.currency)}</span>
                </div>
                {draft.discountTotal > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(draft.discountTotal, draft.currency)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-medium text-lg">
                  <span>Total</span>
                  <span>{formatPrice(draft.total, draft.currency)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          {(canSendInvoice || canConvert) && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {canSendInvoice && (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Send an invoice to the customer</span>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setInvoiceDialogOpen(true)}
                      disabled={actionLoading === "invoice"}
                    >
                      {actionLoading === "invoice" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Send Invoice
                    </Button>
                  </div>
                )}
                {canConvert && (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Convert this draft into a live order</span>
                    </div>
                    <Button
                      onClick={() => setConvertDialogOpen(true)}
                      disabled={actionLoading === "convert"}
                    >
                      {actionLoading === "convert" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Convert to Order
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
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {draft.customerEmail ? (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{draft.customerEmail}</p>
                    {draft.customerId && (
                      <p className="text-xs text-muted-foreground truncate">
                        ID: {draft.customerId.slice(0, 12)}...
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(draft.customerEmail!, "email")}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No customer assigned</p>
              )}

              {/* Shipping Address */}
              {draft.shippingAddress && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">Shipping Address</p>
                    <div className="text-sm text-muted-foreground space-y-0.5">
                      {draft.shippingAddress.firstName && (
                        <p>{draft.shippingAddress.firstName} {draft.shippingAddress.lastName}</p>
                      )}
                      {draft.shippingAddress.address1 && <p>{draft.shippingAddress.address1}</p>}
                      {draft.shippingAddress.address2 && <p>{draft.shippingAddress.address2}</p>}
                      <p>
                        {draft.shippingAddress.city}
                        {draft.shippingAddress.postalCode && ` ${draft.shippingAddress.postalCode}`}
                      </p>
                      {draft.shippingAddress.countryCode && <p>{draft.shippingAddress.countryCode}</p>}
                      {draft.shippingAddress.phone && <p>{draft.shippingAddress.phone}</p>}
                    </div>
                  </div>
                </>
              )}

              {/* Billing Address */}
              {draft.billingAddress && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">Billing Address</p>
                    <div className="text-sm text-muted-foreground space-y-0.5">
                      {draft.billingAddress.firstName && (
                        <p>{draft.billingAddress.firstName} {draft.billingAddress.lastName}</p>
                      )}
                      {draft.billingAddress.address1 && <p>{draft.billingAddress.address1}</p>}
                      {draft.billingAddress.address2 && <p>{draft.billingAddress.address2}</p>}
                      <p>
                        {draft.billingAddress.city}
                        {draft.billingAddress.postalCode && ` ${draft.billingAddress.postalCode}`}
                      </p>
                      {draft.billingAddress.countryCode && <p>{draft.billingAddress.countryCode}</p>}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Note Card */}
          {draft.note && (
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <CardTitle>Note</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{draft.note}</p>
              </CardContent>
            </Card>
          )}

          {/* Converted Order Link */}
          {draft.convertedOrderId && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm">
                  <ArrowRightLeft className="h-4 w-4 text-green-600" />
                  <span>Converted to order</span>
                </div>
                <Button
                  variant="link"
                  className="px-0 mt-1"
                  onClick={() => router.push(`/orders/${draft.convertedOrderId}`)}
                >
                  View Order
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Send Invoice Dialog */}
      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Invoice</DialogTitle>
            <DialogDescription>
              Send a payment invoice to{" "}
              {draft.customerEmail ? (
                <span className="font-medium">{draft.customerEmail}</span>
              ) : (
                "the customer"
              )}
              . They will receive an email with a link to complete payment.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex justify-between p-3 bg-muted/50 rounded-lg text-sm">
              <span>Amount due</span>
              <span className="font-medium">{formatPrice(draft.total, draft.currency)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvoiceDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendInvoice} disabled={actionLoading === "invoice"}>
              {actionLoading === "invoice" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Send Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert to Order Dialog */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert to Order</DialogTitle>
            <DialogDescription>
              This will create a new order from this draft. The draft will be marked as completed
              and can no longer be modified.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span>Items</span>
              <span>{draft.items.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Customer</span>
              <span>{draft.customerEmail || "None"}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>{formatPrice(draft.total, draft.currency)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConvert} disabled={actionLoading === "convert"}>
              {actionLoading === "convert" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Convert to Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Draft Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this draft order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Keep Draft
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={actionLoading === "cancel"}
            >
              {actionLoading === "cancel" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Cancel Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

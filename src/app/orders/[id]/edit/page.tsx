"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  ArrowLeft,
  Pencil,
  Trash2,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import {
  apiFetch,
  createOrderEdit,
  addOrderEditItem,
  confirmOrderEdit,
  cancelOrderEdit,
  type OrderEdit,
} from "@/lib/api";

interface OrderLineItem {
  id: string;
  title: string;
  variantId: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
  currencyCode: string;
  thumbnail: string | null;
}

interface OrderDetail {
  id: string;
  displayId: number;
  email: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  currencyCode: string;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  items: OrderLineItem[];
}

export default function OrderEditPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [edit, setEdit] = useState<OrderEdit | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [note, setNote] = useState("");
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(0);

  const fetchOrder = useCallback(async () => {
    try {
      const data = await apiFetch<OrderDetail>(`/admin/orders/${orderId}`);
      setOrder(data);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load order");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleStartEdit = async () => {
    try {
      const newEdit = await createOrderEdit(orderId, note || undefined);
      setEdit(newEdit);
      toast.success("Order edit started");
    } catch (err: any) {
      toast.error(err?.message || "Failed to start edit");
    }
  };

  const handleUpdateQuantity = async (lineItemId: string, newQuantity: number) => {
    if (!edit) return;
    try {
      const updated = await addOrderEditItem(orderId, edit.id, {
        lineItemId,
        action: "UPDATE",
        newQuantity,
      });
      setEdit(updated);
      setEditingItem(null);
      toast.success("Item change added");
    } catch (err: any) {
      toast.error(err?.message || "Failed to add change");
    }
  };

  const handleRemoveItem = async (lineItemId: string) => {
    if (!edit) return;
    try {
      const updated = await addOrderEditItem(orderId, edit.id, {
        lineItemId,
        action: "REMOVE",
      });
      setEdit(updated);
      toast.success("Item removal added");
    } catch (err: any) {
      toast.error(err?.message || "Failed to add removal");
    }
  };

  const handleConfirm = async () => {
    if (!edit) return;
    setConfirming(true);
    try {
      const confirmed = await confirmOrderEdit(orderId, edit.id);
      setEdit(confirmed);
      toast.success("Order edit confirmed and applied");
      setTimeout(() => router.push(`/orders/${orderId}`), 1500);
    } catch (err: any) {
      toast.error(err?.message || "Failed to confirm edit");
    } finally {
      setConfirming(false);
    }
  };

  const handleCancel = async () => {
    if (!edit) return;
    try {
      await cancelOrderEdit(orderId, edit.id);
      setEdit(null);
      toast.success("Edit canceled");
      router.push(`/orders/${orderId}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to cancel edit");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Order not found.</p>
      </div>
    );
  }

  const currency = order.currencyCode.toUpperCase();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/orders/${orderId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Edit Order #{order.displayId}
          </h1>
          <p className="text-muted-foreground mt-1">
            Modify line items and quantities. Changes are applied when you confirm.
          </p>
        </div>
      </div>

      {/* Start edit or show active edit */}
      {!edit ? (
        <Card>
          <CardHeader>
            <CardTitle>Start Order Edit</CardTitle>
            <CardDescription>
              Create an edit session to modify this order. Changes won't apply until you confirm.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Add a note about why this edit is being made (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
            <Button onClick={handleStartEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Start Editing
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Edit summary */}
          {edit.items.length > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="py-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">
                    {edit.items.length} pending change{edit.items.length !== 1 ? "s" : ""}
                  </span>
                  <span className="text-sm text-amber-600 ml-2">
                    Difference: {Number(edit.differenceAmount) >= 0 ? "+" : ""}{currency} {Number(edit.differenceAmount).toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Line items table */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => {
                    const editChange = edit.items.find((e) => e.lineItemId === item.id);
                    const isRemoved = editChange?.action === "REMOVE";
                    const isUpdated = editChange?.action === "UPDATE";
                    const isEditing = editingItem === item.id;

                    return (
                      <TableRow key={item.id} className={isRemoved ? "opacity-40 line-through" : ""}>
                        <TableCell className="font-medium">
                          {item.title}
                          {isRemoved && (
                            <Badge variant="destructive" className="ml-2 text-xs">Removing</Badge>
                          )}
                          {isUpdated && (
                            <Badge variant="secondary" className="ml-2 text-xs">Modified</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {currency} {Number(item.unitPrice).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-2">
                              <Input
                                type="number"
                                min="1"
                                value={editQuantity}
                                onChange={(e) => setEditQuantity(parseInt(e.target.value) || 1)}
                                className="w-20 text-right"
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => handleUpdateQuantity(item.id, editQuantity)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => setEditingItem(null)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <span>
                              {isUpdated && editChange?.newQuantity != null
                                ? <><s className="text-muted-foreground">{item.quantity}</s> {editChange.newQuantity}</>
                                : item.quantity}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {currency} {Number(item.total).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {!isRemoved && !isEditing && (
                            <div className="flex gap-1 justify-end">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => {
                                  setEditingItem(item.id);
                                  setEditQuantity(item.quantity);
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleRemoveItem(item.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Confirm / Cancel */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleCancel}>
              Cancel Edit
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={confirming || edit.items.length === 0}
            >
              {confirming && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm & Apply Changes
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

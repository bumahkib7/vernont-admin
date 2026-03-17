"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface ClaimItemInput {
  _key: string;
  productTitle: string;
  quantity: number;
  reason: string;
}

export default function NewClaimPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [orderId, setOrderId] = useState("");
  const [claimType, setClaimType] = useState("DAMAGED");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<ClaimItemInput[]>([
    { _key: `${Date.now()}`, productTitle: "", quantity: 1, reason: "" },
  ]);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { _key: `${Date.now()}-${Math.random()}`, productTitle: "", quantity: 1, reason: "" },
    ]);
  };

  const removeItem = (key: string) => {
    setItems((prev) => prev.filter((item) => item._key !== key));
  };

  const updateItem = (key: string, updates: Partial<ClaimItemInput>) => {
    setItems((prev) =>
      prev.map((item) => (item._key === key ? { ...item, ...updates } : item))
    );
  };

  const handleSubmit = async () => {
    if (!orderId.trim()) {
      setError("Order ID is required");
      return;
    }
    if (items.length === 0 || !items[0].productTitle.trim()) {
      setError("At least one item is required");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const result = await apiFetch("/admin/claims", {
        method: "POST",
        body: JSON.stringify({
          orderId: orderId.trim(),
          claimType,
          description: description.trim() || null,
          items: items
            .filter((i) => i.productTitle.trim())
            .map((i) => ({
              productTitle: i.productTitle,
              quantity: i.quantity,
              reason: i.reason || null,
            })),
        }),
      });
      router.push(`/returns/claims/${(result as { id: string }).id}`);
    } catch (err) {
      console.error("Failed to create claim:", err);
      setError("Failed to create claim. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">New Claim</h1>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Claim Info */}
      <Card>
        <CardHeader>
          <CardTitle>Claim Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Order ID *</label>
            <Input
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Enter the order ID"
              className="mt-1.5"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Claim Type *</label>
            <Select value={claimType} onValueChange={setClaimType}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAMAGED">Damaged</SelectItem>
                <SelectItem value="DEFECTIVE">Defective</SelectItem>
                <SelectItem value="WRONG_ITEM">Wrong Item</SelectItem>
                <SelectItem value="MISSING_ITEM">Missing Item</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue..."
              rows={3}
              className="mt-1.5"
            />
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Claimed Items</CardTitle>
            <Button variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item) => (
            <div key={item._key} className="flex gap-3 items-start border rounded-lg p-3">
              <div className="flex-1 space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Product Name *</label>
                  <Input
                    value={item.productTitle}
                    onChange={(e) => updateItem(item._key, { productTitle: e.target.value })}
                    placeholder="Product name"
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Quantity</label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={item.quantity}
                      onChange={(e) => updateItem(item._key, { quantity: parseInt(e.target.value) || 1 })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Reason</label>
                    <Input
                      value={item.reason}
                      onChange={(e) => updateItem(item._key, { reason: e.target.value })}
                      placeholder="e.g., cracked lens"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
              {items.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => removeItem(item._key)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
          Create Claim
        </Button>
      </div>
    </div>
  );
}

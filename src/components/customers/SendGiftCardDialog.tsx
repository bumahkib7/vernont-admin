"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Gift } from "lucide-react";
import { sendGiftCard, getCustomerName, formatPrice, type CustomerSummary } from "@/lib/api";

interface SendGiftCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: CustomerSummary;
  onSuccess: () => void;
}

export function SendGiftCardDialog({
  open,
  onOpenChange,
  customer,
  onSuccess,
}: SendGiftCardDialogProps) {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountInCents = Math.round(parseFloat(amount || "0") * 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!amount || amountInCents <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    try {
      setLoading(true);
      const result = await sendGiftCard(customer.id, {
        amount: amountInCents,
        currencyCode: "GBP",
        message: message || undefined,
      });
      setAmount("");
      setMessage("");
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send gift card");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Send Gift Card
            </DialogTitle>
            <DialogDescription>
              Send a gift card to {getCustomerName(customer)} ({customer.email})
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Preview Card */}
            <div className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
              <p className="text-sm opacity-80">Gift Card Value</p>
              <p className="text-3xl font-bold">
                {amountInCents > 0 ? formatPrice(amountInCents / 100, "GBP") : "£0.00"}
              </p>
              <p className="mt-4 text-sm opacity-80">
                For: {getCustomerName(customer)}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (GBP)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  £
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={loading}
                  className="pl-7"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">
                Personal Message <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="message"
                placeholder="Add a personal message to the gift card..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={loading}
                rows={3}
              />
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || amountInCents <= 0}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Gift Card"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

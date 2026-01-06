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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Ban, AlertTriangle } from "lucide-react";
import { suspendCustomer, getCustomerName, type CustomerSummary } from "@/lib/api";

interface SuspendCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: CustomerSummary;
  onSuccess: () => void;
}

export function SuspendCustomerDialog({
  open,
  onOpenChange,
  customer,
  onSuccess,
}: SuspendCustomerDialogProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reason.trim()) {
      setError("Please provide a reason for suspension");
      return;
    }

    try {
      setLoading(true);
      await suspendCustomer(customer.id, { reason });
      setReason("");
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to suspend customer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Ban className="h-5 w-5" />
              Suspend Customer Account
            </DialogTitle>
            <DialogDescription>
              Suspend the account for {getCustomerName(customer)} ({customer.email})
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Warning */}
            <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Warning</p>
                <p className="text-yellow-700">
                  Suspending this account will prevent the customer from placing new orders
                  and accessing certain features. They will be notified via email.
                </p>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reason">Reason for Suspension</Label>
              <Textarea
                id="reason"
                placeholder="Provide a reason for suspending this account..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={loading}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                This reason will be stored in the activity log and included in the notification email.
              </p>
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
            <Button
              type="submit"
              variant="destructive"
              disabled={loading || !reason.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suspending...
                </>
              ) : (
                "Suspend Account"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

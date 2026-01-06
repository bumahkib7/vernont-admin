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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Star, Crown, ArrowRight } from "lucide-react";
import {
  changeCustomerTier,
  getCustomerName,
  getTierDisplay,
  type CustomerSummary,
  type CustomerTier,
} from "@/lib/api";

interface ChangeTierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: CustomerSummary;
  onSuccess: () => void;
}

const tierOptions: { value: CustomerTier; label: string; description: string }[] = [
  { value: "BRONZE", label: "Bronze", description: "Default tier - no discount" },
  { value: "SILVER", label: "Silver", description: "5% discount on all orders" },
  { value: "GOLD", label: "Gold", description: "10% discount on all orders" },
  { value: "PLATINUM", label: "Platinum", description: "15% discount + free shipping" },
];

function getTierBadgeColor(tier: CustomerTier): string {
  const colors: Record<CustomerTier, string> = {
    BRONZE: "bg-orange-100 text-orange-800",
    SILVER: "bg-gray-100 text-gray-800",
    GOLD: "bg-yellow-100 text-yellow-800",
    PLATINUM: "bg-purple-100 text-purple-800",
  };
  return colors[tier];
}

export function ChangeTierDialog({
  open,
  onOpenChange,
  customer,
  onSuccess,
}: ChangeTierDialogProps) {
  const [tier, setTier] = useState<CustomerTier>(customer.tier);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUpgrade = tierOptions.findIndex(t => t.value === tier) > tierOptions.findIndex(t => t.value === customer.tier);
  const isDowngrade = tierOptions.findIndex(t => t.value === tier) < tierOptions.findIndex(t => t.value === customer.tier);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (tier === customer.tier) {
      setError("Please select a different tier");
      return;
    }

    try {
      setLoading(true);
      await changeCustomerTier(customer.id, { tier, reason: reason || undefined });
      setReason("");
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change tier");
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
              <Star className="h-5 w-5" />
              Change Customer Tier
            </DialogTitle>
            <DialogDescription>
              Change the membership tier for {getCustomerName(customer)}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Current to New Tier Visual */}
            <div className="flex items-center justify-center gap-4 rounded-lg bg-muted/50 p-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Current Tier</p>
                <Badge className={getTierBadgeColor(customer.tier)}>
                  {customer.tier === "PLATINUM" && <Crown className="mr-1 h-3 w-3" />}
                  {getTierDisplay(customer.tier).label}
                </Badge>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">New Tier</p>
                <Badge className={getTierBadgeColor(tier)}>
                  {tier === "PLATINUM" && <Crown className="mr-1 h-3 w-3" />}
                  {getTierDisplay(tier).label}
                </Badge>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tier">Select New Tier</Label>
              <Select value={tier} onValueChange={(v) => setTier(v as CustomerTier)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a tier" />
                </SelectTrigger>
                <SelectContent>
                  {tierOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reason">
                Reason <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="Provide a reason for this tier change..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={loading}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                This will be logged for audit purposes and the customer will be notified.
              </p>
            </div>

            {isUpgrade && (
              <p className="text-sm text-green-600">
                This is an upgrade. The customer will receive better benefits.
              </p>
            )}
            {isDowngrade && (
              <p className="text-sm text-orange-600">
                This is a downgrade. The customer will have reduced benefits.
              </p>
            )}

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
            <Button type="submit" disabled={loading || tier === customer.tier}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Change Tier"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

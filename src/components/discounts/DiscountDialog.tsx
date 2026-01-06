"use client";

import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Percent,
  Tag,
  Truck,
  Gift,
  Check,
  Calendar,
  Users,
  ShoppingCart,
} from "lucide-react";
import {
  createDiscount,
  updateDiscount,
  generateDiscountCode,
  type Promotion,
  type PromotionType,
  type CreatePromotionRequest,
  type CreatePromotionRuleRequest,
  getPromotionTypeDisplay,
} from "@/lib/api";

interface DiscountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  discount: Promotion | null;
  onSuccess?: () => void;
}

type Step = 1 | 2 | 3 | 4 | 5;

interface FormData {
  name: string;
  code: string;
  description: string;
  type: PromotionType;
  value: number;
  minimumAmount: number | null;
  maximumDiscount: number | null;
  usageLimit: number | null;
  customerUsageLimit: number;
  startsAt: string;
  endsAt: string;
  isStackable: boolean;
  priority: number;
  buyQuantity: number | null;
  getQuantity: number | null;
  getDiscountValue: number | null;
  activateImmediately: boolean;
  rules: CreatePromotionRuleRequest[];
}

const initialFormData: FormData = {
  name: "",
  code: "",
  description: "",
  type: "PERCENTAGE",
  value: 0,
  minimumAmount: null,
  maximumDiscount: null,
  usageLimit: null,
  customerUsageLimit: 1,
  startsAt: "",
  endsAt: "",
  isStackable: false,
  priority: 0,
  buyQuantity: null,
  getQuantity: null,
  getDiscountValue: null,
  activateImmediately: false,
  rules: [],
};

const STEPS: { number: Step; title: string; description: string }[] = [
  { number: 1, title: "Basic Info", description: "Code, name and type" },
  { number: 2, title: "Value & Limits", description: "Discount value and restrictions" },
  { number: 3, title: "Schedule", description: "Start and end dates" },
  { number: 4, title: "Rules", description: "Eligibility conditions" },
  { number: 5, title: "Review", description: "Confirm and save" },
];

export function DiscountDialog({
  open,
  onOpenChange,
  discount,
  onSuccess,
}: DiscountDialogProps) {
  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);

  const isEditing = !!discount;

  // Initialize form when editing
  useEffect(() => {
    if (discount) {
      setFormData({
        name: discount.name || "",
        code: discount.code,
        description: discount.description || "",
        type: discount.type,
        value: discount.value,
        minimumAmount: discount.minimumAmount || null,
        maximumDiscount: discount.maximumDiscount || null,
        usageLimit: discount.usageLimit || null,
        customerUsageLimit: discount.customerUsageLimit || 1,
        startsAt: discount.startsAt
          ? new Date(discount.startsAt).toISOString().slice(0, 16)
          : "",
        endsAt: discount.endsAt
          ? new Date(discount.endsAt).toISOString().slice(0, 16)
          : "",
        isStackable: discount.isStackable || false,
        priority: discount.priority || 0,
        buyQuantity: discount.buyQuantity || null,
        getQuantity: discount.getQuantity || null,
        getDiscountValue: discount.getDiscountValue || null,
        activateImmediately: discount.isActive,
        rules: discount.rules?.map((r) => ({
          type: r.type,
          value: r.value,
          description: r.description,
        })) || [],
      });
    } else {
      setFormData(initialFormData);
    }
    setStep(1);
    setError(null);
  }, [discount, open]);

  const handleGenerateCode = async () => {
    setGeneratingCode(true);
    try {
      const result = await generateDiscountCode();
      setFormData((prev) => ({ ...prev, code: result.code }));
    } catch (err) {
      setError("Failed to generate code");
    } finally {
      setGeneratingCode(false);
    }
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return formData.code.length >= 3 && formData.type !== undefined;
      case 2:
        if (formData.type === "PERCENTAGE") {
          return formData.value > 0 && formData.value <= 100;
        }
        if (formData.type === "FIXED") {
          return formData.value > 0;
        }
        if (formData.type === "BUY_X_GET_Y") {
          return (
            (formData.buyQuantity ?? 0) > 0 &&
            (formData.getQuantity ?? 0) > 0
          );
        }
        return true;
      case 3:
        return true;
      case 4:
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < 5 && canProceed()) {
      setStep((step + 1) as Step);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as Step);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);

    try {
      const payload: CreatePromotionRequest = {
        name: formData.name || undefined,
        code: formData.code.toUpperCase(),
        type: formData.type,
        value: formData.value,
        description: formData.description || undefined,
        startsAt: formData.startsAt
          ? new Date(formData.startsAt).toISOString()
          : undefined,
        endsAt: formData.endsAt
          ? new Date(formData.endsAt).toISOString()
          : undefined,
        usageLimit: formData.usageLimit ?? undefined,
        customerUsageLimit: formData.customerUsageLimit,
        minimumAmount: formData.minimumAmount ?? undefined,
        maximumDiscount: formData.maximumDiscount ?? undefined,
        isStackable: formData.isStackable,
        priority: formData.priority,
        buyQuantity: formData.buyQuantity ?? undefined,
        getQuantity: formData.getQuantity ?? undefined,
        getDiscountValue: formData.getDiscountValue ?? undefined,
        rules: formData.rules.length > 0 ? formData.rules : undefined,
        activateImmediately: formData.activateImmediately,
      };

      if (isEditing && discount) {
        await updateDiscount(discount.id, payload);
      } else {
        await createDiscount(payload);
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save discount");
    } finally {
      setSaving(false);
    }
  };

  const getTypeIcon = (type: PromotionType) => {
    switch (type) {
      case "PERCENTAGE":
        return <Percent className="h-5 w-5" />;
      case "FIXED":
        return <Tag className="h-5 w-5" />;
      case "FREE_SHIPPING":
        return <Truck className="h-5 w-5" />;
      case "BUY_X_GET_Y":
        return <Gift className="h-5 w-5" />;
    }
  };

  const progress = (step / 5) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Discount" : "Create Discount"}
          </DialogTitle>
          <DialogDescription>
            {STEPS.find((s) => s.number === step)?.description}
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Step {step} of 5</span>
            <span>{STEPS.find((s) => s.number === step)?.title}</span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <ScrollArea className="flex-1 max-h-[400px]">
          <div className="space-y-4 pr-4">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Discount Code *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value.toUpperCase() })
                      }
                      placeholder="e.g., SAVE20"
                      className="font-mono"
                      disabled={isEditing}
                    />
                    {!isEditing && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGenerateCode}
                        disabled={generatingCode}
                      >
                        {generatingCode ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Customers will enter this code at checkout
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Display Name (optional)</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Summer Sale 20% Off"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Discount Type *</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {(["PERCENTAGE", "FIXED", "FREE_SHIPPING", "BUY_X_GET_Y"] as PromotionType[]).map(
                      (type) => {
                        const display = getPromotionTypeDisplay(type);
                        const isSelected = formData.type === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setFormData({ ...formData, type })}
                            className={`flex items-center gap-3 p-3 border rounded-lg text-left transition-colors ${
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <div
                              className={`p-2 rounded-lg ${
                                isSelected ? "bg-primary/10" : "bg-muted"
                              }`}
                            >
                              {getTypeIcon(type)}
                            </div>
                            <div>
                              <div className="font-medium text-sm">{display.label}</div>
                            </div>
                            {isSelected && (
                              <Check className="h-4 w-4 ml-auto text-primary" />
                            )}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Internal notes about this discount..."
                    rows={2}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Value & Limits */}
            {step === 2 && (
              <div className="space-y-4">
                {formData.type === "PERCENTAGE" && (
                  <div className="space-y-2">
                    <Label htmlFor="value">Percentage Off *</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="value"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.value || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })
                        }
                        placeholder="20"
                        className="w-24"
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
                  </div>
                )}

                {formData.type === "FIXED" && (
                  <div className="space-y-2">
                    <Label htmlFor="value">Amount Off *</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">£</span>
                      <Input
                        id="value"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.value || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })
                        }
                        placeholder="10.00"
                        className="w-32"
                      />
                    </div>
                  </div>
                )}

                {formData.type === "BUY_X_GET_Y" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="buyQuantity">Buy Quantity *</Label>
                        <Input
                          id="buyQuantity"
                          type="number"
                          min="1"
                          value={formData.buyQuantity || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              buyQuantity: parseInt(e.target.value) || null,
                            })
                          }
                          placeholder="2"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="getQuantity">Get Quantity *</Label>
                        <Input
                          id="getQuantity"
                          type="number"
                          min="1"
                          value={formData.getQuantity || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              getQuantity: parseInt(e.target.value) || null,
                            })
                          }
                          placeholder="1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="getDiscountValue">Discount on free items (%)</Label>
                      <Input
                        id="getDiscountValue"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.getDiscountValue || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            getDiscountValue: parseFloat(e.target.value) || null,
                          })
                        }
                        placeholder="100 for free, 50 for half price"
                      />
                    </div>
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="minimumAmount">Minimum Order Amount</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">£</span>
                    <Input
                      id="minimumAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.minimumAmount || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          minimumAmount: parseFloat(e.target.value) || null,
                        })
                      }
                      placeholder="No minimum"
                      className="w-32"
                    />
                  </div>
                </div>

                {formData.type === "PERCENTAGE" && (
                  <div className="space-y-2">
                    <Label htmlFor="maximumDiscount">Maximum Discount</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">£</span>
                      <Input
                        id="maximumDiscount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.maximumDiscount || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maximumDiscount: parseFloat(e.target.value) || null,
                          })
                        }
                        placeholder="No maximum"
                        className="w-32"
                      />
                    </div>
                  </div>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="usageLimit">Total Usage Limit</Label>
                    <Input
                      id="usageLimit"
                      type="number"
                      min="1"
                      value={formData.usageLimit || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          usageLimit: parseInt(e.target.value) || null,
                        })
                      }
                      placeholder="Unlimited"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerUsageLimit">Per Customer Limit</Label>
                    <Input
                      id="customerUsageLimit"
                      type="number"
                      min="1"
                      value={formData.customerUsageLimit}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customerUsageLimit: parseInt(e.target.value) || 1,
                        })
                      }
                      placeholder="1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Schedule */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="startsAt">Start Date & Time</Label>
                  <Input
                    id="startsAt"
                    type="datetime-local"
                    value={formData.startsAt}
                    onChange={(e) =>
                      setFormData({ ...formData, startsAt: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to start immediately when activated
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endsAt">End Date & Time</Label>
                  <Input
                    id="endsAt"
                    type="datetime-local"
                    value={formData.endsAt}
                    onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for no end date
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Can Stack with Other Discounts</Label>
                      <p className="text-xs text-muted-foreground">
                        Allow this discount to be combined with others
                      </p>
                    </div>
                    <Switch
                      checked={formData.isStackable}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isStackable: checked })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority (higher = applied first)</Label>
                    <Input
                      id="priority"
                      type="number"
                      min="0"
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })
                      }
                      className="w-24"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Rules */}
            {step === 4 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Add eligibility rules to restrict who can use this discount.
                  Rules will be applied in the checkout flow.
                </p>

                <div className="grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    className="flex items-center gap-3 p-4 border rounded-lg text-left hover:border-primary/50"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        rules: [
                          ...formData.rules,
                          { type: "MIN_SUBTOTAL", value: "50", description: "Minimum order £50" },
                        ],
                      })
                    }
                  >
                    <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-sm">Minimum Order Value</div>
                      <div className="text-xs text-muted-foreground">
                        Require a minimum subtotal
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="flex items-center gap-3 p-4 border rounded-lg text-left hover:border-primary/50"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        rules: [
                          ...formData.rules,
                          { type: "MIN_QUANTITY", value: "3", description: "Minimum 3 items" },
                        ],
                      })
                    }
                  >
                    <Tag className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-sm">Minimum Quantity</div>
                      <div className="text-xs text-muted-foreground">
                        Require a minimum number of items
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="flex items-center gap-3 p-4 border rounded-lg text-left hover:border-primary/50"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        rules: [
                          ...formData.rules,
                          { type: "CUSTOMER_GROUPS", value: "", description: "Specific customer groups" },
                        ],
                      })
                    }
                  >
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-sm">Customer Groups</div>
                      <div className="text-xs text-muted-foreground">
                        Limit to specific customer segments
                      </div>
                    </div>
                  </button>
                </div>

                {formData.rules.length > 0 && (
                  <div className="space-y-2">
                    <Label>Active Rules</Label>
                    <div className="space-y-2">
                      {formData.rules.map((rule, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <span className="text-sm">{rule.description || rule.type}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                rules: formData.rules.filter((_, i) => i !== index),
                              })
                            }
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Review */}
            {step === 5 && (
              <div className="space-y-4">
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(formData.type)}
                    <div>
                      <div className="font-mono font-bold text-lg">{formData.code}</div>
                      {formData.name && (
                        <div className="text-sm text-muted-foreground">{formData.name}</div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Type:</span>{" "}
                      {getPromotionTypeDisplay(formData.type).label}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Value:</span>{" "}
                      {formData.type === "PERCENTAGE" && `${formData.value}%`}
                      {formData.type === "FIXED" && `£${formData.value}`}
                      {formData.type === "FREE_SHIPPING" && "Free"}
                      {formData.type === "BUY_X_GET_Y" &&
                        `Buy ${formData.buyQuantity} Get ${formData.getQuantity}`}
                    </div>
                    {formData.minimumAmount && (
                      <div>
                        <span className="text-muted-foreground">Min Order:</span>{" "}
                        £{formData.minimumAmount}
                      </div>
                    )}
                    {formData.maximumDiscount && (
                      <div>
                        <span className="text-muted-foreground">Max Discount:</span>{" "}
                        £{formData.maximumDiscount}
                      </div>
                    )}
                    {formData.usageLimit && (
                      <div>
                        <span className="text-muted-foreground">Usage Limit:</span>{" "}
                        {formData.usageLimit}
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Per Customer:</span>{" "}
                      {formData.customerUsageLimit}
                    </div>
                    {formData.startsAt && (
                      <div>
                        <span className="text-muted-foreground">Starts:</span>{" "}
                        {new Date(formData.startsAt).toLocaleDateString()}
                      </div>
                    )}
                    {formData.endsAt && (
                      <div>
                        <span className="text-muted-foreground">Ends:</span>{" "}
                        {new Date(formData.endsAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {formData.rules.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <span className="text-sm text-muted-foreground">Rules:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {formData.rules.map((rule, index) => (
                            <Badge key={index} variant="secondary">
                              {rule.description || rule.type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <div className="font-medium text-sm">Activate Immediately</div>
                    <p className="text-xs text-muted-foreground">
                      Make this discount available right away
                    </p>
                  </div>
                  <Switch
                    checked={formData.activateImmediately}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, activateImmediately: checked })
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          {step > 1 && (
            <Button type="button" variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          {step < 5 ? (
            <Button type="button" onClick={handleNext} disabled={!canProceed()}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Discount"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

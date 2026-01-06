"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Percent,
  PoundSterling,
  TrendingUp,
  Clock,
  Layers,
  Package,
  Tags,
  Calendar,
  Plus,
  Trash2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  Search,
} from "lucide-react";
import {
  createPricingRule,
  updatePricingRule,
  getProducts,
  getCategories,
  type CreatePricingRuleRequest,
  type UpdatePricingRuleRequest,
  type PricingRuleDto,
  type PricingRuleType,
} from "@/lib/api";
import { useKeyboardShortcut, SHORTCUTS, formatShortcut } from "@/hooks/use-keyboard-shortcut";

interface PricingRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: PricingRuleDto | null;
  onSuccess?: () => void;
}

interface TierConfig {
  minQty: number;
  price: number;
}

interface RuleFormData {
  name: string;
  description: string;
  type: PricingRuleType;
  config: {
    percentage?: number;
    amount?: number;
    minQuantity?: number;
    tiers?: TierConfig[];
  };
  targetType: "ALL" | "PRODUCTS" | "CATEGORIES";
  targetIds: string[];
  startAt: string;
  endAt: string;
  priority: number;
  activateImmediately: boolean;
}

const RULE_TYPES: {
  value: PricingRuleType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}[] = [
  {
    value: "PERCENTAGE_DISCOUNT",
    label: "Percentage Discount",
    description: "Reduce prices by a percentage (e.g., 10% off)",
    icon: Percent,
    color: "bg-green-100 text-green-700 border-green-200",
  },
  {
    value: "FIXED_DISCOUNT",
    label: "Fixed Discount",
    description: "Reduce prices by a fixed amount (e.g., £5 off)",
    icon: PoundSterling,
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  {
    value: "MARKUP",
    label: "Markup",
    description: "Increase prices by a percentage",
    icon: TrendingUp,
    color: "bg-orange-100 text-orange-700 border-orange-200",
  },
  {
    value: "TIME_BASED",
    label: "Time-Based",
    description: "Apply discount during specific dates/times",
    icon: Clock,
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
  {
    value: "QUANTITY_BASED",
    label: "Quantity-Based",
    description: "Apply discount when buying X or more items",
    icon: Package,
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
  {
    value: "TIERED",
    label: "Tiered Pricing",
    description: "Different prices at different quantity levels",
    icon: Layers,
    color: "bg-pink-100 text-pink-700 border-pink-200",
  },
];

const TARGET_TYPES = [
  { value: "ALL", label: "All Products", description: "Apply to every product in the store" },
  { value: "PRODUCTS", label: "Specific Products", description: "Choose individual products" },
  { value: "CATEGORIES", label: "Categories", description: "Apply to entire categories" },
] as const;

const initialFormData: RuleFormData = {
  name: "",
  description: "",
  type: "PERCENTAGE_DISCOUNT",
  config: {
    percentage: 10,
  },
  targetType: "ALL",
  targetIds: [],
  startAt: "",
  endAt: "",
  priority: 0,
  activateImmediately: false,
};

export function PricingRuleDialog({
  open,
  onOpenChange,
  rule,
  onSuccess,
}: PricingRuleDialogProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<RuleFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Product/Category selection state
  const [products, setProducts] = useState<{ id: string; title: string; thumbnail?: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingItems, setLoadingItems] = useState(false);

  const isEditing = !!rule;
  const totalSteps = 4;

  // Initialize form data when editing
  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name,
        description: rule.description || "",
        type: rule.type as PricingRuleType,
        config: rule.config as RuleFormData["config"],
        targetType: (rule.targetType as RuleFormData["targetType"]) || "ALL",
        targetIds: rule.targetIds || [],
        startAt: rule.startAt ? rule.startAt.split("T")[0] : "",
        endAt: rule.endAt ? rule.endAt.split("T")[0] : "",
        priority: rule.priority,
        activateImmediately: rule.isActive,
      });
    } else {
      setFormData(initialFormData);
    }
    setStep(1);
    setError(null);
  }, [rule, open]);

  // Fetch products or categories when needed
  useEffect(() => {
    if (formData.targetType === "PRODUCTS" && step === 3) {
      fetchProducts();
    } else if (formData.targetType === "CATEGORIES" && step === 3) {
      fetchCategories();
    }
  }, [formData.targetType, step]);

  const fetchProducts = async () => {
    setLoadingItems(true);
    try {
      const response = await getProducts({ start: 0, end: 100, q: searchQuery || undefined });
      setProducts(
        response.content.map((p) => ({
          id: p.id,
          title: p.title,
          thumbnail: p.thumbnail,
        }))
      );
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoadingItems(false);
    }
  };

  const fetchCategories = async () => {
    setLoadingItems(true);
    try {
      const response = await getCategories({ limit: 100 });
      setCategories(
        response.categories.map((c) => ({
          id: c.id,
          name: c.name,
        }))
      );
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    } finally {
      setLoadingItems(false);
    }
  };

  const updateConfig = (key: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        [key]: value,
      },
    }));
  };

  const addTier = () => {
    const tiers = formData.config.tiers || [];
    const lastTier = tiers[tiers.length - 1];
    const newMinQty = lastTier ? lastTier.minQty + 10 : 1;
    setFormData((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        tiers: [...tiers, { minQty: newMinQty, price: 0 }],
      },
    }));
  };

  const updateTier = (index: number, field: keyof TierConfig, value: number) => {
    const tiers = [...(formData.config.tiers || [])];
    tiers[index] = { ...tiers[index], [field]: value };
    setFormData((prev) => ({
      ...prev,
      config: { ...prev.config, tiers },
    }));
  };

  const removeTier = (index: number) => {
    const tiers = formData.config.tiers?.filter((_, i) => i !== index) || [];
    setFormData((prev) => ({
      ...prev,
      config: { ...prev.config, tiers },
    }));
  };

  const toggleTargetId = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      targetIds: prev.targetIds.includes(id)
        ? prev.targetIds.filter((t) => t !== id)
        : [...prev.targetIds, id],
    }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);

    try {
      // Build config based on rule type
      let config: Record<string, unknown> = {};
      switch (formData.type) {
        case "PERCENTAGE_DISCOUNT":
        case "MARKUP":
        case "TIME_BASED":
          config = { percentage: formData.config.percentage || 0 };
          break;
        case "FIXED_DISCOUNT":
          config = { amount: (formData.config.amount || 0) * 100 }; // Convert to cents
          break;
        case "QUANTITY_BASED":
          config = {
            minQuantity: formData.config.minQuantity || 1,
            percentage: formData.config.percentage || 0,
          };
          break;
        case "TIERED":
          config = {
            tiers: (formData.config.tiers || []).map((t) => ({
              minQty: t.minQty,
              price: t.price * 100, // Convert to cents
            })),
          };
          break;
      }

      const payload: CreatePricingRuleRequest = {
        name: formData.name,
        description: formData.description || undefined,
        type: formData.type,
        config,
        targetType: formData.targetType,
        targetIds: formData.targetType !== "ALL" ? formData.targetIds : undefined,
        startAt: formData.startAt ? new Date(formData.startAt).toISOString() : undefined,
        endAt: formData.endAt ? new Date(formData.endAt).toISOString() : undefined,
        priority: formData.priority,
        activateImmediately: formData.activateImmediately,
      };

      if (isEditing && rule) {
        await updatePricingRule(rule.id, payload as UpdatePricingRuleRequest);
      } else {
        await createPricingRule(payload);
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save rule");
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.name.trim().length > 0;
      case 2:
        if (formData.type === "TIERED") {
          return (formData.config.tiers?.length || 0) >= 2;
        }
        return true;
      case 3:
        if (formData.targetType !== "ALL") {
          return formData.targetIds.length > 0;
        }
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  // =========================================================================
  // Keyboard Shortcuts
  // =========================================================================

  // Cmd+Enter - Submit on last step, or go to next step
  useKeyboardShortcut(
    open ? SHORTCUTS.SUBMIT : null,
    () => {
      if (!canProceed()) return;
      if (step === totalSteps) {
        handleSubmit();
      } else {
        setStep(step + 1);
      }
    },
    [open, step, totalSteps, canProceed, handleSubmit]
  );

  // Alt+ArrowRight - Next step
  useKeyboardShortcut(
    open && step < totalSteps ? { key: "ArrowRight", alt: true } : null,
    () => {
      if (canProceed() && step < totalSteps) {
        setStep(step + 1);
      }
    },
    [open, step, totalSteps, canProceed]
  );

  // Alt+ArrowLeft - Previous step
  useKeyboardShortcut(
    open && step > 1 ? { key: "ArrowLeft", alt: true } : null,
    () => {
      if (step > 1) {
        setStep(step - 1);
      }
    },
    [open, step]
  );

  const selectedRuleType = RULE_TYPES.find((t) => t.value === formData.type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Pricing Rule" : "Create Pricing Rule"}</DialogTitle>
          <DialogDescription>
            Step {step} of {totalSteps}:{" "}
            {step === 1 && "Basic Information"}
            {step === 2 && "Configure Rule"}
            {step === 3 && "Select Targets"}
            {step === 4 && "Schedule & Priority"}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center gap-2 px-1">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`h-2 flex-1 rounded-full transition-colors ${
                  s <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            </div>
          ))}
        </div>

        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-6 py-4">
            {/* Step 1: Basic Information */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Rule Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Summer Sale 20% Off"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this rule does..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    rows={3}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Rule Type *</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {RULE_TYPES.map((type) => {
                      const Icon = type.icon;
                      const isSelected = formData.type === type.value;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              type: type.value,
                              config:
                                type.value === "TIERED"
                                  ? { tiers: [{ minQty: 1, price: 0 }] }
                                  : { percentage: 10 },
                            }))
                          }
                          className={`flex flex-col items-start gap-2 p-4 rounded-lg border-2 text-left transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-muted hover:border-muted-foreground/30"
                          }`}
                        >
                          <div className="flex items-center gap-2 w-full">
                            <div className={`p-2 rounded-md ${type.color}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className="font-medium text-sm">{type.label}</span>
                            {isSelected && <Check className="h-4 w-4 ml-auto text-primary" />}
                          </div>
                          <p className="text-xs text-muted-foreground">{type.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Configure Rule */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  {selectedRuleType && (
                    <>
                      <div className={`p-2 rounded-md ${selectedRuleType.color}`}>
                        <selectedRuleType.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{selectedRuleType.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedRuleType.description}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <Separator />

                {/* Percentage Discount / Markup / Time-Based */}
                {(formData.type === "PERCENTAGE_DISCOUNT" ||
                  formData.type === "MARKUP" ||
                  formData.type === "TIME_BASED") && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="percentage">
                        {formData.type === "MARKUP" ? "Markup Percentage" : "Discount Percentage"} *
                      </Label>
                      <div className="relative">
                        <Input
                          id="percentage"
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          placeholder="10"
                          value={formData.config.percentage || ""}
                          onChange={(e) =>
                            updateConfig("percentage", parseFloat(e.target.value) || 0)
                          }
                          className="pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          %
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formData.type === "MARKUP"
                          ? `Prices will increase by ${formData.config.percentage || 0}%`
                          : `Prices will decrease by ${formData.config.percentage || 0}%`}
                      </p>
                    </div>

                    {/* Preview */}
                    <div className="p-4 rounded-lg border bg-muted/30 space-y-2">
                      <p className="text-sm font-medium">Preview</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">Original: £100.00</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          New: £
                          {formData.type === "MARKUP"
                            ? (100 * (1 + (formData.config.percentage || 0) / 100)).toFixed(2)
                            : (100 * (1 - (formData.config.percentage || 0) / 100)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Fixed Discount */}
                {formData.type === "FIXED_DISCOUNT" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Discount Amount *</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          £
                        </span>
                        <Input
                          id="amount"
                          type="number"
                          min={0}
                          step={0.01}
                          placeholder="5.00"
                          value={formData.config.amount || ""}
                          onChange={(e) => updateConfig("amount", parseFloat(e.target.value) || 0)}
                          className="pl-8"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Subtract £{(formData.config.amount || 0).toFixed(2)} from each item
                      </p>
                    </div>

                    {/* Preview */}
                    <div className="p-4 rounded-lg border bg-muted/30 space-y-2">
                      <p className="text-sm font-medium">Preview</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">Original: £25.00</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          New: £{Math.max(0, 25 - (formData.config.amount || 0)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quantity-Based */}
                {formData.type === "QUANTITY_BASED" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="minQuantity">Minimum Quantity *</Label>
                        <Input
                          id="minQuantity"
                          type="number"
                          min={1}
                          placeholder="3"
                          value={formData.config.minQuantity || ""}
                          onChange={(e) =>
                            updateConfig("minQuantity", parseInt(e.target.value) || 1)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="qtyPercentage">Discount Percentage *</Label>
                        <div className="relative">
                          <Input
                            id="qtyPercentage"
                            type="number"
                            min={0}
                            max={100}
                            step={0.1}
                            placeholder="15"
                            value={formData.config.percentage || ""}
                            onChange={(e) =>
                              updateConfig("percentage", parseFloat(e.target.value) || 0)
                            }
                            className="pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      When customers buy {formData.config.minQuantity || 1} or more items, they get{" "}
                      {formData.config.percentage || 0}% off
                    </p>
                  </div>
                )}

                {/* Tiered Pricing */}
                {formData.type === "TIERED" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Price Tiers *</Label>
                        <p className="text-xs text-muted-foreground">
                          Set different prices based on quantity purchased
                        </p>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={addTier}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Tier
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {(formData.config.tiers || []).map((tier, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                        >
                          <div className="flex-1 grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Min Quantity</Label>
                              <Input
                                type="number"
                                min={1}
                                value={tier.minQty}
                                onChange={(e) =>
                                  updateTier(index, "minQty", parseInt(e.target.value) || 1)
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Price per Unit (£)</Label>
                              <Input
                                type="number"
                                min={0}
                                step={0.01}
                                value={tier.price}
                                onChange={(e) =>
                                  updateTier(index, "price", parseFloat(e.target.value) || 0)
                                }
                              />
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeTier(index)}
                            disabled={(formData.config.tiers?.length || 0) <= 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {(formData.config.tiers?.length || 0) < 2 && (
                      <p className="text-sm text-amber-600 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Add at least 2 tiers for tiered pricing
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Select Targets */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>Apply Rule To *</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {TARGET_TYPES.map((target) => {
                      const isSelected = formData.targetType === target.value;
                      return (
                        <button
                          key={target.value}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              targetType: target.value,
                              targetIds: [],
                            }))
                          }
                          className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 text-center transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-muted hover:border-muted-foreground/30"
                          }`}
                        >
                          {target.value === "ALL" && <Tags className="h-5 w-5" />}
                          {target.value === "PRODUCTS" && <Package className="h-5 w-5" />}
                          {target.value === "CATEGORIES" && <Layers className="h-5 w-5" />}
                          <span className="font-medium text-sm">{target.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {formData.targetType !== "ALL" && (
                  <>
                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>
                          Select {formData.targetType === "PRODUCTS" ? "Products" : "Categories"}
                        </Label>
                        {formData.targetIds.length > 0 && (
                          <Badge variant="secondary">{formData.targetIds.length} selected</Badge>
                        )}
                      </div>

                      {formData.targetType === "PRODUCTS" && (
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="Search products..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && fetchProducts()}
                          />
                        </div>
                      )}

                      <div className="border rounded-lg max-h-64 overflow-y-auto">
                        {loadingItems ? (
                          <div className="flex items-center justify-center p-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : formData.targetType === "PRODUCTS" ? (
                          products.length === 0 ? (
                            <div className="text-center text-muted-foreground p-8">
                              No products found
                            </div>
                          ) : (
                            <div className="divide-y">
                              {products.map((product) => {
                                const isSelected = formData.targetIds.includes(product.id);
                                return (
                                  <button
                                    key={product.id}
                                    type="button"
                                    onClick={() => toggleTargetId(product.id)}
                                    className={`flex items-center gap-3 w-full p-3 text-left hover:bg-muted/50 transition-colors ${
                                      isSelected ? "bg-primary/5" : ""
                                    }`}
                                  >
                                    {product.thumbnail ? (
                                      <img
                                        src={product.thumbnail}
                                        alt=""
                                        className="h-10 w-10 rounded object-cover"
                                      />
                                    ) : (
                                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                        <Package className="h-4 w-4 text-muted-foreground" />
                                      </div>
                                    )}
                                    <span className="flex-1 font-medium text-sm truncate">
                                      {product.title}
                                    </span>
                                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                                  </button>
                                );
                              })}
                            </div>
                          )
                        ) : categories.length === 0 ? (
                          <div className="text-center text-muted-foreground p-8">
                            No categories found
                          </div>
                        ) : (
                          <div className="divide-y">
                            {categories.map((category) => {
                              const isSelected = formData.targetIds.includes(category.id);
                              return (
                                <button
                                  key={category.id}
                                  type="button"
                                  onClick={() => toggleTargetId(category.id)}
                                  className={`flex items-center gap-3 w-full p-3 text-left hover:bg-muted/50 transition-colors ${
                                    isSelected ? "bg-primary/5" : ""
                                  }`}
                                >
                                  <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                    <Layers className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <span className="flex-1 font-medium text-sm">{category.name}</span>
                                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {formData.targetIds.length === 0 && (
                        <p className="text-sm text-amber-600 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Select at least one{" "}
                          {formData.targetType === "PRODUCTS" ? "product" : "category"}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 4: Schedule & Priority */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Scheduling</p>
                      <p className="text-sm text-muted-foreground">
                        Set start and end dates (optional)
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startAt">Start Date</Label>
                      <Input
                        id="startAt"
                        type="date"
                        value={formData.startAt}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, startAt: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endAt">End Date</Label>
                      <Input
                        id="endAt"
                        type="date"
                        value={formData.endAt}
                        min={formData.startAt}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, endAt: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Leave empty for no time restrictions. The rule will be active whenever enabled.
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Input
                      id="priority"
                      type="number"
                      min={0}
                      max={100}
                      placeholder="0"
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          priority: parseInt(e.target.value) || 0,
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Higher priority rules are applied first when multiple rules match. Range: 0-100.
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="space-y-0.5">
                    <Label htmlFor="activate">Activate Immediately</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable this rule as soon as it&apos;s created
                    </p>
                  </div>
                  <Switch
                    id="activate"
                    checked={formData.activateImmediately}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, activateImmediately: checked }))
                    }
                  />
                </div>

                {/* Summary */}
                <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
                  <p className="font-medium">Summary</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rule Name:</span>
                      <span className="font-medium">{formData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span>{selectedRuleType?.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Applies To:</span>
                      <span>
                        {formData.targetType === "ALL"
                          ? "All Products"
                          : `${formData.targetIds.length} ${
                              formData.targetType === "PRODUCTS" ? "products" : "categories"
                            }`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge
                        variant={formData.activateImmediately ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {formData.activateImmediately ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {step > 1 && (
            <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
              <kbd className="ml-2 hidden sm:inline-flex kbd text-[10px]">Alt+←</kbd>
            </Button>
          )}
          <div className="flex-1" />
          {step < totalSteps ? (
            <Button type="button" onClick={() => setStep(step + 1)} disabled={!canProceed()}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
              <kbd className="ml-2 hidden sm:inline-flex kbd text-[10px]">{formatShortcut(SHORTCUTS.SUBMIT)}</kbd>
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={saving || !canProceed()}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  {isEditing ? "Update" : "Create"}
                  <kbd className="ml-2 hidden sm:inline-flex kbd text-[10px]">{formatShortcut(SHORTCUTS.SUBMIT)}</kbd>
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

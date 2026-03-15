"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Plus, Trash2, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  SubscriptionPlanInterval,
  CreateSubscriptionPlanInput,
  createSubscriptionPlan,
  getSubscriptionPlan,
  updateSubscriptionPlan,
} from "@/lib/api";

export default function CreatePlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditing = !!editId;

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [interval, setInterval] = useState<SubscriptionPlanInterval>("MONTHLY");
  const [trialDays, setTrialDays] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState("");

  // Load plan data when editing
  useEffect(() => {
    if (!editId) return;
    setLoading(true);
    getSubscriptionPlan(editId)
      .then((plan) => {
        setName(plan.name);
        setDescription(plan.description || "");
        setPrice((plan.price / 100).toString());
        setCurrency(plan.currency);
        setInterval(plan.interval);
        setTrialDays(plan.trialDays > 0 ? plan.trialDays.toString() : "");
        setFeatures(plan.features || []);
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Failed to load plan");
        router.push("/subscriptions");
      })
      .finally(() => setLoading(false));
  }, [editId]);

  const addFeature = () => {
    const trimmed = newFeature.trim();
    if (!trimmed) return;
    if (features.includes(trimmed)) {
      toast.error("Feature already added");
      return;
    }
    setFeatures((prev) => [...prev, trimmed]);
    setNewFeature("");
  };

  const removeFeature = (index: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addFeature();
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Plan name is required");
      return;
    }
    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue < 0) {
      toast.error("Please enter a valid price");
      return;
    }

    setSaving(true);
    try {
      const data: CreateSubscriptionPlanInput = {
        name: name.trim(),
        description: description.trim() || undefined,
        price: Math.round(priceValue * 100), // Convert to cents
        currency,
        interval,
        trialDays: trialDays ? parseInt(trialDays, 10) : undefined,
        features: features.length > 0 ? features : undefined,
      };

      if (isEditing && editId) {
        await updateSubscriptionPlan(editId, data);
        toast.success("Plan updated");
      } else {
        await createSubscriptionPlan(data);
        toast.success("Plan created");
      }
      router.push("/subscriptions");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save plan");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/subscriptions">Subscriptions</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{isEditing ? "Edit Plan" : "Create Plan"}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/subscriptions")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold">{isEditing ? "Edit Plan" : "Create Subscription Plan"}</h1>
      </div>

      {/* General Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g. Pro Monthly"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what this plan includes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pricing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                  <SelectItem value="AUD">AUD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interval">Billing Interval</Label>
              <Select value={interval} onValueChange={(v) => setInterval(v as SubscriptionPlanInterval)}>
                <SelectTrigger id="interval">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="trialDays">Trial Period (days)</Label>
              <Input
                id="trialDays"
                type="number"
                min="0"
                placeholder="0"
                value={trialDays}
                onChange={(e) => setTrialDays(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Add a feature..."
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button variant="outline" size="icon" onClick={addFeature} type="button">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {features.length > 0 && (
            <ul className="space-y-2">
              {features.map((feature, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between px-3 py-2 bg-muted rounded-md text-sm"
                >
                  <span>{feature}</span>
                  <button
                    onClick={() => removeFeature(index)}
                    className="text-muted-foreground hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {features.length === 0 && (
            <p className="text-sm text-muted-foreground">No features added yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={() => router.push("/subscriptions")}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isEditing ? "Update Plan" : "Create Plan"}
        </Button>
      </div>
    </div>
  );
}
